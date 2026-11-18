/*
The one inline script in the Site's head (ticket 033, decision 009). Authorship protocol
rule 8 asks every script to be progressive enhancement and justified in its ticket:

- Why a script at all: a theme toggle that remembers a choice needs localStorage and a click
  handler. There is no HTML-only way to do either.
- Why inline in the head: it must set the saved theme before the first paint, or a visitor
  who chose the other theme than their OS sees a flash of the wrong one. A module or
  external file runs too late. It sits in <head>, so it is render-blocking by design, which
  is why the byte allowance below is small.
- Byte allowance: THEME_SCRIPT_MAX_BYTES (the minified source, UTF-8). A test fails the
  build above it. The measured size is in the ticket report.
- Without JS: the button stays hidden (CSS shows it only under html.js) and the OS theme
  applies through `color-scheme: light dark`.

Behaviour: no saved choice means the OS theme (CSS `color-scheme`, no attribute). A click
flips the shown theme and saves it as data-theme on <html>; flipping to the theme the OS
already has drops the saved choice. localStorage can throw or be blocked, so every access
is in try/catch and the choice then lives only in memory for the page. Only "light" and
"dark" are accepted from storage. The theme change crossfades through a view transition
(html.theme-fade scopes the timing in src/css/blocks/theme-toggle.css; 012 owns page
transitions). Button state is aria-pressed (true = dark); its name never changes.

The source below is written readably; line breaks are dropped to minify it, so every line
ends with a character that makes the join safe, and it carries no comments.
*/
export const THEME_SCRIPT_MAX_BYTES = 1100;

const source = `
(() => {
const d = document.documentElement;
const q = matchMedia("(prefers-color-scheme: dark)");
const K = "theme";
let s, t;
try { s = localStorage.getItem(K); } catch {}
if (s != "light" && s != "dark") s = 0;
const dark = () => (s || (q.matches ? "dark" : "light")) == "dark";
const show = () => { s ? (d.dataset.theme = s) : delete d.dataset.theme; };
const sync = () => document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.setAttribute("aria-pressed", dark()));
const go = () => { show(); sync(); };
d.classList.add("js");
show();
addEventListener("DOMContentLoaded", sync);
q.addEventListener("change", sync);
document.addEventListener("click", (e) => {
if (!e.target.closest("[data-theme-toggle]")) return;
s = dark() ? "light" : "dark";
if ((s == "dark") == q.matches) s = 0;
try { s ? localStorage.setItem(K, s) : localStorage.removeItem(K); } catch {}
if (!document.startViewTransition) return go();
d.classList.add("theme-fade");
const v = (t = document.startViewTransition(go));
const end = () => { if (t == v) d.classList.remove("theme-fade"); };
v.finished.then(end, end);
});
})();
`;

export const THEME_SCRIPT = source.replace(/\s*\n\s*/g, "").trim();
