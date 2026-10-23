# Migrating to 0.5

0.5 fixes bugs that changed observable behaviour, so some of these fixes break 0.4 code. This page lists every breaking change by package, with the code to change. Upgrade every `tuvix.js` and `@tuvix.js/*` package to `^0.5.0` together; mixing 0.4 and 0.5 adapters on one page is not supported.

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

Projects created with `create-tuvix-app` before 0.5 depend on `^0.1.0`, which never resolves to 0.4 or 0.5. Edit those ranges by hand.

## Core

### The orchestrator uses the global bus

0.4 gave every orchestrator a private bus, separate from `getGlobalBus()`. In 0.5 the orchestrator's bus is `getGlobalBus()` unless you pass `eventBus` options, and `destroy()` leaves the global bus alive.

```ts no-check
// 0.4: two buses; apps listening on getGlobalBus() missed orchestrator events
const orchestrator = createOrchestrator();
orchestrator.getEventBus() === getGlobalBus(); // false
```

```ts
// 0.5
import { createOrchestrator, getGlobalBus } from 'tuvix.js';

const shared = createOrchestrator();
console.log(shared.getEventBus() === getGlobalBus()); // true

const isolated = createOrchestrator({ eventBus: {} }); // private bus, as in 0.4
console.log(isolated.getEventBus() === getGlobalBus()); // false
```

If you exposed the orchestrator's bus on `window` so apps could find it, you can drop that and use the `bus` from the mount context or `getGlobalBus()`.

### Route changes leave manual apps alone

0.4 unmounted an app on the next route change when it had neither `activeWhen` nor a router route, and `mountWhenVisible` apps as well. In 0.5, reconciles only touch apps that `activeWhen` or a route controls. If you relied on a navigation to remove a manually mounted app, unmount it yourself:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true renders in a shadow root

In 0.4 `sandbox` on `register` did nothing. In 0.5 `sandbox: true` mounts the app inside a shadow root and loads its entry `styles` there. Page CSS stops reaching the app, and the app's entry styles stop reaching the page. Remove `sandbox: true` from apps that depend on page styles. See [Sandboxing](/guide/sandbox).

### prefetch: 'hover'

0.4 prefetched every app on the first mouse movement anywhere on the page. 0.5 prefetches an app when the pointer enters, or focus lands on, a same-origin link whose path activates it. Use `'idle'` or `'immediate'` to fetch every app up front.

### OrchestratorConfig.shared is gone

The orchestrator never read `shared`. Delete it, and share dependencies with `@tuvix.js/module-federation` or import maps.

### activeWhen patterns

`activeWhen` strings now use `matchPath`. A query string or hash no longer unmounts an app, `:param` segments work, and characters such as `.` and `(` match literally.

```ts no-check
// 0.4: `.` was a regex wildcard and matched '/v1x0'
activeWhen: '/v1.0/*'
// 0.4: query strings broke matching, so people wrote functions
activeWhen: (path) => path.split('?')[0].startsWith('/dashboard')
```

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*', // also active on /dashboard?tab=1
});
```

## Router

### The '/' route and RouteConfig.exact

Route paths match the whole path everywhere. A `'/'` route now activates only on `/`; in 0.4, `getActiveApps()` treated it as every path while `match()` treated it as exact. `RouteConfig.exact` is gone, because it never changed anything.

```ts no-check
// 0.4
routes: [{ path: '/', app: 'shell-nav' }, { path: '/settings', app: 'settings', exact: true }]
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({
  routes: [
    { path: '/*', app: 'shell-nav' }, // every path
    { path: '/settings', app: 'settings' }, // /settings only
  ],
});
void router;
```

`activeWhen: '/'` on `register` still matches every path, because `activeWhen` strings use prefix matching.

### push and replace add the base

```ts no-check
// 0.4 with base: '/app'
router.push('/app/settings'); // you had to add the base yourself
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({ base: '/app', routes: [] });
await router.push('/settings'); // URL: /app/settings
```

Passing `/app/settings` in 0.5 writes `/app/app/settings`. A guard that cancels back/forward navigation also restores the URL with the base.

### Other router changes

- `base` strips only on a segment boundary. With `base: '/app'`, `/application` stays `/application`.
- `pathToRegex()` returns a cached `RegExp`; do not mutate it. Its second `exact` argument is gone.
- Regex characters in patterns match literally. A `*` in the middle of a pattern matches one segment.
- `matchRoute()` and `isPathActive()` ignore a `#hash` in the path.

## Loader

### Removed options

`LoaderOptions.fetch` and `EntryConfig.html` are gone. The loader never read them; delete them from your config.

```ts no-check
// 0.4
new ModuleLoader({ fetch: myFetch });
orchestrator.register({ name: 'x', entry: { scripts: ['/x.js'], html: '<div></div>' }, container: '#x' });
```

```ts
// 0.5
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({ timeout: 10000 });
void loader;
```

### Module scripts run once per URL

After `unload(name)`, an app whose `type: 'module'` script registered itself does not load again from the same URL, because browsers run a module script once per URL. Use a loader-function entry for apps you unload and reload:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

`load()` for a cached module now reports its real `duration` instead of `0`.

## Module Federation

`federatedEntry` and `createFederatedEntry` return a loader function instead of `{ scripts: [remoteEntry.js] }`. The 0.4 entry loaded the container script and then failed with "no exports found".

```ts no-check
// 0.4
orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }),
  container: '#main',
});
```

