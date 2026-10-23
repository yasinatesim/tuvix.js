# Claude Instructions for Tuvix.js

Tuvix.js is a pnpm + turbo monorepo of microfrontend packages (`packages/*`), a VitePress site in `website/` (10 locales), examples and a chatbot. `.claude/SESSION_RULES.md` and `.claude/memory/MEMORY.md` load at session start; read them before the first edit.

## Domain invariant

Every framework adapter (`createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`) returns a `MicroAppModule` registered through `registerModule`, keeps one instance per container, hydrates existing server markup or renders fresh, emits `tuvix:mounted`/`tuvix:error`/`tuvix:unmounted` through `emitLifecycle`, makes `unmount` wait for a pending `mount`, re-renders on `update`, empties the container on `unmount`, and never imports zone.js or another global-patching polyfill.

A change to one adapter needs the same change in the other three, or a one-line reason why not.

## Request classes

Classify every request first. Depth follows risk.

| Class | Signal | Steps |
| --- | --- | --- |
| Question | "explain", "why", "how"; no code change | Answer. |
| Trivial | typo, copy, comment, config value, version bump; no behaviour change | Edit → Verification Protocol → commit message. |
| Bug | "fix", "bug", a pasted error | prompt-enhancer graph → failing test first → minimal fix → Verification Protocol → reviewer (one round) → changeset → commit message. |
| Feature / Refactor | "add", "implement", "refactor", "rename" | prompt-enhancer graph → TDD → implement → Verification Protocol → reviewer (one round) → changeset → commit message. |
| Critical | public API break, `window.__TUVIX_*__` globals, sandbox isolation, SSR HTML output, loader script execution, release or CI config | Feature steps, plus the security checklist in `.claude/references/code-quality/security-checklist.md`; reviewer up to 3 rounds. |

A Trivial edit that turns out to change behaviour is a Bug from that moment, and TDD applies.

## Step 1: Enhance the prompt

For Bug, Feature, Refactor and Critical requests, run `/prompt-enhancer` before planning or coding. It builds a BRAID graph with the mandatory Check nodes for that class; plan and code from that graph. Trivial requests and questions skip it.

## Step 2: Implement

### Monorepo rules (violations break CI)

- **pnpm only.** Never npm or yarn. Subagents use pnpm too.
- **package.json protection.** Touch only `dependencies` / `devDependencies` / `peerDependencies` unless the user asks for more. NEVER change `name`, `version`, `bin`, `files`, `publishConfig`, `scripts` or `license` on your own; subagents have destroyed these fields before.
- **Lockfile.** After any `package.json` change, run `pnpm install` from the root and keep `pnpm-lock.yaml` in the same change. CI installs with `--frozen-lockfile`, so a stale lockfile fails every job.
- **Changesets.** Each changed published package gets `.changeset/<slug>.md` (`patch` for fixes, `minor` for features or breaking changes, with a "Breaking" line for the latter).
- **Runtime dependencies.** See `CONTRIBUTING.md` "Code Style" for the zero-dependency rule and its exceptions.

### Styling

**Tailwind is forbidden** in packages, website and any new code. No exceptions. Use CSS Modules (`.module.css` / `.module.scss`) for component styles, SCSS for shared tokens and mixins, plain CSS where modules add nothing.

### Prose

All prose follows `.claude/skills/stop-slop/SKILL.md`: docs, READMEs, JSDoc, changesets and commit messages. Docs say what a feature does, when to use it, a runnable example, its edge cases and what it does not do. Never document an export the code lacks.

### Subagents

Every subagent prompt states:

- Use `pnpm`, never npm. Preserve every `package.json` field beyond the dependency sections. Run `pnpm install` from the root after a dependency change and keep the lockfile with it.
- "Do NOT use Tailwind CSS. Use CSS Modules (.module.scss) for component styles and SCSS for shared design tokens."
- Follow stop-slop for prose.
- Never commit or push. Report each verification command as passed, failed or not run.

## Step 3: Tests (TDD)

Run `/test-driven-development` before writing implementation code for Bug, Feature, Refactor and Critical work. Its Test Quality section is binding: name the broken implementation each test must catch, assert behaviour (rendered DOM, event detail, registry entry) instead of `toBeDefined()`, compile or execute runtime code inside the test (esbuild `transform()` for playground examples, `createProject()` into a temp dir for CLI templates), and add `// @vitest-environment node` to tests that use esbuild, `child_process` or other Node-native APIs. After writing tests, dispatch the `test-verifier` agent on them.

