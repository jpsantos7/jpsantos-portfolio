// Pure helpers shared by Figure.astro, Photo.astro, the Markdown figure plugin
// and scripts/check-media-sizes.mjs. No dependencies, so each can import it.

/**
 * Landscape Figures run full-width, up to the wrapper's 80rem (1280px): keep in step with
 * the `80rem` clamp in src/css/compositions/wrapper.css.
 */
export const FIGURE_LANDSCAPE_DISPLAY = 1280;
/**
 * Portrait and square Figures sit in a 40rem (640px) prose column: keep in step with
 * `--figure-column` in src/css/global/variables.css.
 */
export const FIGURE_PORTRAIT_DISPLAY = 640;

/** A Figure source must be at least this many times its display width (decision 024). */
export const FIGURE_MIN_RATIO = 2;

/**
 * @param {number} sourceWidth
 * @param {number} displayWidth
 */
export const meetsFigureMinimum = (sourceWidth, displayWidth) =>
  sourceWidth >= displayWidth * FIGURE_MIN_RATIO;

/**
 * @param {number} width displayed width (EXIF orientation already applied)
 * @param {number} height
 * @returns {"wide" | "tall"} landscape is wide; portrait and square are tall
 */
export const figureLayout = (width, height) =>
  width > height ? "wide" : "tall";

/**
 * @param {number} width
 * @param {number} height
 */
export const figureDisplayWidth = (width, height) =>
  figureLayout(width, height) === "wide"
    ? FIGURE_LANDSCAPE_DISPLAY
    : FIGURE_PORTRAIT_DISPLAY;

/**
 * @param {number} width displayed width (EXIF orientation applied)
 * @param {number} height
 * @returns {string | null} what is wrong with a Figure of this size, or null
 */
export function figureSizeProblem(width, height) {
  const display = figureDisplayWidth(width, height);
  if (meetsFigureMinimum(width, display)) return null;
  const kind = display === FIGURE_LANDSCAPE_DISPLAY ? "landscape" : "portrait";
  return `is ${width}px wide; a ${kind} Figure must be at least ${display * FIGURE_MIN_RATIO}px`;
}

/**
 * @param {{ alt: string, caption: string | undefined, edited: boolean }} props
 * @returns {string | null} what is wrong with these Figure props, or null
 */
export function figureProblem({ alt, caption, edited }) {
  if (typeof alt !== "string" || alt.trim() === "") {
    return "a Figure needs full alt text; an empty alt is not allowed";
  }
  if (edited && (typeof caption !== "string" || caption.trim() === "")) {
    return "a redrawn or blurred Figure needs a caption saying so";
  }
  return null;
}

/**
 * A focal-point coordinate clamped to 0..100 (percent).
 * @param {number} n
 */
export const focalPercent = (n) => Math.min(100, Math.max(0, n));

/**
 * Responsive image hints for a Figure layout: candidate widths (the largest is
 * 2x the display width) and the `sizes` attribute. Used by Figure.astro and by
 * the Markdown figure plugin, so both ship the same candidates.
 * @param {"wide" | "tall"} layout
 */
export const figureImageHints = (layout) =>
  layout === "wide"
    ? {
        widths: [640, 1280, FIGURE_LANDSCAPE_DISPLAY * 2],
        sizes: "(min-width: 80rem) 80rem, 100vw",
      }
    : {
        widths: [320, FIGURE_PORTRAIT_DISPLAY, FIGURE_PORTRAIT_DISPLAY * 2],
        sizes: "(min-width: 40rem) 40rem, 100vw",
      };
