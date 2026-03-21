---
"@tuvix.js/svelte": patch
---

## Fix: `svelte/server` CJS static resolution & Svelte 4 hydration

### `renderSvelteToString` — CJS build fix

`dist/server.js` contained `await import('svelte/server')` as a literal string.
Vite/Rollup's `@rollup/plugin-commonjs` statically scans all `import()` literals in CJS
files — even inside `try/catch` — and fails with `Missing "./server" specifier in "svelte" package`
when Svelte 4 is installed (Svelte 4 has no `svelte/server` export).

Fix: replaced with `new Function('m', 'return import(m)')` so the specifier is opaque
to static analyzers. The Svelte 5 path works as before; Svelte 3/4 falls through to
`App.render()` as intended. No stub file or consumer-side alias needed.

### Hydration note

Svelte 4 consumers must compile components with `hydratable: true` (via the Svelte Vite
plugin `compilerOptions`) for `new App({ hydrate: true })` to work at runtime.
