import netlify from "@astrojs/netlify";
import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import { fonts } from "./src/fonts.config.mjs";
import { figureMarkdownPlugin } from "./src/integrations/figure-markdown.mjs";
import cssTestPage from "./src/integrations/css-test-page.mjs";

// `astro preview` serves static output itself, but the Netlify adapter does not
// implement a preview server, so the adapter is left out for that one command.
const isPreview = process.argv.includes("preview");

// Static output. Only Contact goes on demand later (ticket 028 / vault 019).
export default defineConfig({
  output: "static",
  fonts,
  // Case study body images become Figures (src/integrations/figure-markdown.mjs).
  // Astro's own image optimisation still runs on them afterwards.
  markdown: { processor: satteri({ hastPlugins: [figureMarkdownPlugin] }) },
  integrations: [cssTestPage()],
  ...(isPreview ? {} : { adapter: netlify() }),
});
