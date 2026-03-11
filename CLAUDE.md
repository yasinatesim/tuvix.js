# Claude Instructions for Tuvix.js

## Code Review After Every Implementation

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
