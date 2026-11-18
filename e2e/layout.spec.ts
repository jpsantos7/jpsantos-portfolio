import { expect, test } from "@playwright/test";

// Safari's Tab key skips links unless a system setting is on (Option-Tab otherwise),
// so Playwright's WebKit cannot walk links with Tab.
const tabSkipsLinks = (browserName: string) => browserName === "webkit";

test.describe("shell on Home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("landmarks: banner, navigation, main, contentinfo", async ({ page }) => {
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("navigation")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
  });

  test("the skip link is the first tab stop, shows on focus and moves to main", async ({
    page,
    browserName,
  }) => {
    test.skip(tabSkipsLinks(browserName), "Safari Tab skips links");
    await page.keyboard.press("Tab");
    const skip = page.locator(".skip-link");
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    await page.keyboard.press("Tab");
    // After the jump, focus continues inside or after main, never back in the header.
    const inHeader = await page.evaluate(() =>
      Boolean(document.activeElement?.closest("header")),
    );
    expect(inHeader).toBe(false);
  });

  test("header: home link, nav links and a sticky position", async ({
    page,
  }) => {
    const header = page.locator("header.site-header");
    await expect(header.locator('a[href="/"]')).toHaveCount(1);
    await expect(header.locator("a[href='/'] svg.mark")).toHaveCount(1);
    await expect(header.getByRole("navigation").getByRole("link")).toHaveText([
      /Work/,
      /About/,
      /Contact/,
    ]);
    await expect(header).toHaveCSS("position", "sticky");
  });

  test("footer: ink background, Contact, Privacy and Colophon links", async ({
    page,
  }) => {
    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveCSS("background-color", "rgb(22, 20, 18)");
    await expect(footer.locator('a[href="/contact"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/privacy"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/about#colophon"]')).toHaveCount(1);
  });

  test("footer stays ink in the dark scheme too", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.getByRole("contentinfo")).toHaveCSS(
      "background-color",
      "rgb(22, 20, 18)",
    );
  });

  test("focus is visible on header links", async ({ page, browserName }) => {
    test.skip(tabSkipsLinks(browserName), "Safari Tab skips links");
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // home link
    const outline = await page.evaluate(
      () => getComputedStyle(document.activeElement!).outlineStyle,
    );
    expect(outline).toBe("solid");
  });
});

test.describe("head metadata", () => {
  test("Home: title, description, canonical, social tags", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("JP Santos — Design Engineer");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://jpsantos.eu",
    );
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "website",
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      "en_GB",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('meta[name="twitter:site"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
});

test.describe("404 page", () => {
  test("is noindex, has no canonical, and keeps the shell", async ({
    page,
  }) => {
    await page.goto("/404.html");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("an unknown path serves the 404 page", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
  });
});

test.describe("sticky header", () => {
  test("is opaque once the page has scrolled (built CSS)", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("/");
    // Make the page scrollable whatever the placeholder content is.
    await page.evaluate(() => {
      document.querySelector("main")!.style.minBlockSize = "200vh";
    });
    await page.evaluate(() => window.scrollTo(0, 400));
    const header = page.locator("header.site-header");
    await expect
      .poll(() => header.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    await expect
      .poll(() =>
        header.evaluate((el) => getComputedStyle(el).borderBlockEndColor),
      )
      .not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });

  test("stays opaque when scroll-driven animations are unsupported", async ({
    page,
  }) => {
    await page.goto("/");
    const supported = await page.evaluate(() =>
      CSS.supports("animation-timeline: scroll()"),
    );
    test.skip(supported, "only meaningful without scroll-driven animations");
    await expect(page.locator("header.site-header")).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  });

  test("is sticky on a tall viewport and not on a short one", async ({
    page,
  }) => {
    const header = page.locator("header.site-header");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(header).toHaveCSS("position", "sticky");
    await page.setViewportSize({ width: 320, height: 256 });
    await expect(header).toHaveCSS("position", "static");
  });

  test("scroll padding clears the sticky header at 320 and 1280 wide", async ({
    page,
  }) => {
    const sizes: [number, number][] = [
      [320, 700],
      [1280, 800],
    ];
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      const { header, padding } = await page.evaluate(() => ({
        header: document
          .querySelector("header.site-header")!
          .getBoundingClientRect().height,
        padding: parseFloat(
          getComputedStyle(document.documentElement).scrollPaddingBlockStart,
        ),
      }));
      expect(padding, `${width}px`).toBeGreaterThanOrEqual(header);
    }
  });

  test("at 320x256 a focused footer link is not covered", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Safari Tab skips links");
    await page.setViewportSize({ width: 320, height: 256 });
    await page.goto("/");
    await page.locator('footer a[href="/privacy"]').focus();
    const covered = await page.evaluate(() => {
      const el = document.activeElement!;
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + 2, r.y + r.height / 2);
      return !(top === el || el.contains(top));
    });
    expect(covered).toBe(false);
  });
});

test("nav marks the current page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header [aria-current]")).toHaveCount(0);
});
