/**
 * Injects the CSS test page at /dev/css-test.
 * Always present under `astro dev`; in `astro build` it is added only when the
 * CSS_TEST_PAGE=1 environment variable is set, so the default production build
 * never contains it.
 * @returns {import("astro").AstroIntegration}
 */
export default function cssTestPage() {
  return {
    name: "css-test-page",
    hooks: {
      "astro:config:setup": ({ command, injectRoute }) => {
        if (command === "dev" || process.env["CSS_TEST_PAGE"] === "1") {
          injectRoute({
            pattern: "/dev/css-test",
            entrypoint: "./src/dev/css-test.astro",
          });
        }
      },
    },
  };
}
