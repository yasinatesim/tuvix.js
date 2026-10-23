# @tuvix.js/router

## 0.5.0

### Minor Changes

- 5d40f9c: One shared path matcher, link interception, and `base` on navigation.

  - `matchPath(pattern, path, { end? })` returns `{ matched, params }`. It drops `?query` and `#hash`, ignores a trailing slash, captures `:param` segments (URI-decoded) and treats `/*` as "this path and everything below it". By default `/docs` also matches `/docs/intro` but not `/docsify`, and `'/'` matches every path. Pass `{ end: true }` for a full match. Core `activeWhen` and the server package use it, so all three agree on what a pattern means.
  - The matcher compiles each pattern once and caches it. In 0.4 it rebuilt the `RegExp` on every match.
  - `interceptLinks({ navigate, root?, base?, shouldIntercept?, prefetch? })` turns same-origin link clicks into `navigate(path)` calls and returns a cleanup function. It skips modified clicks (Ctrl, Meta, Shift, Alt), non-primary buttons, clicks another handler prevented, links with a `target` other than `_self`, `download`, `rel="external"` or `data-tuvix-reload`, links to another origin or outside `base`, and hash-only links on the current path. `prefetch(path)` runs on pointerenter or focus, once per path.
  - `interceptLinks` follows the event's composed path, so it handles links inside open shadow roots. It ignores SVG `<a>` elements, whose `href` is not a URL string. `rel` must contain the token `external` to skip a link; `rel="external-help"` does not count.
  - `resolveLink(event, { base? })` returns `{ anchor, url, path }` for the same-origin HTML link an event happened on, or `null` when the browser should handle it. `interceptLinks` and the core orchestrator's hover prefetch both use it.
  - New exports: `matchPath`, `interceptLinks`, `resolveLink`, and the types `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions`.

  Breaking:

  - `push()` and `replace()` prefix the configured `base`. With `base: '/app'`, `push('/x')` now writes `/app/x`; 0.4 wrote `/x`. Pass paths relative to `base`. A guard that cancels a back/forward navigation restores the URL with the base too.
  - `base` strips only on a segment boundary: with `base: '/app'`, the router reads `/application` as `/application`, not `/lication`.
  - `pathToRegex()` returns a cached `RegExp`; do not mutate it. Its second `exact` argument is gone; it never changed the result.
  - `RouteConfig.exact` is gone. 0.4 accepted it and ignored it. Route paths match the whole path; end a path with `/*` to match sub-paths.
  - A `'/'` route activates only on `/`. In 0.4 `getActiveApps()` and `isPathActive()` treated `'/'` as "every path" while `match()` treated it as exact; now all three agree. Use `'/*'` for a route that matches every path. Core `activeWhen: '/'` keeps matching every path, because `activeWhen` strings use prefix matching.
  - Regex characters in patterns match literally. A `*` segment in the middle of a pattern matches one path segment; 0.4 passed it into the regex as a quantifier.
  - `matchRoute()` and `isPathActive()` ignore a `#hash` in the path.

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
