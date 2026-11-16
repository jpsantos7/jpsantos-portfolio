import netlify from "@astrojs/netlify";
import { defineConfig } from "astro/config";

// `astro preview` serves static output itself, but the Netlify adapter does not
// implement a preview server, so the adapter is left out for that one command.
const isPreview = process.argv.includes("preview");

// Static output. Only Contact goes on demand later (ticket 028 / vault 019).
export default defineConfig({
  output: "static",
  ...(isPreview ? {} : { adapter: netlify() }),
});
