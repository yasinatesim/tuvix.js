# Claude Instructions for Tuvix.js

## Step 1: Enhance the Prompt First

**Before doing anything else**, run the `/prompt-enhancer` skill on the user's request.

- This skill uses Braid and generates a Mermaid diagram to expand and clarify the prompt
- Use the enhanced prompt as the basis for all subsequent implementation work
- Do NOT begin planning or coding until the prompt has been enhanced

---

## Step 2: Code Review After Every Implementation

After completing any implementation task (new features, bug fixes, refactoring, multi-file changes), **always run the `/wtf-code-reviewer` skill** to validate the work before considering it done.

### When to Run

- After completing all todos in a plan
- After finishing a feature implementation
- After fixing a bug
- After any multi-file changes

### Iterative Verification Loop

1. Run `/wtf-code-reviewer` after implementation
2. If **REJECTED** or **NEEDS_FIXES**: fix the reported issues
3. Run `/wtf-code-reviewer` again to validate fixes
4. Repeat until status is **VERIFIED** or **APPROVED**
5. **Maximum 3 iterations** — if still failing after 3 runs, stop and report to user

**Do NOT consider the implementation complete until the reviewer passes.**

Even if linter shows no errors, run the reviewer — it checks for security vulnerabilities, logic errors, missing error handling, breaking changes, integration issues, and architecture violations.

---

## Step 3: Test Writing After Code Review Passes

Once `/wtf-code-reviewer` returns **VERIFIED** or **APPROVED**, **always run the `/test-driven-development` skill** to write proper tests for the implementation.

### When to Run

- Immediately after the code review passes
- For every new feature, bug fix, or refactored logic

### What to Cover

- Unit tests for individual functions and modules
- Integration tests for cross-module interactions
- Edge cases and error handling paths identified during code review

**Do NOT skip test writing even if the implementation seems trivial.**

---

## Step 4: Commit Message

After both the code review and tests pass, **provide a commit message** following this format:
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

Provide the commit message at the very end of every implementation session, after reviewer and tests both pass.