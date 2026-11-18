// Head metadata rules from the SEO decision (vault ticket 022).

/** Canonical origin: HTTPS, apex (no `www`), no trailing slash. */
export const SITE_URL = "https://jpsantos.eu";

const BRAND = "JP Santos";

/** `Page — JP Santos`; Home is `JP Santos — Design Engineer`. */
export function pageTitle(title: string, options: { home?: boolean } = {}) {
  return options.home ? `${BRAND} — Design Engineer` : `${title} — ${BRAND}`;
}

/** Self-referencing canonical for a pathname: slashless, `index.html` dropped. */
export function canonicalUrl(pathname: string) {
  const path = pathname.replace(/(^|\/)index\.html$/, "$1").replace(/\/+$/, "");
  return `${SITE_URL}${path}`;
}
