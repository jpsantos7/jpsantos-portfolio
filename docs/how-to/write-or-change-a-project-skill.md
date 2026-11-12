# Write or change a project skill

Rules: [authorship-protocol](../authorship-protocol.md).

1. Invoke the `writing-for-agents` skill first.
2. Location: `.agents/skills/<name>/SKILL.md` with frontmatter `name` and `description`. Keep it at or under 150 lines; move long reference to `references/`.
3. Link the authorship protocol instead of restating it.
4. Test on a small case before first real use.
5. Claude Code link: `ln -s ../../.agents/skills/<name> .claude/skills/<name>`, then `git add` both.

## Third-party skills
Vet before install: source, scripts, network access, licence, and whether it decides visuals or writes copy (that breaks the authorship protocol). Install the single skill needed, never the whole collection. Record the vetting in the ticket's resolution.
