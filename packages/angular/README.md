# @tuvix.js/angular

> Angular 15+ bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Add `@angular/compiler` for JIT components, and `@angular/platform-server` plus `@angular/compiler` on the server for `renderAngularToString` (Angular 16+).

## Quick Start

```ts
import { Component, Input } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

The adapter registers the module with `registerModule` from `@tuvix.js/loader`. Props from the orchestrator become component inputs:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | App name, registered with `registerModule` |
| `component` | `Type<C>` | required | Root component |
| `module` | `Type<unknown>` | none | NgModule that declares `component`; its providers are added with `importProvidersFrom` |
| `providers` | `AngularProviders` | `[]` | Environment providers, such as `provideHttpClient()` |
| `selector` | `string` | element part of the component selector, else `'div'` | Host element tag name |
| `zone` | `boolean` | `false` | Use zone.js; your entry must import `zone.js` first |
| `ssr` | `boolean` | `false` | Adopt markup from `renderAngularToString` |
| `bootstrap` | `() => void \| Promise<void>` | none | One-time setup |

- Each mount calls `createApplication` and bootstraps the component into its own host element inside the container, so two Angular apps (or two copies of one) never collide on one `app-root`.
- Props are set with `ComponentRef.setInput` before the first change detection, so `ngOnInit` sees them. Keys that are not inputs are skipped.
- `update({ props, container? })` sets the new inputs and runs `appRef.tick()` for one container or every mount. Inputs missing from the new props reset to `undefined`.
- JIT components (no `ɵcmp`) get `@angular/compiler` loaded before `@angular/platform-browser`. It only helps when the adapter is the first code to load an Angular package other than `@angular/core`. If your component files import `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` or another Angular library, those packages evaluate before the adapter runs and fail with "JIT compilation failed". Keep `import '@angular/compiler'` as the first line of your client entry, or build AOT.
- `unmount` destroys the application, empties the container and dispatches `tuvix:unmounted`. Called while `mount` is still loading, it cancels the mount.

### `createSsrAngularMicroApp(config)`

Same as `createAngularMicroApp({ ...config, ssr: true })`. When the container holds server markup, Angular renders into the server's host element and the adapter removes the inlined server `<style>` tags. `tuvix:mounted` reports `hydrated: true`.

This re-renders over the server DOM. Angular's non-destructive hydration (`provideClientHydration`) needs a hydration marker comment directly under `<body>`, which an island inside another page cannot provide, so the adapter does not add it.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString(component, options?)` from `@tuvix.js/angular/server`

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | Providers for the server render |
| `appId` | `string` | `'ng'` | Angular `APP_ID` |
| `document` | `string` | empty document with the host element | Document to render into |
| `selector` | `string` | element part of the component selector, else `'app-root'` | Host tag for the default document |
| `props` | `Record<string, unknown>` | `{}` | Values for the component inputs, set before the first change detection |

Returns the component `<style>` tags followed by the body markup. It runs zoneless, never patches `Promise`, and does not wait for HTTP requests the component starts. Call it from a server function; in a browser it returns `''`.

`props` works like the client props: keys are input names (or aliases), keys that are not inputs are skipped, and `ngOnInit` sees the values. Pass the same object to the server render and to `mount` so both sides render the same markup.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// Client: aboutApp.mount({ container, props })
```

### Types

`AngularMicroAppConfig<C>`, `AngularSsrMicroAppConfig<C>`, `AngularSsrOptions`, `AngularProviders` (all from `@tuvix.js/angular`).

## Change Detection

The adapter never imports zone.js. Without `zone: true` it adds `provideZonelessChangeDetection()` on Angular 20+, `provideExperimentalZonelessChangeDetection()` on 18-19, and replaces `NgZone` with `ɵNoopNgZone` on 15-17.

- Angular 18+: event listeners, signals, `markForCheck()` and `AsyncPipe` schedule change detection. A plain field changed in a timer or `fetch` callback does not; use a signal or `markForCheck()`.
- Angular 15-17: DOM events do not trigger change detection. Call `ChangeDetectorRef.detectChanges()` after changing state, or pass `zone: true`.

## Edge Cases

- `zone: true` without zone.js loaded rejects the mount and dispatches `tuvix:error`.
- `unmount` on a container this module never mounted does nothing.
- On Angular 16, `@angular/platform-server` copies Domino's DOM classes (`Event`, `Node`, ...) onto the Node global object during a server render. Angular does this, not the adapter.
- Attribute-selector components need a `document` with a matching host element on the server.

## What It Does Not Do

- It does not load zone.js, add `provideClientHydration()`, or keep server DOM nodes and form state.
- It does not write `window.__TUVIX_ANGULAR_PROPS__`; declare inputs.

Full documentation: [tuvix.js.org/packages/angular](https://tuvix.js.org/packages/angular)

## License

MIT
