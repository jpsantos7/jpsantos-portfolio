# Start and end a session

Rules: [authorship-protocol](../authorship-protocol.md). One session per task: a new task starts a new session from the latest handoff note, never from a pasted transcript.

## Start
1. Read directly (not via QMD): the vault's `MAP.md` and the newest note in `sessions/`.
2. Read the ticket you will work, if one is named. Otherwise take the frontier as [track-tickets](track-tickets.md) describes.
3. Done when you can state the ticket, its type, the branch (if any) and the next action.

## During
- Compact between steps (plan, implement, browser check, review, fixes). Update the handoff note first.
- Heavy output (screenshots, snapshots, logs, test output, large diffs, whole files) stays in subagents; they return their Report format only.
- Wait for background agents' completion notice; read each result once.

## End
1. Copy `_Templates/session.md` to `sessions/YYYY-MM-DD-<slug>.md` (via `vault-writer`).
2. Fill: branch, tickets touched with status, open decisions, accepted review findings, one next action, skills the next session should load.
3. Reference notes by `[[link]]`; copy nothing; no secrets or PII.
4. Reindex: [reindex-vault](reindex-vault.md).
