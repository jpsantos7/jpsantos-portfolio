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

// Bold inside a heading uses the heading weight (800), including through em and .label,
// where inheriting from the parent would give 400 or 500. Each case must also be set in
// a real loaded face (nothing synthesised); in Chromium CDP confirms it is a web font.
test.describe("bold inside a heading", () => {
  const cases = [
    ...[1, 2, 3, 4, 5, 6].map((n) => ({
      name: `h${n}`,
      html: `<h${n}>Text <strong>bold</strong> and <b>bold</b></h${n}>`,
      family: "Bricolage Grotesque",
      style: "normal",
    })),
    {
      name: "h2 em",
      html: "<h2>Text <em><strong>bold</strong></em></h2>",
      family: "Fraunces",
      style: "italic",
    },
    {
      name: "h2 .label",
      html: '<h2>Text <span class="label"><strong>bold</strong></span></h2>',
      family: "Geist Mono",
      style: "normal",
    },
  ];

  for (const c of cases) {
    test(`${c.name} bold is 800 in a real ${c.family} face`, async ({
      page,
      browserName,
    }) => {
      await page.goto("/");
      const result = await page.evaluate(
        async ({ html }) => {
          const host = document.createElement("div");
          host.id = "heading-bold-host";
          host.innerHTML = html;
          document.body.append(host);
          await document.fonts.ready;
          await new Promise((r) => requestAnimationFrame(r));
          await document.fonts.ready;
          const clean = (s: string) => s.replace(/^["'\s]+|["'\s]+$/g, "");
          return [...host.querySelectorAll("strong, b")].map((el) => {
            const cs = getComputedStyle(el);
            const family = clean(cs.fontFamily.split(",")[0]!);
            const covered = [...document.fonts].some((f) => {
              if (clean(f.family) !== family) return false;
              if (f.status !== "loaded" || f.style !== cs.fontStyle)
                return false;
              // The face tops out below 800 for em and .label: the browser then uses
              // its nearest weight, and synthesises bold only if that is under 600.
              const hi = Math.max(...f.weight.split(" ").map(Number));
              return hi >= 600;
            });
            return {
              weight: cs.fontWeight,
              family,
              style: cs.fontStyle,
              covered,
            };
          });
        },
        { html: c.html },
      );
      expect(result.length).toBeGreaterThan(0);
      for (const r of result) {
        expect(r.weight).toBe("800");
        expect(r.family.startsWith(`${c.family}-`)).toBe(true);
        expect(r.style).toBe(c.style);
        expect(
          r.covered,
          "a loaded face at weight 600 or more, so nothing is synthesised",
        ).toBe(true);
      }

      if (browserName === "chromium") {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("DOM.enable");
        await cdp.send("CSS.enable");
        const { root } = await cdp.send("DOM.getDocument");
        const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
          nodeId: root.nodeId,
          selector: "#heading-bold-host strong, #heading-bold-host b",
        });
        for (const nodeId of nodeIds) {
          const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", {
            nodeId,
          });
          expect(fonts.length).toBeGreaterThan(0);
          for (const f of fonts) {
            expect(f.isCustomFont).toBe(true);
            expect(f.familyName.startsWith(c.family)).toBe(true);
          }
        }
      }

      await page.evaluate(() =>
        document.getElementById("heading-bold-host")?.remove(),
      );
    });
  }
});
