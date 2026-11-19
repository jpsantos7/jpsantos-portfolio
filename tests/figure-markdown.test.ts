import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { markdownToHtml } from "satteri";
import sharp from "sharp";
import { figureMarkdownPlugin } from "../src/integrations/figure-markdown.mjs";

async function render(md: string, files: Record<string, [number, number]>) {
  const dir = mkdtempSync(join(tmpdir(), "figmd-"));
  for (const [name, [w, h]] of Object.entries(files)) {
    writeFileSync(
      join(dir, name),
      await sharp({
        create: { width: w, height: h, channels: 3, background: "#888" },
      })
        .png()
        .toBuffer(),
    );
  }
  const { html } = await markdownToHtml(md, {
    hastPlugins: [figureMarkdownPlugin],
    fileURL: new URL(`file://${dir}/post.md`),
  });
  return html;
}

describe("figureMarkdownPlugin", () => {
  it("wraps a landscape image in a wide figure with a caption from the title", async () => {
    const html = await render('![alt text](./w.png "A caption")', {
      "w.png": [200, 100],
    });
    expect(html).toContain('<figure class="figure" data-layout="wide">');
    expect(html).toContain('<img src="./w.png" alt="alt text"');
    expect(html).toContain(
      '<figcaption class="figure-caption">A caption</figcaption>',
    );
    expect(html).not.toContain("<p><figure");
    expect(html).not.toContain("<p><img");
  });

  it("makes portrait and square images tall, with no figcaption without a title", async () => {
    const html = await render("![a](./t.png)\n\n![b](./s.png)", {
      "t.png": [100, 200],
      "s.png": [100, 100],
    });
    expect(html.match(/data-layout="tall"/g)).toHaveLength(2);
    expect(html).not.toContain("figcaption");
  });

  it("leaves images inside running text alone", async () => {
    const html = await render("Some ![a](./w.png) text", {
      "w.png": [200, 100],
    });
    expect(html).toContain("<p>Some <img");
    expect(html).not.toContain("<figure");
  });

  it("decodes percent-encoded paths", async () => {
    const html = await render("![a](./my%20photo.png)", {
      "my photo.png": [200, 100],
    });
    expect(html).toContain('data-layout="wide"');
  });

  it("keeps lazy loading and async decoding, like Figure.astro", async () => {
    const html = await render("![a](./w.png)", { "w.png": [200, 100] });
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });

  it("names the Markdown file and image when the image cannot be read", async () => {
    await expect(render("![a](./missing.png)", {})).rejects.toThrow(
      /post\.md.*missing\.png.*cannot be read/,
    );
  });

  it("throws, naming the image, when the file location is unknown", async () => {
    await expect(
      markdownToHtml("![a](./w.png)", { hastPlugins: [figureMarkdownPlugin] }),
    ).rejects.toThrow(/w\.png.*location/);
  });

  it("throws on empty alt, naming the file", async () => {
    await expect(
      render("![](./w.png)", { "w.png": [200, 100] }),
    ).rejects.toThrow(/alt/i);
  });
});
