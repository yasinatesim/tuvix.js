---
name: wtf-code-reviewer
description: Dispatch the wtf-code-reviewer agent (and test-verifier for changed tests) once after a Bug, Feature, Refactor or Critical implementation, then apply the findings. Trivial edits skip it.
---

# WTF/minute code review

The checklist lives in the agent (`.claude/agents/wtf-code-reviewer.md`) and its references (`.claude/references/code-quality/`). This skill only says when and how to call it, and what to do with the answer.

## When

After the Verification Protocol in `CLAUDE.md` has run on the finished change, for every request class except Question and Trivial.

## Dispatch

Run the reviewer agent read-only:

```text
Agent({
  subagent_type: 'wtf-code-reviewer',
  description: 'Review <change>',
  prompt: `Review this tuvix.js change.
    Request class: <Bug | Feature | Refactor | Critical>
    What was asked: <the user's request in one or two sentences>
    Files changed: <list>
    Packages touched: <list; name every adapter touched so sibling parity gets checked>
    Verification results: <passed / failed / not run per command>
    Produce the full report.`
})
```

In the same message, when the diff changes any `*.test.ts` file, dispatch `test-verifier` with the list of changed test files and the code they cover.

## Apply the findings

1. Read the code each finding points at before you act on it. Reject a wrong finding in one line with the evidence (the line, the test, the written rule). A finding that contradicts `CLAUDE.md` or `CONTRIBUTING.md` is wrong.
2. Fix every Critical and Major finding you accept.
3. Fix a Minor finding only if the fix is shorter than the explanation. Informational findings need no action.
4. Re-run the Verification Protocol.
5. Record any finding you rejected with evidence that is likely to come back as one line in the "Reviewer false positives" list in `CLAUDE.md`.

## One round

Do not dispatch the reviewer again to confirm your fixes. A second round is earned only by new code the reviewer never saw. Critical-class requests are the exception: up to 3 rounds, then stop and report the open findings to the user.
