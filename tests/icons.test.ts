import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const pub = new URL("../public/", import.meta.url);
const read = (name: string) => readFileSync(new URL(name, pub));
const colors = JSON.parse(
  readFileSync(
    new URL("../src/design-tokens/colors.json", import.meta.url),
    "utf8",
  ),
) as { items: { name: string; value?: string; light?: string }[] };
const token = (name: string) => {
  const c = colors.items.find((i) => i.name === name);
  return c?.value ?? c?.light;
};

describe("icon files", () => {
  const pngs: [string, number][] = [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["icon-maskable-512.png", 512],
  ];
  for (const [name, size] of pngs) {
    it(`${name} is a ${size}px square PNG`, async () => {
      const meta = await sharp(read(name)).metadata();
      expect(meta.format).toBe("png");
      expect([meta.width, meta.height]).toEqual([size, size]);
    });
  }

  it("maskable icon is a full-bleed square, the others have rounded corners", async () => {
    const alpha = async (name: string) => {
      const { data, info } = await sharp(read(name))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      return data[info.channels - 1]; // alpha of pixel (0,0)
    };
    expect(await alpha("icon-maskable-512.png")).toBe(255);
    expect(await alpha("icon-512.png")).toBe(0);
    expect(await alpha("icon-192.png")).toBe(0);
    expect(await alpha("apple-touch-icon.png")).toBe(0);
  });

  it("favicon.ico is one 32px PNG image", () => {
    const ico = read("favicon.ico");
    expect(ico.readUInt16LE(0)).toBe(0); // reserved
    expect(ico.readUInt16LE(2)).toBe(1); // type: icon
    expect(ico.readUInt16LE(4)).toBe(1); // image count
    expect(ico[6]).toBe(32); // width
    expect(ico[7]).toBe(32); // height
    const length = ico.readUInt32LE(14);
    const offset = ico.readUInt32LE(18);
    expect(offset + length).toBeLessThanOrEqual(ico.length);
    const signature = ico.subarray(offset, offset + 8);
    expect([...signature]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it("icon.svg is outlined paths in the token colours, with no live text", () => {
    const svg = read("icon.svg").toString("utf8");
    expect(svg).toMatch(/^<svg[^>]*viewBox="0 0 100 100"/);
    expect(svg).not.toMatch(/<text|<tspan|font-family/);
    expect(svg).toContain(token("ink")!);
    expect(svg).toContain(token("yellow")!);
    expect(svg).toContain(token("bg")!);
    expect(svg).toMatch(/<path /);
  });
});

describe("manifest", () => {
  const manifest = JSON.parse(read("manifest.webmanifest").toString("utf8"));

  it("has visitor-facing names as placeholders and token colours", () => {
    expect(manifest.name).toMatch(/^PLACEHOLDER: /);
    expect(manifest.short_name).toMatch(/^PLACEHOLDER: /);
    expect(manifest.theme_color).toBe(token("ink"));
    expect(manifest.background_color).toBe(token("ink"));
  });

  it("has start_url and display", () => {
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
  });

  it("lists 192, 512 and 512 maskable icons that exist", async () => {
    const icons = manifest.icons as {
      src: string;
      sizes: string;
      type: string;
      purpose?: string;
    }[];
    expect(icons.map((i) => `${i.sizes} ${i.purpose ?? "any"}`).sort()).toEqual(
      ["192x192 any", "512x512 any", "512x512 maskable"],
    );
    for (const icon of icons) {
      expect(icon.type).toBe("image/png");
      const meta = await sharp(read(icon.src.replace(/^\//, ""))).metadata();
      expect(`${meta.width}x${meta.height}`).toBe(icon.sizes);
    }
  });
});
