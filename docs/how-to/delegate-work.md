# Delegate work

Roles are tool-agnostic tiers; the agent files under `.claude/agents/` implement them for Claude Code. Rules: [authorship-protocol](../authorship-protocol.md).

## Roles
| Role | Tier | Claude Code | Effort | Rules |
|---|---|---|---|---|
| Lead (main session) | Strong | Opus | medium | Breaks work into tickets, briefs agents, decides which findings to accept. Writes no code. |
| Implementer | Mid | Sonnet | medium | One per build ticket, own branch or worktree, test-first. Never one implementer working through several tickets. |
| Implementer retry | Mid | Sonnet | high | Only the ticket still red after one fix round. |
| Reviewer | Strong | Opus | medium | Read-only diff review: code, security, authorship protocol. Reports; the lead decides. |
| Browser checker | Strong | Opus | medium | Rendered pages at mobile and desktop widths, every state, a11y bar; keeps screenshots and logs out of the lead. |
| Researcher | Mid | Sonnet | medium | Wayfinder research tickets; writes only its findings file. |
| Vault writer | Mid | Sonnet | medium | All vault writes, reindex, vault commit. One at a time. |
| Discovery | Fast | Haiku | medium | Read-only lookups; structured output capped at ~40 entries. |
| Advisor | Top | Fable 5.2 | high | Read-only second opinion on hard calls only. |

The lead stays on Strong at medium effort unless the owner asks otherwise.

## Brief
Give each agent: goal, acceptance criteria, exact paths and branch, out-of-scope items, notes already read, and the commit trailers when it commits. Agents return their Report format only. The lead reads the diff before accepting: "looks good" requires having looked.

## Checkpoints
- `reviewer` before a build ticket goes to the owner, and before committing any harness change (`AGENTS.md`, `docs/`, agents, skills).
- `browser-checker` before `reviewer` on any build ticket that changes a page.
- One `vault-writer` at a time.

## Escalation
Climb only when the current step clearly falls short:
1. Make sure the agent can check its own work (a test, a build, a script).
2. Raise effort one level on the same model.
3. Move to a bigger model, starting again at lower effort.
4. Advisor (Top tier) only for a major migration or refactor, or when Strong at high effort still falls short, and only with the owner's approval.

When the same check fails twice, stop and send both attempts to `reviewer` before climbing further.

## Other agents and tools
Codex is not part of this harness. It stays reachable through the owner's global propose-then-invoke policy.
