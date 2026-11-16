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
module.exports = {
  ci: {
    collect: {
      startServerCommand: "ASTRO_PREVIEW_BACKGROUND=0 npm run preview",
      startServerReadyPattern: "localhost",
      url: ["http://localhost:4321/"],
      numberOfRuns: 3,
      settings: { chromeFlags: process.env.CI ? "--no-sandbox" : "" },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 0 }],
        "resource-summary:font:size": ["error", { maxNumericValue: 100000 }],
        "resource-summary:image:size": ["error", { maxNumericValue: 150000 }],
        "resource-summary:document:size": ["error", { maxNumericValue: 50000 }],
        "resource-summary:stylesheet:size": [
          "error",
          { maxNumericValue: 50000 },
        ],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
