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

### Event Bus Integration

Use the global event bus for cross-app communication:

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

// In a component constructor or ngOnInit
const bus = getGlobalBus();
const unsub = bus.on('theme:changed', ({ theme }) => {
  this.currentTheme = theme;
});

// In ngOnDestroy
unsub();
```

See the [Angular Guide](/guide/angular) for the full example.
