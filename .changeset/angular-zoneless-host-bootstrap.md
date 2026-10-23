---
"@tuvix.js/angular": minor
---

Angular adapter: zoneless by default, per-container apps, inputs from props, and server output with styles.

- Apps run without zone.js by default. The adapter adds `provideZonelessChangeDetection()` on Angular 20+, `provideExperimentalZonelessChangeDetection()` on Angular 18-19, and replaces `NgZone` with `ɵNoopNgZone` on Angular 15-17. It never imports zone.js, so the global `Promise` stays untouched in the browser and in Node. Pass `zone: true` to keep zone-based change detection; your client entry must import `zone.js` first, or mount rejects.
- Each mount calls `createApplication` and bootstraps the component into a host element inside its container. Two Angular apps on one page no longer collide on the first `app-root`, and one module can mount into several containers.
- Props reach the component through `ComponentRef.setInput`. Mount sets them before the first change detection, so `ngOnInit` sees them. `update({ props })` writes the new values and runs change detection; pass `container` to update one mount. Keys that are not component inputs are skipped. Inputs missing from the new props reset to `undefined`.
- When the component is JIT (no compiled `ɵcmp`), the adapter loads `@angular/compiler` before `@angular/platform-browser`. It only helps when the adapter is the first code to load an Angular package other than `@angular/core`. If your component files import `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` or another Angular library, those packages evaluate before the adapter runs and fail with "JIT compilation failed". Keep `import '@angular/compiler'` as the first line of your client entry, or build AOT.
- `createSsrAngularMicroApp` renders into the host element from `renderAngularToString` and removes the inlined server `<style>` tags after Angular adds its own. The `mounted` event reports `hydrated: true`. This replaces the server DOM; it is not Angular's non-destructive hydration.
- Mount dispatches `tuvix:mounted`, unmount dispatches `tuvix:unmounted`, and a failure dispatches `tuvix:error` and rejects. An unmount that arrives while mount is still loading Angular waits for it and leaves an empty container. The adapter registers through `registerModule` from `@tuvix.js/loader`.
- `renderAngularToString` runs zoneless, returns the component `<style>` tags from the rendered `<head>` before the body markup, derives the host tag from the component selector, and applies `appId` as Angular's `APP_ID`. It does not wait for HTTP requests the component starts. Call it from a server function; in a browser it returns `''`.
- `renderAngularToString` forwards the `BootstrapContext` that `renderApplication` passes on Angular 18.2.21+, 19.2.15+ and 20.3+. Without it, those versions throw NG0401 "Missing Platform".
- `renderAngularToString(component, { props })` sets component inputs on the server before the first change detection, like the client `mount`, so `ngOnInit` sees them on both sides. Keys that are not inputs are skipped. Pass the same props to the server render and to `mount` and both render the same markup. Calls without `props` render as before.
- If Angular throws while `unmount` destroys the app, the adapter still empties the container and dispatches `tuvix:unmounted` after `tuvix:error`, so `isMounted(name)` turns false. `unmount` then rejects with Angular's error.
- Peer dependencies now list `@angular/platform-browser` (>=15), plus `@angular/compiler` (>=15) and `@angular/platform-server` (>=16) as optional peers.

Breaking:

- Behaviour change: apps run zoneless unless you pass `zone: true`. On Angular 15-17, DOM events no longer trigger change detection on their own; call `ChangeDetectorRef.detectChanges()` in handlers or opt into zone.js.
- `createAngularMicroApp` takes `{ name, component, module?, providers?, selector?, zone?, ssr? }`. The `platform` and `compilerOptions` fields are gone. Pass the root component as `component` and the NgModule that declares it as `module`; the adapter imports the module's providers with `importProvidersFrom`.
- `update()` no longer writes `window.__TUVIX_ANGULAR_PROPS__`. Declare component inputs instead.
- `createSsrAngularMicroApp` no longer adds `provideClientHydration()`.
- `unmount()` on a container this module never mounted does nothing. Before, it cleared the container.
