import { describe, expect, it } from "vitest";
import { canonicalUrl, pageTitle, SITE_URL } from "../src/utils/seo";

describe("pageTitle", () => {
  it("is `Page — JP Santos` for a page", () => {
    expect(pageTitle("About")).toBe("About — JP Santos");
  });
  it("is `JP Santos — Design Engineer` for Home", () => {
    expect(pageTitle("ignored", { home: true })).toBe(
      "JP Santos — Design Engineer",
    );
  });
});

describe("canonicalUrl", () => {
  it("uses the apex HTTPS origin", () => {
    expect(SITE_URL).toBe("https://jpsantos.eu");
  });
  it("has no trailing slash, Home included", () => {
    expect(canonicalUrl("/")).toBe("https://jpsantos.eu");
    expect(canonicalUrl("/about/")).toBe("https://jpsantos.eu/about");
    expect(canonicalUrl("/work/some-slug")).toBe(
      "https://jpsantos.eu/work/some-slug",
    );
  });
  it("only drops a whole index.html segment", () => {
    expect(canonicalUrl("/myindex.html")).toBe(
      "https://jpsantos.eu/myindex.html",
    );
    expect(canonicalUrl("/about/myindex.html")).toBe(
      "https://jpsantos.eu/about/myindex.html",
    );
  });
  it("drops index.html so every form points at the one URL", () => {
    expect(canonicalUrl("/index.html")).toBe("https://jpsantos.eu");
    expect(canonicalUrl("/about/index.html")).toBe("https://jpsantos.eu/about");
  });
});
