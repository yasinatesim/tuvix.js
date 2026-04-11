# @tuvix.js/core

## 0.4.4

### Patch Changes

- Updated dependencies [e8f0731]
  - @tuvix.js/loader@0.4.4
  - @tuvix.js/router@0.4.4

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
  - @tuvix.js/event-bus@0.4.2
  - @tuvix.js/router@0.4.2

## 0.3.2

### Patch Changes

- 6826b4d: feat: add public `reconcile(path?)` method to Orchestrator

  Allows external routers (TanStack Router, Next.js App Router, etc.) to
  trigger micro app reconciliation after navigation without relying on
  tuvix.js's built-in popstate listener.

  Also fixes a fallback in `reconcileApps` so it reads `window.location.pathname`
  when no router is configured and no override path is provided.

## 0.1.3

### Patch Changes

- 9e55cc9: fix: address code review findings across core, router, loader, sandbox, and server
  - **core**: fix validation order in `register()` (name check before duplicate check); fix `updateAppProps()` to only mutate config props after a successful `update()` call; implement real `mouseover`-based hover prefetch strategy instead of a 2-second timeout; add XSS warning to `fallback` type
  - **router**: fix `handleUrlChange()` to run navigation guards for browser back/forward navigation, restoring the previous URL when a guard cancels
  - **loader**: serialize the global-key snapshot + script load + resolve sequence with a module-level mutex to prevent concurrent loads from cross-contaminating UMD global detection; add timeout support to `loadStyle()` to match script loading behaviour
  - **sandbox**: document `execScript()` CSP requirement (`unsafe-eval`) in JSDoc
  - **server**: fix `fetchFragment()` return type to `{html, isError}` so metrics accurately record SSR error counts (previously always recorded 0 errors); add missing `# TYPE` declarations to Prometheus output

- Updated dependencies [9e55cc9]
  - @tuvix.js/router@0.1.3
  - @tuvix.js/loader@0.1.3

## 0.1.2

### Patch Changes

- fix: provide NODE_AUTH_TOKEN to CI pipeline
- Updated dependencies
  - @tuvix.js/event-bus@0.1.2
  - @tuvix.js/loader@0.1.2
  - @tuvix.js/router@0.1.2

## 0.1.1

### Patch Changes

- fix: bump versions to trigger CI release flow
- Updated dependencies
  - @tuvix.js/event-bus@0.1.1
  - @tuvix.js/loader@0.1.1
  - @tuvix.js/router@0.1.1
