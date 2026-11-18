import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  COVER_MIN_WIDTH,
  checkCovers,
  coverSizeProblem,
  meetsFigureMinimum,
} from "../scripts/check-media-sizes.mjs";
import { caseStudySchema } from "../src/utils/case-study-schema";
import { publishedCaseStudies } from "../src/utils/case-studies";

// Stand-in for Astro's image() helper: the real one resolves a file to this
// metadata shape, which is all the schema reads.
const fakeImage = () =>
  z.object({
    src: z.string(),
    width: z.number(),
    height: z.number(),
    format: z.string(),
  });
const schema = caseStudySchema(fakeImage);

const cover = (over: Record<string, unknown> = {}) => ({
  image: { src: "/c.jpg", width: 2880, height: 1800, format: "jpg" },
  focalPoint: { x: 50, y: 50 },
  sourceUrl: "https://example.com/photo",
  photographer: "PLACEHOLDER: photographer",
  ...over,
});

const base = {
  title: "PLACEHOLDER: title",
  outcome: "PLACEHOLDER: outcome",
  results: [{ claim: "PLACEHOLDER: claim" }],
  disclosure: "anonymised",
  role: "PLACEHOLDER: role",
  team: "PLACEHOLDER: team",
  period: "PLACEHOLDER: period",
  employer: "PLACEHOLDER: employer",
  industry: "PLACEHOLDER: industry",
  scale: "PLACEHOLDER: scale",
  stack: ["a", "b"],
  cover: cover(),
  order: 1,
};
const parse = (over: Record<string, unknown>) =>
  schema.safeParse({ ...base, ...over });

describe("case study schema", () => {
  it("accepts a valid Anonymised entry and defaults draft to false", () => {
    const r = parse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.draft).toBe(false);
  });

  it("accepts a valid Named entry with client", () => {
    const r = parse({
      disclosure: "named",
      client: "PLACEHOLDER: client",
      industry: undefined,
      scale: undefined,
    });
    expect(r.success).toBe(true);
  });

  it("requires a one-line outcome", () => {
    expect(parse({ outcome: undefined }).success).toBe(false);
    expect(parse({ outcome: "one\ntwo" }).success).toBe(false);
  });

  it("requires 1 to 3 results", () => {
    expect(parse({ results: [] }).success).toBe(false);
    const four = Array.from({ length: 4 }, () => ({ claim: "c" }));
    expect(parse({ results: four }).success).toBe(false);
    const three = Array.from({ length: 3 }, () => ({
      claim: "c",
      evidence: "e",
    }));
    expect(parse({ results: three }).success).toBe(true);
  });

  it("rejects client on a non-Named entry", () => {
    for (const disclosure of ["anonymised", "outcome-only"]) {
      expect(parse({ disclosure, client: "Acme" }).success).toBe(false);
    }
  });

  it("requires client at Named, and industry + scale below it", () => {
    expect(
      parse({ disclosure: "named", industry: undefined, scale: undefined })
        .success,
    ).toBe(false);
    expect(parse({ industry: undefined }).success).toBe(false);
    expect(parse({ scale: undefined }).success).toBe(false);
  });

  it("rejects an unknown disclosure level", () => {
    expect(parse({ disclosure: "secret" }).success).toBe(false);
  });

  it("allows at most 6 stack items", () => {
    const seven = Array.from({ length: 7 }, (_, i) => `t${i}`);
    expect(parse({ stack: seven }).success).toBe(false);
    expect(parse({ stack: seven.slice(0, 6) }).success).toBe(true);
  });

  it("has no coverAlt and requires a cover", () => {
    expect(parse({ cover: undefined }).success).toBe(false);
    expect("coverAlt" in schema.shape).toBe(false);
  });

  it("requires a cover source URL, photographer and focal point", () => {
    expect(parse({ cover: cover({ sourceUrl: "nope" }) }).success).toBe(false);
    expect(parse({ cover: cover({ photographer: "" }) }).success).toBe(false);
    expect(parse({ cover: cover({ focalPoint: undefined }) }).success).toBe(
      false,
    );
    expect(
      parse({ cover: cover({ focalPoint: { x: 120, y: 50 } }) }).success,
    ).toBe(false);
  });

  it("accepts only http(s) URLs", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,x"]) {
      expect(parse({ cover: cover({ sourceUrl: url }) }).success).toBe(false);
      expect(parse({ sources: [{ label: "x", url }] }).success).toBe(false);
    }
  });

  it("requires an integer order", () => {
    expect(parse({ order: 1.5 }).success).toBe(false);
  });

  it("validates optional sources", () => {
    const ok = [{ label: "PLACEHOLDER: label", url: "https://example.com" }];
    expect(parse({ sources: ok }).success).toBe(true);
    expect(parse({ sources: [{ label: "x", url: "no" }] }).success).toBe(false);
  });
});