## Verification Protocol

Run it after the last edit, once all subagents have finished, never in parallel with them. While you work, scope to your package (`pnpm --filter @tuvix.js/<pkg> build | test | check-types | lint`). The full lane mirrors `ci.yml`:

```bash
pnpm install                       # only if a package.json changed
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm format:check
pnpm check-types                   # after the last edit: vitest transpiles and stays green when tsc is red
pnpm test                          # also runs validate-code-examples, validate-i18n, check-package-exports
pnpm lint:md
pnpm --filter @tuvix.js/website lint
pnpm --filter @tuvix.js/website build
pnpm check-links
pnpm validate-docs
pnpm validate-i18n
pnpm exec playwright install --with-deps chromium && pnpm exec playwright test
pnpm --filter chatbot test
pnpm --filter chatbot test:e2e
```

Report every command as **passed**, **failed** or **not run (reason)**. A command you skipped or could not start is never "passed". Fix failures before handing over. CI runs the same jobs on Node 18, 20 and 22.

Git hooks back this up: `.husky/pre-commit` runs the fast checks, `.husky/pre-push` runs `pnpm build` and the Playwright suite, and CI runs everything.

## Step 4: Code review

For Bug, Feature, Refactor and Critical work, run `/wtf-code-reviewer` once after the Verification Protocol. It dispatches `.claude/agents/wtf-code-reviewer.md`, which checks what tools cannot: scope, duplicated concepts, adapter parity, impact radius, error and async paths, and the domain invariant.

- A finding is a hypothesis. Read the code it points at; reject a wrong finding in one line with evidence.
- Fix every accepted Critical and Major finding. Fix a Minor one only when the fix is shorter than the explanation.
- One round: apply the findings, re-run the Verification Protocol, hand over. Do not re-run the reviewer to confirm your fixes. Critical requests allow up to 3 rounds, then stop and report the open findings.

### Reviewer false positives

Reject these on sight, and add a line here when a new one comes back twice:

- `eslint-disable-next-line @typescript-eslint/no-explicit-any` on `window.__TUVIX_*__` globals and framework handles; they cross framework type boundaries on purpose.
- Positional parameters on existing public APIs (`createReactMicroApp(config)`, `renderVueToString(App, props, plugins)`); changing them breaks consumers.
- `workspace:*` vs `workspace:^` ranges.
- Runtime dependencies listed as exceptions in `CONTRIBUTING.md`.
- Commented-out code.

## Hooks (`.claude/settings.json`)

Only hooks wired in `settings.json` run. Each one either blocks or warns:

| Hook | Event | Effect |
| --- | --- | --- |
| `session-start.mjs` | SessionStart | Loads `SESSION_RULES.md` and `MEMORY.md` into context. |
| `block-git-write.mjs` | PreToolUse(Bash) | **Blocks** (exit 2) `git commit`, `push`, `restore`, `revert`, `merge`, `rebase`, `cherry-pick`, `am`, `stash`, `clean`, `reset --hard`, `checkout` of paths, `switch --discard-changes`/`-f`, `branch -D`. Also checks `bash -c`, `eval`, `$(...)`, backticks and wrappers (`env`, `sudo`, `timeout`, `nice`, `xargs`); skips heredoc bodies unless a shell reads them. |
| `post-edit-ts.mjs` | PostToolUse(Edit, Write, MultiEdit) | Runs `eslint --fix` and `prettier --write` on the edited file under `packages/*/src`; reports leftover errors (exit 2). |
| `test-verifier-trigger.mjs` | PostToolUse(Edit, Write, MultiEdit) | **Warns** when a test asserts only `toBeDefined()` / `not.toThrow()`. |

Post-edit hooks see only the file you just edited. The Verification Protocol covers the rest of the repo.

## Memory

`.claude/memory/MEMORY.md` is one file with one line per durable, non-obvious fact. Name the file, function or command in each line. When the user states a rule or correction, add it in the same turn. Edit or delete stale lines instead of appending corrections.

## Step 5: Commit message

Do NOT commit or push; the human does. At the end of every implementation session, after verification and review, print a commit message:

```text
<type>(<scope>): <short summary>

<body: what changed and why, bullet points if needed>

<footer: breaking changes, issue refs if applicable>
```

Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`.

```text
feat(parser): add support for async token resolution

- Introduced AsyncTokenResolver class to handle promise-based tokens
- Updated Parser to await resolution before emitting events
- Added fallback for undefined token types

Closes #42
```

The message never includes a `Co-Authored-By` trailer.
