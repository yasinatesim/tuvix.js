## Summary

<!-- What changed and why. Name the packages you touched. Link the issue: Closes #N -->

## Verification

<!-- Mark each command passed, failed or not run. For "not run", give the reason. A skipped command is not a pass. -->

| Command | Result |
| --- | --- |
| `pnpm build` | |
| `pnpm lint` | |
| `pnpm format:check` | |
| `pnpm check-types` | |
| `pnpm test` | |
| `pnpm lint:md` | |
| `pnpm --filter @tuvix.js/website lint` | |
| `pnpm --filter @tuvix.js/website build` | |
| `pnpm check-links && pnpm validate-docs && pnpm validate-i18n` | |
| `pnpm exec playwright test` | |
| `pnpm --filter chatbot test` | |

## Checklist

- [ ] I added a changeset (`pnpm changeset`) for every published package this PR changes, with a "Breaking" line for breaking changes
- [ ] A change to one framework adapter (react, vue, svelte, angular) is applied to the other three, or the summary says why not
- [ ] Docs and README examples compile against the real exports
