import { describe, expect, it } from "vitest";
import { shouldInjectTestPage } from "../src/integrations/css-test-page.mjs";

describe("css test page gate", () => {
  it("is absent from a default build", () => {
    expect(shouldInjectTestPage("build", {})).toBe(false);
  });

  it("is present under dev and when CSS_TEST_PAGE=1", () => {
    expect(shouldInjectTestPage("dev", {})).toBe(true);
    expect(shouldInjectTestPage("build", { CSS_TEST_PAGE: "1" })).toBe(true);
  });

  it("throws if the flag reaches a Netlify build", () => {
    expect(() =>
      shouldInjectTestPage("build", { CSS_TEST_PAGE: "1", NETLIFY: "true" }),
    ).toThrow(/Netlify/);
  });
});