describe("Cover size rules", () => {
  it("accepts 2880 px wide landscape", () => {
    expect(COVER_MIN_WIDTH).toBe(2880);
    expect(coverSizeProblem(2880, 1800)).toBeNull();
  });

  it("rejects a Cover narrower than 2880 px", () => {
    expect(coverSizeProblem(2879, 1800)).toMatch(/at least 2880/);
  });

  it("rejects a Cover that is square or portrait", () => {
    expect(coverSizeProblem(2880, 2880)).toMatch(/landscape/);
    expect(coverSizeProblem(2880, 3600)).toMatch(/landscape/);
  });

  const folder = async (w: number, h: number, ref = "./cover.jpg") => {
    const dir = mkdtempSync(join(tmpdir(), "covers-"));
    mkdirSync(dir, { recursive: true });
    await sharp({
      create: { width: w, height: h, channels: 3, background: "#888" },
    })
      .jpeg()
      .toFile(join(dir, "cover.jpg"));
    writeFileSync(
      join(dir, "a.md"),
      `---\ntitle: x\ncover:\n  image: "${ref}"\n  focalPoint:\n    x: 1\n---\nbody\n`,
    );
    return dir;
  };

  it("passes a valid Cover file", async () => {
    expect(await checkCovers(await folder(2880, 1800))).toEqual([]);
  });

  it("fails a too-small, a portrait and a missing Cover file", async () => {
    expect(await checkCovers(await folder(2000, 1200))).toHaveLength(1);
    expect(await checkCovers(await folder(2880, 3000))).toHaveLength(1);
    expect(await checkCovers(await folder(2880, 1800, "./nope.jpg"))).toEqual([
      expect.stringContaining("cannot be read"),
    ]);
  });

  it("reads nested entries", async () => {
    const dir = await folder(2000, 1200);
    const sub = join(dir, "nested");
    mkdirSync(sub);
    await sharp({
      create: { width: 2000, height: 1200, channels: 3, background: "#888" },
    })
      .jpeg()
      .toFile(join(sub, "c.jpg"));
    writeFileSync(join(sub, "b.md"), '---\ncover:\n  image: "./c.jpg"\n---\n');
    const problems = await checkCovers(dir);
    expect(problems).toHaveLength(2);
    expect(problems.some((p) => p.includes("nested"))).toBe(true);
  });

  it("swaps width and height for a rotated EXIF orientation", async () => {
    const dir = mkdtempSync(join(tmpdir(), "covers-"));
    // Stored 2880x1800 but tagged to display as 1800x2880 (portrait).
    await sharp({
      create: { width: 2880, height: 1800, channels: 3, background: "#888" },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toFile(join(dir, "cover.jpg"));
    writeFileSync(
      join(dir, "a.md"),
      '---\ncover:\n  image: "./cover.jpg"\n---\n',
    );
    expect(await checkCovers(dir)).toHaveLength(1);
  });

  it("fails an entry with no cover", async () => {
    const dir = mkdtempSync(join(tmpdir(), "covers-"));
    writeFileSync(join(dir, "a.md"), "---\ntitle: x\n---\n");
    expect(await checkCovers(dir)).toEqual(["a.md: no cover image"]);
  });
});

describe("Figure source size", () => {
  it("needs at least 2x the display width", () => {
    expect(meetsFigureMinimum(1200, 600)).toBe(true);
    expect(meetsFigureMinimum(1199, 600)).toBe(false);
  });
});

describe("publishedCaseStudies", () => {
  const entries = [
    { id: "a", data: { draft: false, order: 2 } },
    { id: "b", data: { draft: true, order: 1 } },
    { id: "c", data: { draft: false, order: 1 } },
  ];

  it("excludes drafts in production, sorted by order", () => {
    expect(
      publishedCaseStudies(entries, { production: true }).map((e) => e.id),
    ).toEqual(["c", "a"]);
  });

  it("breaks ties on order by id", () => {
    const tied = [
      { id: "b", data: { draft: false, order: 1 } },
      { id: "a", data: { draft: false, order: 1 } },
    ];
    expect(
      publishedCaseStudies(tied, { production: true }).map((e) => e.id),
    ).toEqual(["a", "b"]);
  });

  it("keeps drafts outside production", () => {
    expect(
      publishedCaseStudies(entries, { production: false }).map((e) => e.id),
    ).toEqual(["b", "c", "a"]);
  });
});
