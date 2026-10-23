# JavaScript and TypeScript

> Sources: [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript) (MIT) and [wtfjs](https://github.com/denysdovhan/wtfjs) (WTFPL) via the yasinatesim agent bootstrap gist. Only items that ESLint, Prettier or `tsc` do not already reject belong here.
>
> Rule: NEVER flag or remove commented-out code.

## Idioms

- Default parameters over `|| fallback`; `||` also swallows `0`, `''` and `false`. Use `??` when only `null`/`undefined` should fall back.
- Destructure option objects with defaults: `function f({ timeout = 5000 } = {})`.
- `async`/`await` over `.then()` chains.
- Named exports only (`CONTRIBUTING.md`).
- Shipped code runs on Node 18, 20 and 22 and evergreen browsers: no `Promise.withResolvers`, `Array.prototype.toSorted`, `Object.groupBy` or `Set` methods from ES2025 in `packages/*/src`.

## Traps to flag

- `.sort()` without a comparator sorts as strings: `[10, 1, 3].sort()` gives `[1, 10, 3]`.
- `NaN === NaN` is `false`; use `Number.isNaN()`.
- `typeof null === 'object'`; check `=== null`.
- `new Promise(async (resolve) => ...)`: a throw inside the async executor is lost.
- An empty `catch`, or a `catch` that only `console.log`s.
- A `setTimeout`/`setInterval`/`addEventListener`/`MutationObserver` with no cleanup in `unmount`.
- A floating promise in `mount`/`unmount` that the caller cannot await.
- Module-level mutable state in an adapter (`let root`), which breaks mounting one module into several containers. Per-container state lives in a `WeakMap<HTMLElement, Instance>`.
- `as` casts that hide a real type mismatch. Deliberate `any` on `window` globals and framework handles is allowed (see the false-positive list in `CLAUDE.md`).
- `JSON.stringify` output dropped into HTML without escaping `<`.

## Framework adapter traps

- React: a new `{ __html }` object on every render rewrites `dangerouslySetInnerHTML` DOM; `useEffect` without cleanup; a stale closure over props in an effect with incomplete deps.
- Vue: calling `createApp` again to update props instead of updating a reactive source; forgetting `app.unmount()`.
- Svelte: Svelte 4 (`new Component`, `$set`, `$destroy`, `App.render`) and Svelte 5 (`mount`, `hydrate`, `unmount`, `render` from `svelte/server`) need separate code paths. Code that only handles one version is a finding.
- Angular: importing `zone.js` anywhere in `packages/angular/src`; bootstrapping without `provideZonelessChangeDetection` (or the experimental variant on older Angular).

## Testing (Vitest)

- `vi.mock` calls are hoisted above imports; variables they reference must come from `vi.hoisted`.
- With fake timers and promises, use `await vi.runAllTimersAsync()`; `vi.runAllTimers()` does not flush awaited work.
- Restore globals you stub (`vi.unstubAllGlobals()`, delete `window.__TUVIX_*__`) in `afterEach`, or tests leak state into each other.
