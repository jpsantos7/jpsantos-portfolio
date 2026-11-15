# 020 Analytics options: none or privacy-friendly

Researched 2026-11-15. Feeds ticket 021 (decide) and 025 (privacy wording). Options and trade-offs only; no recommendation. Every claim has a source line or an UNVERIFIED mark. Script sizes were measured by `curl` on 2026-11-15 (gzip as served), so they are first-hand but point-in-time.

Vault constraints read: 007 (client JS 0 KB by default, "a justified script adds its own allowance in its ticket"; HTML+CSS <= 50 KB gz; Lighthouse CI), 012 (native cross-document view transitions, no `<ClientRouter />`, every link a real page load), 015 (US storage under SCCs accepted for Resend; no paid plans; processors named in privacy wording). No vault note records a CSP decision; a strict CSP is the brief's premise. No conflict with a vault decision found.

## 1. Legal frame (owner EU-based)

- ePrivacy Art. 5(3) covers storing or accessing information on a visitor's device, not only cookies. EDPB Guidelines 2/2023 v2.0 (adopted 7 Oct 2024): tracking pixel/link distribution "does constitute storage, at the very least through the caching mechanism of the client-side software" (para 50); IP addresses can fall in scope. Para 56: "the applicability of this article does not systematically mean that consent needs to be collected... it would have to be assessed if a consent is needed or whether an exemption under Article 5(3) ePD could apply." The guidelines do not analyse the exemptions. https://edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf (read 2026-11-15)
- So "no cookies" is not itself the legal test; the exemption is national. The owner's country and regulator were not identified: national position UNVERIFIED.
- CNIL (France) publishes the clearest exemption test. Page dated 4 July 2025: purpose "strictly limited to the sole measurement of the audience" for the publisher's own account, anonymous statistics only, no cross-referencing with other processing, no cross-site tracking; recommends tracker lifespan about 13 months, retention at most 25 months, informing users (e.g. in the privacy policy); vendors may not say "validated by the CNIL". https://www.cnil.fr/fr/solutions-pour-la-mesure-daudience (read 2026-11-15). The older sheet n°16 (11 June 2020, may be superseded) also asked to truncate the last IP byte and offer an opt-out: https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications. CNIL binds only France: applicability to the owner UNVERIFIED.
- "No banner needed" statements from Plausible, Netlify and others are vendor self-declarations, not regulator rulings. GoatCounter itself says only "it should _probably_ be safe to add GoatCounter without a GDPR consent notice". https://www.goatcounter.com/help/gdpr (read 2026-11-15)
- Inference, UNVERIFIED: a purely server-side option (no script, nothing read or written on the device) falls outside Art. 5(3) in practice, but GDPR still applies to IP processing (so privacy wording is still needed). Neither source above says this directly.

## 2. Comparison

Prices dated 2026-11-15.

| | Netlify Web Analytics | Plausible Cloud | Plausible self-host | Umami Cloud | Umami self-host | GoatCounter | Cloudflare Web Analytics | Server logs only | None |
|---|---|---|---|---|---|---|---|---|---|
| Cost | unclear, see 2a | $9/mo (10k pageviews), 30-day trial, no free tier | free software + host | Hobby $0: 100K events/mo, 1 site, 6-mo retention; Pro $20 | free software + host | free hosted for "reasonable public usage" | free | log drains Enterprise only | 0 |
| Script, gzip | none (CDN logs) | 1.3 KB (1.5 with outbound links, 1.9 with outbound + tagged events) | same | 4.1 KB | same | 3.4 KB | 10.3 KB | none | none |
| Device storage | none | none written; reads `plausible_ignore` | same | none per FAQ; script reads `umami.disabled` | same | none written, except opt-in `skipgc` self-exclusion flag | none per docs | none | none |
| Data location | not stated | EU | owner's host | US and EU servers | owner's host | Finland, Germany (Hetzner); operator in Ireland | Cloudflare (US company); EU handling unclear | Netlify (US) | none |
| Measures | pageviews, unique IPs/day, top pages, 404s, sources, locations, bandwidth; no custom events documented | pageviews, referrers, outbound links, downloads, custom events | same | pageviews, referrers, custom events, optional Web Vitals/errors | same | pageviews, referrers, aggregate browser/OS/location/screen; events via JS | pageviews, referrers, Web Vitals (RUM); no custom events documented | requests by URL/status | nothing |
| Self-host effort | n/a | n/a | Docker Compose + ClickHouse, 2 GB RAM recommended | n/a | Node 20.19+ and PostgreSQL 12.14+ (or Docker Compose) | "easily" per vendor | n/a | n/a | n/a |

