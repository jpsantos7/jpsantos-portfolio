# 014: Email sending for the contact form

Research ticket `tickets/014-email-sending-for-the-contact-form`. Retrieved 2026-11-15. Presents options; does not decide. "UNVERIFIED" = one secondary source, an undated page, a page I could only read through a summarising fetch/search without a quotable primary line, or my inference. Does not repeat `research/003-contact-form-on-netlify`.

Setting (ticket 010): text-only form (name, email, message), low volume, server-side validation, honeypot + time trap + rate limiting, Astro Action on the Netlify adapter, failure re-renders the form with the alias as fallback. `jpsantos.eu` is on Netlify DNS (NS1) with no MX or TXT records yet (owner fact, 2026-11-15). ImprovMX forwards `alias@jpsantos.eu` to the owner's inbox.

Note on method: page text was read through WebFetch (a summarising fetch) and web search, not raw HTML. Figures below are what those returned for the cited primary URL on 2026-11-15; where a page could not be fetched I say so.

## 1. Cost and plan

### (a) ImprovMX SMTP
- SMTP is paid only. "ImprovMX SMTP is available only on paid plans." https://improvmx.com/guides/forwarding-vs-smtp/ (2026-11-15). Free plan: SMTP sends 0.
- Plans (https://improvmx.com/pricing/, 2026-11-15):

| Plan | Price | SMTP sends | Forwarding |
|---|---|---|---|
| Free | $0 | 0 | 500/day |
| Light | $50/yr | 750/mo | 150,000/mo |
| Premium | $9/mo | 12,000/mo | 150,000/mo |
| Pro | $24/mo | 60,000/mo | 450,000/mo |

- Same limits in the sending guide: Light 750, Premium 12,000, Pro 60,000 SMTP per account per month; "we stop processing mail for your account until your quota resets"; paid quotas reset on the billing date. https://improvmx.com/guides/sending-receiving-limits/ (2026-11-15). Sending limits apply to SMTP only.
- Consequence at the limit (quote above): processing "stops" for the account, and incoming mail then bounces to senders. So a contact-form burst that exhausts a 750/mo Light quota would also stop forwarding for the domain (reading of "we stop processing mail for your account"; the guide says incoming mail is bounced with an over-quota message). Low risk at personal-site volume, but it is a shared failure mode.
- Conflict between sources: a help-centre article still cites 6,000 (Premium) and 30,000 (Pro) per month; the pricing page and the limits guide say 12,000 and 60,000. Search result summary of https://help.improvmx.com/email-deliverability/can-i-use-improvmx-smtp-to-send-bulk-mail-create-mailing-lists, UNVERIFIED (article not fetched; appears older). Current pricing/limits guide win.
- Also stated: "ImprovMX SMTP is not designed for bulk mailing or mass email campaigns." https://improvmx.com/smtp/ (2026-11-15). A contact form is not bulk.
- Forwarding itself stays free (needs MX + SPF). Using (a) means moving from Free to at least Light, $50/yr.

### (b) Transactional APIs
- Resend free: 3,000 emails/mo, 100/day, 3 domains, 30-day retention. "The Free plan is limited to 100 emails per day." Paid Pro $20/mo for 50,000. https://resend.com/pricing (2026-11-15).
- Postmark free (Developer): 100 emails/mo, never expires, "No overages allowed in this plan"; no inbound or dedicated IPs on free. Lowest paid Basic $15/mo for 10,000. https://postmarkapp.com/pricing (2026-11-15). Account signup refuses free-mail addresses (Gmail, Yahoo...); a business-domain address is required, so the ImprovMX alias on `jpsantos.eu` could be used. https://postmarkapp.com/blog/why-cant-i-use-gmail-address (via search summary, 2026-11-15; UNVERIFIED on exact wording). Whether new accounts go through an approval review: not established (see Gaps).
- Extra option, Brevo (France): free plan "300 email sends per day", resets daily, includes SMTP relay and API; over-cap transactional mail can queue up to 1,000 messages. https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan (read via search summary only; page returned 403 to fetch; UNVERIFIED). Some Brevo pages say new accounts must be approved before sending (UNVERIFIED). Whether free-plan transactional mail carries a Brevo logo: not established; one pricing page lists "No Brevo logo" as a paid feature, which concerns campaigns as far as I can tell (UNVERIFIED, inference). Pricing page https://www.brevo.com/pricing/ returned no usable text.

At personal-site volume all three free tiers are ample except Postmark's 100/mo cap, which a spam wave could exhaust (no overages).

## 2. Deliverability to an ImprovMX-forwarded alias

The mail goes: sender -> MX of `jpsantos.eu` (ImprovMX) -> owner's inbox. Two hops, so two authentication questions: does the message pass at ImprovMX, and does it still look legitimate to the final mailbox after forwarding.

Facts about ImprovMX forwarding:
- SRS: ImprovMX uses "our own custom version of SRS", rewriting the envelope sender to a special address at a domain it controls (`bounces.improvmx.net`). https://improvmx.com/guides/do-you-support-srs-sender-rewriting-scheme/ (2026-11-15); the `improvmx.net` envelope detail and DKIM/ARC detail come from a search summary of ImprovMX pages, UNVERIFIED as quotes: original DKIM signature preserved, optional improvmx.net DKIM added, ARC added.
- ImprovMX asks the recipient domain to put `include:spf.improvmx.com` in SPF because it sets MAIL FROM to the recipient's domain when forwarding. https://improvmx.com/guides/why-does-improvmx-need-spf/ (2026-11-15) and Netlify DNS guide https://improvmx.com/guides/netlify/ (2026-11-15): default `v=spf1 include:spf.improvmx.com ~all`; use the dashboard's recommended value.
- Inbound: it checks SPF on the sending IP and looks up DMARC (search summary of https://improvmx.com/transparency/deliverability-and-abuse-detection/, UNVERIFIED).

What this means per option (inference unless marked):
- The From address must be on `jpsantos.eu` (e.g. `form@jpsantos.eu`) and the visitor's address goes in Reply-To. Putting the visitor's address in From fails DMARC for any visitor domain with a policy and would look spoofed. This is standard practice; all three APIs expose a reply-to field: Resend `replyTo` (https://resend.com/docs/send-with-nodejs, 2026-11-15), Postmark `ReplyTo` (https://postmarkapp.com/developer/api/email-api, 2026-11-15), Brevo `replyTo{email,name}` (https://developers.brevo.com/reference/sendtransacemail, 2026-11-15), nodemailer `replyTo` (not fetched; UNVERIFIED).
- From `jpsantos.eu` to an alias on `jpsantos.eu` is a self-send. DKIM signed with `d=jpsantos.eu` survives forwarding intact (ImprovMX preserves it, UNVERIFIED as above), so DMARC passes at the final mailbox by DKIM even though SPF is rewritten by SRS. That holds for any option that signs with a DKIM key on `jpsantos.eu` (all of them; see section 3). The residual risk is the final mailbox (owner's provider) treating a forged-looking self-send harshly. Not testable from here; a send test to the real inbox is the check (inference).
- (a) ImprovMX SMTP: mail is DKIM-signed by ImprovMX with CNAME keys on your domain. "First-time SMTP setup requires two new DKIM CNAMEs and a DMARC TXT entry in your DNS; sending is blocked until they're added" (https://improvmx.com/api/, undated page, ~2,390 days old per the search tool; treat the wording as UNVERIFIED but consistent with https://improvmx.com/guides/adding-dkim-records/ and the 5.1.9 error guide https://improvmx.com/guides/519-domain-domain-is-not-configured-to-send-emails/). Because the sender and the forwarder are the same company, a self-send stays inside one system; whether ImprovMX special-cases it: not established.
- (b) Resend: SPF/return-path on a `send.` subdomain (the MX and SPF TXT live on that subdomain), DKIM TXT on `resend._domainkey`. Per Resend docs the Return-Path defaults to `send.example.com` and is fixed at domain creation. https://resend.com/docs/add-a-domain (via search summary 2026-11-15) and https://resend.com/docs/dashboard/domains/custom-return-path. SPF aligns with the root From under DMARC relaxed alignment (inference; DMARC default `aspf=r`), DKIM aligns via `d=jpsantos.eu`.
- (b) Postmark: DKIM TXT plus a Return-Path CNAME to `pm.mtasv.net` so SPF aligns on a subdomain of the From domain. https://postmarkapp.com/support/article/how-do-i-verify-a-domain and https://postmarkapp.com/support/article/910-how-do-i-add-a-custom-return-path (2026-11-15).
- (b) Brevo: Brevo code TXT, DKIM (two CNAMEs or one TXT), DMARC TXT (https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC, via search summary; UNVERIFIED). SPF alignment on Brevo not established; DKIM alignment suffices for DMARC.

Neither the vendors' pages nor any source I found tests the combined path "transactional API -> ImprovMX alias -> personal inbox". Treat deliverability as expected-good, unproven.

## 3. DNS records on Netlify DNS

Current state: no MX, no TXT. ImprovMX needs on the root (https://improvmx.com/guides/netlify/, 2026-11-15):
- MX `@` priority 10 `mx1.improvmx.com`, MX `@` priority 20 `mx2.improvmx.com`.
- TXT `@` `v=spf1 include:spf.improvmx.com ~all`.

Rule that matters for coexistence: a name may have only one SPF TXT record, so any sender that wants to sit on the root merges into the single root SPF; senders on a subdomain avoid that. (General SPF rule, RFC 7208 section 3.2; not fetched, UNVERIFIED here.) Other TXT records (Brevo code, DMARC) on different names or alongside SPF are fine.

| Option | Extra records | Where | Touches root SPF/MX? |
|---|---|---|---|
| (a) ImprovMX SMTP | 2 CNAME `dkimprovmx1._domainkey` -> `dkimprovmx1.improvmx.com`, `dkimprovmx2._domainkey` -> `dkimprovmx2.improvmx.com` (https://improvmx.com/guides/adding-dkim-records/, 2026-11-15); `_dmarc` TXT, value given as `v=DMARC1; p=none;` in https://improvmx.com/api/ (undated, UNVERIFIED) | root names | No. Reuses the existing root SPF include. Records appear in the dashboard only after one SMTP credential exists. Fewest records. |
| (b) Resend | SPF TXT + MX on `send` subdomain, DKIM TXT `resend._domainkey`, optional DMARC (https://resend.com/docs/add-a-domain, search summary; exact values only in the dashboard) | `send.jpsantos.eu` for SPF/MX, root for DKIM | No. Resend recommends sending from a subdomain; the root MX stays ImprovMX. Can send From `form@jpsantos.eu` if the root domain is verified (Resend says "each subdomain must be verified separately"; exact From/subdomain rule: UNVERIFIED). |
| (b) Postmark | DKIM TXT, Return-Path CNAME (`pm-bounces` or `pm_bounces` depending on source) -> `pm.mtasv.net`, DMARC strongly recommended (https://postmarkapp.com/support/article/how-do-i-verify-a-domain; hostname spelling differs between the two Postmark pages I read, use the account's DNS Settings page) | DKIM on root `<selector>._domainkey`, CNAME on subdomain | No SPF change at root. |
| (b) Brevo | Brevo code TXT (root), DKIM x2 CNAME or TXT, DMARC TXT | root | Another TXT at root alongside SPF is fine. Existing DMARC record must be merged, not duplicated. Cloudflare-only note about CNAME flattening does not apply to Netlify DNS (UNVERIFIED). |

Common to all: a DMARC TXT at `_dmarc.jpsantos.eu` is expected by (a) and recommended by the rest; one record only. The owner has none today.

ImprovMX's own Netlify DNS guide exists and covers the forwarding records, so the base setup is documented. Netlify DNS record entry itself was not checked beyond that guide.

## 4. EU data handling (brief)

- ImprovMX: where it stores logs/mail and its sub-processors: not established. Company location not checked (UNVERIFIED gap). Free plan keeps a 7-day email log; paid up to 180 days (https://improvmx.com/pricing/, 2026-11-15). As a forwarder it already handles every message in plaintext regardless of this choice; (a) adds sending content to the same processor.
- Resend: all account data (message content, logs, API records, webhooks) stored in the US. Region `eu-west-1` (Ireland) only controls where mail is sent from. "there is no setting today that moves stored data to the EU." Transfers use EU SCCs; also DPF participant. https://resend.com/docs/dashboard/domains/regions and https://resend.com/security/gdpr (both fetched 2026-11-15). DPA pre-signed for all plans (search summary of https://resend.com/legal/dpa; UNVERIFIED on exact text).
- Postmark (ActiveCampaign): US storage, SCCs rather than EU residency; its EU page says GDPR does not require EU servers and no current plans to add them. https://postmarkapp.com/support/article/1218-gdpr-faq and https://postmarkapp.com/eu-privacy (search summary; pages ~248 and ~1,277 days old per the tool; UNVERIFIED current). Parent's privacy policy cites EU-U.S. DPF compliance; whether it covers Postmark: not stated.
- Brevo: transactional page lists hosting in France and Germany, GDPR compliant. https://www.brevo.com/products/transactional-email/ (vendor marketing via search summary; UNVERIFIED).
- Data sent: name, email, message of a visitor (personal data), so the Site's privacy notice should name the processor whichever is chosen (inference).

## 5. Calling it from an Astro Action on Netlify

Shape (Astro docs, 2026-11-15): `defineAction({ accept: 'form', input: z.object(...), handler })` in `src/actions/index.ts`; pages must be on-demand for form `action={actions.x}`; failures surface via `Astro.getActionResult()` with `error`, and `ActionError` carries `code`/`message`. https://docs.astro.build/en/guides/actions/ . The handler's `try/catch` around the send turns a provider failure into an `ActionError` (e.g. `INTERNAL_SERVER_ERROR`) so the page can re-render with the alias fallback.

Secrets:
- Rule 11: secrets live in Netlify environment settings (`docs/authorship-protocol.md`).
- Netlify: for a variable to be readable by functions at runtime "its scope must include Functions" (scopes need Pro plan and above); variables in `netlify.toml` are not available to functions; values are fixed per deploy (redeploy to change). https://docs.netlify.com/build/functions/environment-variables/ (2026-11-15). Whether the free/Personal plan lets you pick scopes: not established.
- Astro: declare in `env.schema` with `context: "server", access: "secret"`, import from `astro:env/server`; secrets are validated at runtime only unless `validateSecrets: true`; `getSecret()` is adapter-provided. https://docs.astro.build/en/guides/environment-variables/ and https://docs.astro.build/en/reference/modules/astro-env/ (2026-11-15). `@astrojs/netlify` adapter specifics for `astro:env` secrets: not checked beyond the generic doc.
- Env size: Netlify docs say the 4 KB total applies "only in Lambda compatibility mode"; the Netlify MCP's functions context says 4 KB combined for all functions. Sources conflict (docs.netlify.com 2026-11-15 vs MCP `get-netlify-coding-context` 2026-11-15). Irrelevant at one API key or one SMTP password.

Function limits: synchronous execution 60 s, buffered payload 6 MB (Netlify MCP `get-netlify-coding-context`, serverless-functions context, 2026-11-15; first-party tool, but the public docs pages I fetched did not state it; UNVERIFIED against docs.netlify.com). Default memory 1024 MB (https://docs.netlify.com/build/functions/usage-and-billing/, 2026-11-15). Default function region is `cmh` (US East, Ohio); region override needs a Pro plan (MCP context, same date). Astro-adapter functions cannot export `config`; region is a project-level UI setting there (same source). So the Action runs in the US by default whatever provider region is picked; this matters for EU residency of the request, not only of the provider.

Per option:
- (a) ImprovMX SMTP: needs nodemailer (or similar) in the server bundle, opening a TCP connection to `smtp.improvmx.com` on port 587 (STARTTLS) or 465 (SSL/TLS); username is the alias address, password set in the dashboard under SMTP Credentials. Hosts and ports: https://improvmx.com/guides/gmail-smtp/ and https://improvmx.com/guides/thunderbird-smtp/ (via search summary 2026-11-15; port "587 or 465"; UNVERIFIED as exact quotes). Cold-start and handshake cost (DNS + TCP + TLS + AUTH, several round trips) is real but small against a 60 s limit (inference). Netlify outbound port restrictions: not established; AWS Lambda blocks outbound port 25 only (general knowledge, UNVERIFIED), so 587/465 are expected to work. Needs a connection per invocation; no pooling in serverless (inference). One more dependency than the API options.
- (b) HTTP API (Resend, Postmark, Brevo): one `fetch` POST over HTTPS, no extra dependency (Resend also ships an SDK, optional). Endpoints and auth: Postmark `POST https://api.postmarkapp.com/email` header `X-Postmark-Server-Token` (https://postmarkapp.com/developer/api/email-api, 2026-11-15); Brevo `POST https://api.brevo.com/v3/smtp/email` header `api-key` (https://developers.brevo.com/reference/sendtransacemail, 2026-11-15); Resend SDK `resend.emails.send({ from, to, subject, text, replyTo })` with key in `RESEND_API_KEY` (https://resend.com/docs/send-with-nodejs, 2026-11-15). Errors come back as HTTP status plus body, easy to map to `ActionError`. Per-request failures (rate limit 429, 4xx) are explicit.
- ImprovMX also has an HTTP API (https://improvmx.com/api/), but it manages aliases and logs, not sending, as far as the pages I saw show (UNVERIFIED; not read in full).

## 6. Trade-offs, side by side (no recommendation)

| | (a) ImprovMX SMTP | Resend | Postmark | Brevo |
|---|---|---|---|---|
| Cost | $50/yr min (Light) | $0 | $0 (100/mo cap) | $0 (300/day, UNVERIFIED) |
| Free-tier headroom | n/a (750/mo on Light) | 3,000/mo, 100/day | 100/mo, no overages | 300/day |
| Extra DNS | 2 CNAME + DMARC | SPF/MX on `send.` + DKIM (+DMARC) | DKIM + Return-Path CNAME (+DMARC) | code TXT + DKIM + DMARC |
| Touches root SPF/MX | no | no | no | no |
| Transport | SMTP + dependency | HTTPS | HTTPS | HTTPS |
| Shared failure with forwarding | yes (quota) | no | no | no |
| Data stored | ImprovMX (not established) | US | US | EU (vendor claim) |
| New vendor / account | no | yes | yes | yes |

## Conflicts with the vault

- No vault decision constrains the choice. ADR 0002 (on-demand Contact page) and tickets 010/003 agree with the Action-based approach. Ticket 015 (sender choice) is downstream. No vault note on EU data residency was found, so no conflict there.
- Between sources: ImprovMX help-centre SMTP limits (6,000 / 30,000) vs pricing page and limits guide (12,000 / 60,000); Netlify 4 KB env cap scope (docs vs MCP); Postmark Return-Path hostname `pm-bounces` vs `pm_bounces`.

## Gaps

- ImprovMX data location, sub-processors, and whether a self-send (From `jpsantos.eu` to its own alias) is handled specially. Raw SMTP host/port page on improvmx.com (the guides I fetched did not list it; ports came from search summaries).
- Exact DNS record values for every vendor (they appear only in each dashboard). ImprovMX `_dmarc` value rests on an undated API page.
- Postmark and Brevo new-account approval, and Brevo free-tier logo/branding on transactional mail.
- Netlify docs statement of the 60 s synchronous limit and outbound SMTP port behaviour; per-plan availability of env scopes.
- No real send test through each path to the owner's inbox.
