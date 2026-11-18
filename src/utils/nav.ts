/** Whether a nav link's href is the current page; trailing slashes and `index.html` are ignored. */
export function isCurrentPath(pathname: string, href: string) {
  const normal = (p: string) =>
    p.replace(/(^|\/)index\.html$/, "$1").replace(/\/+$/, "") || "/";
  return normal(pathname) === normal(href);
}
