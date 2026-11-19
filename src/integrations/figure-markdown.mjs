import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  figureImageHints,
  figureLayout,
  figureProblem,
} from "../utils/figure-layout.mjs";
import {
  decodeImagePath,
  displayedSize,
  isLocalImage,
} from "../utils/image-files.mjs";

/**
 * The image a paragraph holds when it holds nothing else (whitespace aside) and the image
 * is a local file: that is what becomes a Figure. Images in running text, in code (which
 * is not a paragraph of images at all), remote or root-relative images are not Figures.
 * Shared with scripts/check-media-sizes.mjs, so the build check sees what this plugin sees.
 *
 * @param {{ children?: any[] }} paragraph a hast `p` element
 * @returns {any | null} the `img` element, or null
 */
export function soleLocalImage(paragraph) {
  const kids = (paragraph.children ?? []).filter(
    (c) => !(c.type === "text" && c.value.trim() === ""),
  );
  const [img] = kids;
  if (kids.length !== 1 || img?.type !== "element" || img.tagName !== "img")
    return null;
  const src = img.properties?.src;
  return typeof src === "string" && isLocalImage(src) ? img : null;
}

/** The Markdown file's path for messages. */
const whereIs = (ctx) =>
  ctx.fileURL ? fileURLToPath(ctx.fileURL) : "a Markdown file";

/**
 * Sätteri hast plugin (Astro 7's default Markdown pipeline; the ticket's
 * "rehype plugin"). Turns a paragraph that holds only an image, `![alt](./a.png
 * "caption")`, into the markup of src/components/Figure.astro:
 *
 *   <figure class="figure" data-layout="wide|tall">
 *     <img ...> [<figcaption class="figure-caption">caption</figcaption>]
 *   </figure>
 *
 * It runs before Astro's own image-marker plugin, which then finds the same
 * <img> node and swaps in the optimised image. Wide or tall comes from the
 * file's aspect ratio. An empty alt, an unreadable image or a missing file URL
 * fails the build, naming the file and the image.
 *
 * @type {import("satteri").HastPluginDefinition}
 */
export const figureMarkdownPlugin = {
  name: "figure-markdown",
  element: {
    filter: ["p"],
    async visit(node, ctx) {
      const img = soleLocalImage(node);
      if (!img) return;
      const props = img.properties ?? {};
      const src = String(props.src);
      const alt = typeof props.alt === "string" ? props.alt : "";
      const caption = typeof props.title === "string" ? props.title : undefined;
      const where = whereIs(ctx);
      const problem = figureProblem({ alt, caption, edited: false });
      if (problem) throw new Error(`${where}: figure ${src}: ${problem}`);
      if (!ctx.fileURL) {
        throw new Error(
          `figure ${src}: the Markdown file's location is unknown, so the image cannot be read`,
        );
      }
      let width, height;
      try {
        [width, height] = await displayedSize(
          resolve(dirname(fileURLToPath(ctx.fileURL)), decodeImagePath(src)),
        );
      } catch (error) {
        throw new Error(
          `${where}: figure ${src} cannot be read: ${error instanceof Error ? error.message : error}`,
          { cause: error },
        );
      }
      // The caption moves to <figcaption>; a title attribute would repeat it.
      const imgProps = { ...props };
      delete imgProps.title;
      const layout = figureLayout(width, height);
      // `widths`, `sizes` and `format` are read by Astro's image optimisation (getImage)
      // from the same <img> node and do not reach the HTML. loading and decoding match
      // Figure.astro.
      const children = [
        {
          ...img,
          properties: {
            ...imgProps,
            ...figureImageHints(layout),
            format: "webp",
            loading: "lazy",
            decoding: "async",
          },
        },
      ];
      if (caption) {
        children.push({
          type: "element",
          tagName: "figcaption",
          properties: { className: ["figure-caption"] },
          children: [{ type: "text", value: caption }],
        });
      }
      return {
        type: "element",
        tagName: "figure",
        properties: {
          className: ["figure"],
          "data-layout": layout,
        },
        children,
      };
    },
  },
};
