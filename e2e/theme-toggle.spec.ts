import { expect, test } from "@playwright/test";

const toggle = (page: import("@playwright/test").Page) =>
  page.locator("[data-theme-toggle]");
const bg = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const theme = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.dataset["theme"] ?? null);
const stored = (page: import("@playwright/test").Page) =>
  page.evaluate(() => localStorage.getItem("theme"));

const LIGHT = "rgb(247, 244, 237)";
const DARK = "rgb(31, 29, 26)";

test.describe("theme toggle", () => {
  test("follows the OS until a choice is made", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    expect(await bg(page)).toBe(DARK);
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    expect(await theme(page)).toBeNull();
    await page.emulateMedia({ colorScheme: "light" });
    expect(await bg(page)).toBe(LIGHT);
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  });

  test("choosing the other theme saves it and survives a reload", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await toggle(page).click();
    await expect.poll(() => bg(page)).toBe(DARK);
    expect(await stored(page)).toBe("dark");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    expect(await bg(page)).toBe(DARK);
    expect(await theme(page)).toBe("dark");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  });

  test("a saved choice beats the OS on load, with no flash", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    // The theme is set before first paint: check at DOMContentLoaded's start.
    await page.addInitScript(() => {
      document.addEventListener("readystatechange", () => {
        if (document.readyState === "interactive")
          (window as unknown as { early: string | undefined }).early =
            document.documentElement.dataset["theme"];
      });
    });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => (window as unknown as { early?: string }).early,
      ),
    ).toBe("light");
    expect(await bg(page)).toBe(LIGHT);
  });

  test("flipping to the OS theme drops the saved choice", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await toggle(page).click();
    await expect.poll(() => stored(page)).toBe("dark");
    await toggle(page).click();
    await expect.poll(() => stored(page)).toBeNull();
    await expect.poll(() => theme(page)).toBeNull();
    // Following the OS again.
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await bg(page)).toBe(DARK);
    await page.reload();
    expect(await theme(page)).toBeNull();
  });

  test("an invalid stored value is ignored", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => localStorage.setItem("theme", "sepia"));
    await page.goto("/");
    expect(await theme(page)).toBeNull();
    expect(await bg(page)).toBe(LIGHT);
  });

  test("blocked storage falls back to the OS and the toggle still works", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    });
    await page.goto("/");
    expect(await bg(page)).toBe(LIGHT);
    await toggle(page).click();
    await expect.poll(() => bg(page)).toBe(DARK);
  });

  test("the footer stays ink in both themes", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const footerBg = () =>
      page.evaluate(
        () =>
          getComputedStyle(document.querySelector(".site-footer")!)
            .backgroundColor,
      );
    const light = await footerBg();
    await toggle(page).click();
    await expect.poll(() => bg(page)).toBe(DARK);
    expect(await footerBg()).toBe(light);
  });

  test("is a real button: named, keyboard operable, at least 24px", async ({
    page,
    browserName,
  }) => {
    await page.goto("/");
    const button = toggle(page);
    await expect(button).toHaveCount(1);
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
    await button.focus();
    await expect(button).toBeFocused();
    const before = await bg(page);
    await page.keyboard.press(browserName === "webkit" ? "Space" : "Enter");
    await expect.poll(() => bg(page)).not.toBe(before);
    await page.keyboard.press("Space");
    await expect.poll(() => bg(page)).toBe(before);
  });

  test("crossfades, and shortens to 0.15s under reduced motion", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "pseudo-element styles read on Chromium",
    );
    for (const [reducedMotion, expected] of [
      ["no-preference", "0.2s"],
      ["reduce", "0.15s"],
    ] as const) {
      await page.emulateMedia({ colorScheme: "light", reducedMotion });
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await page.evaluate(() => {
        const w = window as unknown as { fade: string[] };
        w.fade = [];
        new MutationObserver(() => {
          if (document.documentElement.classList.contains("theme-fade"))
            w.fade.push(
              getComputedStyle(
                document.documentElement,
                "::view-transition-old(root)",
              ).animationDuration,
            );
        }).observe(document.documentElement, { attributeFilter: ["class"] });
      });
      await toggle(page).click();
      await expect
        .poll(() =>
          page.evaluate(() => (window as unknown as { fade: string[] }).fade),
        )
        .toContain(expected);
    }
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the button is hidden and the OS theme applies", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(toggle(page)).toBeHidden();
    expect(await bg(page)).toBe(DARK);
    await page.emulateMedia({ colorScheme: "light" });
    expect(await bg(page)).toBe(LIGHT);
  });
});

test.describe("forced colours", () => {
  test("the button keeps a visible border", async ({ page, browserName }) => {
    test.skip(
      browserName !== "chromium",
      "forced-colors emulation is Chromium",
    );
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    const border = await toggle(page).evaluate(
      (el) => getComputedStyle(el).borderTopWidth,
    );
    expect(border).toBe("1px");
    await expect(toggle(page)).toBeVisible();
  });
});
