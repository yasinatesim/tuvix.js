# Architecture

## Overview

Tuvix.js is structured as a monorepo of small, composable packages. You only import what you use.

```
@tuvix.js/core          ← Orchestrator, lifecycle, registration
@tuvix.js/router        ← URL-based routing
@tuvix.js/event-bus     ← Inter-app pub/sub
@tuvix.js/loader        ← Dynamic bundle loading
@tuvix.js/sandbox       ← CSS + JS isolation
@tuvix.js/react         ← React bindings
@tuvix.js/vue           ← Vue bindings
@tuvix.js/svelte        ← Svelte bindings
@tuvix.js/angular       ← Angular bindings
@tuvix.js/devtools      ← Debug panel
@tuvix.js/server        ← SSR composition
@tuvix.js/module-federation  ← Webpack 5 integration
create-tuvix-app        ← CLI scaffolding
tuvix.js                ← Umbrella (all-in-one)
```

## Request Flow

```
URL change
    │
    ▼
@tuvix.js/router         ← Matches path to micro app name
    │
    ▼
@tuvix.js/core           ← Orchestrator decides to mount/unmount
    │
    ▼
@tuvix.js/loader         ← Fetches & executes micro app bundle
    │
    ▼
@tuvix.js/sandbox        ← Wraps app in isolated scope (optional)
    │
    ▼
Micro App .mount()       ← App renders into its container element
```

## Lifecycle

Every micro app must implement the `MicroApp` interface:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

The orchestrator calls these hooks at the right time:

1. **`mount`** — called when the app's route becomes active
2. **`unmount`** — called when navigating away from the app's route
3. **`update`** — called when props change without a full remount

## Isolation Model

### CSS Isolation (Shadow DOM)

When `sandbox.css = true`, the micro app container becomes a Shadow DOM host. Styles defined inside cannot bleed out, and global styles cannot bleed in.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### JS Isolation (Proxy Scope)

When `sandbox.js = true`, the micro app's global scope is wrapped in a `Proxy`. Access to `window.localStorage`, `window.addEventListener`, etc. is intercepted and cleaned up on unmount.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

The event bus is a decoupled pub/sub channel shared across all micro apps:

```ts
// Publisher (any micro app)
import { eventBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// Subscriber (another micro app)
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

Events are typed — TypeScript will enforce the event payload shape.
