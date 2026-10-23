# create-tuvix-app

## 0.2.0

### Minor Changes

- 1df3ff8: Scaffold projects against the 0.5 release.

  - Generated `package.json` files depend on `^0.5.0` for `tuvix.js` and every `@tuvix.js/*` adapter. Before, the CLI wrote `^0.1.0`, so new projects installed a 0.1 release without the 0.4 and 0.5 fixes.
  - The `angular-app` template depends on `@tuvix.js/angular` and exports `createSsrAngularMicroApp({ name, component })` from `src/main.ts`. Before, it depended on `@tuvix.js/core`, bootstrapped Angular by hand, and never destroyed the Angular app on unmount.
  - The `angular-app` template targets Angular 20 without zone.js. It adds `@angular/common`, `@angular/compiler`, `rxjs` and `tslib` to `dependencies`, which Angular needs at runtime when Vite serves JIT components. `src/main.ts` imports `@angular/compiler` first, so components that import `@angular/common`, forms or router compile.
  - The `vue-app` template builds. It adds `@vitejs/plugin-vue@^5.2` and a `vite.config.ts` that registers it, and in TypeScript mode a `src/vite-env.d.ts` that declares `*.vue` modules. `App.vue` reads props with `inject(TUVIX_PROPS_KEY)`. Before, Vite had no Vue plugin, and the TypeScript `App.vue` called `defineProps<Record<string, unknown>>()`, which the Vue compiler rejects.
  - The `react-app` template adds `@vitejs/plugin-react@^4.3` and a `vite.config.ts` that registers it. Before, Vite compiled the JavaScript template's `App.jsx` to `React.createElement` calls with no `React` import, so the app threw `React is not defined` at runtime.
  - The `svelte-app` template targets Svelte 5: `svelte@^5`, `@sveltejs/vite-plugin-svelte@^5`, a `svelte.config.js` with `vitePreprocess()`, and in TypeScript mode `svelte-check@^4` with a `check` script and `src/vite-env.d.ts`. `App.svelte` reads props with `$props()`, and `src/main` passes `SvelteMap` from `svelte/reactivity` to `createSvelteMicroApp`, so `update()` re-renders the component in place instead of remounting it.
  - `create-tuvix-app --version` prints the version from the CLI's `package.json`. Before, it always printed `v0.1.0`.

## 0.1.3

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
