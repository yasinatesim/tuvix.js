---
"@tuvix.js/core": patch
"@tuvix.js/router": patch
"@tuvix.js/event-bus": patch
"@tuvix.js/loader": patch
"@tuvix.js/sandbox": patch
"@tuvix.js/react": patch
"@tuvix.js/vue": patch
"@tuvix.js/svelte": patch
"@tuvix.js/angular": patch
"@tuvix.js/devtools": patch
"@tuvix.js/server": patch
"@tuvix.js/module-federation": patch
"tuvix.js": patch
---

Fix `require()` for five packages and give every package the same `dist/` layout.

In 0.4, `tuvix.js`, `@tuvix.js/core`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/router` pointed `main` and `exports.require` at `dist/index.cjs` and `dist/index.d.cts`, but the build wrote `dist/index.js` and `dist/index.d.ts`. `require('@tuvix.js/core')` threw `Cannot find module`, and TypeScript projects using CommonJS resolution got no types.

Every package now ships the same layout:

- `dist/<entry>.cjs` with `dist/<entry>.d.ts` for `require`
- `dist/<entry>.mjs` with `dist/<entry>.d.mts` for `import`

`@tuvix.js/vue`, `@tuvix.js/svelte` and `@tuvix.js/angular` use the same layout for their `./server` entry and add `typesVersions`, so TypeScript with `moduleResolution: "node"` finds `@tuvix.js/<adapter>/server` types. Each package also exports `./package.json`.
