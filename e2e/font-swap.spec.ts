import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// Swapping the fallback for the real face must not reflow text (CLS). Measures
// the same elements with font requests aborted (fallback only) and loaded.
// The test page is only in dist when built with CSS_TEST_PAGE=1.
const route = "/dev/css-test/";
const selectors = ["h1", "h2", "h3", "p", ".label", "em"];

type Box = { selector: string; width: number; height: number };

async function measure(
  page: import("@playwright/test").Page,
  blockFonts: boolean,
  width: number,
): Promise<{ boxes: Box[]; pageHeight: number }> {
  if (blockFonts) await page.route("**/*.woff2", (r) => r.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((selectors) => {
    // The test page copy is upper-case PLACEHOLDER text, which is not how real copy
    // sets (caps widths differ from lower-case between faces). Measure mixed-case
    // prose instead, the same text in both runs.
    const sample = "Selected work and the case studies behind it";
    for (const el of document.querySelectorAll(selectors.join(","))) {
      if (el.children.length === 0) el.textContent = sample;
    }
    const boxes = selectors.flatMap((selector) =>
      [...document.querySelectorAll(selector)].map((el) => {
        const r = el.getBoundingClientRect();
        return { selector, width: r.width, height: r.height };
      }),
    );
    return { boxes, pageHeight: document.documentElement.scrollHeight };
  }, selectors);
}

for (const width of [360, 1280]) {
  test(`fallback and real fonts lay out alike at ${width}px`, async ({
    browser,
    browserName,
  }) => {
    test.skip(
      !routes().includes(route),
      "build with CSS_TEST_PAGE=1 to run this test",
    );
    // Local fallback fonts (Arial, Times New Roman, Courier New) differ per OS,
    // so the metrics are tuned for macOS and Windows; Chromium is the gate.
    test.skip(browserName !== "chromium", "tuned and gated on Chromium");

    const fallback = await measure(
      await (await browser.newContext()).newPage(),
      true,
      width,
    );
    const real = await measure(
      await (await browser.newContext()).newPage(),
      false,
      width,
    );

    expect(fallback.boxes.length).toBe(real.boxes.length);
    fallback.boxes.forEach((f, i) => {
      const r = real.boxes[i]!;
      expect(
        Math.abs(f.height - r.height),
        `${f.selector}[${i}] height ${f.height} vs ${r.height}`,
      ).toBeLessThanOrEqual(2);
      // Block-level boxes take the container width, so widths only differ for inline em.
      expect(
        Math.abs(f.width - r.width) / r.width,
        `${f.selector}[${i}] width ${f.width} vs ${r.width}`,
      ).toBeLessThanOrEqual(0.02);
    });
    expect(Math.abs(fallback.pageHeight - real.pageHeight)).toBeLessThanOrEqual(
      8,
    );
  });
}
