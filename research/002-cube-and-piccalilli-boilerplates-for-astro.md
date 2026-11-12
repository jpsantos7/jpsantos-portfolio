# 002 What to take from the CUBE and Piccalilli boilerplates for an Astro build

Researched 2026-11-12. Facts and options only; type, colour and space values are the owner's ([authorship protocol](../docs/authorship-protocol.md) §4).

## Answer

1. **The boilerplate is not Eleventy-based.** It is plain PostCSS plus Tailwind v3 used as an on-demand utility generator. The vault MAP note ("believed to be Eleventy-based") is wrong. Nothing in it depends on Eleventy; the only trace is `njk` in a Tailwind `content` glob.
2. **Take the structure and the CSS, not the toolchain.** Directory-led CUBE layout, cascade order, reset, global styles, compositions and utilities are plain CSS and drop into Astro unchanged (apart from the physical-property fixes below).
3. **Replace three things.** (a) Tailwind-as-generator (tokens to custom properties and token-driven utilities), which conflicts with "no CSS framework"; (b) `postcss-import-ext-glob`; (c) the `npm start` PostCSS CLI build. Astro/Vite covers (c) natively.
4. **Fix before reuse.** The CSS uses physical properties and `vw`, against the logical-properties rule.

## Source facts

### Repo and article
- Repo `Set-Creative-Studio/cube-boilerplate`, MIT, HEAD `f8c626c` dated 2024-04-24. Read by cloning. https://github.com/Set-Creative-Studio/cube-boilerplate
- README: "This is a boilerplate that **works for us**... please don't propose changes." Dependencies in `package.json`: `tailwindcss ^3.3.5`, `postcss`, `postcss-import`, `postcss-import-ext-glob`, `postcss-js`, `postcss-cli`, `cssnano`, `slugify`, `concurrently`. No Eleventy.
- Article "A CSS project boilerplate", Andy Bell, 12 February 2024: https://piccalil.li/blog/a-css-project-boilerplate (the domain is piccalil.li, not piccalilli.co.uk). Quote: "Everything is stitched together using PostCSS in `src/css/global.css`."
- README says the CSS system is dropped "into various types of projects in the studio", and the article says "every project is different, so the CSS setup rarely looks exactly like this". Treat it as a starting set, not a spec.

### Folder structure (repo, matches article)
```
src/css-utils/   clamp-generator.js, tokens-to-tailwind.js
src/design-tokens/  colors, fonts, spacing, text-sizes, text-leading, text-weights, viewports (.json)
src/css/global.css            entry, imports in order
src/css/global/   reset, fonts, variables, global-styles
src/css/blocks/   prose.css
src/css/compositions/  wrapper flow grid switcher cluster repel sidebar
src/css/utilities/     region, visually-hidden
tailwind.config.js, postcss.config.js
```
Article: "In `src/css` the CUBE structure is directory-led."

### Token pipeline
- Tokens are JSON with `items: [{name, min, max}]` (sizes, spacing) or `{name, value}` (colour, font, weight, leading). `viewports.json` holds `min 330, mid 760, max 1230`. The text and spacing files link to Utopia calculators in `meta.scaleGenerator`.
- `clamp-generator.js` converts min/max px to `clamp(minRem, intercept rem + slope vw, maxRem)` (rem base 16; the article credits the Utopia logic to Trys Mudford). It uses `vw`. Latent bug: when `min === max` it returns a bare string, not `{name, value}`, so the name is lost. No current token hits it (Zero is 0 to 1).
- `tokens-to-tailwind.js` slugifies names into a key/value object.
- A Tailwind plugin in `tailwind.config.js` writes one `:root { --color-*, --space-*, --size-*, --leading-*, --font-* }` block (groups and prefixes in the config). The article says it is placed on Tailwind's `components` layer via `addComponents`, "a bit of a hack, but it does the job".
- A second plugin generates `.flow-space-*`, `.region-space-*` and `.gutter-*` utilities that set `--flow-space`, `--region-space`, `--gutter` from the spacing tokens. Article: "such as `gutter-m` or `flow-space-s`".
- Tailwind config also disables preflight and opacity plugins, blocks `container`, and generates only the utilities reached via config plus content scanning ("utility classes *on demand*"). Tailwind is the "U" generator only; the article defends it explicitly.
- Spacing pairs exist as tokens (e.g. `--space-s-l`, `--space-s-m`, `--space-xl-2xl` used by the compositions). Only the single-step and pair tokens listed in `spacing.json` are generated (first 12 items inspected; list is longer).

