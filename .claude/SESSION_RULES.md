# Session rules (read before the first edit)

`CLAUDE.md` explains the why. This file holds the rules you need before you write a line.

## Before writing

1. **Reuse first.** Grep for the helper that already does this and widen it. The shared runtime in `@tuvix.js/loader` (`registerModule`, `emitLifecycle`, `hasServerMarkup`, `whenMounted`, `onLifecycle`) and `matchPath` in `@tuvix.js/router` exist so nobody writes a second copy.
2. **Check the siblings.** A change to one framework adapter (react, vue, svelte, angular) needs the same change in the other three, or a one-line reason why not.
3. **Minimum code.** No speculative options, no rewrites of working code.
4. **Never make the user repeat a rule.** When the user states a preference or correction, add one line to `.claude/memory/MEMORY.md` in the same turn.

## Hard rules

- **pnpm only.** Never npm or yarn. After any `package.json` change, run `pnpm install` from the root and keep `pnpm-lock.yaml` in the same change.
- **package.json protection.** Touch only `dependencies`, `devDependencies` and `peerDependencies` unless the user asks for more. Never change `name`, `version`, `bin`, `files`, `publishConfig`, `scripts` or `license` on your own.
- **No Tailwind**, anywhere. Use CSS Modules (`.module.scss`), SCSS or plain CSS.
- **No git writes.** No `commit`, `push`, `restore`, `revert`, `merge`, `rebase`, `cherry-pick`, `stash`, `clean`, `reset --hard`, path `checkout`, `switch -f` or `branch -D`; `.claude/hooks/block-git-write.mjs` blocks them. Read-only git (`status`, `diff`, `log`, `show`) and `checkout -b` are fine. Finish with a commit message for the human.
- **Prose follows stop-slop** (`.claude/skills/stop-slop/SKILL.md`): docs, READMEs, JSDoc, changesets, commit messages. No em dashes, no filler openers, active voice.
- **Shipped code runs on Node 18, 20 and 22.** No zone.js or other global-patching polyfills.

## Adapter contract (every `create*MicroApp`)

1. Return a `MicroAppModule` and call `registerModule(config.name, module)`.
2. Keep per-container instances in a `WeakMap<HTMLElement, Instance>`; no module-level root.
3. `mount`: hydrate when SSR is on and `hasServerMarkup(container)`, else render; then `emitLifecycle('mounted', ...)`. On failure emit `error` and rethrow.
4. `unmount` during a pending `mount` waits for it, then tears down.
5. `update` re-renders with new props (remount only where the framework has no prop API, and document it).
6. `unmount`: destroy, `container.replaceChildren()`, emit `unmounted`.

## Before finishing

- Run the Verification Protocol in `CLAUDE.md` after the last edit, and report each command as passed, failed or not run.
- Run the reviewer once for anything above Trivial.
