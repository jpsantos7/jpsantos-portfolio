# Write to the vault

Rules: [authorship-protocol](../authorship-protocol.md). All writes go through `vault-writer`, one at a time: the vault is not worktree-friendly and obsidian-git auto-commits.

1. Load the `obsidian-markdown` skill (plus `obsidian-bases` for `.base` files).
2. In the vault run `git status`. Commit pending changes first as `vault backup: before agent edit`, so the agent's diff stays separate. Done when `git status` is clean.
3. Write only the notes the brief names. Frontmatter carries `status` and `updated`. Reference notes by wikilink with a display name; copy nothing; no secrets or PII.
4. Renames and moves: `obsidian-cli` if Obsidian is running; otherwise edit directly and say so.
5. Reindex: [reindex-vault](reindex-vault.md).
6. Check that wikilinks in the changed notes resolve and frontmatter is present.
7. Commit in the vault with the trailers given in the brief. Done when the commit hash is in hand.
