import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import Figure from "../src/components/Figure.astro";
import Photo from "../src/components/Photo.astro";
import cover from "../src/content/case-studies/email-builder-cover.jpg";
import tall from "../src/content/case-studies/email-builder-figure-tall.jpg";
import wide from "../src/content/case-studies/email-builder-figure-wide.jpg";

const render = async (
  component: Parameters<AstroContainer["renderToString"]>[0],
  props: Record<string, unknown>,
) => (await AstroContainer.create()).renderToString(component, { props });

describe("Photo", () => {
  it.each([
    ["row", "50% 50%"],
    ["cover", "50% 50%"],
    ["band", "50% 50%"],
  ])("renders the %s crop decorative, with the focal point", async (crop) => {
    const html = await render(Photo, {
      src: cover,
      crop,
      focalPoint: { x: 50, y: 50 },
    });
    expect(html).toContain(`data-crop="${crop}"`);
    expect(html).toMatch(/<img[^>]* alt(=""|\s|>)/);
    expect(html).toContain("--fx: 50%; --fy: 50%");
    expect(html).toContain("fm=avif");
    expect(html).toContain("sizes=");
  });

  it("applies the focal point as object-position", async () => {
    const html = await render(Photo, {
      src: cover,
      crop: "band",
      focalPoint: { x: 20, y: 80 },
    });
    expect(html).toContain("--fx: 20%; --fy: 80%");
  });

  it("sizes the cover for the frame height, not just the width", async () => {
    const html = await render(Photo, {
      src: cover,
      crop: "cover",
      focalPoint: { x: 50, y: 50 },
    });
    // 2880x1800 is ratio 1.6: the cover draws max(100vw, 160svh) wide.
    expect(html).toContain('sizes="max(100vw, 160svh)"');
  });

  it("offers a 1280 px candidate for the full-screen cover", async () => {
    const html = await render(Photo, {
      src: cover,
      crop: "cover",
      focalPoint: { x: 50, y: 50 },
    });
    expect(html).toMatch(/w=1280[^"]*1280w/);
  });
});

// Owner decision 2026-11-19: every image is AVIF only. A fallback file in any other
// format (the Netlify image URL carries it as fm=) or a <picture> would break that.
describe("AVIF only", () => {
  const other =
    /fm=(webp|jpe?g|png|gif)\b|<picture|<source|\.(webp|jpe?g|png)\s+\d+w/;

  it("Photo and Figure reference only avif variants", async () => {
    const photo = await render(Photo, {
      src: cover,
      crop: "cover",
      focalPoint: { x: 50, y: 50 },
    });
    const figure = await render(Figure, { src: wide, alt: "a" });
    for (const html of [photo, figure]) {
      expect(html).toContain("fm=avif");
      expect(html).not.toMatch(other);
    }
  });
});

describe("Figure", () => {
  it("renders full alt text, a layout by aspect ratio and an optional figcaption", async () => {
    const withCaption = await render(Figure, {
      src: wide,
      alt: "Full alt",
      caption: "A caption",
    });
    expect(withCaption).toContain('data-layout="wide"');
    expect(withCaption).toContain('alt="Full alt"');
    expect(withCaption).toContain(
      '<figcaption class="figure-caption">A caption</figcaption>',
    );
    const bare = await render(Figure, { src: tall, alt: "Full alt" });
    expect(bare).toContain('data-layout="tall"');
    expect(bare).not.toContain("figcaption");
  });

  it("fails on empty alt", async () => {
    await expect(render(Figure, { src: wide, alt: "" })).rejects.toThrow(
      /alt/i,
    );
  });

  it("fails on an undersized source, landscape and portrait", async () => {
    const fake = (width: number, height: number) => ({
      src: "/x.jpg",
      width,
      height,
      format: "jpg" as const,
    });
    await expect(
      render(Figure, { src: fake(2000, 1000), alt: "a" }),
    ).rejects.toThrow(/2560/);
    await expect(
      render(Figure, { src: fake(1000, 1600), alt: "a" }),
    ).rejects.toThrow(/1280/);
  });

  it("fails on an edited Figure with no caption", async () => {
    await expect(
      render(Figure, { src: wide, alt: "a", edited: true }),
    ).rejects.toThrow(/caption/i);
    await expect(
      render(Figure, { src: wide, alt: "a", edited: true, caption: "Redrawn" }),
    ).resolves.toContain("Redrawn");
  });
});

// The largest above-the-fold image is the full-screen Cover a 1280px desktop
// gets. Netlify Image CDN encodes at quality 75 by default; sharp stands in for
// it here. Real photos are checked by the lhci image-size budget on built pages.
describe("above-the-fold image budget", () => {
  const BUDGET = 150_000;
  it.each(["avif"] as const)(
    "the 1280 px %s of the stand-in Cover is within 150 KB",
    async (format) => {
      const file = new URL(
        "../src/content/case-studies/email-builder-cover.jpg",
        import.meta.url,
      );
      const out = await sharp(file.pathname)
        .resize(1280, 800)
        .toFormat(format, { quality: 75 })
        .toBuffer();
      expect(out.length).toBeLessThanOrEqual(BUDGET);
    },
  );
});

// The filter in Base.astro copies the colour tokens as table values.
describe("duotone filter", () => {
  const tokens = JSON.parse(
    readFileSync(
      new URL("../src/design-tokens/colors.json", import.meta.url),
      "utf8",
    ),
  ) as { items: { name: string; value?: string }[] };
  const hex = (name: string) =>
    tokens.items.find((i) => i.name === name)?.value ?? "";
  const channels = (h: string) =>
    [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

  it("maps ink to yellow, derived from the colour tokens", () => {
    const base = readFileSync(
      new URL("../src/layouts/Base.astro", import.meta.url),
      "utf8",
    );
    const tables = [...base.matchAll(/tableValues="([^"]+)"/g)].map((m) =>
      (m[1] ?? "").split(" ").map(Number),
    );
    const [ink, yellow] = [channels(hex("ink")), channels(hex("yellow"))];
    expect(tables).toHaveLength(3);
    tables.forEach((table, c) => {
      expect(table[0]).toBeCloseTo(ink[c] ?? NaN, 3);
      expect(table[1]).toBeCloseTo(yellow[c] ?? NaN, 3);
    });
  });

  it("uses gamma 0.5 and the same filter for both themes", () => {
    const base = readFileSync(
      new URL("../src/layouts/Base.astro", import.meta.url),
      "utf8",
    );
    expect(base.match(/exponent="0.5"/g)).toHaveLength(3);
    expect(base.match(/<filter /g)).toHaveLength(1);
  });
});
