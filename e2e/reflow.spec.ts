import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// WCAG 1.4.10 reflow: no horizontal scroll at 320 CSS px. The CSS test page
// is only in dist when built with CSS_TEST_PAGE=1, so it is skipped otherwise.
const built = routes();

for (const route of ["/", "/dev/css-test/"]) {
  test(`${route} has no horizontal scroll at 320px`, async ({ page }) => {
    test.skip(
      !built.includes(route),
      `${route} is not in dist (build with CSS_TEST_PAGE=1)`,
    );
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(route);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}
