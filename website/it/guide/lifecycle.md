# Lifecycle Hooks

## Overview

Every micro app in Tuvix.js follows a predictable lifecycle. The orchestrator
calls hooks at the appropriate times — you implement them on the module
returned to the loader.

```
register()  →  bootstrap()  →  mount()  →  update()*  →  unmount()
                                              ↑   loop while mounted
```

`bootstrap()` runs only once per page lifetime. `mount()` and `unmount()` run
every time the app's route activates/deactivates. `update()` is optional and
runs whenever the shell pushes new props via `orchestrator.updateAppProps()`.

## The Module Shape

All hooks receive a single context object — never positional arguments.

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: ({ container, props }) => void | Promise<void>;
  unmount: ({ container }) => void | Promise<void>;
  update?: ({ props }) => void | Promise<void>;
}
```

## bootstrap

Called once before the very first `mount()`. Use it for one-shot setup such as
pre-loading data, registering globals, or warming caches.

```ts
async bootstrap() {
  await preloadCriticalChunks();
}
```

If `bootstrap()` throws, the orchestrator marks the app as `error` and emits
`app:error` on the bus.

## mount

Called when the app's route becomes active (or when `mountApp()` is invoked
manually). Render your UI into the supplied container.

```ts
async mount({ container, props }) {
  this._root = createRoot(container);
  this._root.render(<App {...props} />);
}
```

`props` is whatever was passed to `register({ props })` (merged with any
subsequent `updateAppProps()` calls).

## unmount

Called when the route deactivates. **Always clean up here** — destroy framework
instances, unsubscribe from events, clear timers.

```ts
async unmount({ container }) {
  this._root?.unmount();
  this._root = null;
  container.innerHTML = '';
}
```

::: warning
Memory leaks from skipping cleanup are the most common micro-frontend bug.
The orchestrator does not destroy your framework instances for you.
:::

## update

Optional. Called when the shell pushes new props **without** unmounting:

```ts
await orchestrator.updateAppProps('dashboard', { theme: 'dark' });
```

Implement it to patch the live UI in place — this avoids the flicker of an
unmount/remount cycle:

```ts
async update({ props }) {
  this._root?.render(<App {...props} />);
}
```

If `update()` is not implemented, the new props are stored and applied the
next time the app mounts. The app is **not** automatically remounted just
because props changed.

## Manual Lifecycle Control

The shell can drive the lifecycle directly without going through the router:

```ts
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');
await orchestrator.unregister('dashboard');

orchestrator.getAppStatus('dashboard');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting'
//   | 'mounted' | 'updating' | 'unmounting' | 'unmounted' | 'error'
```

## Shell-level Hooks

Wire shell-wide reactions through orchestrator config callbacks or by
subscribing to the event bus:

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { /* ... */ },

  onError(error, name) {
    reportToSentry(error, { app: name });
  },

  onStatusChange(name, status) {
    console.log(`[${name}] → ${status}`);
  },
});

const bus = orchestrator.getEventBus();
bus.on(OrchestratorEvent.APP_MOUNT,   ({ name }) => analytics.track('app_mount', { name }));
bus.on(OrchestratorEvent.APP_UNMOUNT, ({ name }) => analytics.track('app_unmount', { name }));
bus.on(OrchestratorEvent.ROUTE_CHANGE, ({ from, to }) => analytics.page(to, { from }));
```

## Tearing Down

`destroy()` is idempotent — call it whenever the page leaves the shell:

```ts
await orchestrator.destroy();
```

It unmounts every active app, disconnects the viewport observer, unsubscribes
the router, clears the loader cache, and finally tears down the event bus.
