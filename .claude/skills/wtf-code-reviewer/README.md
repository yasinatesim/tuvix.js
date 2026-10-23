# WTF/minute Code Reviewer

Dispatcher for the `wtf-code-reviewer` agent. The agent reads `.claude/references/code-quality/*` and `CONTRIBUTING.md` as rejection criteria and spends the review on what lint, Prettier and `tsc` cannot see: scope creep, duplicated concepts, parity across the four framework adapters, impact radius, error and async paths, and the adapter contract in `CLAUDE.md`.

## Files

```text
.claude/skills/wtf-code-reviewer/SKILL.md     when to dispatch, how to apply findings
.claude/agents/wtf-code-reviewer.md           the reviewer itself
.claude/agents/test-verifier.md               adversarial review of changed tests
.claude/references/code-quality/              universal, js-ts, security, SOLID, quality, removal checklists
```

The former `code-review-expert` skill was merged into this agent; its checklists live in `.claude/references/code-quality/`.

## License

MIT
