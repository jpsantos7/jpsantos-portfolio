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

describe("fallback faces (src/css/global/fonts.css)", () => {
  const css = readFileSync(
    new URL("../src/css/global/fonts.css", import.meta.url),
    "utf8",
  );
  const faces = [...css.matchAll(/@font-face \{([^}]*)\}/g)].map((m) => m[1]!);

  it("name every fallback face after a family in fonts.json", () => {
    const names = new Set(
      faces.map((f) => /font-family: "([^"]+) fallback"/.exec(f)?.[1]),
    );
    expect([...names].sort()).toEqual(
      tokens.items.map((t: { value: string[] }) => t.value[0]).sort(),
    );
  });

  it("add the Linux and ChromeOS look-alikes after each platform face", () => {
    const wants: Record<string, string[]> = {
      Arial: ["Liberation Sans", "Arimo"],
      "Arial Bold": ["Liberation Sans Bold", "Arimo Bold"],
      "Courier New": ["Liberation Mono", "Cousine"],
      "Times New Roman Italic": ["Liberation Serif Italic", "Tinos Italic"],
    };
    for (const face of faces) {
      const src = /src:\s*([^;]+);/.exec(face)![1]!.replace(/\s+/g, " ");
      const [platform] = Object.keys(wants).filter((k) =>
        src.startsWith(`local("${k}")`),
      );
      expect(platform, src).toBeDefined();
      for (const alt of wants[platform!]!)
        expect(src).toContain(`local("${alt}")`);
    }
  });

  it("give each face size-adjust and ascent/descent overrides", () => {
    for (const face of faces) {
      expect(face).toMatch(/size-adjust: \d+(\.\d+)?%;/);
      expect(face).toMatch(/ascent-override: /);
      expect(face).toMatch(/descent-override: /);
    }
  });
});

describe("weight tokens", () => {
  const weights = JSON.parse(
    readFileSync(
      new URL("../src/design-tokens/font-weights.json", import.meta.url),
      "utf8",
    ),
  );
  it("hold the prototype weights the owner approved on 2026-11-17", () => {
    const byName = Object.fromEntries(
      weights.items.map((w: { name: string; value: number }) => [
        w.name,
        w.value,
      ]),
    );
    expect(byName).toEqual({
      body: 400,
      lead: 400,
      emphasis: 400,
      label: 500,
      strong: 700,
      "display-secondary": 700,
      heading: 800,
    });
  });
});
