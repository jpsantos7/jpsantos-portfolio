# Build a backlog ticket

How a build ticket goes from `ready` to `done`. Rules: [authorship-protocol](../authorship-protocol.md). Roles: [delegate-work](delegate-work.md). Only the owner moves a ticket from `backlog` to `ready`.

## Pipeline
1. **Claim:** pick a `ready` build ticket with no open blockers; set `assignee` and `status: in-progress` ([track-tickets](track-tickets.md)).
2. **Branch:** `build/NNN-slug` from `v2`, in its own worktree when tickets run in parallel.
3. **Implement:** brief one `implementer` per ticket with the ticket's acceptance criteria. It works test-first where behaviour is testable and finishes with the checks below green. Several implementers may run at once, one ticket each.
4. **Browser check:** brief `browser-checker` with the local preview URL and the states to cover. Gate: PASS.
5. **Review:** brief `reviewer` with the branch diff. Gate: PASS. The lead decides which findings to accept; accepted findings go back to the same implementer.
6. **Owner:** set `status: review`. The owner writes or approves every PLACEHOLDER and visual decision in the diff.
7. **Merge:** the owner approves the merge into `v2`; set `status: done`.

## Checks (the implementer's done)
- `npm run build` succeeds with no warnings introduced.
- Lint, type check and tests pass (exact commands: `package.json` scripts).
- Automated a11y scan of the changed pages is clean (tool and command: set by the launch quality bar decision; until then, the browser checker's scan stands in).

## Accessibility bar (the browser checker's done)
WCAG 2.2 AA on every changed page and state:
- keyboard only: every control reachable, visible focus, logical order, no traps
- screen reader: names, roles, states and landmarks make sense (VoiceOver; NVDA before launch)
- widths 320, 360 and 1280 CSS px; 400% zoom with no horizontal scroll or lost content
- `prefers-reduced-motion`, `prefers-color-scheme`, forced colors
- contrast, target size, page works with JavaScript disabled
- console and network clean

## When it fails
[Escalation](delegate-work.md#escalation).
