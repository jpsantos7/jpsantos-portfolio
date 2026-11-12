# Retrieve context with QMD

Retrieval results are supporting context. Read the map, ADRs and the ticket you are working directly.

Step 0: load the `qmd` skill. The commands below are reference.

## Commands (collection `portfolio-vault`)
- Hybrid, best default: `qmd query "<question>" -c portfolio-vault`
- Lexical, exact terms: `qmd search "<terms>" -c portfolio-vault`
- Fetch one hit: `qmd get <file>`
- Or the qmd MCP tools (`query`, `get`, `multi_get`) with collection `portfolio-vault`.

## Steps
1. Start with `query`.
2. For every hit, read frontmatter `status`; `draft` is not a decision.
3. Flag conflicts with an ADR or a closed ticket to the owner instead of resolving them.

Stale results: [reindex-vault](reindex-vault.md).
