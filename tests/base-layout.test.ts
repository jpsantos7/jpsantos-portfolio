import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Base from "../src/layouts/Base.astro";

const render = async (
  props: Record<string, unknown>,
  path = "/about/",
): Promise<string> => {
  const container = await AstroContainer.create();
  return container.renderToString(Base, {
    props,
    request: new Request(`https://jpsantos.eu${path}`),
    partial: false,
  });
};

describe("Base layout head", () => {
  it("renders title, description, canonical and social tags", async () => {
    const html = await render({ title: "About", description: "A description" });
    expect(html).toContain('<html lang="en-GB"');
    expect(html).toContain("<title>About — JP Santos</title>");
    expect(html).toContain('name="description" content="A description"');
    expect(html).toContain('rel="canonical" href="https://jpsantos.eu/about"');
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('property="og:locale" content="en_GB"');
    expect(html).toContain('property="og:title" content="About — JP Santos"');
    expect(html).toContain(
      'property="og:url" content="https://jpsantos.eu/about"',
    );
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).not.toContain("twitter:site");
    expect(html).not.toContain("noindex");
  });

  it("uses the Home title and a slashless canonical on /", async () => {
    const html = await render(
      { title: "x", description: "d", home: true },
      "/",
    );
    expect(html).toContain("<title>JP Santos — Design Engineer</title>");
    expect(html).toContain('rel="canonical" href="https://jpsantos.eu"');
  });

  it("noindex pages get a robots meta and no canonical", async () => {
    const html = await render(
      { title: "Not found", description: "d", noindex: true },
      "/404.html",
    );
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).not.toContain('rel="canonical"');
  });

  it("fails when the description is missing or blank", async () => {
    await expect(render({ title: "About" })).rejects.toThrow(/description/i);
    await expect(render({ title: "About", description: "  " })).rejects.toThrow(
      /description/i,
    );
  });
});
