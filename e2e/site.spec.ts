import { expect, test } from "@playwright/test";
import { routes } from "./routes";

for (const route of routes()) {
  test(`${route} loads with a language and a title`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
    // Home's title is fixed by the SEO decision; every other title carries a placeholder.
    await expect(page).toHaveTitle(
      route === "/" ? "JP Santos — Design Engineer" : /^PLACEHOLDER: /,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });
}
