import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

describe("eslint-plugin-astro jsx-a11y config", () => {
  it("flags an <img> without alt in an .astro template", async () => {
    const eslint = new ESLint({ cwd: process.cwd() });
    const [result] = await eslint.lintText('<img src="x.png" />\n', {
      filePath: "src/pages/fixture.astro",
    });
    expect(result?.messages.map((m) => m.ruleId)).toContain(
      "astro/jsx-a11y/alt-text",
    );
  });
});
