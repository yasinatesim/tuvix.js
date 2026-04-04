# Claude Instructions for Tuvix.js

## Step 1: Enhance the Prompt

**Before doing anything else**, run the `/prompt-enhancer` skill on the user's request.

- This skill uses Braid and generates a Mermaid diagram to expand and clarify the prompt
- Use the enhanced prompt as the basis for all subsequent implementation work
- Do NOT begin planning or coding until the prompt has been enhanced

---

## Step 2: Implementation

Build the feature or fix based on the enhanced prompt from Step 1.

---

## Step 3: Write Tests with TDD Skill

After implementation, **run the `/test-driven-development` skill** to write proper tests.

### Tests Must Pass the CI Pipeline

Tests must mirror the CI pipeline (`ci.yml`). After writing tests, validate locally by running **every command below in order** — do NOT skip any:
```bash
pnpm install --frozen-lockfile
pnpm lint                        # MUST pass with 0 errors — fix all errors before proceeding
pnpm build                       # Root monorepo build
pnpm test                        # Unit tests + validate-docs (chained)
pnpm check-types
pnpm check-links                 # All markdown links must resolve
pnpm --filter @tuvix.js/website lint   # Website-specific lint (separate CI job)
pnpm --filter @tuvix.js/website build  # Website build must succeed (separate CI job)
pnpm format --check || true
pnpm exec playwright install --with-deps chromium && pnpm exec playwright test  # E2E tests
```

**Every command above maps to a CI job. If any command fails locally, it will fail in CI.** Fix all failures before proceeding — never leave a failing check for a follow-up commit.

**`pnpm lint` must exit with 0 errors before any commit.** ESLint errors (`@typescript-eslint/no-explicit-any`, `no-useless-escape`, etc.) break the CI pipeline and must be fixed in the same commit as the implementation — never left for a follow-up.

Tests must pass on **Node.js 18, 20, and 22** (matching the CI matrix).

### What to Cover

- Unit tests for individual functions and modules
- Integration tests for cross-module interactions
- Edge cases and error handling paths

**Do NOT skip test writing even if the implementation seems trivial.**

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