### 2a. Netlify Web Analytics (server-side, CDN logs)
- "Data for Web Analytics comes from our Content Delivery Network (CDN) server logs... no client-side code", so 0 KB, unaffected by ad blockers or JS off. "tracked anonymously without cookies or personally identifying information... fully GDPR compliant" (vendor claim). Unique visitors are distinct IPs per day. https://docs.netlify.com/manage/monitoring/web-analytics/how-web-analytics-works/ (read 2026-11-15). IP storage, retention and data location are not stated: UNVERIFIED.
- Counts only `text/html` responses with status 200, 201 or 304 (same page). Charts: pageviews, unique visitors, top pages, top resources not found, top sources, locations, bandwidth; no custom events documented. https://docs.netlify.com/manage/monitoring/web-analytics/overview/ (read 2026-11-15)
- Price: sources CONFLICT, so UNVERIFIED. (a) The pricing page lists "30-day analytics & metrics" under Pro ($20/mo) and not under Free; undated. https://www.netlify.com/pricing/ (read 2026-11-15). (b) Billing doc (last updated 11 Sep 2026) calls it an "add-on" with fees driven by pageviews and gives no price. https://docs.netlify.com/manage/monitoring/web-analytics/usage-and-billing/ (c) Credit-plan doc (last updated 30 Oct 2026) lists web analytics retention per plan, Free "current/past day", Personal "past 24 hours", Pro "past 30 days", and does not list it among add-ons. https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ (d) Legacy plans: $9/site/month add-on (secondary search snippet, not opened). Check the dashboard for this site before 021.
- Related, no install: Observability dashboard, "Included with Netlify plan"; Free and Personal past 24 hours, Pro 7 days; shows requests, status codes, top URLs, not referrers; says analytics tools estimate visitors while "Our dashboard doesn't track these metrics". https://docs.netlify.com/manage/monitoring/observability/overview/ (read 2026-11-15)
- Log drains (raw logs including `referrer`, and `client_ip` unless PII excluded): Enterprise only. https://docs.netlify.com/manage/monitoring/log-drains/ (read 2026-11-15). So "server logs only" on a non-Enterprise plan means the two dashboards above.

### 2b. Plausible
- Cloud: Starter $9/mo, "Up to 10k monthly pageviews", "30-day free trial. No credit card required", no free tier listed. https://plausible.io/#pricing (read 2026-11-15, undated). Fails "no paid plans" unless 021 justifies it.
- "It sets no cookies and writes nothing to local storage or the browser cache"; script only reads `plausible_ignore`; no raw User-Agent or IP stored; daily-rotated salt; "All visitor data is securely processed and stored in the EU on infrastructure owned by European companies." https://plausible.io/data-policy (read 2026-11-15). Banner claim "no consent banner is required" with a link to its own legal assessment (author-described, not verified): https://plausible.io/privacy-focused-web-analytics
- Script measured: 2,841 B raw, 1,283 B gz (`https://plausible.io/js/script.js`, 2026-11-15). Account snippets use `pa-XXXXX.js` (per Netlify proxy guide); that file's size UNVERIFIED. Extensions measured: outbound-links 1,493 B gz; outbound-links + tagged-events 1,874 B gz.
- Self-host (Community Edition): Docker Compose, CPU with SSE 4.2/NEON, ClickHouse, "At least 2 GB of RAM". https://github.com/plausible/community-edition (read 2026-11-15). Licence not confirmed: UNVERIFIED.
- First-party proxy on Netlify: two `_redirects` rules (`/.../js/script.js` to the Plausible script, `/.../api/event` to `https://plausible.io/api/event`, status 200) plus an async script tag; Netlify "Bundle JS/Minify JS" can rewrite the `src`. https://plausible.io/docs/proxy/guides/netlify (read 2026-11-15). The proxy intro says the real visitor IP must reach Plausible in `X-Forwarded-For` and does not say Netlify does this: UNVERIFIED. https://plausible.io/docs/proxy/introduction

### 2c. Umami
- Cloud Hobby $0: "Up to 100K events per month", 1 website, 6-month retention; Pro $20/mo; servers "in the US and EU" (region choice not detailed). https://umami.is/pricing (read 2026-11-15, undated).
- "Umami's web tracker does not use cookies"; compliance depends on configuration. https://docs.umami.is/docs/faq (read 2026-11-15). Measured script source reads `umami.disabled` from storage (presumably an opt-out flag: UNVERIFIED).
- Script measured: 9,246 B raw, 4,134 B gz (`https://cloud.umami.is/script.js`, 2026-11-15). Options: `data-do-not-track`, `data-domains`, `data-exclude-search`, `data-auto-pageview`, `data-before-send`, optional performance and error tracking. https://docs.umami.is/docs/tracker-configuration (read 2026-11-15). Click events with an attribute only: `data-umami-event="..."`. https://docs.umami.is/docs/track-events (read 2026-11-15)
- Self-host: Node.js 20.19+ (22 LTS recommended) and PostgreSQL 12.14+, or Docker Compose bundling Postgres. https://docs.umami.is/docs/install (read 2026-11-15). Needs an always-on host; Netlify cannot run it (inference).

