import { expect, test } from "@playwright/test";
import { routes } from "./routes";

for (const route of routes()) {
  test(`${route} loads with a clean console and network`, async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") problems.push(`console error: ${msg.text()}`);
    });
    page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));
    page.on("requestfailed", (req) =>
      problems.push(`request failed: ${req.url()}`),
    );
    page.on("response", (res) => {
      if (res.status() >= 400) problems.push(`${res.status()}: ${res.url()}`);
    });
    await page.goto(route, { waitUntil: "load" });
    expect(problems).toEqual([]);
  });

  // Headless Playwright never requests /favicon.ico, but real browsers and
  // Lighthouse do, and a 404 is a console error. Without a declared icon the
  // request happens, so require one on every page.
  test(`${route} declares an icon so no default favicon request is made`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator('head link[rel~="icon"]')).toHaveCount(1);
  });
}