### Global styles
- Order in `global.css`: tailwind base, `reset.css`, `fonts.css`, tailwind components (custom property block lands here), `variables.css`, `global-styles.css`, glob `blocks/`, `compositions/`, `utilities/`, tailwind utilities. Article: "I try to maintain a decent source order for specificity purposes".
- `reset.css` is Andy Bell's modern reset (https://piccalil.li/blog/a-more-modern-css-reset/): border-box, `text-size-adjust: none`, `ul[role=list]` reset, `line-height 1.1` on headings and controls, `text-wrap: balance` on headings, `a:not([class])` colour, `img { max-width:100%; display:block }`, `font: inherit` on form controls, `:target { scroll-margin-block: 5ex }`.
- `global-styles.css` is only `body { background; color; font-size: var(--size-step-0); font-family; line-height }`, consistent with the CUBE principle "embrace the cascade and inheritance... style as much as possible at a high level" (https://cube.fyi/css.html).
- `variables.css` holds non-token custom properties: `--gutter`, four transitions, `--leading-standard`. `fonts.css` is a placeholder comment.

### Compositions and utilities
`wrapper`, `flow` (owl, `--flow-space`), `switcher` (max 2 items, `--switcher-target-container-width`), `cluster`, `repel`, `sidebar`, `grid` (auto-fill, `data-layout` halves/thirds). Each is configured by custom properties with fallbacks (`--gutter`, `--sidebar-target-width`...). Utilities: `.region` (`padding-block`), `.visually-hidden`. Block: `.prose { --flow-space: var(--space-m) }`. Article: "Sometimes they all get used and sometimes they don't."

Logical-property audit of the boilerplate CSS (repo files above): physical or `vw` usage in `wrapper.css` (`padding-left/right`), `flow.css` (`margin-top`), `reset.css` (`max-width`, `min-height`, `min-width` in `sidebar.css`), `visually-hidden.css` (`width`, `height`), `grid.css` (`50vw`), `clamp-generator.js` (`vw`). `reset.css` itself uses `margin-block-end`, `scroll-margin-block`. Every Layout's own Stack uses `margin-block-start` (https://every-layout.dev/layouts/stack/, read 2026-11-12), so the logical form is the upstream one.

Utopia: `utopia-core` (https://github.com/trys/utopia-core, read 2026-11-12) exposes `calculateTypeScale`, `calculateSpaceScale` (with `customSizes` pairs such as `s-l`), `calculateClamp(s)`. It defaults to `rem` and `vi` and reports `wcagViolation` where a step fails WCAG 1.4.4 at 200% zoom. The boilerplate's own generator does neither.

### Astro facts (docs.astro.build, via Astro Docs MCP, 2026-11-12)
- CSS imported in a layout or page frontmatter is bundled and optimised; cascade order is link tags, then imported styles, then scoped styles. "Import the Layout component before other imports so that it has the lowest precedence." https://docs.astro.build/en/guides/styling/#cascading-order
- `<style>` in `.astro` is scoped by default; `is:global` or `:global()` opts out. Docs: "Global styles should be used only as-needed." https://docs.astro.build/en/guides/styling/#global-styles
- PostCSS is included via Vite; add `postcss.config.cjs` in the root. https://docs.astro.build/en/guides/styling/#postcss
- Vite inlines CSS `@import` via `postcss-import` and applies any PostCSS config to all imported CSS; also `import.meta.glob`. https://vite.dev/guide/features.html (read 2026-11-12)
- Tailwind: Astro supports v4 via `@tailwindcss/vite` (`astro add tailwind`, Astro >=5.2.0) and v3 only through the legacy `@astrojs/tailwind` integration. The boilerplate's JS `tailwind.config.js` is v3-style. https://docs.astro.build/en/guides/styling/#tailwind
- `define:vars` on `<style>` passes frontmatter values as custom properties; scripts using it become inline. https://docs.astro.build/en/reference/directives-reference/#definevars
- Static endpoints (`src/pages/x.css.ts` pattern, `.json.ts` documented) run at build time and emit files. https://docs.astro.build/en/guides/endpoints/#static-file-endpoints
- Stylesheets under 4 kB are inlined by default (`build.inlineStylesheets: auto`). https://docs.astro.build/en/guides/styling/#bundle-control

## What needs replacing in Astro, and options

| Boilerplate part | Why it does not carry | Options |
|---|---|---|
| Tailwind generating the custom property block and `flow-space-*`, `gutter-*`, `region-space-*` utilities | Authorship protocol §7: no CSS framework. Also v3 config vs Astro's v4 path. | **A.** Hand-write `tokens.css` (pasting Utopia calculator output). Zero tooling, but values drift from any JSON source. **B.** Keep JSON tokens; a small Node script (reusing `clamp-generator` logic or `utopia-core`) writes `src/styles/tokens.css` and utility CSS before `astro dev`/`build`. **C.** A Vite plugin doing B inside the build (UNVERIFIED: not tested against Astro 6). Not recommended to emit via a static endpoint: it would be a separate URL, not bundled with the page CSS (inference, UNVERIFIED). |
| On-demand utilities (colour, padding, margin, the three layout-variable utilities) | No content scanner without Tailwind | Write only the utilities the Site uses (`region`, `visually-hidden`, a few `flow-space`/`gutter` steps, colour pairs) by hand or generated from tokens; or set the variables inline, e.g. `style="--gutter: var(--space-m)"` (inline `style` attribute is documented). Whether to ship a utility per token is the owner's call. |
| `@import-glob` (`postcss-import-ext-glob`) | Not in Vite by default | **A.** Explicit `@import` list in `global.css` (Vite inlines these). Simple; add a line per file. **B.** Add the plugin via `postcss.config.cjs` (UNVERIFIED that it composes with Vite's own `postcss-import`). **C.** `import.meta.glob` is JS-only for modules, not a CSS `@import` replacement (UNVERIFIED for side-effect CSS import in frontmatter). |
| Source order via Tailwind layers | No Tailwind layers | Keep the file order in `global.css`; optionally declare `@layer reset, tokens, global, blocks, compositions, utilities;`. Cascade layers are a CSS feature the boilerplate does not use; Starlight docs show the pattern. Owner/ADR decision. |
| `npm start` PostCSS CLI, `dist/` copy, cssnano | Astro builds and minifies | Drop. Vite uses Lightning CSS for minification by default (https://vite.dev/guide/features.html). |
| `src/index.html` demo | Not needed | Drop. |
| Global CSS location | Not decided by the boilerplate | Import `src/styles/global.css` once in the base layout (first import for lowest precedence). Use scoped `<style>` for one-off component CSS and CUBE Blocks as files or scoped; the Block-vs-scoped split is a separate decision. |

## Fixes to apply when taking the CSS
Use logical properties (`padding-inline`, `margin-block-start`, `max-inline-size`, `min-block-size`, `inline-size`/`block-size` in `visually-hidden`); use `vi` (or `vw` knowingly) in fluid clamps; consider `utopia-core` for the WCAG 1.4.4 check; the `grid.css` `50vw` halves variant.

## Vault check (qmd, portfolio-vault)
- `adr/0001-astro-as-platform.md`: Astro chosen, "CSS approach" left to a separate ticket. No conflict.
- `MAP.md` Notes: says the boilerplate is "believed to be Eleventy-based". **Conflict: it is not** (see Answer).
- No vault decision on tokens, Tailwind, PostCSS or cascade layers.
- `tickets/008-visual-direction.md` is blocked by this ticket.

## Gaps
- Not run: no Astro project was built, so Vite plus `postcss-import-ext-glob` and any token script remain UNVERIFIED in practice.
- Utopia output equivalence between `clamp-generator.js` and `utopia-core` not compared numerically.
- `cube.fyi` was read only for the inheritance principle; its exceptions/blocks guidance was not mapped to Astro scoped styles.
- Spacing token list beyond the first 12 entries not inspected.
