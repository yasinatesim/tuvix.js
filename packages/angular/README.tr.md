# @tuvix.js/angular

> Angular 15+ bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## Quick Start

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

export const app = createAngularMicroApp({
  name: 'my-angular-app',
  module: AppModule,
  platform: platformBrowserDynamic,
});
```

## API

### `createAngularMicroApp(config)`

Creates a Tuvix micro app module from an Angular NgModule.

**Config options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | Yes | Unique name for the micro app |
| `module` | `any` | Yes | Angular NgModule class to bootstrap |
| `platform` | `() => any` | Yes | The `platformBrowserDynamic` function |
| `selector` | `string` | No | CSS selector for the bootstrap component (default: `'app-root'`) |
| `compilerOptions` | `Record<string, unknown>` | No | Angular compiler options |
| `bootstrap` | `() => void \| Promise<void>` | No | Optional one-time setup hook |

> **Note:** The `platform` parameter is required to ensure the correct Angular version is used. Always pass the `platformBrowserDynamic` function from your application's `@angular/platform-browser-dynamic` package.

## License

MIT
