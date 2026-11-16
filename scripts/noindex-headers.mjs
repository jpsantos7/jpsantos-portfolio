import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Netlify `_headers` and `[[headers]]` cannot be scoped to a deploy context,
 * so the file is generated at build time from the CONTEXT env var that
 * Netlify sets (production, deploy-preview, branch-deploy). Every context
 * except production gets `X-Robots-Tag: noindex`. No CONTEXT (local or CI
 * build, not a Netlify deploy) writes nothing.
 *
 * @param {string | undefined} context
 * @returns {string | null} the `_headers` file content, or null for none
 */
export function headersFor(context) {
  if (!context || context === "production") return null;
  return "/*\n  X-Robots-Tag: noindex\n";
}

/**
 * @param {string} distDir
 * @param {string | undefined} context
 * @returns {boolean} whether a file was written
 */
export function writeHeaders(distDir, context) {
  const content = headersFor(context);
  if (content === null) return false;
  mkdirSync(distDir, { recursive: true });
  const file = join(distDir, "_headers");
  // Append, so a `_headers` copied from `public/` is kept.
  const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
  const separator = existing === "" || existing.endsWith("\n") ? "" : "\n";
  appendFileSync(file, `${separator}${content}`);
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const wrote = writeHeaders(process.argv[2] ?? "dist", process.env["CONTEXT"]);
  console.log(
    wrote
      ? `noindex: wrote _headers for CONTEXT=${process.env["CONTEXT"]}`
      : "noindex: skipped (production or no CONTEXT)",
  );
}
