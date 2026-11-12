# Track tickets

The vault is the issue tracker. Every map and ticket is one note; its file name is its id, its `title` is its name. Refer to tickets by name, wrapping the wikilink: `[[012-contact-form-security|Contact form security]]`.

## Notes and frontmatter
- Map: `MAP.md`. Wayfinder tickets: `tickets/NNN-<slug>.md`. Build tickets: `backlog/NNN-<slug>.md`. `NNN` is the next free number across both folders.
- Templates: `_Templates/map.md`, `_Templates/ticket.md`, `_Templates/build-ticket.md`. Map children are decisions only; build tickets are not children of the map.

| Property | Map | Wayfinder ticket | Build ticket |
|---|---|---|---|
| `title` | ✓ | ✓ | ✓ |
| `wayfinder` | `map` | `research` · `prototype` · `grilling` · `task` | — |
| `kind` | — | — | `build` |
| `status` | `open` · `closed` | `open` · `closed` | `backlog` · `ready` · `in-progress` · `review` · `done` |
| `assignee` | — | empty or `lead:<YYYY-MM-DD>` | same |
| `blocked_by` | — | list of `"[[NNN-slug]]"` | same |
| `parent` | — | `"[[MAP]]"` | — |
| `decided_in` | — | — | wayfinder tickets whose decisions it builds |
| `branch` | — | research/prototype branch, if any | `build/NNN-slug` |
| `updated` | ✓ | ✓ | ✓ |

## Wayfinding operations
- **Create:** new note from the template, `status: open`, `assignee` empty. Create all notes of a batch first, then wire `blocked_by` in a second pass, with real file names.
- **Claim:** set `assignee` before any other work. An open note with an empty `assignee` is unclaimed.
- **Unblocked:** every note in `blocked_by` has `status: closed` (or `done`).
- **Frontier:** open, unblocked, unclaimed wayfinder tickets. The `Backlog.base` view "Frontier" shows it, sorted by ticket number.
- **Resolve:** append a `## Resolution` section to the ticket (the answer, links to assets and branches), set `status: closed`, then add one line to the map's "Decisions so far": `- [[NNN-slug|Name]]: one-line gist`.
- **Out of scope:** set `status: closed`, add `resolution: out-of-scope`, add one line to the map's "Out of scope" section with the reason.

Writes follow [write-to-the-vault](write-to-the-vault.md).
