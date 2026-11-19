import sharp from "sharp";

// Shared by scripts/check-media-sizes.mjs and src/integrations/figure-markdown.mjs, so the
// build check and the Markdown plugin read an image path and its size the same way.

/**
 * A Markdown image src as a file path: Markdown keeps it percent-encoded
 * (`./my%20photo.jpg`), the file on disk is `my photo.jpg`.
 * @param {string} src
 */
export const decodeImagePath = (src) => decodeURI(src);

/**
 * Local means a relative path in the Case study folder: not a URL, not root-relative
 * (`public/`).
 * @param {string} src
 */
export const isLocalImage = (src) =>
  src !== "" &&
  !/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(src) &&
  !src.startsWith("/");

/**
 * Displayed size of an image file, EXIF orientation applied.
 * @param {string} file
 * @returns {Promise<[number, number]>} width, height
 */
export async function displayedSize(file) {
  const meta = await sharp(file).metadata();
  // Orientation 5-8 means the pixels are stored rotated by a quarter turn.
  const turned = (meta.orientation ?? 1) >= 5;
  return turned
    ? [meta.height ?? 0, meta.width ?? 0]
    : [meta.width ?? 0, meta.height ?? 0];
}
