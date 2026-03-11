---
"@tuvix.js/core": patch
"@tuvix.js/router": patch
"@tuvix.js/loader": patch
"@tuvix.js/sandbox": patch
"@tuvix.js/server": patch
---

fix: address code review findings across core, router, loader, sandbox, and server

- **core**: fix validation order in `register()` (name check before duplicate check); fix `updateAppProps()` to only mutate config props after a successful `update()` call; implement real `mouseover`-based hover prefetch strategy instead of a 2-second timeout; add XSS warning to `fallback` type
- **router**: fix `handleUrlChange()` to run navigation guards for browser back/forward navigation, restoring the previous URL when a guard cancels
- **loader**: serialize the global-key snapshot + script load + resolve sequence with a module-level mutex to prevent concurrent loads from cross-contaminating UMD global detection; add timeout support to `loadStyle()` to match script loading behaviour
- **sandbox**: document `execScript()` CSP requirement (`unsafe-eval`) in JSDoc
- **server**: fix `fetchFragment()` return type to `{html, isError}` so metrics accurately record SSR error counts (previously always recorded 0 errors); add missing `# TYPE` declarations to Prometheus output
