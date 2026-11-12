# 003: Secure, accessible contact form on Netlify (Astro)

Research ticket `tickets/003-contact-form-on-netlify`. Retrieved 2026-11-12. Presents options; does not decide. "UNVERIFIED" = one secondary source, undated page, or my inference. Netlify read via the Netlify MCP (read-only `get-netlify-coding-context`) and docs.netlify.com; Astro via `search_astro_docs`.

## 0. What v1 did (tag `v1`)

- `src/index.html:618`: `<form action="" method="POST" enctype="multipart/form-data" class="form-contact" id="contact-form">`. Fields: name (text), email (email), message (textarea). All required. **No `<input type="file">`**: the multipart enctype is vestigial, there are no attachments.
- `src/js/sections/Contact.js:156`: JS `preventDefault`s, validates client-side only (email regex), then `fetch('https://formsubmit.co/ajax/<hash>')` with a JSON body. Without JS the form posts to `""` (itself) and does nothing useful. No honeypot, no server-side validation of our own, the third-party endpoint hash is in the repo (violates authorship-protocol rule 11 for v2).
- Errors/success go to a `role="alert"` live region, JS only.

## 1. Options at a glance

| | A. Netlify Forms (static) | B. Netlify Function (or Astro endpoint) + email API | C. Astro Action (HTML form `action`) on Netlify adapter |
|---|---|---|---|
| Needs adapter / SSR | No | Function: no adapter. Astro endpoint: adapter | Yes (on-demand page) |
| Server-side validation of content | None of ours (see 3) | Full, in our code | Full, Zod schema |
| Spam | Honeypot + Akismet (+ reCAPTCHA, excluded by brief) | Ours: honeypot, time trap, rate limit | Ours, same as B |
| No-JS error display | Not possible with default flow (see 5) | Yes, we render the response | Yes, `Astro.getActionResult()` |
| Secrets | None needed (notif. in UI) | Email-provider key in Netlify env | same as B |
| Cost | Forms free on credit plans | Function compute + email provider | same as B |
| Attachments | Native, 8 MB cap | Hard (4.5 MB binary cap) | Hard |

## 2. (a) Spam protection without a CAPTCHA

Netlify Forms:
- Honeypot: "add a `netlify-honeypot` attribute to your `<form>` with the name of your hidden field... if a spambot enters any value in `bot-field`, Netlify will quietly reject the form submission." Source: https://docs.netlify.com/manage/forms/spam-filters/ (updated Jul 14, 2025).
- Akismet: "All form submissions are filtered for spam using Akismet"; only passing submissions land in Verified, flagged ones in a Spam list, where state can be changed. Same page. Honeypot/reCAPTCHA rejects "won't even be included in your form's spam submissions" (so a false-positive honeypot hit is unrecoverable; Akismet false positives are recoverable).
- Netlify's house guidance: a "missing" real submission is usually an Akismet false positive; check the Spam list first (Netlify MCP `netlify-forms` context, undated).
- reCAPTCHA 2 is the only built-in challenge (excluded by the brief).
- Rate limiting for Forms: the spam-filters page "does not mention any rate limits" (checked 2026-11-12). Nothing documented; none is configurable for form POSTs.

Own endpoint (Function/Action):
- Platform rate limiting: Functions set `config.rateLimit { windowLimit, windowSize, aggregateBy: ["ip","domain"] }` in the function file; not settable in `netlify.toml` for functions. Rules in code are on all plans: 2 per project on Free/Starter/Personal, 5 on Pro/Enterprise. "It can take up to 10 seconds before Netlify starts blocking." Source: https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/ (updated Sep 17, 2026). Redirects can also be rate limited via `[redirects.rate_limit]` in `netlify.toml`.
- Honeypot, minimum-fill-time check (signed timestamp), and content heuristics are code we write; Akismet would need our own integration (UNVERIFIED: Akismet API terms/pricing for personal use not checked).
- Astro Actions body limit defaults to 1 MB (`security.actionBodySizeLimit`, astro@5.18.0). Source: https://docs.astro.build/en/reference/configuration-reference/#securityactionbodysizelimit
- Astro `security.checkOrigin` (default true) gives CSRF protection by checking `Sec-Fetch-Site`/`Origin`, but only for on-demand pages and POST with form content types; cross-origin gets 403. Source: https://docs.astro.build/en/reference/configuration-reference/#security
- Honeypot field accessibility: must be hidden from assistive tech too (CSS-hidden removes it from the a11y tree; do not rely on visually-offscreen only). Netlify's example puts it in a `<p class="hidden">` with a label. The label text is read by AT if not truly hidden. (Inference, UNVERIFIED as a Netlify statement; it follows from WCAG 1.3.1/2.4.3 on stray focusable fields.)

## 3. (b) Server-side validation

