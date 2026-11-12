# 004 Astro content model for case studies

Researched 2026-11-12. Question: how should case studies be modelled in the current Astro version (content collections, Markdown vs MDX, images, view transitions)? Facts and options only; the fields belong to the case-study anatomy grilling ticket.

## Version the docs describe

- The Astro Docs MCP (`search_astro_docs`) serves the Astro 7 docs: it has an "Upgrade to Astro v7" guide ("migrate from Astro v6 to Astro v7") and says "Since Astro v7, Sätteri is the default Markdown processor". https://docs.astro.build/en/guides/upgrade-to/v7/ , https://docs.astro.build/en/guides/markdown-content/ (retrieved 2026-11-12). The docs pages show no explicit version number; the version is inferred from those pages.
- npm `astro@latest` = 7.4.11, published 2026-11-11 (registry.npmjs.org/astro, queried 2026-11-12). 5.0.0 was published 2024-12-03, 6.0.0 on 2026-03-10.
- `@astrojs/mdx@latest` = 8.1.5 (2026-11-11), `zod` latest = 4.6.7 (npm).

## (a) Content collections

Current API (Astro 7 docs, https://docs.astro.build/en/guides/content-collections/ and https://docs.astro.build/en/reference/modules/astro-content/):

- Build-time collections live in `src/content.config.ts` (`.js`/`.mjs` also work), defined with `defineCollection()` from `astro:content` and exported as one `collections` object. Each collection has a required `loader` and an optional-but-"highly recommended" Zod `schema`.
- Built-in loaders from `astro/loaders`: `glob({ pattern, base })` for directories of Markdown, MDX, Markdoc, JSON, YAML or TOML; `file(path)` for one file holding many entries (each needs a unique `id`). `glob` generates ids from filenames, overridable with a `slug` frontmatter property or `generateId`. Quote: "`glob()` loader fetches entries from directories of Markdown, MDX, Markdoc, JSON, YAML, or TOML files".
- Zod: `import { z } from "astro/zod"` ("a re-export of the Zod library, and it supports all of the features of Zod 4").
- References: `reference("authors")` (single) or `z.array(reference("blog"))`. In content they are written as the target entry `id`; they resolve to `{ collection, id }` objects that you then query (`getEntry`/`getEntries`). Imported from `astro:content`.
- Query/render: `getCollection()`, `getEntry()`, `getEntries()`, `render(entry)` returning `{ Content, headings }`. Sort order of `getCollection()` is "non-deterministic and platform-dependent" (v5 upgrade guide), so sort explicitly.
- Live collections (`defineLiveCollection`, `src/live.config.ts`, `getLiveCollection`) were "Added in astro@6.0.0". They run at request time, need an adapter, and have "No MDX support" and "No image optimization". Not relevant to a static portfolio.
- Schema can be a function receiving a context: `schema: ({ image }) => z.object({...})`. Docs: "performing custom validation checks on images using `image().refine()` is unsupported."
- Astro also generates a JSON Schema per collection in `.astro/collections/` (since 4.13.0) for editor IntelliSense on JSON/YAML data.

What changed across majors (official upgrade guides: https://docs.astro.build/en/guides/upgrade-to/v3/ , /v5/ , /v6/ , /v7/):

| Major | Change relevant here |
|---|---|
| 2.0 | Content collections introduced (`src/content/`, `type: 'content'`). |
| 3.0 | `image()` helper in the schema function replaces the removed `image` export from `astro:content`. `astro:assets` `<Image/>` stable. |
| 5.0 (2024-12-03) | Content Layer API: `loader` property, `src/content.config.ts` location, `glob()`/`file()`. Old `type: 'content'\|'data'` collections became "legacy" (emulated via `glob()`). `<ViewTransitions />` renamed `<ClientRouter />`. Underscore-prefixed entry filenames no longer excluded from routes. |
| 6.0 (2026-03-10) | Legacy collections removed ("All content collections must now use the Content Layer API"); temporary `legacy.collectionsBackwardsCompat` flag. Zod 4 (e.g. `z.email()` instead of `z.string().email()`; `.default()` must match output type). `z` from `astro:content` and `astro:schema` deprecated in favour of `astro/zod`. Loader schema functions replaced by `createSchema()`. Live collections added. Node 22.12+ required. Responsive image styles moved to build-time classes and `data-*` attributes. |
| 7.0 | Sätteri (Rust) becomes the default Markdown and MDX processor; `@astrojs/markdown-remark` no longer installed by default. Rust compiler is stricter about invalid HTML (unclosed tags error, no auto-correction). Vite 8. Some `astro:transitions` internals removed. |

Inference (UNVERIFIED as a general claim): tutorials or model answers using `type: 'content'`, `entry.slug`, `entry.render()`, `src/content/config.ts` or `z` from `astro:content` are out of date for v6/v7.

## (b) Markdown vs MDX

Facts:

- `.md` and `.mdx` both work with `glob()`; the same `schema` validates frontmatter in both. MDX needs the separate `@astrojs/mdx` integration; without it Astro raises `MdxIntegrationMissingError` (https://docs.astro.build/en/reference/errors/mdx-integration-missing-error/).
- MDX allows importing and rendering Astro or UI-framework components inline, mapping Markdown elements to custom components (`export const components = {...}` or the `components` prop on `<Content />`), and `<Image />`/`<Picture />` in content. Plain `.md` cannot: "The `<Image />` and `<Picture />` components are unavailable in `.md` files." https://docs.astro.build/en/guides/images/#images-in-markdown-files , https://docs.astro.build/en/guides/integrations-guide/mdx/
- Markdown `![alt](./relative.png)` for local `src/` images is processed and optimized in `.md`; with `image.layout` set globally it is also responsive. `<img>` in Markdown is not optimized for `src/` images.
- Since Astro 7, Sätteri renders both `.md` and `.mdx` by default; remark/rehype/recma plugins need `unified()` from `@astrojs/markdown-remark` (can be set for MDX only via `mdx({ processor: unified() })`). Sätteri applies GFM and SmartyPants. https://docs.astro.build/en/guides/upgrade-to/v7/ , https://docs.astro.build/en/guides/integrations-guide/mdx/#processor
- MDX is stricter than Markdown: unescaped `<` and `{` start JSX or expressions and error otherwise; tags must be well formed; imports/exports must be valid JS. Quote: "Unexpected end of file in expression, expected a corresponding closing brace for `{`". https://mdxjs.com/docs/troubleshooting-mdx/ (undated page). Impact: owner-written prose containing `<` or `{` breaks the build in MDX but not in Markdown.
- Costs of MDX (verifiable): an extra integration to install and keep in step with Astro (`@astrojs/mdx` 8.1.5 depends on `es-module-lexer`, `@astrojs/internal-helpers`, `@astrojs/markdown-satteri`, per npm metadata); components used in content must be imported per file; authors write JSX-flavoured syntax. Client JS: MDX components are Astro components rendered at build time, so zero JS unless a `client:` directive or `<script>` is added (https://docs.astro.build/en/basics/astro-components/: "HTML-only templating components with no client-side runtime"). MDX itself adds no client JS.
- Third option: Markdoc (`@astrojs/markdoc`; tags map to `.astro` components in `markdoc.config.mjs`, no per-file imports). Not evaluated further.
- Option (not a fact about needs): keep case-study bodies in `.md` and put structured, repeatable parts in typed frontmatter fields rendered by `.astro` components. Whether case studies need inline components (charts, comparison sliders, pull quotes, figure groups) is for the anatomy ticket; no Astro constraint forces MDX. A pull quote or figure can be a Markdown blockquote or image styled in CSS; MDX is only needed if a component must sit inside the prose.

## (c) Images

Facts (https://docs.astro.build/en/guides/images/ , retrieved 2026-11-12):

- Keep local images in `src/` so Astro can transform and bundle them; `public/` files are never processed and never responsive. Images can sit "alongside your content".
- `<Image />` and `<Picture />` come from `astro:assets`. `<Image />` outputs `<img>` with `alt`, `loading="lazy"`, `decoding="async"` and inferred `width`/`height` (avoids layout shift). `<Picture />` adds `<picture>` with `formats` (default `['webp']`), `fallbackFormat`, `pictureAttributes`.
- Alt: "This attribute is required for both the `<Image />` and `<Picture />` components"; missing alt throws `ImageMissingAlt`; decorative images use `alt=""`. https://docs.astro.build/en/reference/errors/image-missing-alt/
- Collection frontmatter: `schema: ({ image }) => z.object({ cover: image(), coverAlt: z.string() })`; frontmatter holds a path relative to the file (`cover: "./firstpostcover.jpeg"`); `image()` validates and imports it as metadata passable to `<Image src={post.data.cover} alt={post.data.coverAlt} />`. This is the documented pattern: alt lives in a sibling string field, because `image()` returns only image metadata.
- Alt enforcement in the schema: `z.string()` makes alt required but allows `""`; `z.string().min(1)` forbids empty alt, so decorative images then need a separate mechanism (for example a union with a `decorative: true` variant). Only `image().refine()` is documented as unsupported; other Zod methods are available "with some limitations". The schema cannot judge alt quality. Because alt text is owner-written (authorship protocol rule 1), a `PLACEHOLDER: ...` marker must pass validation until the owner writes it (design point for the anatomy ticket).
- Alt for images in the Markdown body (`![alt](src)`): no source found saying Astro enforces non-empty alt there. UNVERIFIED; test before relying on it.
- Responsive images, "Added in astro@5.10.0": set `layout` (`constrained`, `full-width`, `fixed`, `none`) on a component or globally via `image.layout`; Astro generates `srcset`/`sizes`. `image.responsiveStyles: true` (default `false`) adds global styles using `:where()` (specificity 0). With a global layout, Markdown `![]()` images are responsive too. Astro 6 emits the styles as a hashed class plus `data-astro-fit`/`data-astro-pos` instead of inline `style` (CSP compatibility). Build cost: "A single responsive image will generate multiple images of different sizes ... may increase the build time".
- `<Picture />` art direction by media query is not built in: use `getImage()` in a custom component (Astro recipe "Build a custom image component").
- No native video support; docs recommend a hosted video service.
- Images are a build-time feature: not available in live collections.

## (d) View transitions

Two mechanisms, both documented by Astro (https://docs.astro.build/en/guides/view-transitions/):

1. Native cross-document (MPA) transitions: opt in with CSS only.
   ```css
   @view-transition { navigation: auto; }
   ```
   Both documents must be same-origin and opt in (MDN https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using). `auto` applies to `traverse`, `push`, `replace` navigations; push/replace only when initiated by interaction with page content, not browser UI (MDN https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition). Astro: they "don't alter the core functionality of a multi-page application, nor do they affect any existing scripts or add additional JavaScript to your page load. They simply add animations."
2. `<ClientRouter />` from `astro:transitions` (renamed from `<ViewTransitions />` in Astro 5.0). It intercepts link clicks and back/forward, fetches the next page, calls `document.startViewTransition`, swaps `<head>` and `<body>` and runs new scripts. It adds `transition:persist`, `transition:animate`, `transition:name`, lifecycle events and a `fallback` prop (`animate` default, `swap`, `none`) for browsers without the API. Astro lists the drawback: "needing to manually reinitialize scripts or state after navigation" (use `astro:page-load` instead of `DOMContentLoaded`). Astro says using the router for extra features "will increasingly become unnecessary" as browser APIs evolve; its 2024 post says native `transition:persist` is not yet supported (https://astro.build/blog/future-of-astro-zero-js-view-transitions/, 2024-06-11).

Browser support, native cross-document (web-features explorer, retrieved 2026-11-12, https://web-platform-dx.github.io/web-features-explorer/features/cross-document-view-transitions): Chrome/Edge 126 (2024-06-11/13), Safari and iOS Safari 18.2 (2024-12-11), Firefox not supported (bug 1860854). Status "Limited availability": "Baseline availability blocked since December 2024 by Firefox". MDN agrees it is not Baseline. Without support the browser does a normal instant navigation: "Cross-document view transitions are a progressive enhancement; the core functionality of the site remains unaffected." (Chrome guide, undated: https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/cross-document-transitions). Firefox 147 appears in that guide only for "navigation activation information", not the feature.

Client JS cost:
- Native: none (CSS only), per Astro docs above. `pageswap`/`pagereveal` handlers are optional JS for custom animation only.
- `<ClientRouter />`: ships a bundled script on every page that uses it. In `astro@7.4.11`, `dist/transitions/router.js` is 26,512 bytes unminified (8,722 bytes gzipped, unminified) and `ClientRouter.astro` carries a click/popstate script (measured from `npm pack astro@7.4.11`, 2026-11-12). The shipped bundle is minified and smaller; exact shipped size not measured, so UNVERIFIED. It is nonzero client JS, so authorship protocol rule 8 requires a ticket-level justification and the page must work without it (links stay ordinary `<a href>`, so it is a progressive enhancement).

Accessibility:
- `<ClientRouter />` route announcement: Astro adds "an element ... with the `aria-live` attribute set to `assertive`" announcing the `<title>`, else the first `<h1>`, else the pathname; "We strongly recommend you always include a `<title>`" (Astro docs; added in 3.2.0). The announcer element is created in `router.js` (confirmed in 7.4.11 source).
- `<ClientRouter />` focus: the Astro docs do not mention focus management, and the 7.4.11 `router.js` contains no `focus` string. So Astro appears not to move focus after a client navigation (inference from a source search of one version; test with keyboard and screen reader). A full page load resets focus and scroll natively.
- `<ClientRouter />` reduced motion: docs say it "includes a CSS media query that disables *all* view transition animations, including fallback animation" under `prefers-reduced-motion`. I could not find that query in the 7.4.11 package (only a dev-mode console warning in `ClientRouter.astro`), so the docs claim is UNVERIFIED in code; check a built page.
- Native: a real document navigation happens, so the browser's own title announcement, focus reset and scroll behaviour apply (inference, UNVERIFIED; no source states it; test). Reduced motion is the author's job. Chrome's guide wraps the opt-in:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    @view-transition { navigation: auto; }
  }
  ```
  (Chrome guide, undated, same URL as above.) A WebKit post on cross-document transitions (https://webkit.org/blog/16967/two-lines-of-cross-document-view-transitions-code-you-can-use-on-every-website-today/) surfaced in search but was not read; UNVERIFIED.
- Vault ticket 009 (preferences control: theme toggle and motion behaviour) is open and blocked by 008. The owner's own motion control would need to gate whichever mechanism is chosen; for native, a class or `data-` attribute on `<html>` could gate the same rule in CSS (inference).
- Native caveats: `<link rel="expect" blocking="render">` can hold first render, and Chrome says to avoid it unless measured (https://developer.chrome.com/docs/web-platform/view-transitions/cross-document, undated). `view-transition-name` values left set can persist in bfcache, duplicate on back navigation and skip the transition (MDN).

## Vault conflicts

None. `adr/0001-astro-as-platform.md` (accepted 2026-11-11) closes the platform choice and leaves "content collections, MDX, islands policy, CSS approach" to separate tickets. Its line "Content collections give a typed model for Case studies" matches (a). `docs/authorship-protocol.md` rules 1-3, 8 and 10 apply as noted.

## Gaps

- No Astro-docs statement on focus management for either router; the finding rests on a source search of one package version.
- Shipped (minified) `<ClientRouter />` bundle size not measured in a built page.
- Native cross-document accessibility behaviour (focus, announcement) is inferred, not sourced; no primary source on screen reader behaviour found.
- Whether Astro 7 warns on empty alt in Markdown body images was not checked.
- The WebKit post was not read; the Chrome cross-document guide has no date.
