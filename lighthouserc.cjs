// Lighthouse CI against the built Site, served by `npm run preview` (Astro's
// preview server, the same one Playwright uses) rather than `staticDistDir`.
// That server does not compress, so resource-summary sizes are the raw
// (uncompressed) bytes: a stricter bound than the gzip budgets in the ticket.
// Budgets: vault ticket 007. Mobile throttling is Lighthouse's default.
//
// Not expressible in LHCI, so enforced elsewhere:
//  - HTML + CSS <= 50 KB gzip combined: resource-summary has document and
//    stylesheet separately, and measures transfer size; scripts/check-budgets.mjs
//    gzips the built files and sums them.
//  - "largest above-the-fold image": only `resource-summary:image:size`
//    (all images) exists; it is asserted instead and is a stricter bound.
// CommonJS config (LHCI loads it with require); require() of ESM works on Node 22.12+.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { routes } = require("./scripts/routes.mjs");

// Median run decides each budget; the default (optimistic) only fails when
// every run breaks it.
const median = { aggregationMethod: "median-run" };

module.exports = {
  ci: {
    collect: {
      startServerCommand: "ASTRO_PREVIEW_BACKGROUND=0 npm run preview",
      startServerReadyPattern: "localhost",
      url: routes().map((route) => `http://localhost:4321${route}`),
      numberOfRuns: 3,
      settings: { chromeFlags: process.env.CI ? "--no-sandbox" : "" },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": [
          "error",
          { maxNumericValue: 2500, ...median },
        ],
        "cumulative-layout-shift": [
          "error",
          { maxNumericValue: 0.1, ...median },
        ],
        "total-blocking-time": ["error", { maxNumericValue: 200, ...median }],
        "resource-summary:script:size": [
          "error",
          { maxNumericValue: 0, ...median },
        ],
        "resource-summary:font:size": [
          "error",
          { maxNumericValue: 100000, ...median },
        ],
        "resource-summary:image:size": [
          "error",
          { maxNumericValue: 150000, ...median },
        ],
        "resource-summary:document:size": [
          "error",
          { maxNumericValue: 50000, ...median },
        ],
        "resource-summary:stylesheet:size": [
          "error",
          { maxNumericValue: 50000, ...median },
        ],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
