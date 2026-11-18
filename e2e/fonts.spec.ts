import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// Astro's Fonts API hashes the family name ("Geist-b98199c6095d6aa2"), so match
// on the prefix. A role is only checked on pages that use it, because the
// browser fetches a face only when text needs it.
const roles = [
  { family: "Bricolage Grotesque", selector: "h1" },
  { family: "Geist", selector: "p" },
  { family: "Geist Mono", selector: ".label" },
  { family: "Fraunces", selector: "em, i" },
];

for (const route of routes()) {
  test(`${route} loads the self-hosted faces it uses`, async ({ page }) => {
    await page.goto(route);
    const result = await page.evaluate(async (roles) => {
      await document.fonts.ready;
      const clean = (s: string) => s.replace(/^["']|["']$/g, "");
      const loaded = [...document.fonts]
        .filter((f) => f.status === "loaded")
        .map((f) => clean(f.family));
      return roles.map(({ family, selector }) => {
        const el = document.querySelector(selector);
        return {
          family,
          used: Boolean(el),
          computed: el ? clean(getComputedStyle(el).fontFamily) : "",
          loaded: loaded.some((l) => l.startsWith(`${family}-`)),
        };
      });
    }, roles);

    // Body text inherits Geist even on a page with no paragraph yet.
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.body).fontFamily.replace(/^["']/, ""),
      ),
    ).toMatch(/^Geist-/);

    for (const r of result.filter((r) => r.used)) {
      expect(
        r.computed.startsWith(`${r.family}-`),
        `${r.family} computed`,
      ).toBe(true);
      expect(r.loaded, `${r.family} loaded`).toBe(true);
    }
  });
}
