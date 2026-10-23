# Credits

The agents, skills, hooks and references in `.claude/` borrow from the work below. A row stays as long as the borrowed behaviour stays, including after a rewrite in our own words.

| What we use | Where it lives here | Original | Author | License |
| --- | --- | --- | --- | --- |
| Agent infrastructure layout: request classes, Verification Protocol, SESSION_RULES, single-file memory, hook set, reviewer and test-verifier agents, test-quality rules, BRAID mandatory checks and escalation budget | `CLAUDE.md`, `.claude/**` | "Claude Code Agent Infrastructure Bootstrap" gist | [yasinatesim](https://github.com/yasinatesim) | see gist |
| TDD skill and testing anti-patterns | `.claude/skills/test-driven-development/` | [obra/superpowers](https://github.com/obra/superpowers) | Jesse Vincent (obra) | MIT |
| stop-slop, copied unchanged with its LICENSE | `.claude/skills/stop-slop/` | [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | [Hardik Pandya](https://hvpandya.com) | MIT |
| BRAID reasoning graphs | `.claude/skills/prompt-enhancer/` | [arXiv 2512.15959](https://arxiv.org/abs/2512.15959), "BRAID: Bounded Reasoning for Autonomous Inference and Decisions" | Armağan Amcalar, Eyup Cinar | academic paper |
| SOLID, security, code-quality and removal checklists (from the former `code-review-expert` skill) | `.claude/references/code-quality/*-checklist.md`, `removal-plan.md` | [sanyuan0704/sanyuan-skills](https://github.com/sanyuan0704/sanyuan-skills) | sanyuan0704 | MIT |
| Clean-code review criteria | `.claude/references/code-quality/universal.md`, `js-ts.md` | [ryanmcdermott/clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript) | Ryan McDermott | MIT |
| JavaScript coercion traps | `.claude/references/code-quality/js-ts.md` | [denysdovhan/wtfjs](https://github.com/denysdovhan/wtfjs) | Denys Dovhan | WTFPL |
