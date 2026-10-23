# @tuvix.js/sandbox

## 0.5.0

### Minor Changes

- 1ec8e77: Sandbox: CSS isolation survives remounts, `adoptStyles`, and a strict mode that blocks writes.

  - `CssSandbox.wrap(container)` reuses `container.shadowRoot` when the element already has an open shadow root, whether it came from an earlier `wrap`, another `CssSandbox` instance, or an `unwrap`. Before, the second mount called `attachShadow` again and threw.
  - `CssSandbox.unwrap(container)` moves the app's nodes back to the light DOM and leaves a `<slot>` in the shadow root, so you see them again. Before, the restored nodes stayed invisible behind a shadow root without a slot. `unwrap` takes `<style>` and `<link rel="stylesheet">` nodes (including ones from `addStyle` and `adoptStyles`) out of the DOM so the app's CSS stops applying, and the next `wrap` of that container puts them back in order. Before, `unwrap` deleted them, and a remounted app rendered unstyled. `removeStyle` or `adopted.remove()` while unwrapped keeps that stylesheet from coming back.
  - New `CssSandbox.adoptStyles(shadowRoot, { urls, cssText })` inserts `<link rel="stylesheet">` and `<style>` elements at the start of the shadow root, skips URLs already adopted there, and returns `{ elements, ready, remove }`. `ready` resolves once each link fires `load` or `error`. jsdom fires neither, so do not await `ready` in jsdom tests. New exported types: `AdoptStylesOptions`, `AdoptedStyles`.
  - `JsSandbox.execScript` runs the code inside `with (scope)`, so sloppy-mode `x = 1`, top-level `var x` and `window.window.x` store `x` on the proxy. Before, a bare assignment created a property on the real `window`. Reading an undeclared identifier now returns `undefined` instead of throwing `ReferenceError`, and a `"use strict"` directive in the script has no effect.
  - `JsSandbox` with `strict: true` throws a `TypeError` when sandboxed code assigns, `var`-declares at the top level, or `Object.defineProperty`s a global outside the built-in allowlist and `allowedGlobals`, and stores nothing. Before, it logged a warning and stored the value anyway. The proxy still leaves timers, event listeners and `<script>`-loaded code alone; it isolates code that reads globals through `proxyWindow`, such as `execScript`.
  - `Object.defineProperty(proxyWindow, ...)` now stores the value on the proxy. Before, the proxy had no `defineProperty` trap and the property landed on the real `window`. A descriptor without `value` (`{ enumerable: false }`) keeps the stored value. Accessor descriptors (`get`/`set`) and `configurable: false` throw a `TypeError`.
  - `eval("...")` inside `execScript` stays a direct eval in the sandbox scope, so `eval("window.x = 1; var y = 2")` stores on the proxy (and throws in strict mode).
  - `proxyWindow.window`, `.self`, `.globalThis`, and `.top`/`.parent`/`.frames` outside an iframe return the proxy, so `top.x = 1` stays in the sandbox.
  - Known limit: inside a plain sloppy-mode function call such as `f()`, `this` is the real global object, as JavaScript defines it, so `this.x = 1` there writes to the real `window`. Top-level `this` in `execScript` is the proxy.
  - Reading a real-window function such as `proxyWindow.fetch` twice returns the same bound function. The proxy binds each function once instead of on every read.

  Breaking:

  - `Sandbox({ css: false }).activate(container)` returns `null` and attaches no shadow root. Before, it attached one, which hid the container's children. `ISandbox.activate` now returns `ShadowRoot | null`.
  - `JsSandbox` strict mode throws on blocked writes instead of warning.
  - `execScript` code runs in a `with` block: it cannot be strict-mode code, and reading an undeclared identifier returns `undefined` instead of throwing.

### Patch Changes

- c131086: Fix `require()` for five packages and give every package the same `dist/` layout.

  In 0.4, `tuvix.js`, `@tuvix.js/core`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/router` pointed `main` and `exports.require` at `dist/index.cjs` and `dist/index.d.cts`, but the build wrote `dist/index.js` and `dist/index.d.ts`. `require('@tuvix.js/core')` threw `Cannot find module`, and TypeScript projects using CommonJS resolution got no types.

  Every package now ships the same layout:

  - `dist/<entry>.cjs` with `dist/<entry>.d.ts` for `require`
  - `dist/<entry>.mjs` with `dist/<entry>.d.mts` for `import`

  `@tuvix.js/vue`, `@tuvix.js/svelte` and `@tuvix.js/angular` use the same layout for their `./server` entry and add `typesVersions`, so TypeScript with `moduleResolution: "node"` finds `@tuvix.js/<adapter>/server` types. Each package also exports `./package.json`.

## 0.4.4

### Patch Changes

- e8f0731: fix: address code review findings in loader, router, and sandbox

  ### @tuvix.js/loader
  - `withRetry`: initialize `lastError` with a fallback error to prevent throwing `undefined` when `retries` is 0 or negative; guarantee at least one attempt via `Math.max(1, retries + 1)`
  - `script-loader`: replace per-call `querySelectorAll` DOM scans with O(1) module-level `Set` caches (`_loadedScripts`, `_loadedStyles`, `_prefetchedResources`); use `CSS.escape` in attribute selectors for correct URL matching with special characters

  ### @tuvix.js/router
  - `getActiveApps`: replace `Array.includes` O(n²) deduplication with a `Set` — no behavior change, better performance with many routes
  - Remove unnecessary `resolvePath()` private wrapper; inline `normalizePath` directly in `push` and `replace`

  ### @tuvix.js/sandbox
  - `CssSandbox.wrap`: wrap `attachShadow` in try/catch and surface a descriptive error instead of letting the browser exception propagate without context

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

## 0.1.3

### Patch Changes

- 9e55cc9: fix: address code review findings across core, router, loader, sandbox, and server
  - **core**: fix validation order in `register()` (name check before duplicate check); fix `updateAppProps()` to only mutate config props after a successful `update()` call; implement real `mouseover`-based hover prefetch strategy instead of a 2-second timeout; add XSS warning to `fallback` type
  - **router**: fix `handleUrlChange()` to run navigation guards for browser back/forward navigation, restoring the previous URL when a guard cancels
  - **loader**: serialize the global-key snapshot + script load + resolve sequence with a module-level mutex to prevent concurrent loads from cross-contaminating UMD global detection; add timeout support to `loadStyle()` to match script loading behaviour
  - **sandbox**: document `execScript()` CSP requirement (`unsafe-eval`) in JSDoc
  - **server**: fix `fetchFragment()` return type to `{html, isError}` so metrics accurately record SSR error counts (previously always recorded 0 errors); add missing `# TYPE` declarations to Prometheus output

## 0.1.2

### Patch Changes

- fix: provide NODE_AUTH_TOKEN to CI pipeline

## 0.1.1

### Patch Changes

- fix: bump versions to trigger CI release flow
