/**
 * Whether the CSS test page should be injected. Always under `astro dev`; in a
 * build only when CSS_TEST_PAGE=1. That flag must never reach Netlify, so it
 * throws there.
 * @param {string} command Astro command
 * @param {Record<string, string | undefined>} env
 */
export function shouldInjectTestPage(command, env) {
  const flagged = env["CSS_TEST_PAGE"] === "1";
  if (flagged && env["NETLIFY"]) {
    throw new Error(
      "CSS_TEST_PAGE=1 is set in a Netlify build: the CSS test page must never be deployed. Remove the variable.",
    );
  }
  return command === "dev" || flagged;
}

/**
 * Injects the CSS test page at /dev/css-test (see shouldInjectTestPage).
 * @returns {import("astro").AstroIntegration}
 */
export default function cssTestPage() {
  return {
    name: "css-test-page",
    hooks: {
      "astro:config:setup": ({ command, injectRoute }) => {
        if (shouldInjectTestPage(command, process.env)) {
          injectRoute({
            pattern: "/dev/css-test",
            entrypoint: "./src/dev/css-test.astro",
          });
        }
      },
    },
  };
}