- Netlify Forms docs contain "no explicit validation rules" (Forms setup, updated Sep 16, 2026: https://docs.netlify.com/manage/forms/setup/). Netlify validates only that submitted field names match the registered form (MCP netlify-forms context; "Netlify validates field names against the registered form"). It does not check non-empty, email format, or length. Native HTML `required`/`type=email` attributes are browser-side only, so a direct POST bypasses them. This fails authorship-protocol rule 12 on its own if used alone. (Absence-of-feature inference: UNVERIFIED beyond the docs' silence.)
- A Netlify Function can run on submission verification: handler `formSubmitted` "fires when a submission is verified", `event.data` is the submission; return value unused. Source: https://docs.netlify.com/build/functions/trigger-on-events/ (updated Jun 26, 2026). This can *react* (validate, forward, flag) but cannot reject the visitor's request or return errors to them, because the submission is already stored.
- Own endpoint: validate on the server and re-render with errors (Function returning HTML; Astro Action with Zod: `accept: 'form'`, `input: z.object({ email: z.email(), ... })`). Source: https://docs.astro.build/en/guides/actions/#validating-form-data
- Function limits: 60 s synchronous; buffered request/response payload 6 MB (4.5 MB effective for binary, Base64 overhead). Source: https://docs.netlify.com/build/functions/configuration/ (updated Sep 17, 2026).
- Hybrid is possible: Astro Action/endpoint validates, then posts to Netlify Forms or an email API. Posting to Netlify Forms from SSR must target the static skeleton file `/__forms.html`, not `/` (Netlify MCP context, undated). UNVERIFIED in practice for this site.

## 4. (c) Attachments

- v1 had no file input (see 0). Dropping attachments loses no existing feature; the v1 multipart enctype is leftover.
- Netlify Forms uploads: one file per field; 8 MB max form request; 30 s timeout; PII uploads should use the Very Good Security integration. Source: https://docs.netlify.com/manage/forms/setup/ (Sep 16, 2026).
- Privacy: submissions "securely stored in our user database"; no stated retention; deletion is manual; uploads are linked from the UI, emails, CSV, and API. After deleting a form, uploaded files remain at their direct URL for 24 h. The docs do not say whether upload URLs are access-controlled. Source: https://docs.netlify.com/manage/forms/submissions/ (Dec 17, 2025). UNVERIFIED: whether file URLs are guessable/public (docs silent).
- Own endpoint: 4.5 MB effective binary cap on a Netlify Function, plus you must store the file somewhere (Netlify Blobs, S3, or email attachment; not researched) and scan it for malware. Higher privacy/security burden than text only.
- Trade-off summary: attachments add a storage + malware + PII surface and a file-input a11y burden (error linking, size/type messaging). Text-only plus "email me files" or a link to a share is the smallest surface. Owner's call.

## 5. (e) Accessibility without client JS

- WCAG 2.2 SC 3.3.1: "the item that is in error is identified and the error is described to the user in text." Source: https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
- SC 4.1.3 Status Messages applies to changes "that are not a change of context"; a full page reload after POST counts as a new page, so it likely falls outside 4.1.3 (my inference from the Understanding doc, https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html; UNVERIFIED as a W3C statement). With JS enhancement (fetch, no reload), the result needs a live region or focus move.
- Proven no-JS pattern (GOV.UK error summary): move focus to the summary, "There is a problem" heading, links to each field with an error, same message text as beside the field, prefix the page `<title>` with "Error: ". The component's page says nothing about behaviour without JS; focus move is done by JS there. Source: https://design-system.service.gov.uk/components/error-summary/ (changelog Feb 2025). Without JS, the server can make the summary the first content with `tabindex="-1"` and use a `#error-summary` fragment in the redirect/URL so browsers scroll to it (my inference, UNVERIFIED).
- **Netlify Forms cannot show field errors** in its native flow: success redirects to `action` page (default generic page, or custom path "relative to the site root, starting with `/`"); there is no validation-error round-trip. Source: Forms setup page above. With a custom `/thank-you` page, success is a new page: give it an `h1`, a clear text confirmation, and a link back (a11y OK by design). Failure cases (spam/blocked) give the visitor no tailored message.
- Astro Action form flow: "zero-JS form submissions with standard attributes"; the page must be on-demand; `Astro.getActionResult()` returns `data` or `error` for rendering errors and success. Results show as a POST, so refresh triggers "confirm resubmission"; use POST/Redirect/GET via middleware with a session (the docs example uses Netlify Blobs). Source: https://docs.astro.build/en/guides/actions/#call-actions-from-an-html-form-action
- Progressive enhancement layers (authorship rule 8, zero JS default): (1) native `required`/`type=email` and `autocomplete` (WCAG 1.3.5), (2) server round-trip with error summary, (3) optional small script to fetch and update a live region. Layer 3 needs its own ticket justification.

## 6. (d) Security headers on Netlify for Astro

- Static `_headers` file in the publish directory (`public/_headers`) or `[[headers]]` in `netlify.toml`. "Custom headers apply only to files Netlify serves from our own backing store... a URL handled by a function or edge function such as a server-side rendered (SSR) page, custom headers won't be applied; the function should return any required headers." Source: https://docs.netlify.com/manage/routing/headers/ (updated Dec 1, 2025). That page does not state precedence between `_headers` and `netlify.toml` (UNVERIFIED).
- So with Option A (all static), `_headers` covers everything. With B/C, SSR/function responses need their own headers (middleware or `Response` headers), a second place to maintain.
- Astro 6 CSP: `security.csp` (added astro@6.0.0, default false) emits a `<meta http-equiv="content-security-policy">` with hashes for bundled scripts/styles; not supported in dev (use build + preview); external scripts/styles need manual hashes. Source: https://docs.astro.build/en/reference/configuration-reference/#securitycsp
- With `@astrojs/netlify` `staticHeaders: true` (since 7.0.0), the CSP is written to Netlify config as HTTP headers instead of a meta element for prerendered pages. Source: https://docs.astro.build/en/guides/integrations-guide/netlify/#staticheaders. This requires the adapter even for a static site.
- MDN: `form-action` does not fall back to `default-src`; omitting it allows submission anywhere; redirect handling is inconsistent across browsers. Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/form-action. Set `form-action 'self'` explicitly.
- Meta-delivered CSP ignoring `frame-ancestors`/`report-uri`/`sandbox`: MDN's page did not state it; this is spec knowledge, UNVERIFIED here. A real header (via `_headers`) avoids the question.
- Common companion headers (not source-checked here, UNVERIFIED as to current best practice): `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`, `frame-ancestors 'none'` (or `X-Frame-Options: DENY` as in Netlify's own example).
- Netlify Forms posts same-origin, so `form-action 'self'` and `connect-src 'self'` suffice. An external email API is called server-side and needs no CSP entry.

## 7. Costs and plan limits

- Forms: "For credit-based plans, Forms are free and unlimited." Form Submissions: Unlimited, Free. Sources: https://docs.netlify.com/manage/forms/usage-and-billing/ (Sep 16, 2026); https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ (Oct 30, 2026). Legacy plans (accounts created before Sep 4, 2025, per a search summary, UNVERIFIED) had 100 submissions/site/month. Which plan the owner's account is on: not established.
- Free credit plan: "300 credits/month with a hard limit and no auto recharge"; Personal plan 1,000 credits. Functions compute costs 10 credits per GB-hour; web requests 2 credits per 10,000. Per-invocation cost is not listed. A low-traffic contact function would use a tiny fraction (my estimate, UNVERIFIED). Behaviour at the hard limit (pause) comes from a search summary only: UNVERIFIED.
- Rate-limit rules in code: 2 per project on Free/Personal (one per function/redirect rule).
- Email delivery for B/C: needs a provider (key in Netlify env, rule 11); pricing not researched.
- Notifications: Netlify email recipients must be an active team member or a confirmed outside address (https://docs.netlify.com/manage/forms/notifications/, Nov 9, 2026).

## 8. Trade-offs for the owner

- **A. Netlify Forms** : least code, zero JS needed, Akismet + honeypot, supports uploads, free. Weak on server-side validation (rule 12) and no no-JS error flow; hosting lock-in; data in Netlify's DB.
- **B. Function/endpoint + email API** : full control and validation; you build spam defence, rate limiting, headers, error rendering; one more provider and secret.
- **C. Astro Action** : cleanest validation and no-JS result rendering in Astro idiom; forces the adapter and an on-demand contact page (and then Netlify Forms detection does not scan it); POST/Redirect/GET needs session/Blobs wiring.
- **Hybrid** : C or B validates and then relays, optionally into Netlify Forms for storage/Akismet. Most moving parts.
- Attachments: recommend the owner decide explicitly; v1 never had any.

## 9. Vault check

QMD `portfolio-vault`: `MAP.md` says the contact form is "Kept from v1 on purpose... security matters". `adr/0001-astro-as-platform.md` (Astro chosen, 2026-11-11). No conflicting decision on forms, hosting plan, or adapter. Not read in full: ADR 0001 body regarding static vs server output; if it fixes `output: static`, Options B-endpoint and C need a note on the adapter.

## 10. Gaps

- Netlify Forms behaviour for field-level validation: docs are silent; not tested on a deploy (no mutations allowed).
- Upload URL access control; retention period.
- Function behaviour at free-plan credit limit; which plan the owner has.
- Akismet standalone terms; email provider choice and pricing.
- Whether Netlify Forms plus Astro `prerender=false` pages works with a skeleton file in practice.
