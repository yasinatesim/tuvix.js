# @tuvix.js/loader

## 0.5.0

### Minor Changes

- 1ec8e77: Loader-function entries, parallel loads, script types, and style cleanup on unmount.

  - `Entry` accepts a function such as `() => import('./dashboard')`. The loader takes the module it resolves to, or its `default` export, or the module the import registered with `registerModule`. The function receives `{ signal }`, which aborts when the attempt times out.
  - `ModuleLoader` loads different apps in parallel. In 0.4 a module-wide lock made every app wait for the previous one, and one hung script blocked every later app.
  - Concurrent `loadScript`/`loadStyle` calls for one URL share one tag, so two entries that list the same vendor script fetch it once. A failed or timed-out load removes its tag; the retry appends a new one. In 0.4 a retry added a second `<script>` for the same URL.
  - A timeout aborts the attempt: the loader stops waiting, removes the attempt's `<script>` and `<link>` tags, and starts the next retry.
  - `EntryConfig.type: 'module' | 'classic'` sets the script type. Set `'module'` for Vite ES output, which ends in `.js` and loaded as a classic script before. Without it, `.mjs`, `.mts`, `.ts`, `.tsx` and `.jsx` load as modules and other URLs as classic.
  - `EntryConfig.integrity` maps script and style URLs to SRI hashes. The loader writes them to the `<script>`, `<link>` and prefetch tags.
  - `prefetch()` adds `<link rel="modulepreload">` for module scripts and `<link rel="prefetch">` for classic scripts and styles. It skips loader-function entries, because calling them would run the module.
  - `LoaderOptions.globals` works: the loader writes those properties to `window` before an entry's scripts run.
  - `removeStyles(name)` removes an app's stylesheets. Core can call it after unmount so an inactive app's CSS stops applying. A stylesheet another loaded app uses stays. The next `load(name)` adds the styles back and waits for them.
  - `unload(name)` removes the module from the `registerModule` registry when it is the module this loader resolved, so the next load cannot pick up a stale copy.
  - The loader reads the registry through `getRegisteredModule`. For UMD bundles it records which window globals each script defined, at that script's `load` event, and looks only at the globals of the entry's own scripts. Two apps that load at the same time no longer pick up each other's global. A global another app already resolved is skipped until a script assigns it a new value. When one entry's scripts define several globals with `mount`, the loader picks the one named after the app (ignoring case and punctuation) and otherwise fails with the candidate names.
  - `MountContext` gains `name?: string` and `bus?: MicroAppBus`. `MicroAppBus` is a structural `{ on, once, emit, off }` type that `IEventBus` satisfies. `UpdateContext` gains `container?: HTMLElement`.
  - New exports: `normalizeEntry`, and the types `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppBus`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`.
  - `loadScript(url, options)` and `loadStyle(url, options)` take an options object with `type`, `integrity`, `signal` and (for styles) `timeout`. The 0.4 forms `loadScript(url, integrity)` and `loadStyle(url, timeoutMs)` still work.

  Breaking:

  - `LoaderOptions.fetch` and `EntryConfig.html` are gone. The loader never read either field.
  - After `unload(name)`, an app whose `type: 'module'` script registered itself does not load again from the same URL, because browsers run a module script once per URL. Use a loader-function entry or a new URL.
  - `load()` for a cached module reports the real `duration` instead of `0`.

### Patch Changes

- 1ec8e77: Lifecycle runtime fixes for modules mounted in several containers and for containers a host framework removed.

  - The runtime tracks mounted containers per app name. `isMounted(name)` stays true while any container of that app is mounted; unmounting one of two containers no longer flips it to false. `whenMounted(name)` resolves on the first mount, or right away with the earliest container still mounted.
  - `emitLifecycle` dispatches on `document` when the container is no longer in the DOM, for example after React removed an island before the adapter reported `unmounted`. `detail.container` still points at the element, and `onLifecycle` listeners on `document` receive the event once.

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
