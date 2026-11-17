import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Gate for the metric-matched fallback faces (src/css/global/fonts.css): swapping the
// fallback for the real face must not reflow mixed-case text, which is what CLS counts.
//
// The page loads twice, once with every woff2 request aborted (text stays in the fallback)
// and once normally. Both times the same long mixed-case prose is injected into `/` and
// styled by the real CSS (the actual element rules, tokens and tracking), one block per
// role: heading 800, secondary display 700, lead 400, body 400, strong 700, label and em.
// For each block the test compares
//   - the text's own width on one line (a Range over the text, not the block box), and
//   - the line count when it wraps in a narrow and in a wide column,
// and checks via CDP that the fallback run really used the local face and the real run
// the web font, so a missing local face cannot pass by comparing a face with itself.
//
// Chromium only: it exposes the platform font used (CDP), and the fallback depends on the
// OS having Arial, Times New Roman and Courier New (macOS, Windows) or Liberation/Arimo
// (Linux, CI). Firefox and WebKit use the same CSS, but their local() lookup and engines
// are not gated here. The prose is mixed case on purpose: all-caps text is allowed to
// differ slightly (owner decision, 2026-11-17). Test sample text, not site copy.
const WIDTH_TOLERANCE = 0.005;
const WRAP_WIDTHS = [320, 720];

const prose = [
  "When a team ships a feature, the people who rely on a keyboard or a screen reader are often the last to find out whether it works, so good interface work starts with plain markup and clear labels.",
  "Selected projects, a short note on how each one was built, the tools that were used, and what changed for the people on the other side of the screen once it was live in front of real users.",
  "A focus ring that is easy to see, a heading that says what follows, and a form that explains its own errors are small details, and they decide whether a page is usable or merely present.",
];

type Role = {
  name: string;
  // Wrapper tag and inline style for each block; `inner` wraps the text in a child tag.
  tag: string;
  style?: string;
  className?: string;
  inner?: string;
};
const roles: Role[] = [
  { name: "heading 800", tag: "h2" },
  {
    name: "secondary display 700",
    tag: "p",
    style:
      "font-family: var(--font-heading); font-weight: var(--weight-display-secondary); letter-spacing: var(--tracking-lead)",
  },
  {
    name: "lead 400",
    tag: "p",
    style:
      "font-family: var(--font-heading); font-weight: var(--weight-lead); letter-spacing: var(--tracking-lead)",
  },
  { name: "body 400", tag: "p" },
  { name: "strong 700", tag: "p", inner: "strong" },
  { name: "label 500", tag: "p", className: "label" },
  { name: "emphasis 400", tag: "p", inner: "em" },
];

type Measure = {
  role: string;
  index: number;
  lineWidth: number;
  lines: number[];
  heights: number[];
};
type Run = { measures: Measure[]; fonts: string[][] };

