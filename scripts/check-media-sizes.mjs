import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/**
 * Source-size rules from vault decision 024 (Photography). They live in a
 * build script, not the content schema: Astro's content layer validates
 * frontmatter before `image()` resolves the file, so a schema cannot see an
 * image's dimensions (and `image().refine()` is unsupported).
 */
export const COVER_MIN_WIDTH = 2880;
export const FIGURE_MIN_RATIO = 2;

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

/**
 * A Figure source must be at least 2x its display width. Figures have no
 * schema or component yet (tickets 035/037); call this where they land.
 *
 * @param {number} sourceWidth
 * @param {number} displayWidth
 */
export const meetsFigureMinimum = (sourceWidth, displayWidth) =>
  sourceWidth >= displayWidth * FIGURE_MIN_RATIO;

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
    let meta;
    try {
      meta = await sharp(resolve(dir, dirname(name), imagePath)).metadata();
    } catch {
      problems.push(`${name}: cover ${imagePath} cannot be read`);
      continue;
    }
    // EXIF orientation 5-8 means the pixels are stored rotated by a quarter
    // turn, so the displayed width and height are swapped.
    const turned = (meta.orientation ?? 1) >= 5;
    const [w, h] = turned
      ? [meta.height, meta.width]
      : [meta.width, meta.height];
    const problem = coverSizeProblem(w ?? 0, h ?? 0);
    if (problem) problems.push(`${name}: cover ${imagePath} ${problem}`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../src/content/case-studies",
  );
  const problems = await checkCovers(dir);
  if (problems.length > 0) {
    console.error(problems.map((p) => `media sizes: ${p}`).join("\n"));
    process.exit(1);
  }
  console.log("media sizes ok");
}
