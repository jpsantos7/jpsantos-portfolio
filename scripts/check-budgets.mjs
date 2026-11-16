// Byte budgets that Lighthouse CI cannot express (see lighthouserc.cjs):
// HTML + CSS <= 50 KB gzip per page, and no client JS at all.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const dist = process.argv[2] ?? "dist";
const LIMIT = 50 * 1000;

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

const files = walk(dist);
const js = files.filter((f) => /\.(m?js|cjs)$/.test(f));
const css = files.filter((f) => f.endsWith(".css"));
const pages = files.filter((f) => f.endsWith(".html"));
const failures = [];

if (js.length > 0)
  failures.push(`client JS must be 0 KB, found: ${js.join(", ")}`);

// Conservative: every stylesheet counts against every page.
const cssBytes = css.reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0);
for (const page of pages) {
  const total = gzipSync(readFileSync(page)).length + cssBytes;
  if (total > LIMIT)
    failures.push(`${page}: HTML + CSS is ${total} B gzip, limit ${LIMIT} B`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  `budgets ok: ${pages.length} page(s), CSS ${cssBytes} B gzip, no client JS`,
);
