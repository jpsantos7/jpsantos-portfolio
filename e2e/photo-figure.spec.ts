import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// Photo and Figure on the dev page, which is only in dist when built with CSS_TEST_PAGE=1.
const route = "/dev/css-test/";
const built = routes().includes(route);

test.describe("Photo and Figure on the dev page", () => {
  test.skip(!built, `${route} is not in dist (build with CSS_TEST_PAGE=1)`);

  test("a landscape Figure fills its container: no default margins", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(route);
    const { figure, wrapperContent } = await page.evaluate(() => {
      const fig = document.querySelector<HTMLElement>(
        '.figure[data-layout="wide"]',
      );
      const wrap = document.querySelector<HTMLElement>(".wrapper");
      if (!fig || !wrap) throw new Error("missing");
      const w = getComputedStyle(wrap);
      return {
        figure: fig.getBoundingClientRect().width,
        wrapperContent:
          wrap.getBoundingClientRect().width -
          parseFloat(w.paddingLeft) -
          parseFloat(w.paddingRight),
      };
    });
    expect(figure).toBeCloseTo(wrapperContent, 0);
  });

  test("a portrait Figure is 40rem wide at most", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(route);
    const width = await page
      .locator('.figure[data-layout="tall"]')
      .first()
      .evaluate((e) => e.getBoundingClientRect().width);
    expect(width).toBe(640);
  });

  test("the cover Photo fills 100svh and picks a file wide enough at 320px, DPR 2", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 640 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(route);
    const cover = page.locator('.photo[data-crop="cover"]');
    await cover.scrollIntoViewIfNeeded();
    const img = cover.locator("img");
    await expect
      .poll(() => img.evaluate((e: HTMLImageElement) => e.currentSrc))
      .not.toBe("");
    const { frameHeight, drawnWidth, chosen } = await img.evaluate(
      (e: HTMLImageElement) => ({
        frameHeight: e.parentElement
          ? e.closest(".photo")!.getBoundingClientRect().height
          : 0,
        // object-fit: cover draws the image at frame height x its ratio when that is wider.
        // (width and height attributes: the preview server has no image CDN to load from.)
        drawnWidth: Math.max(
          e.getBoundingClientRect().width,
          e.getBoundingClientRect().height *
            (Number(e.getAttribute("width")) /
              Number(e.getAttribute("height"))),
        ),
        chosen: Number(/[?&]w=(\d+)/.exec(e.currentSrc)?.[1] ?? 0),
      }),
    );
    expect(frameHeight).toBe(640);
    // At least ~1 file pixel per device pixel drawn (0.9 allows the candidate steps).
    expect(chosen).toBeGreaterThanOrEqual(drawnWidth * 2 * 0.9);
    await context.close();
  });

  test("the row and band crops keep their ratios", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(route);
    for (const [crop, ratio] of [
      ["row", 16 / 10],
      ["band", 21 / 9],
    ] as const) {
      const box = await page
        .locator(`.photo[data-crop="${crop}"]`)
        .evaluate((e) => e.getBoundingClientRect());
      expect(box.width / box.height).toBeCloseTo(ratio, 1);
    }
  });
});