```ts
// 0.5
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader, federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry(
    { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
    './App', // exposed module path
  ),
  container: '#main',
  activeWhen: '/dashboard/*',
});

const remotes = createFederatedLoader({
  remotes: [{ name: 'settings', url: 'https://cdn.example.com/settings/remoteEntry.js' }],
  shareScope: {}, // replaces 0.4 `shared`
});

orchestrator.register({
  name: 'settings',
  entry: remotes.createFederatedEntry('settings', './App'),
  container: '#main',
  activeWhen: '/settings/*',
});
```

- `FederatedLoaderConfig.shared` is replaced by `shareScope`. 0.4 never read `shared`.
- `loadRemoteContainer` returns `FederatedContainer` instead of `any`.

## React

- `TuvixReactApp` server HTML now contains Suspense comment markers (`<!--$-->...<!--/$-->`). Render and hydrate with `@tuvix.js/react` 0.5 on both sides.
- `mount` rejects when the first render throws. In 0.4 the error reached React's root error handler and `mount` resolved. The orchestrator now shows the app's `fallback` and calls `onError`.
- `unmount` on a container the module never mounted does nothing. 0.4 cleared it.

## Vue

`update()` no longer writes `app.config.globalProperties.$tuvixProps`. Props are reactive now:

```vue
<!-- 0.4 -->
<template>{{ $tuvixProps.theme }}</template>
```

```vue
<!-- 0.5 -->
<script setup lang="ts">
defineProps<{ theme?: string }>();
</script>

<template>{{ theme }}</template>
```

Descendants can `inject('tuvixProps')`, which returns the same reactive object.

- `VueSsrMicroAppConfig` no longer accepts `ssr`. `createSsrVueMicroApp` sets it.
- `unmount` on a container the module never mounted does nothing.

## Svelte

- Without `ssr`, `createSvelteMicroApp` empties the container before it renders. 0.4 appended Svelte 3/4 components after existing markup. Use `createSsrSvelteMicroApp` to keep and hydrate server markup.
- `unmount` on a container the module never mounted, or whose mount failed, does nothing. 0.4 emptied it. All four adapters now behave this way.
- `renderSvelteToString` no longer falls back to `App.render` when `svelte/server` fails to load. With `render` passed it uses Svelte 5; otherwise it takes the Svelte 5 path when `svelte` exports `mount`, and calls `App.render` only for Svelte 3/4. A Svelte 5 import or render error reaches you.

Svelte 5 components work in 0.5; in 0.4 `createSvelteMicroApp` failed on them. A Svelte 5 `update()` remounts the component unless you pass `SvelteMap` from `svelte/reactivity` in the config, which updates props in place:

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### New config shape

```ts no-check
// 0.4
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AppComponent, // required
  module: AppModule, // only when AppComponent is declared in an NgModule
});
```

`platform` and `compilerOptions` are gone. Remove `import '@angular/compiler'` from your entry; the adapter loads the compiler for JIT components.

### Zoneless by default

Apps run without zone.js unless you pass `zone: true`. On Angular 15-17, DOM events no longer trigger change detection; call `ChangeDetectorRef.detectChanges()` in handlers, or import `zone.js` in your entry and pass `zone: true`. Angular 18+ schedules change detection without zone.js. See [Angular](/guide/angular).

### Props are inputs

`update()` no longer writes `window.__TUVIX_ANGULAR_PROPS__`. Declare `@Input()` properties instead; the adapter sets them with `setInput`.

```ts no-check
// 0.4
ngOnInit() {
  this.userId = (window as any).__TUVIX_ANGULAR_PROPS__?.admin?.userId;
}
```

```ts
// 0.5
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-admin', standalone: true, template: '{{ userId }}' })
export class AdminComponent {
  @Input() userId = '';
}
```

### Other Angular changes

- `createSsrAngularMicroApp` no longer adds `provideClientHydration()`. It re-renders into the server host element.
- `unmount` on a container the module never mounted does nothing.

## Sandbox

- `Sandbox({ css: false }).activate(container)` returns `null` and attaches no shadow root. `ISandbox.activate` returns `ShadowRoot | null`; check for `null` before calling `addStyle`.
- `JsSandbox` strict mode throws a `TypeError` on a blocked write. 0.4 logged a warning and stored the value anyway. Add globals your code writes to `allowedGlobals`.

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Server

- `createServerRenderer().render()` returns `statusCode: 502` when at least one app matched the path and every fragment fetch failed. It still returns 200 when no app matched or one fragment succeeded. `createMiddleware` sends that status. The streaming renderer always sends 200.
- `createMiddleware` and `createStreamingMiddleware` call `next(error)` instead of `next()` when rendering throws, so Express routes the request to your error handler.

## Non-breaking fixes worth knowing

- `require('@tuvix.js/core')` and the other CommonJS entry points work. In 0.4 five packages pointed `require` at files the build never wrote.
- `getGlobalBus()` keeps its instance on `window`, so separately bundled micro apps share one bus.
- Adapters and `defineMicroApp` dispatch `tuvix:mounted`, `tuvix:unmounted` and `tuvix:error`. See [Lifecycle Events](/guide/lifecycle-events).
- A `bootstrap()` that throws runs again on the next mount. 0.4 skipped it from then on.
- `register()` after `start()` mounts the app right away when the current path activates it, and starts observing a `mountWhenVisible` app.
- Every lifecycle failure emits `tuvix:app:error` on the bus with `{ name, error, phase }`. 0.4 emitted it only for load and mount failures.
- `maxListeners` warns with `console.warn` once per event, with or without `debug`.
- `orchestrator.connectRouter()` replaces `setTimeout` + `reconcile()` bridges. See [External Router](/guide/external-router).
