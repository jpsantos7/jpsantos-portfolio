import { describe, expect, it } from "vitest";
import { generate, WcagError } from "../src/css-utils/generate.mjs";

const viewports = { min: 320, max: 1440 };
const base = {
  viewports,
  textSizes: {
    items: [
      { name: "step-0", min: 16, max: 19.2 },
      { name: "step-2", min: 25.6, max: 44.8 },
    ],
  },
  spacing: {
    items: [
      { name: "s", min: 16, max: 19 },
      { name: "3xs-2xs", min: 4, max: 10 },
      { name: "flat", min: 8, max: 8 },
    ],
  },
  colors: {
    items: [
      { name: "bg", light: "#f7f4ed", dark: "#1f1d1a", textUtility: false },
      { name: "fg", light: "#161412", dark: "#f1ede5" },
      { name: "yellow", value: "#f2c200", textUtility: false },
      { name: "ink", value: "#161412" },
    ],
  },
  fonts: {
    items: [
      { name: "body", value: ["Geist", "system-ui", "sans-serif"] },
      { name: "label", value: ["Geist Mono", "monospace"] },
    ],
  },
};

describe("token generator", () => {
  const { tokensCss, utilitiesCss } = generate(base);

  it("writes fluid tokens as clamp() in rem and vi, never vw", () => {
    expect(tokensCss).toMatch(
      /--size-step-0: clamp\(1rem, [\d.]+rem \+ [\d.]+vi, 1\.2rem\);/,
    );
    expect(tokensCss).toMatch(/--space-s: clamp\(1rem, .+vi, 1\.1875rem\);/);
    expect(tokensCss).not.toMatch(/\dvw/);
  });

  it("writes a constant token as plain rem", () => {
    expect(tokensCss).toContain("--space-flat: 0.5rem;");
  });

  it("writes each colour once with light-dark()", () => {
    expect(tokensCss).toContain("--color-bg: light-dark(#f7f4ed, #1f1d1a);");
    expect(tokensCss.match(/--color-bg:/g)).toHaveLength(1);
    expect(tokensCss).toContain("--color-yellow: #f2c200;");
  });

  it("quotes named font families and leaves generic ones bare", () => {
    expect(tokensCss).toContain('--font-label: "Geist Mono", monospace;');
  });

  it("generates flow-space, gutter and region-space per spacing token", () => {
    for (const name of ["s", "3xs-2xs", "flat"]) {
      expect(utilitiesCss).toContain(
        `.flow-space-${name} {\n  --flow-space: var(--space-${name});\n}`,
      );
      expect(utilitiesCss).toContain(`.gutter-${name} {`);
      expect(utilitiesCss).toContain(`.region-space-${name} {`);
    }
  });

  it("generates text and bg utilities per colour", () => {
    expect(utilitiesCss).toContain(".text-fg {\n  color: var(--color-fg);\n}");
    expect(utilitiesCss).toContain(
      ".bg-bg {\n  background-color: var(--color-bg);\n}",
    );
    expect(utilitiesCss).toContain(".text-ink {");
    expect(utilitiesCss).toContain(".bg-yellow {");
  });

  it("generates text utilities only where textUtility is not false", () => {
    const text = [...utilitiesCss.matchAll(/^\.text-([\w-]+) \{/gm)].map(
      (m) => m[1],
    );
    expect(text).toEqual(["fg", "ink"]);
    expect(utilitiesCss).not.toContain(".text-yellow");
    expect(utilitiesCss).not.toContain(".text-bg");
  });

  it("generates a bg utility for every colour", () => {
    for (const name of ["bg", "fg", "yellow", "ink"])
      expect(utilitiesCss).toContain(`.bg-${name} {`);
  });

  it("generates no margin, padding or type utilities", () => {
    expect(utilitiesCss).not.toMatch(/(^|\s)(margin|padding)[a-z-]*:/m);
    expect(utilitiesCss).not.toMatch(/font-size|\.size-|\.m[a-z]?-|\.p[a-z]?-/);
  });

  it("fails on a WCAG 1.4.4 flag and names the step", () => {
    const flagged = {
      ...base,
      textSizes: { items: [{ name: "step-6", min: 57.6, max: 272 }] },
    };
    expect(() => generate(flagged)).toThrow(WcagError);
    expect(() => generate(flagged)).toThrow(/step-6/);
  });

  it("does not apply the text check to spacing", () => {
    const wide = {
      ...base,
      spacing: { items: [{ name: "x", min: 56, max: 160 }] },
    };
    expect(() => generate(wide)).not.toThrow();
  });
});
