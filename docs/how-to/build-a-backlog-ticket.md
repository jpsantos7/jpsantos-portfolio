# Build a backlog ticket

How a build ticket goes from `ready` to `done`. Rules: [authorship-protocol](../authorship-protocol.md). Roles: [delegate-work](delegate-work.md). Only the owner moves a ticket from `backlog` to `ready`.

## Pipeline
1. **Claim:** pick a `ready` build ticket with no open blockers; set `assignee` and `status: in-progress` ([track-tickets](track-tickets.md)).
2. **Branch:** `build/NNN-slug` from `main`. Tickets running in parallel each need their own worktree, so uncommitted changes never mix.
3. **Implement:** brief one `implementer` per ticket with the ticket's acceptance criteria. It works test-first where behaviour is testable, finishes with the checks below green, and leaves its changes uncommitted. Several implementers may run at once, one ticket each, in separate worktrees (step 2).
4. **Gate:** run the [commit gate](#commit-gate). The gate passes when every check that reports a verdict says PASS and no finding the lead accepted is still open. The lead decides which findings to accept; accepted findings go back to the same implementer, then steps 3–4 repeat with the whole gate.
5. **Commit:** the lead commits once every gate check passes. Changes after a commit, including the owner's at step 6, repeat steps 3–5 as a new gated commit. Push the ticket branch after each commit; commits stay there until the owner approves the merge.
6. **Owner:** set `status: review`. The owner writes or approves every PLACEHOLDER and visual decision in the diff.
7. **Merge:** the owner approves the merge into `main`, only with `npm run check` green (GitHub does not enforce it on `main`); set `status: done`.

## Commit gate
Nothing is committed to the repo until these pass, in this order:
1. `browser-checker`, when the changes affect a rendered page: the local preview URL and the states to cover.
2. `reviewer`: project rules, acceptance criteria, security basics.
3. A correctness bug review at medium effort (Claude Code: `/code-review medium`).
4. A security review (Claude Code: `/security-review`), when the changes touch the contact form, server endpoints or Astro Actions, middleware, client scripts that handle input, secrets or env, headers, redirects, CI or deploy config (`netlify.toml` included), or dependencies.

Scope: only the uncommitted changes; earlier commits already passed. The lead runs `git add -N <new paths>` first so new files show in `git diff HEAD`; never add untracked artefacts (reports, screenshots). Brief the base too: reviewers judge the new changes against the whole branch (`git diff <base>`), so a fix that breaks earlier committed work is caught.

Applies to every repo commit: build tickets, fix rounds, harness changes, the lead's own edits. Exempt: vault notes, research findings (`researcher` commits them on its `research/` branch) and prototype branches, which are throwaway and never merged. Otherwise agents never commit to the repo; the lead does, after the gate. The merge into `main` is `git merge --ff-only`, so it adds no ungated commit; if `main` has moved, run `git merge --no-commit main` on the ticket branch, rerun `npm run check`, gate the result and commit it, then fast-forward.

## Checks (the implementer's done)
- `npm run build` succeeds with no warnings introduced.
- `npm run check` passes. It runs every gate set by the launch quality bar decision: type check, lint, format, CSS and HTML validation, Playwright tests with the axe scan, Vitest, and the performance budget. Until `package.json` has a `check` script, run each gate that already has a script; until the axe gate exists, the browser check covers it.

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
