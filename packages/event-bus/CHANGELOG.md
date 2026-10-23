# @tuvix.js/event-bus

## 0.5.0

### Patch Changes

- 5d40f9c: `getGlobalBus()` keeps its singleton on `window.__TUVIX_GLOBAL_BUS__`, so separately bundled micro apps that each ship their own copy of `@tuvix.js/event-bus` get the same bus. In 0.4 each copy created its own "global" bus. `resetGlobalBus()` from any copy resets it for all of them. On the server, without `window`, the singleton stays module-scoped.
- 5d40f9c: `maxListeners` prints a `console.warn` when an event gets more listeners than the limit, once per event name, with or without `debug`. In 0.4 the warning went through the debug logger, so you only saw it with `debug: true`. The listener is still added.
- c131086: Fix `require()` for five packages and give every package the same `dist/` layout.

  In 0.4, `tuvix.js`, `@tuvix.js/core`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/router` pointed `main` and `exports.require` at `dist/index.cjs` and `dist/index.d.cts`, but the build wrote `dist/index.js` and `dist/index.d.ts`. `require('@tuvix.js/core')` threw `Cannot find module`, and TypeScript projects using CommonJS resolution got no types.

  Every package now ships the same layout:

  - `dist/<entry>.cjs` with `dist/<entry>.d.ts` for `require`
  - `dist/<entry>.mjs` with `dist/<entry>.d.mts` for `import`

  `@tuvix.js/vue`, `@tuvix.js/svelte` and `@tuvix.js/angular` use the same layout for their `./server` entry and add `typesVersions`, so TypeScript with `moduleResolution: "node"` finds `@tuvix.js/<adapter>/server` types. Each package also exports `./package.json`.

## 0.4.2

### Patch Changes

- b5a7081: Fix bugs, add missing READMEs to npm, and apply code review improvements
  - core: catch errors in updateAppProps to prevent stuck 'updating' state; exclude 'error' apps from viewport remount loop; add ensureAlive() guard to unmountApp()
  - angular: initialize **TUVIX_ANGULAR_PROPS** before writing (was always falsy, causing silent prop update drops)
  - svelte: warn instead of silent no-op when Svelte 5 $set() is missing
  - sandbox: fix CssSandbox.unwrap() to restore app content nodes (not just discard styles); add reset() to IJsSandbox interface; fix README Quick Start example (wrong API)
  - loader: remove unused createDeferred dead export
  - devtools: wire up autoOpen option (was declared but never read)
  - vue: wire up autoOpen option (was declared but never read)
  - react: : sanitize example name before tar filter to prevent path traversal
  - create-tuvix-app: sanitize example name before tar filter to prevent path traversal
  - event-bus, module-federation, router, server: publish with README (packages were previously published without one)

## 0.1.2

### Patch Changes

- fix: provide NODE_AUTH_TOKEN to CI pipeline

## 0.1.1

### Patch Changes

- fix: bump versions to trigger CI release flow
