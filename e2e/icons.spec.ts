import { expect, test } from "@playwright/test";

const expected: Record<string, RegExp> = {
  'link[rel="icon"][type="image/svg+xml"]': /^image\/svg\+xml/,
  'link[rel="icon"][sizes="32x32"]': /^image\/(x-icon|vnd\.microsoft\.icon)/,
  'link[rel="apple-touch-icon"]': /^image\/png/,
  'link[rel="manifest"]': /^application\/(manifest\+json|json)/,
};

test("head icon and manifest links resolve with the right content type", async ({
  page,
  request,
}) => {
  await page.goto("/");
  for (const [selector, type] of Object.entries(expected)) {
    const link = page.locator(`head ${selector}`);
    await expect(link, selector).toHaveCount(1);
    const href = await link.getAttribute("href");
    const res = await request.get(new URL(href!, page.url()).href);
    expect(res.status(), `${selector} ${href}`).toBe(200);
    expect(res.headers()["content-type"], `${selector} ${href}`).toMatch(type);
  }
});

test("manifest icons resolve as PNG", async ({ page, request }) => {
  await page.goto("/");
  const href = await page
    .locator('head link[rel="manifest"]')
    .getAttribute("href");
  const manifest = await (
    await request.get(new URL(href!, page.url()).href)
  ).json();
  for (const icon of manifest.icons) {
    const res = await request.get(new URL(icon.src, page.url()).href);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"], icon.src).toMatch(/^image\/png/);
  }
});

test("/favicon.ico resolves", async ({ request }) => {
  const res = await request.get("/favicon.ico");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(
    /^image\/(x-icon|vnd\.microsoft\.icon)/,
  );
});
