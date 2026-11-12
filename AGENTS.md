# Portfolio

Personal Site of a design engineer and accessibility specialist, being rebuilt as v2 on Astro and hosted on Netlify. This repo holds the code and the harness. Plans, tickets, decisions (ADRs) and the glossary live in the vault. Terms (Site, Work, Case study, Project card) are defined in the vault's `GLOSSARY.md`.

## Paths
- Repo: `/Users/jsantos/Documents/git/jpsantos-portfolio`. v1 is frozen at tag `v1`; v2 is built on branch `v2`.
- Vault: `/Users/jsantos/Documents/Obsidian Vaults/Portfolio Vault`
- QMD collection: `portfolio-vault`

## Rules
- Authorship protocol is mandatory: [docs/authorship-protocol.md](docs/authorship-protocol.md).
- Stay tool-agnostic. Rules and workflows live in `AGENTS.md`, `docs/` and `.agents/skills/`; tool-specific files (`.claude/agents/`, `.claude/skills/` symlinks, `.mcp.json`) only point at them.
- Roles, briefs, checkpoints and escalation: [delegate-work](docs/how-to/delegate-work.md).
- Library docs: use the source routed in [look-up-docs](docs/how-to/look-up-docs.md). A library with no row yet gets one decided with the human first.
- Planning follows the wayfinder skill; the vault is its tracker ([track-tickets](docs/how-to/track-tickets.md)).

## Tool routing
- Search/read the vault: `qmd` skill (collection `portfolio-vault`). Read the map, ADRs and the ticket you are working directly.
- Write to the vault: `vault-writer` agent, following [write-to-the-vault](docs/how-to/write-to-the-vault.md).
- Other vault operations (rename/move with link updates, properties, open a note): `obsidian-cli` skill; it needs the Obsidian app running, so if it isn't, edit files directly and say so.
- `.base` files: `obsidian-bases` skill.
- Web: find pages with web search, read them with the `defuddle` skill; plain fetch only for `.md` URLs or if defuddle fails.

## Agents
`implementer`, `reviewer`, `browser-checker`, `researcher`, `vault-writer`, `discovery`, `advisor`. Roster: [delegate-work](docs/how-to/delegate-work.md).

## How to...
Open a doc only when the task matches.

| Task | Doc |
|---|---|
| Start or end a session, write the handoff note | [start-and-end-a-session](docs/how-to/start-and-end-a-session.md) |
| Chart the map or work a wayfinder ticket (research, prototype, grilling, task) | [work-a-wayfinder-ticket](docs/how-to/work-a-wayfinder-ticket.md) |
| Build a backlog ticket (branch → implement → check → review → merge) | [build-a-backlog-ticket](docs/how-to/build-a-backlog-ticket.md) |
| Create, claim, block, close or query tickets in the vault | [track-tickets](docs/how-to/track-tickets.md) |
| Write to the vault (any note) | [write-to-the-vault](docs/how-to/write-to-the-vault.md) |
| Pick an agent, brief it, escalate | [delegate-work](docs/how-to/delegate-work.md) |
| Look up library or platform docs | [look-up-docs](docs/how-to/look-up-docs.md) |
| Find notes in the vault (QMD) | [retrieve-context](docs/how-to/retrieve-context.md) |
| Refresh the QMD index after vault writes | [reindex-vault](docs/how-to/reindex-vault.md) |
| Create, change, or install a skill | [write-or-change-a-project-skill](docs/how-to/write-or-change-a-project-skill.md) |
