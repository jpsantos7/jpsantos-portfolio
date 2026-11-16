import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const dist = join(process.cwd(), "dist");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? htmlFiles(join(dir, e.name))
      : e.name.endsWith(".html")
        ? [join(dir, e.name)]
        : [],
  );
}

/** Every built page as a URL path, read from `dist` so no route is missed. */
export function routes(): string[] {
  return htmlFiles(dist).map((file) => {
    const rel = relative(dist, file).split(sep).join("/");
    if (rel === "index.html") return "/";
    if (rel.endsWith("/index.html"))
      return `/${rel.slice(0, -"index.html".length)}`;
    return `/${rel}`;
  });
}
