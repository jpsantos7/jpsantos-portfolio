import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Header from "../src/components/Header.astro";
import { isCurrentPath } from "../src/utils/nav";

describe("isCurrentPath", () => {
  it("ignores trailing slashes and index.html", () => {
    expect(isCurrentPath("/about/", "/about")).toBe(true);
    expect(isCurrentPath("/about", "/about")).toBe(true);
    expect(isCurrentPath("/about/index.html", "/about")).toBe(true);
    expect(isCurrentPath("/about-us", "/about")).toBe(false);
    expect(isCurrentPath("/", "/work")).toBe(false);
  });
});

describe("Header nav", () => {
  const render = async (path: string) =>
    (await AstroContainer.create()).renderToString(Header, {
      request: new Request(`https://jpsantos.eu${path}`),
    });

  it("marks only the current page's link with aria-current", async () => {
    const html = await render("/about/");
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/<a href="\/about"[^>]*aria-current="page"/);
  });

  it("marks nothing on Home or an unknown page", async () => {
    expect(await render("/")).not.toContain("aria-current");
    expect(await render("/404.html")).not.toContain("aria-current");
  });
});
