import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fonts } from "../src/fonts.config.mjs";

const dir = new URL("../src/assets/fonts/", import.meta.url);
const tokens = JSON.parse(
  readFileSync(
    new URL("../src/design-tokens/fonts.json", import.meta.url),
    "utf8",
  ),
);

// Lighthouse CI asserts resource-summary:font:size <= 100000 bytes (raw).
const BUDGET = 100_000;

describe("font files", () => {
  const files = fonts.flatMap((f) =>
    f.options.variants.flatMap((v) =>
      v.src.map((src) => new URL(src.replace("./src/assets/fonts/", ""), dir)),
    ),
  );

  it("exist as woff2 under src/", () => {
    expect(files).toHaveLength(4);
    for (const url of files) {
      expect(url.pathname).toMatch(/\.woff2$/);
      expect(statSync(url).size).toBeGreaterThan(1000);
    }
  });

  it("total under the 100 KB per-page budget even if one page uses all four", () => {
    const total = files.reduce((sum, url) => sum + statSync(url).size, 0);
    expect(total).toBeLessThan(BUDGET);
  });

  it("keep an OFL licence per family", () => {
    for (const name of [
      "bricolagegrotesque",
      "geist",
      "geistmono",
      "fraunces",
    ]) {
      expect(readFileSync(new URL(`OFL-${name}.txt`, dir), "utf8")).toMatch(
        /SIL OPEN FONT LICENSE/,
      );
    }
  });
});

describe("Astro fonts config", () => {
  it("has one family per role in fonts.json, named by --font-<role>", () => {
    expect(fonts.map((f) => f.cssVariable)).toEqual(
      tokens.items.map((t: { name: string }) => `--font-${t.name}`),
    );
    expect(fonts.map((f) => f.name)).toEqual(
      tokens.items.map((t: { value: string[] }) => t.value[0]),
    );
  });

  it("keeps the owner-accepted fallback stacks, ending in the right generic", () => {
    const last = Object.fromEntries(
      fonts.map((f) => [f.cssVariable, f.fallbacks.at(-1)]),
    );
    expect(last).toEqual({
      "--font-heading": "sans-serif",
      "--font-body": "sans-serif",
      "--font-label": "monospace",
      "--font-emphasis": "serif",
    });
  });

  it("states font-display swap and the subset unicode range on every variant", () => {
    for (const f of fonts) {
      for (const v of f.options.variants) {
        expect(v.display).toBe("swap");
        expect(v.unicodeRange).toContain("U+0020-007E");
        expect(v.unicodeRange).toContain("U+2122");
      }
    }
  });
});
