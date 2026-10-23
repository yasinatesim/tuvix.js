---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angular Bindings"
  description="Turns an Angular 15+ component into a Tuvix.js micro app: zoneless by default, one application per container, props as component inputs, and server rendering with styles."
  icon="🔺"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Add `@angular/compiler` when your components are not AOT-compiled (JIT), and `@angular/platform-server` plus `@angular/compiler` on the server when you call `renderAngularToString`. The client adapter needs Angular 15 or newer; the server renderer needs Angular 16 or newer.

## When to use it

Use this package when an Angular component should run as one micro app among others: the orchestrator mounts it into a container on a route, passes props, updates them, and unmounts it on the way out. Several Angular apps, or several copies of one, can share a page because each mount gets its own Angular application and its own host element. The adapter never loads zone.js, so an Angular island does not patch `Promise` or `addEventListener` for the React or Vue apps next to it.

If Angular owns the whole page, bootstrap it the usual way with `bootstrapApplication`. You gain nothing from the adapter there.

## Quick start

A standalone component with an input:

```ts
// greeting.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

The micro app entry wraps it:

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

The shell registers the app and starts the orchestrator:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'greeting',
  entry: () => import('./greeting-app'),
  container: '#greeting',
  activeWhen: '/hello',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: setInput('name', 'Grace') and one change detection pass.
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

The adapter creates an `<app-greeting>` host element inside `#greeting`, and after the update it shows "Hello Grace".

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | App name. The adapter registers the module under it with `registerModule` from `@tuvix.js/loader`. |
| `component` | `Type<C>` | required | Root component. Standalone components work on their own. |
| `module` | `Type<unknown>` | none | NgModule that declares `component`. The adapter adds its providers with `importProvidersFrom`. |
| `providers` | `AngularProviders` | `[]` | Environment providers for the application, such as `provideHttpClient()`. |
| `selector` | `string` | element part of the component selector, else `'div'` | Tag name of the host element the adapter creates inside the container. |
| `zone` | `boolean` | `false` | Use zone.js change detection. Your client entry must import `zone.js` first. |
| `ssr` | `boolean` | `false` | Adopt markup from `renderAngularToString`. See `createSsrAngularMicroApp`. |
| `bootstrap` | `() => void \| Promise<void>` | none | One-time setup. The module's `bootstrap()` awaits it. |

Each `mount({ container, props })`:

1. Loads `@angular/compiler` first when `component` or `module` has no AOT definition (`ɵcmp` / `ɵmod`), then `@angular/core` and `@angular/platform-browser`. It only helps when the adapter is the first code to load an Angular package other than `@angular/core`. If your component files import `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` or another Angular library, those packages evaluate before the adapter runs and fail with "JIT compilation failed". Keep `import '@angular/compiler'` as the first line of your client entry, or build AOT.
2. Calls `createApplication({ providers })` with the change detection providers for your Angular version (see [Change detection](#change-detection)), the module providers, and `providers`.
3. Creates the host element (`<app-greeting>` for selector `'app-greeting'`, `<div>` for an attribute selector like `'[card]'`), puts it in the container, and bootstraps the component into it.
4. Sets props as component inputs with `ComponentRef.setInput` before the first change detection, so `ngOnInit` already sees them. On Angular versions without `ComponentFactoryResolver` the inputs are set right after bootstrap, followed by a tick.
5. Dispatches `tuvix:mounted` on the container. A failure dispatches `tuvix:error` and rejects with the original error.

`update({ props, container? })` writes the new values with `setInput` and runs `appRef.tick()`, for one container or for every mount when you leave `container` out. This renders on every Angular version, zoneless or not.

`unmount({ container })` destroys the application, empties the container and dispatches `tuvix:unmounted`.

A component declared in an NgModule:

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
import { AdminModule } from './admin/admin.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  module: AdminModule,
  providers: [provideHttpClient()],
});
```

### `createSsrAngularMicroApp`

```ts no-check
function createSsrAngularMicroApp<C>(config: AngularSsrMicroAppConfig<C>): MicroAppModule;
```

Same options as `createAngularMicroApp` without `ssr`; it behaves like `createAngularMicroApp({ ...config, ssr: true })`. Use it on the client for islands that the server rendered with `renderAngularToString`.

When the container holds server markup, the adapter reuses the host element if it is a direct child of the container with the expected tag. Angular renders into that element, replacing the server's children. Once Angular has added the component styles to `<head>`, the adapter removes the inlined server `<style>` tags and anything else next to the host. `tuvix:mounted` reports `hydrated: true`. An empty container gets a normal client render.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString`

