import stylelint from "stylelint";
import { describe, expect, it } from "vitest";

async function lint(code: string, codeFilename = "fixture.css") {
  const result = await stylelint.lint({
    code,
    codeFilename,
    cwd: process.cwd(),
  });
  return result.results[0]?.warnings.map((w) => w.rule) ?? [];
}

describe("stylelint config", () => {
  it("fails on physical properties", async () => {
    expect(await lint("a {\n  margin-left: 0;\n}\n")).toContain(
      "property-disallowed-list",
    );
    expect(await lint("a {\n  padding-top: 0;\n}\n")).toContain(
      "property-disallowed-list",
    );
    expect(await lint("a {\n  width: 0;\n}\n")).toContain(
      "property-disallowed-list",
    );
    expect(await lint("a {\n  border-top-left-radius: 0;\n}\n")).toContain(
      "property-disallowed-list",
    );
  });

  it("fails on physical values", async () => {
    expect(await lint("a {\n  text-align: left;\n}\n")).toContain(
      "declaration-property-value-disallowed-list",
    );
  });

  it("fails on vw units", async () => {
    expect(await lint("a {\n  inline-size: 50vw;\n}\n")).toContain(
      "unit-disallowed-list",
    );
  });

  it("fails on dynamic, small and large vw units", async () => {
    for (const unit of ["dvw", "svw", "lvw"]) {
      expect(await lint(`a {\n  inline-size: 50${unit};\n}\n`)).toContain(
        "unit-disallowed-list",
      );
    }
  });

  it("allows logical float and fails physical float", async () => {
    expect(await lint("a {\n  float: inline-start;\n}\n")).toEqual([]);
    expect(await lint("a {\n  float: left;\n}\n")).toContain(
      "declaration-property-value-disallowed-list",
    );
  });

  it("lints <style> blocks in .astro files", async () => {
    const astro =
      "<p>x</p>\n<style>\n  p {\n    margin-right: 0;\n  }\n</style>\n";
    expect(await lint(astro, "fixture.astro")).toContain(
      "property-disallowed-list",
    );
  });

  it("passes logical properties", async () => {
    expect(
      await lint(
        "a {\n  margin-inline-start: 0;\n  inline-size: 50%;\n  text-align: start;\n}\n",
      ),
    ).toEqual([]);
  });
});
