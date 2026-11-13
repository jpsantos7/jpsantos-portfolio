# Authorship protocol

Single source of these rules. Agents, skills and how-tos link here.

The Site is the owner's voice and the owner's design. Agents make the owner faster; the owner makes every call that reaches a visitor.

## Copy
1. Every word a visitor reads (headings, body, case studies, alt text, link text, meta descriptions, form labels and errors) is written by the owner.
2. Agents fill each copy slot with a marker naming what belongs there: `<!-- PLACEHOLDER: one-line outcome of the project -->` in markup, `PLACEHOLDER: …` in content files. The reviewer fails any diff that adds visitor-facing text without one.
3. Agents may draft structure: outlines, content-model fields, section order, questions that help the owner write.

## Design
4. Type, colour, space scale, layout and motion are the owner's decisions, recorded in the vault (ticket resolution or ADR). Code uses existing tokens; a value with no token is raised as an open issue for the owner.
5. Agents explore visual options only inside a prototype ticket, as rough throwaway artifacts for the owner to react to, never as the answer.
6. The `ui-ux-pro-max` skill is excluded from this project. Third-party skills are vetted before use ([write-or-change-a-project-skill](how-to/write-or-change-a-project-skill.md)). They advise: a value or edit one suggests (an easing curve, a duration, a removal) goes to the owner as a proposal under rule 4. Run `remove-animations` through its Workflow step 4 (hazards checked), then report the candidates as proposals in its output format; the owner decides what goes.

## Code principles
7. CSS follows CUBE CSS with Every Layout compositions and design tokens. No CSS framework, no component library.
8. HTML first. Zero client JavaScript by default; each script is progressive enhancement, justified in its ticket, and the page works without it.
9. Logical properties throughout, so layouts stay direction-safe.
10. Accessibility bar: WCAG 2.2 AA, checked as in [build-a-backlog-ticket](how-to/build-a-backlog-ticket.md).
11. Secrets (form endpoints, tokens, API keys) live in Netlify environment settings, never in the repo or the vault.
12. Form input is validated server-side; client-side validation is an enhancement on top.

## Status
13. Agent-authored notes in the vault (sessions, research, drafts) carry `status: draft`. Only the owner moves one to `approved`, recorded in the ticket's resolution. Tickets and the map use their own status values ([track-tickets](how-to/track-tickets.md)).
