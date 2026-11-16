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
