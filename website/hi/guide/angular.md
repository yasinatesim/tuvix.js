# With Angular

`@tuvix.js/angular` provides Angular 15+ bindings for Tuvix.js, with first-class
support for Angular 17+ standalone components and SSR hydration.

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
# or pnpm add @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## NgModule (Legacy)

For Angular 15 / 16 or apps that haven't migrated to standalone components:

```ts
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root', // optional, defaults to 'app-root'
});
```

> The `platform` parameter is required so the consumer's Angular version is
> used. This avoids running multiple incompatible Angular runtimes on the
> same page.

If the container already has an element matching `selector` (typical when SSR
markup was injected), the binding reuses it instead of appending a duplicate.

## Standalone Components + SSR (Angular 17+)

For Angular 17+, prefer `createSsrAngularMicroApp` — it calls
`bootstrapApplication` with `provideClientHydration` so SSR markup is
hydrated rather than re-rendered:

```ts
// src/main.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';
import { provideHttpClient } from '@angular/common/http';

export default createSsrAngularMicroApp({
  name: 'about-angular-app',
  component: AboutComponent,
  providers: [provideHttpClient()],
});
```

Pair this with `renderAngularToString` from `@tuvix.js/angular/server`.

## Receiving Props

Angular doesn't have a built-in "update props" channel, so the orchestrator's
`updateAppProps()` writes the latest props to:

```ts
window.__TUVIX_ANGULAR_PROPS__[name] = props;
```

Read them inside an Angular service or component:

```ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TuvixPropsService {
  get<T>(name: string): T | undefined {
    return (window as any).__TUVIX_ANGULAR_PROPS__?.[name];
  }
}
```

```ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<h1>User: {{ userId }}</h1>`,
  standalone: true,
})
export class AppComponent implements OnInit {
  userId = '';

  constructor(private tuvixProps: TuvixPropsService) {}

  ngOnInit() {
    const props = this.tuvixProps.get<{ userId: string }>('admin');
    this.userId = props?.userId ?? '';
  }
}
```

For reactive props, prefer wiring `orchestrator.getEventBus()` to a
`BehaviorSubject` inside a shared service — this gives you fine-grained
change detection on every `updateAppProps()` call.

## Event Bus Integration

```ts
import { Component, OnDestroy } from '@angular/core';
import type { IEventBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'cart-badge',
  template: `<span>{{ count }}</span>`,
  standalone: true,
})
export class CartBadgeComponent implements OnDestroy {
  count = 0;
  private unsub: () => void = () => {};

  constructor() {
    const bus: IEventBus = (window as any).__tuvixBus;
    this.unsub = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
      this.count = itemCount;
    });
  }

  ngOnDestroy() {
    this.unsub();
  }
}
```

> A clean pattern is to expose `orchestrator.getEventBus()` on `window` once
> during shell startup so micro apps can grab it without dependency injection
> across the shell boundary.

## API Surface

| Export | Purpose |
| --- | --- |
| `createAngularMicroApp({ name, module, platform, selector?, compilerOptions?, bootstrap? })` | NgModule micro app |
| `createSsrAngularMicroApp({ name, component, providers?, selector?, bootstrap? })` | Standalone component + SSR / hydration |
| `renderAngularToString(...)` (from `/server`) | SSR render to HTML string |
