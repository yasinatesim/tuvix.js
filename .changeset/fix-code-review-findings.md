---
"@tuvix.js/loader": patch
"@tuvix.js/router": patch
"@tuvix.js/sandbox": patch
---

fix: address code review findings in loader, router, and sandbox

### @tuvix.js/loader

- `withRetry`: initialize `lastError` with a fallback error to prevent throwing `undefined` when `retries` is 0 or negative; guarantee at least one attempt via `Math.max(1, retries + 1)`
- `script-loader`: replace per-call `querySelectorAll` DOM scans with O(1) module-level `Set` caches (`_loadedScripts`, `_loadedStyles`, `_prefetchedResources`); use `CSS.escape` in attribute selectors for correct URL matching with special characters

### @tuvix.js/router

- `getActiveApps`: replace `Array.includes` O(n²) deduplication with a `Set` — no behavior change, better performance with many routes
- Remove unnecessary `resolvePath()` private wrapper; inline `normalizePath` directly in `push` and `replace`

### @tuvix.js/sandbox

- `CssSandbox.wrap`: wrap `attachShadow` in try/catch and surface a descriptive error instead of letting the browser exception propagate without context
