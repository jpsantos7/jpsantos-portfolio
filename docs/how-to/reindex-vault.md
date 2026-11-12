# Reindex the vault

Run after any vault write, and before retrieval if hits look stale:

```
qmd update && qmd embed -c portfolio-vault
```

Check with `qmd status` that `portfolio-vault` shows the new doc count. If you cannot run it, say "re-indexing pending" in the session note.
