import { existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** @param {string} dir @returns {string[]} */
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? htmlFiles(join(dir, e.name))
      : e.name.endsWith(".html")
        ? [join(dir, e.name)]
        : [],
  );
}

/**
 * Every built page as a URL path, read from the build output so no route is missed.
 * @param {string} [dist]
 * @returns {string[]}
 */
export function routes(dist = join(process.cwd(), "dist")) {
  if (!existsSync(dist))
    throw new Error("dist/ not found: run npm run build first");
  return htmlFiles(dist).map((file) => {
    const rel = relative(dist, file).split(sep).join("/");
    if (rel === "index.html") return "/";
    if (rel.endsWith("/index.html"))
      return `/${rel.slice(0, -"index.html".length)}`;
    return `/${rel}`;
  });
}
