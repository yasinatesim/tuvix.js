# @tuvix.js/angular

> Angular 15+ bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
# or pnpm add @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## Quick Start (NgModule, legacy)

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root', // optional, default 'app-root'
});
```

The returned module is auto-registered on `window.__TUVIX_MODULES__['admin']`.

> **Why is `platform` a parameter?** Angular doesn't allow multiple instances
> of `platformBrowserDynamic` in the same page. By taking it as an argument,
> the consumer guarantees the correct version is used per micro app.

## Standalone Components + SSR (Angular 17+)

For Angular 17+ standalone components, use `createSsrAngularMicroApp` — it
calls `bootstrapApplication` with `provideClientHydration` so SSR markup is
hydrated rather than re-rendered:

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({
  name: 'about-angular-app',
  component: AboutComponent,
  // providers: [provideHttpClient(), ...],   // optional
  // selector: 'app-root',                     // optional
});
```

If the container already contains an element matching `selector` (typical when
SSR markup is injected), it is reused; otherwise a new one is created. This
prevents duplicate `<app-root>` siblings.

Pair this with `renderAngularToString` from `@tuvix.js/angular/server`.

## Updating Props

Angular doesn't have a built-in "update props" channel, so the orchestrator's
`updateAppProps()` writes the latest props to:

```ts
window.__TUVIX_ANGULAR_PROPS__[name] = props;
```

Read them inside an Angular service or component:

```ts
@Injectable({ providedIn: 'root' })
export class TuvixPropsService {
  get<T>(name: string): T | undefined {
    return (window as any).__TUVIX_ANGULAR_PROPS__?.[name];
  }
}
```

For reactive props, prefer wiring `orchestrator.getEventBus()` to a `BehaviorSubject`
inside a shared service.

## API Surface

| Export | Purpose |
| --- | --- |
| `createAngularMicroApp({ name, module, platform, selector?, compilerOptions?, bootstrap? })` | NgModule micro app |
| `createSsrAngularMicroApp({ name, component, providers?, selector?, bootstrap? })` | Standalone component + SSR / hydration |
| `renderAngularToString(...)` (from `/server`) | SSR render to HTML string |

## License

MIT