```ts no-check
// import from '@tuvix.js/angular/server'
function renderAngularToString(component: unknown, options?: AngularSsrOptions): Promise<string>;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | Input values keyed by input name (or alias). Set before the first change detection, like the client mount. Keys that are not inputs are skipped. |
| `providers` | `AngularProviders` | `[]` | Environment providers for the server render. |
| `appId` | `string` | `'ng'` (Angular's default) | Angular `APP_ID`. Angular writes it into the `ng-app-id` attribute of the style tags. |
| `document` | `string` | an empty document with the host element in `<body>` | HTML document to render into. It must contain the host element. |
| `selector` | `string` | element part of the component selector, else `'app-root'` | Host element tag for the default document; Angular bootstraps into the element it matches. |

Renders a standalone component with `renderApplication` from `@angular/platform-server` and returns one fragment: the component `<style>` tags from the rendered `<head>`, followed by the inner HTML of `<body>`. Put the fragment in the container that `createSsrAngularMicroApp` mounts into; the island has its styles on first paint.

`props` reach the component through `setInput` before the first change detection, the same way the client `mount` sets them, so `ngOnInit` sees them on both sides. Pass the same object to the server render and to the client mount and both produce the same markup.

The render runs zoneless and never patches the global `Promise`. It always loads `@angular/compiler` first, because Node loads the Angular packages from `node_modules` without the Angular linker. Call it from a server function, not from code that also runs in the browser: in a browser it returns `''`.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### Types

| Type | Meaning |
| --- | --- |
| `AngularMicroAppConfig<C>` | Options of `createAngularMicroApp`. |
| `AngularSsrMicroAppConfig<C>` | `AngularMicroAppConfig<C>` without `ssr`; options of `createSsrAngularMicroApp`. |
| `AngularSsrOptions` | Options of `renderAngularToString`. Import the type from `@tuvix.js/angular`. |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`, what `createApplication` and `bootstrapApplication` accept. |

## Change detection

The adapter never imports zone.js. Unless you pass `zone: true`, it picks the zoneless setup your Angular version supports:

| Angular | Provider the adapter adds | What triggers change detection |
| --- | --- | --- |
| 20 and newer | `provideZonelessChangeDetection()` | Template event listeners, signal writes, `markForCheck()`, `AsyncPipe`, `setInput` |
| 18 and 19 | `provideExperimentalZonelessChangeDetection()` | Same as 20 |
| 15 to 17 | `NgZone` replaced by `ɵNoopNgZone` | Nothing on its own. `update()` from the host still renders. |

On Angular 18 and newer, a plain field you change in a `setTimeout` or `fetch` callback does not re-render the template. Keep that state in a signal, or call `ChangeDetectorRef.markForCheck()`:

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<time>{{ now() }}</time>`,
})
export class ClockComponent {
  readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
  }
}
```

On Angular 15 to 17, clicks and other DOM events do not trigger change detection either. Call `ChangeDetectorRef.detectChanges()` after you change state:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="increment()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  increment(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

To keep zone-based change detection, import zone.js in your client entry before the adapter mounts, and pass `zone: true`. The adapter then leaves Angular's default `NgZone` in place and bootstraps inside it:

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.js patches `Promise`, timers and DOM listeners for the whole page, including the other frameworks' apps.

## Server rendering

1. On the server, call `renderAngularToString(Component)` and put the fragment in the container element.
2. On the client, export `createSsrAngularMicroApp({ name, component })` from the island entry.
3. The orchestrator mounts the app into that container. Angular renders into the server's host element and the adapter drops the server styles.

The adapter re-renders over the server DOM. It does not use Angular's non-destructive hydration (`provideClientHydration`), because that hydration expects a page Angular rendered from top to bottom: it looks for Angular's hydration marker comment as a direct child of `<body>` and for `ngh` annotations on the components. An island inside a page that React, Vue or a plain server template rendered has neither. The trade-off: the visible markup and styles arrive with the HTML, but state inside the island (focus, a typed-in value, scroll position) resets when Angular takes over, and clicks before that point do nothing.

