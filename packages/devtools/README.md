# @tuvix.js/devtools

> In-page debug overlay that lists an orchestrator's registered and mounted apps, its current route and recent event bus traffic

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Quick start

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

A round button appears in the bottom-right corner. The panel above it refreshes every second and shows:

- **Apps**: every registered app, with a green dot when its status is `mounted` and a white dot otherwise.
- **Route**: `orchestrator.getRouter()?.currentPath`, or `/` without a router.
- **Events**: the 10 newest bus events (time and name), newest first.

The overlay also sets `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Run `__TUVIX_DEVTOOLS__.logger.getEntries()` in the console to read event payloads.

## API

### `installDevTools(orchestrator, options?): () => void`

Accepts any object with `getRegisteredApps()`, `getMountedApps()`, `getEventBus()` and `getRouter()`, such as an `Orchestrator`. Returns a cleanup function that stops polling, detaches the logger, removes the panel and deletes the global.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Maximum number of events the logger keeps |
| `autoOpen` | `boolean` | `true` | `false` mounts the panel hidden; the toggle button opens it |
| `updateInterval` | `number` | `1000` | Milliseconds between panel refreshes |

### `EventLogger`

`new EventLogger(maxEntries = 200)` records every event of a bus through `onAny`. Entries are `{ timestamp, event, data }`.

| Method | Behaviour |
| --- | --- |
| `attach(bus)` | Subscribes to all events. Throws on a destroyed bus. |
| `detach()` | Unsubscribes and keeps the entries |
| `getEntries()` | Whole log, oldest first |
| `getRecent(count = 20)` | Last `count` entries, oldest first |
| `clear()` | Empties the log |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

The overlay DOM without polling. You feed it state.

| Method | Behaviour |
| --- | --- |
| `mount()` | Appends `#tuvix-devtools` to `document.body`, open. Second call does nothing. |
| `unmount()` | Removes it |
| `toggle()` | Shows or hides the panel body; the button stays |
| `update({ registeredApps, mountedApps, currentRoute, events })` | Re-renders the three sections |

### `DevToolsOptions`

Type of the `installDevTools` options above.

## Edge cases

- The logger sees only events emitted after `installDevTools`, and the panel fills on the first refresh, `updateInterval` ms later.
- Browser only: `installDevTools` throws a `ReferenceError` during server rendering.
- An app in `mounting` or `error` shows a white dot; the panel does not print status names.
- With the default global bus, the logger keeps recording after `orchestrator.destroy()` until you call the cleanup function.
- Two `installDevTools` calls create two overlays with the same element ids, and the second overwrites `window.__TUVIX_DEVTOOLS__`.

## What it does not do

- No keyboard shortcut and no position, size or theme options.
- No payloads, entry URLs, loader state or timings in the UI.
- No browser extension or link to framework devtools.
- No automatic removal in production: gate the import behind a build-time flag, as in the quick start.

Full documentation: [tuvix.js.org/packages/devtools](https://tuvix.js.org/packages/devtools)

## License

MIT
