// Astro Fonts API config, built from src/design-tokens/fonts.json so the family
// names and fallback stacks have one source. Astro emits --font-<role> (family,
// optimised fallback, then the stack) and the @font-face rules; see Base.astro.
//
// font-display: swap. Text shows at once in the metric-adjusted fallback and
// swaps when the file arrives; the fallback matches the font's metrics, so the
// swap shifts nothing (CLS) and text stays readable while fonts load.
// Subset: Basic Latin, Latin-1 Supplement, and the punctuation listed below.
import { readFileSync } from "node:fs";
import { fontProviders } from "astro/config";

const tokens = JSON.parse(
  readFileSync(new URL("./design-tokens/fonts.json", import.meta.url), "utf8"),
);

const unicodeRange = [
  "U+0020-007E",
  "U+00A0-00FF",
  "U+2013",
  "U+2014",
  "U+2018",
  "U+2019",
  "U+201C",
  "U+201D",
  "U+2026",
  "U+2022",
  "U+20AC",
  "U+2122",
];

const dir = "./src/assets/fonts/";

// Per role: the file, and the weight range and style that file serves.
const files = {
  heading: {
    file: "bricolage-grotesque.woff2",
    weight: "400 800",
    style: "normal",
  },
  body: { file: "geist.woff2", weight: "400 700", style: "normal" },
  label: { file: "geist-mono.woff2", weight: 500, style: "normal" },
  emphasis: { file: "fraunces-italic.woff2", weight: 400, style: "italic" },
};

/**
 * @typedef {{ src: string[], weight: string | number, style: string, display: string, unicodeRange: string[] }} Variant
 * @typedef {{ provider: unknown, name: string, cssVariable: string, fallbacks: string[], optimizedFallbacks: boolean, options: { variants: Variant[] } }} Family
 */

/** @type {Family[]} */
export const fonts = tokens.items.map(({ name, value }) => {
  const { file, weight, style } = files[name];
  return {
    provider: fontProviders.local(),
    name: value[0],
    cssVariable: `--font-${name}`,
    // Last entry is the generic Astro builds the optimised fallback from.
    fallbacks: value.slice(1),
    optimizedFallbacks: true,
    options: {
      variants: [
        {
          src: [`${dir}${file}`],
          weight,
          style,
          display: "swap",
          unicodeRange,
        },
      ],
    },
  };
});
