# jpsantos-portfolio

PLACEHOLDER: one or two lines on what this Site is and who it's for.

v2 is built with [Astro](https://astro.build/) and hosted on Netlify. v1 (webpack) is kept at the `v1` tag.

## Requirements

- Node 26 (see `.nvmrc`; run `nvm use`)
- npm

## Develop

```sh
npm ci
npm run dev        # local dev server
npm run build      # static build in dist/
npm run preview    # serve dist/ locally
```

## CSS

Design tokens are JSON in `src/design-tokens/`. `npm run dev` and `npm run build` first run `src/css-utils/build-tokens.mjs` (npm `predev` and `prebuild`), which writes the gitignored `src/css/global/tokens.css` and `src/css/utilities/generated.css`. The script fails the build if any type step is flagged for WCAG 1.4.4. `src/css/global.css` is the ordered import list, imported once by `src/layouts/Base.astro`.

A dev-only test page at `/dev/css-test` shows every composition, utility family, the focus ring and both themes. It is always available under `npm run dev`. It is left out of `npm run build` unless you set `CSS_TEST_PAGE=1` (the `css-test-page` integration in `astro.config.mjs` injects the route):

```sh
CSS_TEST_PAGE=1 npm run build && npm run preview
```

## Checks

`npm run check` runs every gate and must pass before any merge. GitHub enforces this only on `production`, through the CI `check` job.

| Script | What it checks |
|---|---|
| `npm run lint` | ESLint, including accessibility rules for `.astro` templates |
| `npm run format:check` | Prettier |
| `npm run check:types` | `astro check` (strictest TypeScript) |
| `npm run lint:css` | Stylelint: logical properties only, no `vw` units |
| `npm test` | Vitest unit tests |
| `npm run validate:html` | html-validate on the built HTML |
| `npm run budgets` | Byte budgets: HTML + CSS gzip size, no client JS |
| `npm run test:e2e` | Playwright on Chromium, Firefox and WebKit, with an axe scan |
| `npm run lhci` | Lighthouse CI: Core Web Vitals and byte budgets |

`npm run check:fast` runs everything except Playwright and Lighthouse CI.

## Branches and deploys

- `main`: where v2 is built, through `build/NNN-slug` ticket branches. Netlify keeps a branch deploy of it, marked `noindex`.
- `production`: the live Site. Changes arrive by pull request, and the CI `check` job must pass.

## License

See [LICENSE.md](LICENSE.md).
