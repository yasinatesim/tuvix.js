---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="In-page debug overlay for an orchestrator. Lists registered and mounted micro apps, the current route and the latest event bus traffic."
  icon="🛠️"
  npm="true"
/>

## Installation

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## When to use it

Install it in development when you need to see which micro apps the orchestrator knows about, which of them are mounted right now, and which events go across the bus. The overlay sits in the bottom-right corner of the page and refreshes once per second.

Reach for your browser's DevTools or a framework devtools extension instead when you need component trees, network timings or event payloads in a UI. This package shows app names, one route string and event names with a timestamp. Payloads stay in the logger, which you can read from the console.

## Quick start

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

Open `/dashboard` and the overlay lists `dashboard` with a green dot and `settings` with a white one. The Route row reads `/dashboard`, and the Events list shows the `tuvix:app:status-change` and `tuvix:app:mount` events of the dashboard mount.

## What the panel shows

`installDevTools` appends one `<div id="tuvix-devtools">` to `document.body`. It holds a round toggle button (fixed at 12px from the bottom-right corner, `z-index: 99999`) and a 280px wide panel above it with three sections:

| Section | Source | Content |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` and `getMountedApps()` | One row per registered app. A green dot means its status is `mounted`. A white dot covers every other status, including `loading` and `error`. |
| Route | `orchestrator.getRouter()?.currentPath` | The router's current path: no `base` prefix, query string included. Shows `/` when the orchestrator has no router. |
| Events | `EventLogger` attached to `orchestrator.getEventBus()` | The 10 newest events, newest first. Each row shows the local time, a dash and the event name. |

By default the orchestrator uses `getGlobalBus()`, so the Events list also shows events that your micro apps emit on the shared bus, next to the orchestrator's own events:

| Event | Emitted when |
| --- | --- |
| `tuvix:app:registered` | `register()` adds an app |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | An app goes through that lifecycle step |
| `tuvix:app:error` | Loading, bootstrapping or mounting an app fails |
| `tuvix:app:status-change` | An app's status changes. Expect several per mount. |
| `tuvix:route:change` | The router navigates |
| `tuvix:started`, `tuvix:destroyed` | `start()` and `destroy()` finish |

The panel also exposes `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Run `__TUVIX_DEVTOOLS__.logger.getEntries()` in the browser console to read the payloads the panel does not print.

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

The first argument accepts any object with those four methods. An `Orchestrator` from `@tuvix.js/core` or `tuvix.js` fits.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Maximum number of events the logger keeps. The panel prints 10 of them; the rest stay readable through `__TUVIX_DEVTOOLS__.logger`. |
| `autoOpen` | `boolean` | `true` | `false` mounts the panel hidden. The toggle button stays visible and opens it. |
| `updateInterval` | `number` | `1000` | Milliseconds between panel refreshes. |

On each call it:

1. creates a `DevToolsPanel` and an `EventLogger(maxLogEntries)`,
2. attaches the logger to `orchestrator.getEventBus()` with `onAny`,
3. mounts the panel and hides it when `autoOpen` is `false`,
4. starts a `setInterval` that reads the orchestrator and calls `panel.update()`,
5. sets `window.__TUVIX_DEVTOOLS__`.

It returns a cleanup function that clears the interval, detaches the logger, removes the panel and deletes `window.__TUVIX_DEVTOOLS__`.

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger` records every event on a bus through `bus.onAny`. Each entry holds `timestamp` (`Date.now()` at emit time), `event` (the name) and `data` (the payload as emitted, not cloned). When the log grows past `maxEntries`, the logger drops the oldest entries.

| Method | Behaviour |
| --- | --- |
| `attach(bus)` | Subscribes to all events of `bus`. Throws when the bus is destroyed. |
| `detach()` | Unsubscribes. Recorded entries stay. |
| `getEntries()` | Returns the whole log, oldest first. |
| `getRecent(count)` | Returns the last `count` entries, oldest first. |
| `clear()` | Empties the log and keeps the subscription. |

Use it without the panel to assert on bus traffic in a test or to dump events from a page:

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel` is the DOM part of the overlay without any polling. You call `update()` with the state you want to show.

| Method | Behaviour |
| --- | --- |
| `mount()` | Appends `#tuvix-devtools` to `document.body`, open. A second call on the same instance does nothing. |
| `unmount()` | Removes the element. |
| `toggle()` | Shows or hides the panel body. The toggle button stays. Does nothing before `mount()`. |
| `update(state)` | Rebuilds the Apps, Route and Events sections. Prints the last 10 items of `events`, newest first. Does nothing before `mount()`. |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### Types

| Name | Meaning |
| --- | --- |
| `DevToolsOptions` | Options of `installDevTools`: `maxLogEntries`, `autoOpen`, `updateInterval`. |

The orchestrator shape and the log entry shape are not exported. Use `Parameters<typeof installDevTools>[0]` and `ReturnType<EventLogger['getEntries']>[number]` when you need them as types.

## Production builds

The package declares `"sideEffects": false`, but a static `import { installDevTools } from '@tuvix.js/devtools'` that your code calls still ends up in the bundle. Load it behind a build-time flag with a dynamic `import()`, as in the quick start. Bundlers replace `process.env.NODE_ENV` with a string and drop the dead branch and its chunk. In a Vite app you can test `import.meta.env.DEV` instead.

Leaving the overlay on in production costs you a `setInterval` that rebuilds three DOM sections every second, a subscription to every bus event, and a global that hands the orchestrator to any script on the page.

## Edge cases

- Install before `register()` and `start()`. The logger only sees events emitted after `attach`, and the panel stays empty until the first refresh, `updateInterval` milliseconds after the call.
- `installDevTools` needs `document` and `window`. Calling it during server rendering throws a `ReferenceError`. Call it from client-only code.
- With `connectRouter()` and no `router` option, `getRouter()` returns `null` and the Route row shows `/`.
- `getMountedApps()` counts only the `mounted` status. An app in `mounting` or `error` gets a white dot, and the panel never prints the status name.
- A private bus (`createOrchestrator({ eventBus: {...} })`) is destroyed by `orchestrator.destroy()`. Installing after that throws from `onAny`. With the default global bus the logger keeps recording after `destroy()` until you call the cleanup function.
- Each call creates a new panel. Two calls put two overlays with the same element ids on the page, and the second call overwrites `window.__TUVIX_DEVTOOLS__`. The first cleanup function then deletes the global the second call set.
- Calling `EventLogger.attach()` twice on one instance replaces the stored unsubscribe function. `detach()` then removes only the second subscription.
- Once the log reaches `maxLogEntries`, the logger copies the array on each new event. Keep `maxLogEntries` in the hundreds on pages with chatty buses.
- The panel writes app names, routes and event names with `textContent`, so markup in an event name renders as text.

## What it does not do

- No keyboard shortcut, and no options for position, size or theme. The overlay always sits bottom-right with inline styles.
- No event payloads, entry URLs, loader cache state or mount timings in the UI. Read payloads from `__TUVIX_DEVTOOLS__.logger.getEntries()`.
- No browser extension and no connection to React, Vue, Svelte or Angular devtools.
- No time travel or event replay. The logger records and never re-emits.
- No automatic removal in production builds. You gate the import yourself.
