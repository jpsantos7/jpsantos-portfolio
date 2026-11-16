// Reads src/design-tokens/*.json and writes the two generated, gitignored files:
//   src/css/global/tokens.css and src/css/utilities/generated.css
// Run by npm `predev` and `prebuild`. Exits non-zero on any WCAG 1.4.4 flag.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generate } from "./generate.mjs";

const root = new URL("../", import.meta.url);
/** @param {string} name */
const read = (name) =>
  JSON.parse(readFileSync(new URL(`design-tokens/${name}.json`, root), "utf8"));

try {
  const { tokensCss, utilitiesCss } = generate({
    viewports: read("viewports"),
    textSizes: read("text-sizes"),
    spacing: read("spacing"),
    colors: read("colors"),
    fonts: read("fonts"),
  });
  for (const [path, css] of [
    ["css/global/tokens.css", tokensCss],
    ["css/utilities/generated.css", utilitiesCss],
  ]) {
    const url = new URL(path, root);
    mkdirSync(new URL("./", url), { recursive: true });
    writeFileSync(url, css);
  }
  console.log("tokens: wrote tokens.css and generated.css");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
