import js from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/",
      ".astro/",
      ".netlify/",
      ".lighthouseci/",
      "playwright-report/",
      "test-results/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  // Astro's jsx-a11y rules for .astro templates. A noisy rule is turned off
  // below with a comment, never the whole config.
  ...eslintPluginAstro.configs["jsx-a11y-recommended"],
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: { ...globals.node } },
  },
];
