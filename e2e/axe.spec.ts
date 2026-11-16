import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// axe runs on Chromium only (launch quality bar).
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "axe scan runs on Chromium only",
);

for (const colorScheme of ["light", "dark"] as const) {
  for (const route of routes()) {
    test(`axe: ${route} in ${colorScheme} scheme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