async function run(page: Page, blockFonts: boolean): Promise<Run> {
  if (blockFonts) await page.route("**/*.woff2", (r) => r.abort());
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.evaluate(
    ({ roles, prose }) => {
      const host = document.createElement("div");
      host.id = "swap-host";
      host.style.cssText =
        "position:absolute;inset-block-start:0;inset-inline-start:0;opacity:0;pointer-events:none";
      roles.forEach((role, r) => {
        prose.forEach((text, i) => {
          const wrapper = document.createElement("div");
          wrapper.dataset["role"] = role.name;
          wrapper.dataset["index"] = String(i);
          const el = document.createElement(role.tag);
          if (role.className) el.className = role.className;
          if (role.style) el.style.cssText = role.style;
          const inner = role.inner ? document.createElement(role.inner) : el;
          inner.textContent = text;
          if (role.inner) el.append(inner);
          el.dataset["swap"] = `${r}-${i}`;
          wrapper.append(el);
          host.append(wrapper);
        });
      });
      document.body.append(host);
    },
    { roles, prose },
  );
  // Layout has to happen before the browser starts the font requests.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.evaluate(() => document.fonts.ready);

  const measures = await page.evaluate(
    ({ widths }) => {
      const host = document.getElementById("swap-host")!;
      // Width of the text itself, from a Range, and the number of lines it occupies.
      const textRange = (wrapper: Element) => {
        const range = document.createRange();
        const target = wrapper.firstElementChild!;
        range.selectNodeContents(target);
        return range;
      };
      const lineCount = (range: Range) =>
        new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
      const out: Measure[] = [];
      for (const wrapper of host.querySelectorAll<HTMLElement>("[data-role]")) {
        const range = textRange(wrapper);
        wrapper.style.whiteSpace = "nowrap";
        wrapper.style.inlineSize = "max-content";
        const lineWidth = range.getBoundingClientRect().width;
        wrapper.style.whiteSpace = "";
        const lines: number[] = [];
        const heights: number[] = [];
        for (const w of widths) {
          wrapper.style.inlineSize = `${w}px`;
          lines.push(lineCount(range));
          heights.push(wrapper.getBoundingClientRect().height);
        }
        out.push({
          role: wrapper.dataset["role"]!,
          index: Number(wrapper.dataset["index"]),
          lineWidth,
          lines,
          heights,
        });
      }
      return out;
    },
    { widths: WRAP_WIDTHS },
  );

  // The font actually used for each block: local face vs web font.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: "[data-swap]",
  });
  const fonts: string[][] = [];
  for (const nodeId of nodeIds) {
    const { fonts: used } = await cdp.send("CSS.getPlatformFontsForNode", {
      nodeId,
    });
    fonts.push(
      used.map(
        (f) => `${f.isCustomFont ? "web" : "local"}:${f.postScriptName}`,
      ),
    );
  }
  return { measures, fonts };
}

// Linux Chromium rounds each glyph advance to whole pixels when hinting is on (the
// default in headless), so any two faces differ by up to ~1% however well their
// metrics match. Turning hinting off gives the fractional advances that macOS and
// Windows use, which is what size-adjust is derived for.
test.use({ launchOptions: { args: ["--font-render-hinting=none"] } });

test.describe("font swap", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "gated on Chromium (platform font check, OS-specific local faces)",
  );

  test("fallback and real faces set mixed-case text alike", async ({
    browser,
  }) => {
    const fallback = await run(
      await (await browser.newContext()).newPage(),
      true,
    );
    const real = await run(await (await browser.newContext()).newPage(), false);

    // Not vacuous: the fallback run used our local faces, the real run the web fonts.
    for (const used of fallback.fonts) {
      expect(used.length).toBeGreaterThan(0);
      for (const f of used) {
        expect(
          f,
          "fallback run fell past the local face (install Arial, Liberation or Arimo)",
        ).toMatch(
          /^local:(Arial|CourierNewPSMT|TimesNewRoman|Liberation|Arimo|Tinos|Cousine)/,
        );
      }
    }
    for (const used of real.fonts) {
      expect(used.length).toBeGreaterThan(0);
      for (const f of used) expect(f).toMatch(/^web:/);
    }

    expect(fallback.measures).toHaveLength(roles.length * prose.length);
    fallback.measures.forEach((f, i) => {
      const r = real.measures[i]!;
      const id = `${f.role} #${f.index}`;
      expect
        .soft(
          Math.abs(f.lineWidth - r.lineWidth) / r.lineWidth,
          `${id} one-line width ${f.lineWidth} (fallback) vs ${r.lineWidth} (real)`,
        )
        .toBeLessThanOrEqual(WIDTH_TOLERANCE);
      expect.soft(f.lines, `${id} line count`).toEqual(r.lines);
      f.heights.forEach((h, w) =>
        expect
          .soft(
            Math.abs(h - r.heights[w]!),
            `${id} height at ${WRAP_WIDTHS[w]}px ${h} vs ${r.heights[w]}`,
          )
          .toBeLessThanOrEqual(2),
      );
    });
  });
});
