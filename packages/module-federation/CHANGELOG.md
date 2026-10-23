# @tuvix.js/module-federation

## 0.5.0

### Minor Changes

- 1ec8e77: `federatedEntry` and `createFederatedEntry` return entries the orchestrator can load.

  - Both return a loader function. On first mount it loads `remoteEntry.js`, initialises the container's share scope, calls `container.get(modulePath)` and returns the micro app (its own exports or its `default` export). In 0.4 they returned `{ scripts: [remoteEntry.js] }`, and the loader then failed with "no exports found", because a container only has `init` and `get`.
  - `federatedEntry(remote, modulePath = './App', { shareScope })` takes the exposed module path. `createFederatedEntry(remoteName, modulePath = './App')` too.
  - In a webpack host the package calls `__webpack_init_sharing__('default')` and passes `__webpack_share_scopes__.default` to `init`. In 0.4 it read `window.__webpack_share_scopes__`, which webpack never defines, so every remote got its own empty scope. Outside webpack, all remotes on the page now share one scope object.
  - Each container is initialised once, even when several entries or loaders use it.
  - `remoteEntry.js` loads through `loadScript` from `@tuvix.js/loader`: one tag per URL, the tag is removed on failure so a retry starts fresh, and the orchestrator's timeout aborts the wait.
  - New exports: the `FederatedContainer`, `ShareScope` and `FederatedEntryOptions` types.

  Breaking:

  - `federatedEntry` and `createFederatedEntry` return an `EntryLoader` function instead of an `EntryConfig`.
  - `FederatedLoaderConfig.shared` is replaced by `shareScope`. The package never read `shared`.
  - `loadRemoteContainer` returns `FederatedContainer` instead of `any`.

### Patch Changes

- c131086: Fix `require()` for five packages and give every package the same `dist/` layout.

  In 0.4, `tuvix.js`, `@tuvix.js/core`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/router` pointed `main` and `exports.require` at `dist/index.cjs` and `dist/index.d.cts`, but the build wrote `dist/index.js` and `dist/index.d.ts`. `require('@tuvix.js/core')` threw `Cannot find module`, and TypeScript projects using CommonJS resolution got no types.

  Every package now ships the same layout:

  - `dist/<entry>.cjs` with `dist/<entry>.d.ts` for `require`
  - `dist/<entry>.mjs` with `dist/<entry>.d.mts` for `import`

  `@tuvix.js/vue`, `@tuvix.js/svelte` and `@tuvix.js/angular` use the same layout for their `./server` entry and add `typesVersions`, so TypeScript with `moduleResolution: "node"` finds `@tuvix.js/<adapter>/server` types. Each package also exports `./package.json`.

- Updated dependencies [1ec8e77]
- Updated dependencies [1ec8e77]
- Updated dependencies [c131086]
  - @tuvix.js/loader@0.5.0

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

- Updated dependencies [b5a7081]
  - @tuvix.js/loader@0.4.2

## 0.1.2

### Patch Changes

- fix: provide NODE_AUTH_TOKEN to CI pipeline
- Updated dependencies
  - @tuvix.js/loader@0.1.2

## 0.1.1

### Patch Changes

- fix: bump versions to trigger CI release flow
- Updated dependencies
  - @tuvix.js/loader@0.1.1
