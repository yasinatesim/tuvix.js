# With Angular

`@tuvix.js/angular` bootstraps an Angular component as a micro app, without zone.js by default. It also renders standalone components to HTML on the server.

Supports Angular 15 and later. `renderAngularToString` needs Angular 16 or later with `@angular/platform-server`.

## Install

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## Turn a component into a micro app

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin.component';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  providers: [provideHttpClient()],
});
```

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | Required. Must match the registered app name. |
| `component` | `Type<C>` | Required. Root component, standalone or declared in `module`. |
| `module` | `Type<unknown>` | NgModule that declares `component`. Its providers are imported with `importProvidersFrom`. |
| `providers` | `Array<Provider \| EnvironmentProviders>` | Environment providers. |
| `selector` | `string` | Tag of the host element. Default: the element part of the component selector, or `div`. |
| `zone` | `boolean` | Use zone.js change detection. Default `false`. |
| `ssr` | `boolean` | Adopt markup from `renderAngularToString`. `createSsrAngularMicroApp` sets it. |
| `bootstrap` | `() => void \| Promise<void>` | Runs once before the first mount. |

Each mount calls `createApplication` and bootstraps the component into its own host element inside the container. Two Angular apps on one page, or one module in two containers, do not collide on a shared `app-root`.

When the component has no compiled `ɵcmp` (JIT), the adapter loads `@angular/compiler` before `@angular/platform-browser`. It only helps when the adapter is the first code to load an Angular package other than `@angular/core`. If your component files import `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` or another Angular library, those packages evaluate before the adapter runs and fail with "JIT compilation failed". Keep `import '@angular/compiler'` as the first line of your client entry, or build AOT.

## Inputs from props

Declare props as component inputs:

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `<h1>Admin for {{ userId }}</h1>`,
})
export class AdminComponent {
  @Input() userId = '';
}
```

- Mount sets inputs with `ComponentRef.setInput` before the first change detection, so `ngOnInit` sees them.
- `update({ props })` sets the new values and runs change detection. With `container`, it updates only that mount.
- Keys that are not inputs are skipped. Inputs missing from the new props reset to `undefined`.

## Change detection without zone.js

The adapter never imports zone.js, so it does not patch `Promise`, timers or DOM events in the page or on the server. It picks the provider by Angular version:

| Angular | Provider | DOM events trigger change detection |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | yes |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | yes |
| 15-17 | `NgZone` replaced with a no-op zone | no |

On Angular 15-17 nothing runs change detection after a click. Call `detectChanges()` in your handlers:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="add()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  add(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

To keep zone-based change detection, import `zone.js` at the top of your client entry and pass `zone: true`. Without zone.js loaded, `mount` rejects.

## Server rendering

```ts
// server-only module
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<string> {
  return renderAngularToString(AboutComponent, { appId: 'about', props: { userId: '42' } });
}
```

```ts
// client
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export const about = createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` returns the component's `<style>` tags followed by the host element, so the island is styled on first paint. It runs zoneless.
- `props` sets component inputs before the first change detection, as `mount` does on the client. Keys that are not inputs are skipped. Pass the same props to the island on the client, or hydration shows different content.
- It does not wait for HTTP requests or timers the component starts. Load data first and provide it.
- Call it from server code. In the browser it returns `''`.

On the client, `createSsrAngularMicroApp` renders into the server's host element, then removes the inlined server `<style>` tags once Angular added its own. The `tuvix:mounted` event reports `hydrated: true`. This replaces the server DOM. Angular's non-destructive hydration needs a marker directly under `<body>`, which an island inside another page cannot provide, so the adapter does not add `provideClientHydration()`.

## Event bus

```ts
import { Component, OnDestroy, signal } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: `<span>{{ count() }}</span>`,
})
export class CartBadgeComponent implements OnDestroy {
  readonly count = signal(0);
  private readonly off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) =>
    this.count.set(itemCount),
  );

  ngOnDestroy(): void {
    this.off();
  }
}
```

Signals schedule change detection on Angular 18+ zoneless. On 15-17, call `ChangeDetectorRef.detectChanges()` after `set`.

## What the adapter does not do

- It does not load zone.js or `@angular/localize`. Import them in your entry when you need them.
- It does not hydrate non-destructively; see above.
- It does not share state between mounts. Each mount is its own Angular application with its own root injector, so a `providedIn: 'root'` service exists once per mount.

## API

| Export | Purpose |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Angular micro app module |
| `createSsrAngularMicroApp(config)` | Same with `ssr: true` |
| `renderAngularToString(component, options?)` from `@tuvix.js/angular/server` | Styles + host element HTML |
