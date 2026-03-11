---
"@tuvix.js/angular": minor
---

**BREAKING:** `platform` is now a required config parameter in `createAngularMicroApp`.

Previously, the library dynamically imported `@angular/platform-browser-dynamic` at runtime, which caused version mismatch errors in pnpm workspaces (resolving Angular 21 instead of the consumer's Angular 16). Now the consumer must pass their own `platformBrowserDynamic` function.

Also adds optional `selector` config to match the bootstrap component's CSS selector (defaults to `'app-root'`).

Migration:
```ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

createAngularMicroApp({
  name: 'my-app',
  module: AppModule,
  platform: platformBrowserDynamic, // NEW: required
  selector: 'app-root',            // NEW: optional
});
```
