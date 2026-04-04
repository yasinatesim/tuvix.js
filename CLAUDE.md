# Claude Instructions for Tuvix.js

## Step 1: Enhance the Prompt

**Before doing anything else**, run the `/prompt-enhancer` skill on the user's request.

- This skill uses Braid and generates a Mermaid diagram to expand and clarify the prompt
- Use the enhanced prompt as the basis for all subsequent implementation work
- Do NOT begin planning or coding until the prompt has been enhanced

---

## Step 2: Implementation

Build the feature or fix based on the enhanced prompt from Step 1.

### Monorepo Rules (pnpm workspace — violations break CI)

**Package manager:** This is a pnpm monorepo. Always use `pnpm`, never `npm` or `yarn`. Subagents must also use pnpm.

**Package.json protection:** When modifying any `package.json`, only touch `dependencies` / `devDependencies` sections unless explicitly told otherwise. NEVER change `name`, `version`, `bin`, `files`, `publishConfig`, `scripts`, or `license` unless the user explicitly requests it — subagents have destroyed these fields before.

**Lockfile:** After any `package.json` change, run `pnpm install` from the monorepo root immediately and include `pnpm-lock.yaml` in the same commit. CI runs `--frozen-lockfile` — an out-of-sync lockfile breaks every CI job before any test runs.

**Subagent constraints:** When dispatching subagents via subagent-driven-development, explicitly state these rules in each subagent prompt:
- Use `pnpm`, not `npm`
- Preserve all existing `package.json` fields beyond deps
- Run `pnpm install` from root after any dep change and stage `pnpm-lock.yaml`

---

## Step 3: Write Tests with TDD Skill

After implementation, **run the `/test-driven-development` skill** to write proper tests.

### Tests Must Pass the CI Pipeline

Tests must mirror the CI pipeline (`ci.yml`). After writing tests, validate locally by running **every command below in order** — do NOT skip any:

> **LOCKFILE RULE:** After modifying ANY `package.json` in any workspace package, run `pnpm install` from the monorepo root **before** any other command. CI uses `--frozen-lockfile` and will fail if `pnpm-lock.yaml` is out of sync. Agents must commit the updated lockfile in the same commit as the `package.json` change.

These commands mirror the exact jobs in `ci.yml`. Run them in order — skip none:

```bash
# 1. Lockfile (if any package.json changed)
pnpm install

# 2. build job (Node matrix — run on Node 20 locally)
pnpm install --frozen-lockfile
pnpm build

# 3. unit-test job
pnpm test
pnpm check-types

# 4. lint job
pnpm format --check || true

# 5. website-lint job
pnpm --filter @tuvix.js/website lint

# 6. website-build job
pnpm --filter @tuvix.js/website build

# 7. docs-validation job
pnpm check-links
pnpm validate-docs
pnpm validate-i18n

# 8. e2e-test job — MANDATORY before every commit, no exceptions
pnpm exec playwright install --with-deps chromium && pnpm exec playwright test
```

**If any command fails, fix it before committing. Never commit after skipping E2E.**

**Subagent constraint:** When dispatching subagents that will commit code, their prompt must include: *"Before committing, run the full CI checklist from CLAUDE.md including `pnpm exec playwright test`. Do not commit if E2E fails."*

**`pnpm lint` must exit with 0 errors before any commit.** ESLint errors (`@typescript-eslint/no-explicit-any`, `no-useless-escape`, etc.) break the CI pipeline and must be fixed in the same commit as the implementation — never left for a follow-up.

Tests must pass on **Node.js 18, 20, and 22** (matching the CI matrix).

### What to Cover

- Unit tests for individual functions and modules
- Integration tests for cross-module interactions
- Edge cases and error handling paths

**Do NOT skip test writing even if the implementation seems trivial.**

### Test Quality Rules

**String-based tests are insufficient for runtime code.** If you are testing code that runs in a different environment (browser, CDN, iframe) or gets compiled/transformed, string assertions will pass while the runtime fails. Use real compilation/execution tests:
- For playground code examples → compile with esbuild (`transform()`) inside the test, assert no errors
- For CLI templates → `createProject()` to a temp dir and check actual file contents
- For transformer functions → run the actual transform and verify output compiles

**Vitest environment:** Code that uses Node.js native modules (like esbuild's native binary) fails in jsdom. Add `// @vitest-environment node` at the top of test files that use esbuild, child_process, or other Node-native APIs.

**Tests must prove the feature works, not just that the code exists.** A test that checks `source.includes('createVueMicroApp')` tells you nothing about whether the code actually runs.

---

## Step 4: Code Review

Once tests pass, **run the `/wtf-code-reviewer` skill** to validate the implementation.

### Iterative Verification Loop

1. Run `/wtf-code-reviewer`
2. If **REJECTED** or **NEEDS_FIXES**: fix the reported issues, then **go back to Step 3** (re-run tests)
3. Run `/wtf-code-reviewer` again after fixes
4. Repeat until status is **VERIFIED** or **APPROVED**
5. **Maximum 3 iterations** — if still failing after 3 runs, stop and report to user

**Do NOT consider the implementation complete until the reviewer passes.**

Even if linter shows no errors, run the reviewer — it checks for security vulnerabilities, logic errors, missing error handling, breaking changes, integration issues, and architecture violations.

---

## Step 5: Commit Message

After both tests and code review pass, **provide a commit message** in this format:
```
<type>(<scope>): <short summary>

<body — what changed and why, bullet points if needed>

<footer — breaking changes, issue refs if applicable>
```

**Types:** `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`

### Example
```
feat(parser): add support for async token resolution

- Introduced AsyncTokenResolver class to handle promise-based tokens
- Updated Parser to await resolution before emitting events
- Added fallback for undefined token types

Closes #42
```

The message NOT include "Co-Authored-By: Claude <model>  <noreply@anthropic.com>"

Provide the commit message at the very end of every implementation session, after reviewer and tests both pass..

DO NOT commit or push. Just provide message