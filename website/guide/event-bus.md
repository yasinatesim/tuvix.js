# Event Bus

`@tuvix.js/event-bus` provides a typed publish/subscribe channel for cross-app communication — without shared globals or coupling between micro apps.

## Import

```ts
import { eventBus } from '@tuvix.js/event-bus';
```

## Basic Usage

```ts
// Publish an event
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// Subscribe to an event
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// Unsubscribe when done (important in unmount!)
unsubscribe();
```

## Typed Events

Define your event map with TypeScript for full type safety:

```ts
// events.d.ts (shared types)
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

Now TypeScript will enforce the event name and payload:

```ts
// ✅ Correct
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ Correct
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ TypeScript error — wrong payload
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

Subscribe to an event only once — handler is automatically removed after the first call:

```ts
eventBus.once('user:login', (payload) => {
  // Called once, then removed
  initUserSession(payload.userId);
});
```

## Cleanup in Micro Apps

Always unsubscribe in `unmount` to prevent memory leaks:

```ts
export const app: MicroApp = {
  _subscriptions: [] as (() => void)[],

  async mount(container, props) {
    this._subscriptions.push(
      eventBus.on('theme:changed', ({ theme }) => applyTheme(theme))
    );
  },

  async unmount(container) {
    this._subscriptions.forEach((unsub) => unsub());
    this._subscriptions = [];
    container.innerHTML = '';
  },
};
```

## Create a Custom Bus

If you need an isolated event channel (e.g. for testing):

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## API Reference

| Method | Signature | Description |
|--------|-----------|-------------|
| `emit` | `emit(event, payload)` | Publish an event |
| `on` | `on(event, handler) → unsub` | Subscribe, returns unsubscribe fn |
| `once` | `once(event, handler)` | Subscribe once, auto-removes |
| `off` | `off(event, handler)` | Remove a specific handler |
| `clear` | `clear(event?)` | Remove all handlers (optionally for one event) |
