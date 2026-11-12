# Work a wayfinder ticket

The `wayfinder` skill is the procedure; this doc maps it onto this repo and vault. The owner starts it (`/wayfinder`); agents never invoke it on their own. Tracker operations: [track-tickets](track-tickets.md). One ticket per session, except research tickets.

## Chart the map
1. Destination and frontier come from grilling with the owner, as the skill says.
2. Create `MAP.md` from `_Templates/map.md`: Destination and Notes filled, Decisions so far empty, fog in Not yet specified, scope cuts in Out of scope.
3. Create the specifiable tickets, then wire `blocked_by` in a second pass.
4. Fire one `researcher` per research ticket, in parallel. Done when the map, tickets and research briefs exist; charting resolves no ticket by hand.

## Every type
1. Load the map; choose and **claim** the ticket.
2. Read its `wayfinder` property: that names the type, not the body.
3. Resolve it as below and record the resolution.
4. Update the map: create and wire newly surfaced tickets; graduate fog the answer makes specifiable and clear it from Not yet specified; update or close tickets the decision invalidates; rule out-of-scope ones out.
5. Done when the ticket is closed, the map line is added, and every graduated or invalidated ticket is handled.

## Research (AFK)
1. Brief the `researcher` agent (see [delegate-work](delegate-work.md)): the question, what the decision waits on, docs sources from [look-up-docs](look-up-docs.md).
2. It invokes the `research` skill, writes `research/NNN-slug.md` on a throwaway branch `research/NNN-slug` cut from `main` in this repo, and pushes it. No PR; never merged.
3. Resolution: the answer in 3-6 lines plus the branch name in the ticket's `branch` property.
Several research tickets may run in parallel.

## Prototype (HITL)
1. Invoke the `prototype` skill with the owner present. Prototype code lives on `prototype/NNN-slug`; it is rough and throwaway ([authorship-protocol](../authorship-protocol.md) §5).
2. The owner reacts and decides. Resolution: the owner's decision, plus the branch as an asset link.

## Grilling (HITL)
1. Invoke the `grilling` and `domain-modeling` skills. The owner answers every question; the lead never answers for them.
2. Glossary terms go to the vault `GLOSSARY.md` as they settle; ADRs to `adr/` when the domain-modeling bar is met.
3. Resolution: the decisions, in the owner's terms.

## Task (AFK or HITL)
Do it if an agent can; otherwise hand the owner a numbered checklist. Resolution: what was done and the facts later tickets need (URLs, where credentials live — never the credentials).
