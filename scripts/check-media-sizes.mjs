import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import {
  FIGURE_LANDSCAPE_DISPLAY,
  FIGURE_MIN_RATIO,
  FIGURE_PORTRAIT_DISPLAY,
  figureSizeProblem,
  meetsFigureMinimum,
} from "../src/utils/figure-layout.mjs";
import { soleLocalImage } from "../src/integrations/figure-markdown.mjs";
import { decodeImagePath, displayedSize } from "../src/utils/image-files.mjs";

export {
  FIGURE_LANDSCAPE_DISPLAY,
  FIGURE_MIN_RATIO,
  FIGURE_PORTRAIT_DISPLAY,
  figureSizeProblem,
  meetsFigureMinimum,
};

/**
 * Source-size rules from vault decision 024 (Photography). They live in a
 * build script, not the content schema: Astro's content layer validates
 * frontmatter before `image()` resolves the file, so a schema cannot see an
 * image's dimensions (and `image().refine()` is unsupported).
 */
export const COVER_MIN_WIDTH = 2880;

/**
 * @param {number} width
 * @param {number} height
 * @returns {string | null} what is wrong with a Cover of this size, or null
 */
export function coverSizeProblem(width, height) {
  if (width < COVER_MIN_WIDTH) {
    return `is ${width}px wide; a Cover must be at least ${COVER_MIN_WIDTH}px`;
  }
  if (height >= width) {
    return `is ${width}x${height}; a Cover must be landscape`;
  }
  return null;
}

/** The `image:` path inside the `cover:` block of a file's frontmatter. */
function coverImagePath(text) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  const block = /^cover:\s*\r?\n((?:[ \t]+.*\r?\n?)*)/m.exec(front)?.[1] ?? "";
  const match = /^[ \t]+image:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(block);
  return match?.[1] ?? null;
}

/**
 * @param {string} dir folder of Case study `.md` files
 * @returns {Promise<string[]>} one message per problem; empty when all pass
 */
export async function checkCovers(dir) {
  const problems = [];
  for (const name of readdirSync(dir, { recursive: true }).filter((n) =>
    n.endsWith(".md"),
  )) {
    const imagePath = coverImagePath(readFileSync(join(dir, name), "utf8"));
    if (!imagePath) {
      problems.push(`${name}: no cover image`);
      continue;
    }
    let w, h;
    try {
      [w, h] = await displayedSize(resolve(dir, dirname(name), imagePath));
    } catch {
      problems.push(`${name}: cover ${imagePath} cannot be read`);
      continue;
    }
    const problem = coverSizeProblem(w, h);
    if (problem) problems.push(`${name}: cover ${imagePath} ${problem}`);
  }
  return problems;
}

/**
 * The Figures in a Markdown body: what src/integrations/figure-markdown.mjs would turn
 * into Figures, found by running the same Markdown pipeline with a collecting plugin
 * (so code, inline code and inline images are never matched).
 *
 * @param {string} body Markdown without frontmatter
 * @param {URL} fileURL
 * @returns {Promise<{ alt: string, src: string }[]>}
 */
async function figuresIn(body, fileURL) {
  const found = [];
  const collector = {
    name: "collect-figures",
    element: {
      filter: ["p"],
      visit(node) {
        const img = soleLocalImage(node);
        if (img) {
          found.push({
            alt:
              typeof img.properties?.alt === "string" ? img.properties.alt : "",
            src: String(img.properties.src),
          });
        }
      },
    },
  };
  const processor = await createSatteriMarkdownProcessor({
    syntaxHighlight: false,
    hastPlugins: [collector],
  });
  await processor.render(body, { fileURL });
  return found;
}

/**
 * Checks every Figure in each Case study body: alt text present, file
 * readable, source wide enough for its display width.
 *
 * @param {string} dir folder of Case study `.md` files
 * @returns {Promise<string[]>} one message per problem; empty when all pass
 */
export async function checkFigures(dir) {
  const problems = [];
  for (const name of readdirSync(dir, { recursive: true }).filter((n) =>
    n.endsWith(".md"),
  )) {
    const file = join(dir, name);
    const body = readFileSync(file, "utf8").replace(
      /^---\r?\n[\s\S]*?\r?\n---/,
      "",
    );
    for (const { alt, src } of await figuresIn(body, pathToFileURL(file))) {
      if (!alt.trim()) {
        problems.push(`${name}: figure ${src} has empty alt text`);
      }
      let w, h;
      try {
        [w, h] = await displayedSize(
          resolve(dir, dirname(name), decodeImagePath(src)),
        );
      } catch {
        problems.push(`${name}: figure ${src} cannot be read`);
        continue;
      }
      const problem = figureSizeProblem(w, h);
      if (problem) problems.push(`${name}: figure ${src} ${problem}`);
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../src/content/case-studies",
  );
  const problems = [...(await checkCovers(dir)), ...(await checkFigures(dir))];
  if (problems.length > 0) {
    console.error(problems.map((p) => `media sizes: ${p}`).join("\n"));
    process.exit(1);
  }
  console.log("media sizes ok");
}
