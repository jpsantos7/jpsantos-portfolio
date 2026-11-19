import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  FIGURE_LANDSCAPE_DISPLAY,
  FIGURE_PORTRAIT_DISPLAY,
  checkFigures,
  figureSizeProblem,
  meetsFigureMinimum,
} from "../scripts/check-media-sizes.mjs";
import {
  figureLayout,
  focalPercent,
  figureProblem,
} from "../src/utils/figure-layout.mjs";

describe("Figure display widths", () => {
  it("are 1280 for landscape and 640 for portrait or square", () => {
    expect(FIGURE_LANDSCAPE_DISPLAY).toBe(1280);
    expect(FIGURE_PORTRAIT_DISPLAY).toBe(640);
  });

  it("classes by aspect ratio; square counts as tall", () => {
    expect(figureLayout(2560, 1440)).toBe("wide");
    expect(figureLayout(1280, 1280)).toBe("tall");
    expect(figureLayout(1280, 1800)).toBe("tall");
  });
});

describe("Figure source size rule", () => {
  it("needs 2560 px for landscape, 1280 px for portrait or square", () => {
    expect(figureSizeProblem(2560, 1440)).toBeNull();
    expect(figureSizeProblem(2559, 1440)).toMatch(/2560/);
    expect(figureSizeProblem(1280, 1800)).toBeNull();
    expect(figureSizeProblem(1279, 1800)).toMatch(/1280/);
    expect(figureSizeProblem(1280, 1280)).toBeNull();
    expect(figureSizeProblem(1200, 1200)).toMatch(/1280/);
  });

  it("still agrees with meetsFigureMinimum", () => {
    expect(meetsFigureMinimum(2560, FIGURE_LANDSCAPE_DISPLAY)).toBe(true);
    expect(meetsFigureMinimum(1279, FIGURE_PORTRAIT_DISPLAY)).toBe(false);
  });
});

const png = (w: number, h: number) =>
  sharp({
    create: { width: w, height: h, channels: 3, background: "#888" },
  })
    .png()
    .toBuffer();

async function folder(
  files: Record<string, [number, number]>,
  body: string,
): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "figures-"));
  for (const [name, [w, h]] of Object.entries(files)) {
    writeFileSync(join(dir, name), await png(w, h));
  }
  writeFileSync(join(dir, "a.md"), `---\ntitle: x\n---\n\n${body}\n`);
  return dir;
}

describe("checkFigures", () => {
  it("passes Figures that meet the rule, with or without a caption", async () => {
    const dir = await folder(
      { "wide.png": [2560, 1440], "tall.png": [1280, 1600] },
      '![alt one](./wide.png "caption")\n\n![alt two](./tall.png)',
    );
    expect(await checkFigures(dir)).toEqual([]);
  });

  it("fails an undersized landscape and an undersized portrait Figure", async () => {
    const dir = await folder(
      { "wide.png": [2000, 1000], "tall.png": [1000, 1600] },
      "![a](./wide.png)\n\n![b](./tall.png)",
    );
    const problems = await checkFigures(dir);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/a\.md.*wide\.png.*2560/);
    expect(problems[1]).toMatch(/tall\.png.*1280/);
  });

  it("applies EXIF orientation before classing and measuring", async () => {
    // Stored 1280x2560 with orientation 6: displayed 2560x1280, so landscape
    // at 2560 wide passes; stored 2000x1000 rotated is 1000x2000 portrait < 1280.
    const dir = mkdtempSync(join(tmpdir(), "figures-"));
    writeFileSync(
      join(dir, "ok.jpg"),
      await sharp({
        create: { width: 1280, height: 2560, channels: 3, background: "#888" },
      })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer(),
    );
    writeFileSync(
      join(dir, "bad.jpg"),
      await sharp({
        create: { width: 2000, height: 1000, channels: 3, background: "#888" },
      })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer(),
    );
    writeFileSync(join(dir, "a.md"), "![a](./ok.jpg)\n\n![b](./bad.jpg)\n");
    const problems = await checkFigures(dir);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/bad\.jpg.*1280/);
  });

  it("fails empty alt text, an unreadable file, and ignores remote images", async () => {
    const dir = await folder(
      { "tall.png": [1280, 1600] },
      "![](./tall.png)\n\n![b](./nope.png)\n\n![c](https://example.com/x.png)",
    );
    const problems = await checkFigures(dir);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/alt/i);
    expect(problems[1]).toMatch(/nope\.png.*cannot be read/);
  });
});

describe("Figure props", () => {
  it("requires alt text", () => {
    expect(
      figureProblem({ alt: "", caption: undefined, edited: false }),
    ).toMatch(/alt/i);
    expect(figureProblem({ alt: "  ", caption: "c", edited: false })).toMatch(
      /alt/i,
    );
  });

  it("requires a caption when redrawn or blurred", () => {
    expect(
      figureProblem({ alt: "a", caption: undefined, edited: true }),
    ).toMatch(/caption/i);
    expect(figureProblem({ alt: "a", caption: " ", edited: true })).toMatch(
      /caption/i,
    );
    expect(figureProblem({ alt: "a", caption: "c", edited: true })).toBeNull();
  });

  it("allows no caption otherwise", () => {
    expect(
      figureProblem({ alt: "a", caption: undefined, edited: false }),
    ).toBeNull();
  });
});

describe("checkFigures finds exactly what the plugin makes into Figures", () => {
  it("ignores fenced code, inline code, inline images, remote and root images", async () => {
    const dir = await folder(
      {},
      [
        "```md",
        "![](./nope.png)",
        "```",
        "",
        "Inline `![](./nope.png)` code and ![](./nope.png) inline image.",
        "",
        "![](https://example.com/x.png)",
        "",
        "![](/public.png)",
      ].join("\n"),
    );
    expect(await checkFigures(dir)).toEqual([]);
  });

  it("decodes percent-encoded paths", async () => {
    const dir = await folder(
      { "my photo.png": [1280, 1600] },
      "![alt](./my%20photo.png)",
    );
    expect(await checkFigures(dir)).toEqual([]);
  });
});

describe("focalPercent", () => {
  it("clamps to 0..100 and passes other values through", () => {
    expect(focalPercent(30.4)).toBe(30.4);
    expect(focalPercent(-5)).toBe(0);
    expect(focalPercent(120)).toBe(100);
  });
});