### 2d. GoatCounter
- Free: "currently offered for free for reasonable public usage", donation-supported; self-host free and open source; "adds just ~3.5KB". https://www.goatcounter.com/ (read 2026-11-15)
- "doesn't store IP addresses, the full User-Agent header, or any tracker ID"; no storage in the browser; data on Hetzner in Finland and Germany; operator in Ireland; "No information is shared with third parties". https://www.goatcounter.com/help/privacy (read 2026-11-15)
- Script measured: 9,213 B raw, 3,358 B gz (`https://gc.zgo.at/count.js`, 2026-11-15). Its only `localStorage` use is a `skipgc` flag written only when a visitor opts out (measured source).
- CSP: `script-src https://gc.zgo.at` and `connect-src https://MYCODE.goatcounter.com/count` (sendBeacon). https://www.goatcounter.com/help/csp (read 2026-11-15)
- Continuity risk of a single named operator: inference, UNVERIFIED.

### 2e. Cloudflare Web Analytics
- Free; JS beacon "collects metrics using the Performance API"; it is real user monitoring (page performance), not audience analytics. https://developers.cloudflare.com/web-analytics/about/ (read 2026-11-15). Non-proxied sites add the snippet manually. https://developers.cloudflare.com/web-analytics/get-started/ (read 2026-11-15)
- Beacon "does not store any data in the browser or access any storage data". https://developers.cloudflare.com/speed/observatory/rum-beacon/ (read 2026-11-15)
- Same page: customers can exclude users on EEA/EU data centres, and "Free customers have RUM enabled with EU traffic excluded by default" (fetch summary). Whether that default applies to the manual snippet on a non-proxied site is UNVERIFIED; if it does, EU visitors would be missing from the data.
- Script measured: 31,853 B raw, 10,264 B gz (`https://static.cloudflareinsights.com/beacon.min.js`, 2026-11-15), about 8 times Plausible. No CSP values in the docs read: UNVERIFIED. Needs a Cloudflare account; US company, transfer terms not checked.

## 3. Cross-cutting

### Byte budget (007)
Client JS is 0 KB by default and a justified script "adds its own allowance in its ticket", so any script option needs an allowance set in 021 or its build ticket. Measured gzip: Plausible 1.3 KB (1.9 with outbound and events), GoatCounter 3.4, Umami 4.1, Cloudflare 10.3. Netlify Web Analytics, logs and none cost 0 KB. Async third-party scripts sit outside the HTML + CSS 50 KB line but add a request; effect on Lighthouse TBT not measured.

### View transitions (012)
Native cross-document transitions keep each link a real page load, so a per-page script runs again and records a pageview on each navigation. Inference from the 012 mechanism, UNVERIFIED by test.
- Plausible, Umami and GoatCounter scripts all contain "prerender" handling (measured source), suggesting they defer counting while a page is prerendering. Which of them defers the pageview is UNVERIFIED. Relevant only if Speculation Rules are added.
- Back/forward restored from bfcache may not re-run scripts, so those views may not count: UNVERIFIED.
- Netlify counts HTML responses with status 200, 201 or 304 at the CDN, so views served from the browser cache would not count: inference, UNVERIFIED.
- No script touches the 012 header's `view-transition-name`: inference.

### Strict CSP
- Third-party scripts need `script-src` and `connect-src` entries. GoatCounter documents exact values; Plausible, Umami and Cloudflare pages read give none: UNVERIFIED, test in a browser.
- Plausible's Netlify proxy would make script and endpoint same-origin, so `'self'` might suffice: inference from the redirect rules, UNVERIFIED. Costs a rewrite to maintain and the IP-forwarding doubt above.
- Netlify Web Analytics, logs and none need no CSP change.

### Contact-form send (010/015)
The form ends in a 303 to a "message sent" page (per vault MAP line for 010), so a send can be counted as a pageview of that URL on every option, with no custom-event JS. Custom click events need the Plausible tagged-events script or Umami `data-umami-event`. Inference, UNVERIFIED against the build.

### Processors and location (015 precedent)
015 accepted US storage under SCCs for Resend, so EU-only residency is not a stated requirement. Options with a possible US party: Netlify, Cloudflare, Umami Cloud US region. DPA and processor terms were not read for any vendor. 025 must name any analytics processor.

## 4. Options for 021

- None: 0 KB, no new processor, no wording; no audience data. Netlify Observability still gives 24 hours to 7 days of request data.
- Netlify Web Analytics: 0 KB, no CSP change, no device access, a processor the Site already uses; price and plan inclusion unresolved; no custom events; IP-based unique counts.
- Plausible Cloud: smallest script, EU hosting, richest events; $9/mo after a 30-day trial.
- Plausible or Umami self-hosted: free software, but an always-on host and database to run and secure; host cost not researched.
- Umami Cloud Hobby: free within 100K events/mo; 4.1 KB; US/EU region choice unverified.
- GoatCounter: free, 3.4 KB, EU hosting, minimal data, "probably" no banner; single operator.
- Cloudflare Web Analytics: free, heaviest script, RUM focus, EU-traffic default exclusion, extra account.

## Gaps
- Netlify Web Analytics current price and Free-plan availability (sources conflict).
- Owner's national regulator guidance (country unknown); CNIL used as a proxy only.
- DPA/processor terms and residency for Netlify, Umami Cloud, Cloudflare not read.
- No browser test of pageview counting under view transitions, bfcache or CSP.
- Plausible account-specific script size and Community Edition licence.
