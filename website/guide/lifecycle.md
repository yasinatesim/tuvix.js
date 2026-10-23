# Lifecycle Hooks

The orchestrator drives each registered app through a fixed sequence of hooks and statuses. This page covers the hooks your module implements, the statuses the shell can read, and what happens on errors and fast navigation. To find out from outside when an app is on the page, use [Lifecycle Events](/guide/lifecycle-events).

## Hook order

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

The orchestrator awaits each hook. It never calls `mount` on an app that is still mounting, and it never calls `unmount` while `mount` is still running: the unmount waits for the mount to settle.

## bootstrap

Runs once per loaded module, after the entry loads and before the first `mount`. Use it for work that should survive remounts, such as reading configuration.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

If `bootstrap` throws, the app goes to `error` status and the mount fails. The next mount attempt calls `bootstrap` again. After one successful run, remounts skip it.

## mount

Runs each time the app becomes active, or when you call `mountApp(name)`. The context holds:

| Field | Value |
| --- | --- |
| `container` | The element to render into. For `sandbox: true` apps, an element inside the shadow root. |
| `props` | The registered props merged with every `updateAppProps` call. |
| `name` | The registered app name. |
| `bus` | The orchestrator's event bus. |

`mountApp(name)` resolves after `mount` settles and rejects with the load or mount error.

## update

Runs when the shell calls `updateAppProps(name, props)` while the app is mounted:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

The context holds the merged `props` and the `container`. If `update` is missing or the app is not mounted, the orchestrator stores the props and passes them to the next `mount`. It never remounts an app because props changed.

`updateAppProps` waits for a pending mount first, so the update reaches the new instance. An `unmount` that arrives during an update waits for the update.

## unmount

Runs when the app turns inactive, on `unmountApp(name)`, `unregister(name)` and `destroy()`. Remove everything `mount` created: framework roots, listeners, timers, bus subscriptions.

After `unmount`, the orchestrator removes the app's entry stylesheets from `document.head`. The next mount adds them back and waits for them to load.

## App status

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| Method | Returns |
| --- | --- |
| `getAppStatus(name)` | The status, or `null` for an unknown name. |
| `getMountedApps()` | Names with status `mounted`. |
| `getRegisteredApps()` | Every registered name. |

## Errors and fallback

When load, `bootstrap` or `mount` fails, the orchestrator:

1. writes the app's `fallback` HTML into its container, when you set one;
2. sets status `error`;
3. emits `OrchestratorEvent.APP_ERROR` (`tuvix:app:error`) on the bus with `{ name, error, phase }`;
4. calls `onError(error, name)`;
5. rejects `mountApp`. A failed mount during a route change is logged with `console.error` instead, and the other apps still mount.

A failed `update` or `unmount` runs steps 2 to 4 and rejects `updateAppProps` or `unmountApp`; it writes no fallback HTML. `phase` is `'load'` (which includes resolving the container), `'bootstrap'`, `'mount'`, `'update'` or `'unmount'`.

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

The next route change that activates an app in `error` status tries to mount it again.

## Fast navigation

Route changes reconcile one at a time. Inactive apps unmount before active apps mount. When paths arrive faster than apps mount:

- only the newest queued path runs next;
- an app that turns inactive while its entry loads skips its mount;
- an app that turns inactive while `mount` runs is unmounted once `mount` settles.

So A → B → A in quick succession ends with only A mounted, and no app renders into a container another app still holds.

## Shell-level hooks

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| Event | Payload | Emitted |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | after `bootstrap` |
| `tuvix:app:mount` | `{ name }` | after `mount` |
| `tuvix:app:unmount` | `{ name }` | after `unmount` |
| `tuvix:app:error` | `{ name, error, phase }` | load, bootstrap, mount, update or unmount failed |
| `tuvix:app:status-change` | `{ name, status }` | every status change |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | built-in router navigation only |
| `tuvix:started` | `{}` | end of `start()` |
| `tuvix:destroyed` | `{}` | end of `destroy()` |

These bus events come from the orchestrator. The `tuvix:mounted` DOM events in [Lifecycle Events](/guide/lifecycle-events) come from the adapters and `defineMicroApp`, and also fire for islands mounted without an orchestrator.

## Tearing down

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` waits for a running reconcile, unmounts every app, stops the router, `connectRouter` subscriptions, prefetching and the viewport observer, and clears the loader cache. It destroys a private event bus and leaves the global bus alive. Calling it twice is safe. After it, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` and `connectRouter` throw; create a new orchestrator instead.