Pass the same props to the server render and to the client mount, so the client render matches the server markup. The render does not wait for HTTP requests or timers the component starts: load the data first and hand it over as props.

```ts
// server.ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<{ html: string; props: { text: string } }> {
  const response = await fetch('https://api.example.com/about');
  const props = { text: await response.text() };
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props });
  return { html, props };
}
```

Send `props` to the browser with the page (for example as JSON in a `<script type="application/json">` tag) and register the app with them:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

For values that are not inputs, such as an API base URL, pass `providers` on both sides instead.

## Edge cases

- `zone: true` without zone.js on the page rejects the mount with `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` and dispatches `tuvix:error`.
- Props whose keys are not component inputs are skipped, so Angular does not log NG0303. Inputs are matched by their public name (the alias, if you set one).
- An input present in the old props and missing from the new props is set to `undefined`. The field initializer (`name = ''`) does not run again.
- `update` before the mount finishes stores the props; the pending bootstrap uses the latest ones. `update({ container })` for a container this module has not mounted does nothing.
- `unmount` while `mount` is still loading Angular cancels it: the application is destroyed, the container stays empty, and no `tuvix:mounted` fires. If the cancel arrives after bootstrap, you get `tuvix:mounted` followed by `tuvix:unmounted`.
- A second `mount` on the same container destroys the first application before it bootstraps the new one.
- `unmount` on a container this module never mounted does nothing.
- If destroying the application throws, the adapter empties the container, dispatches `tuvix:error` and rethrows.
- With SSR, a container whose markup has no direct child matching the host tag gets a fresh host element. `hydrated` is still `true`, because the container held markup.
- On the server, an attribute-selector component (`'[card]'`) falls back to an `<app-root>` host, which the selector does not match. Pass a `document` whose `<body>` holds a matching element.
- On Angular 16, `@angular/platform-server` copies Domino's DOM classes (`Event`, `Node` and others) onto the Node global object during a server render. Angular does this, not the adapter.
- JIT components without the Angular compiler plugin still need TypeScript `experimentalDecorators`; Angular does not support the standard decorator proposal.

## What it does not do

- It does not load zone.js or any other polyfill.
- It does not add `provideClientHydration()` and does not perform non-destructive hydration.
- It does not send server props to the browser. Serialize them into the page yourself and pass the same object to the client mount.
- It does not wait for HTTP calls, timers or `PendingTasks` the component starts during a server render.
- It does not keep the server's DOM nodes, focus or form state when the client takes over.
- It does not give the component a Tuvix props service or bus. Declare inputs for props, and use [`@tuvix.js/event-bus`](/packages/event-bus) to talk to other apps.

## Migrating from 0.4

**`createAngularMicroApp` takes a component.** `platform` and `compilerOptions` are gone. Pass the root component as `component` and, if it is declared in an NgModule, the module as `module`.

```ts no-check
// 0.4
createAngularMicroApp({
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

export default createAngularMicroApp({ name: 'admin', component: AppComponent, module: AppModule });
```

**Props are inputs.** `update()` no longer writes `window.__TUVIX_ANGULAR_PROPS__`. Delete services that read that global and declare `@Input()` fields with the prop names instead.

**Zoneless by default.** Apps run without zone.js unless you pass `zone: true`. On Angular 15 to 17, DOM events no longer trigger change detection; call `ChangeDetectorRef.detectChanges()` in handlers or opt into zone.js. You can drop `provideZonelessChangeDetection()` from your entry. Drop `import '@angular/compiler'` only when your component files import nothing from Angular except `@angular/core`; otherwise keep it as the first line of the client entry, or build AOT.

**No automatic `provideClientHydration()`.** `createSsrAngularMicroApp` re-renders over the server markup. Leave `provideClientHydration()` out of its `providers`.

**`appId` takes effect.** In 0.4, `renderAngularToString` accepted `appId` and ignored it. It now sets Angular's `APP_ID`, so the `ng-app-id` attribute of the style tags changes from `ng` to your value.

**Host element.** On the client and the server, the host tag comes from the component selector instead of a fixed `'app-root'`, and the client adapter creates it inside the container. `unmount` on a container the module never mounted no longer clears it.

See the [Angular guide](/guide/angular) for a full app.
