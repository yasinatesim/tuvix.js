# Event Bus

`@tuvix.js/event-bus` provides a typed publish/subscribe channel for cross-app
communication — without shared globals or coupling between micro apps.

## Picking a Bus

The recommended way to get a bus is from the orchestrator — every registered
app already shares it:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator(/* ... */);
const bus = orchestrator.getEventBus();
```

For standalone scripts (no orchestrator), use the lazy global singleton:

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
```

For a fully isolated bus (tests, embedded scenarios):

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus({ debug: true });
```

## Basic Usage

```ts
// Publish
bus.emit('user:login', { userId: '42', name: 'Alice' });

// Subscribe — returns an unsubscribe function
const unsubscribe = bus.on<{ userId: string; name: string }>(
  'user:login',
  ({ userId }) => console.log('User logged in:', userId),
);

// Always unsubscribe (most importantly inside unmount)
unsubscribe();
```

## Typed Events

Pass the payload type as a generic to `on` / `once` / `emit`:

```ts
type LoginPayload = { userId: string; name: string };
type CartPayload  = { itemCount: number; total: number };

bus.emit<LoginPayload>('user:login', { userId: '42', name: 'Alice' });

bus.on<CartPayload>('cart:updated', ({ itemCount }) => {
  updateCartBadge(itemCount);
});
```

For a project-wide event registry, define helper wrappers:

```ts
// events.ts
import type { IEventBus } from '@tuvix.js/event-bus';

export interface AppEvents {
  'user:login':   { userId: string; name: string };
  'user:logout':  { userId: string };
  'cart:updated': { itemCount: number; total: number };
}

export function emit<E extends keyof AppEvents>(
  bus: IEventBus, event: E, payload: AppEvents[E],
) {
  bus.emit(event, payload);
}

export function subscribe<E extends keyof AppEvents>(
  bus: IEventBus, event: E, handler: (payload: AppEvents[E]) => void,
) {
  return bus.on(event, handler);
}
```

## Once

Fire once, auto-unsubscribe:

```ts
bus.once('app:ready', () => initUserSession());
```

## Wildcard Listener

Useful for logging or DevTools — receives every event:

```ts
const off = bus.onAny((event, data) => {
  console.log('[bus]', event, data);
});
```

## Cleanup in Micro Apps

Always unsubscribe in `unmount` to prevent memory leaks:

```ts
import { defineMicroApp } from '@tuvix.js/core';

const subscriptions: Array<() => void> = [];

export default defineMicroApp({
  name: 'header',

  mount({ container, props }) {
    const bus = (window as any).__tuvixBus;
    subscriptions.push(
      bus.on('theme:changed', ({ theme }) => applyTheme(theme)),
      bus.on('user:logout', () => clearAvatar()),
    );
  },

  unmount({ container }) {
    subscriptions.splice(0).forEach((off) => off());
    container.innerHTML = '';
  },
});
```

> A clean pattern is to expose the orchestrator's bus on `window` once during
> shell startup so micro apps can grab it without prop plumbing.

## Removing Listeners

```ts
bus.off('user:login', handler);   // single handler
bus.offAll('user:login');          // every listener for this event
bus.offAll();                       // every listener for every event (incl. wildcards)
```

## Introspection

```ts
bus.hasListeners('user:login');   // boolean
bus.listenerCount('user:login');  // number
bus.eventNames();                 // string[]
```

## Lifecycle

`destroy()` removes every listener and marks the bus unusable — any subsequent
`emit` / `on` / `once` / `onAny` throws.

```ts
bus.destroy();
```

## API Reference

| Method | Signature | Description |
| --- | --- | --- |
| `emit` | `emit<T>(event, data?)` | Publish an event |
| `on` | `on<T>(event, handler) → off` | Subscribe, returns unsubscribe |
| `once` | `once<T>(event, handler) → off` | Subscribe, auto-removes after first call |
| `off` | `off<T>(event, handler)` | Remove a specific handler |
| `offAll` | `offAll(event?)` | Remove every handler (event-scoped or global) |
| `onAny` | `onAny<T>(handler) → off` | Wildcard listener |
| `offAny` | `offAny<T>(handler)` | Remove a wildcard listener |
| `hasListeners` | `hasListeners(event) → boolean` | Quick check |
| `listenerCount` | `listenerCount(event) → number` | Count handlers |
| `eventNames` | `eventNames() → string[]` | Inventory subscribed events |
| `destroy` | `destroy()` | Tear down the bus |
