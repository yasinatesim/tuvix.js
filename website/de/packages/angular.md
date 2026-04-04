---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angular Bindings"
  description="Angular 15+ bindings for Tuvix.js. NgModule, service injection, and RxJS-based event bus integration."
  icon="🔺"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## API

### `createAngularMicroApp(options)`

Creates an Angular micro-application instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Unique name for the micro-app |
| `module` | `any` | Yes | The root Angular NgModule |
| `platform` | `() => any` | Yes | Platform factory (e.g., `platformBrowserDynamic`) |
| `selector` | `string` | No | Root element selector (defaults to `'app-root'`) |
| `compilerOptions` | `Record<string, unknown>` | No | Angular compiler options |
| `bootstrap` | `() => void \| Promise<void>` | No | Custom bootstrap function |

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

export const app = createAngularMicroApp({
  name: 'angular-app',
  module: AppModule,
  platform: platformBrowserDynamic,
});
```

### `TuvixModule`

Import into your Angular module to enable prop injection and event service:

```ts

@NgModule({
  imports: [BrowserModule, TuvixModule],
})
export class AppModule {}
```

### `TuvixPropsService`

Inject shell props into any Angular component or service:

```ts
constructor(private tuvixProps: TuvixPropsService) {
  const props = this.tuvixProps.getProps<{ userId: string }>();
}
```

### `TuvixEventService`

RxJS-based wrapper around the event bus:

```ts
constructor(private events: TuvixEventService) {
  this.events.on('theme:changed').subscribe(({ theme }) => {
    this.currentTheme = theme;
  });
}
```

See the [Angular Guide](/guide/angular) for the full example.
