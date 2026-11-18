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

// Lighthouse CI asserts resource-summary:font:size <= 120000 bytes (raw).
const BUDGET = 120_000;

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

  it("total under the 120 KB per-page budget even if one page uses all four", () => {
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
      "Courier New Bold": ["Liberation Mono Bold", "Cousine Bold"],
      "Times New Roman Bold Italic": [
        "Liberation Serif Bold Italic",
        "Tinos Bold Italic",
      ],
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

describe("bold weights", () => {
  const range = (role: string) => {
    const v = fonts.find((f) => f.cssVariable === `--font-${role}`)!.options
      .variants[0]!;
    const [lo, hi = lo] = String(v.weight).split(" ").map(Number);
    return { lo: lo!, hi: hi!, style: v.style };
  };

  it("are served as real faces for strong inside emphasis and labels", () => {
    // 700 inside the served range means no synthesised bold.
    const emphasis = range("emphasis");
    expect(emphasis.lo).toBeLessThanOrEqual(400);
    expect(emphasis.hi).toBeGreaterThanOrEqual(700);
    expect(emphasis.style).toBe("italic");
    const label = range("label");
    expect(label.lo).toBeLessThanOrEqual(500);
    expect(label.hi).toBeGreaterThanOrEqual(700);
  });
});

describe("subset unicode range", () => {
  it("is the same in subset-fonts.sh and the fonts config", () => {
    const script = readFileSync(
      new URL("../scripts/subset-fonts.sh", import.meta.url),
      "utf8",
    );
    const unicodes = /^UNICODES="([^"]+)"/m.exec(script)?.[1];
    expect(unicodes).toBeDefined();
    for (const f of fonts) {
      for (const v of f.options.variants) {
        expect(v.unicodeRange.join(",")).toBe(unicodes);
      }
    }
  });
});

describe("fonts config guard", () => {
  it("names the role when fonts.json has no file entry for it", async () => {
    // fonts.config.mjs reads fonts.json at import time, so stub the read for one import.
    const { vi } = await import("vitest");
    vi.resetModules();
    vi.doMock("node:fs", async (orig) => {
      const real = await orig<typeof import("node:fs")>();
      return {
        ...real,
        readFileSync: (path: unknown, ...rest: unknown[]) =>
          String(path).endsWith("fonts.json")
            ? JSON.stringify({
                items: [{ name: "display", value: ["X", "serif"] }],
              })
            : (real.readFileSync as (...a: unknown[]) => unknown)(
                path,
                ...rest,
              ),
      };
    });
    await expect(import("../src/fonts.config.mjs")).rejects.toThrow(
      /"display"/,
    );
    vi.doUnmock("node:fs");
    vi.resetModules();
  });
});
