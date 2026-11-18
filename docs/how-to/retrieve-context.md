# Retrieve context with QMD

Retrieval results are supporting context. Read the map, ADRs and the ticket you are working directly.

Step 0: load the `qmd` skill. The commands below are reference.

## Setup (once per machine)
QMD is installed globally, not by this repo, so every harness shares one copy. Keep the CLI and the skill on the same version. If the Claude Code plugin `qmd@qmd` is installed, uninstall it first (`claude plugin uninstall qmd@qmd`): it brings a second skill copy and serves the tools as `mcp__plugin_qmd_qmd__*`, which the agents here no longer list.
1. CLI: `npm i -g @tobilu/qmd@<version>`.
2. Skill, same version: `npx skills add tobi/qmd#v<version> -g -s qmd -y`. It lands in `~/.agents/skills/qmd`, and the installer links it into each harness's skills folder.
3. MCP: register `qmd mcp` (stdio) at user level in each harness, e.g. `claude mcp add -s user qmd -- qmd mcp` and `codex mcp add qmd -- qmd mcp` (in Claude Code the tools are then `mcp__qmd__*`).
4. Index, unless `qmd collection list` already shows `portfolio-vault`: `qmd collection add "<vault path from AGENTS.md>" --name portfolio-vault`, then `qmd embed -c portfolio-vault`.

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
