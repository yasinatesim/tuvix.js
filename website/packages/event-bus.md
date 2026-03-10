---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="Typed publish/subscribe communication channel for cross-app messaging. No shared globals, no coupling."
  icon="📡"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/event-bus
```

## Quick Start

```ts
import { eventBus } from '@tuvix.js/event-bus';

// Publish
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// Subscribe
const unsub = eventBus.on('user:login', ({ userId, name }) => {
  console.log(`${name} logged in (id: ${userId})`);
});

// Cleanup
unsub();
```

## Type-Safe Events

Extend the `TuvixEvents` interface to get full type inference:

```ts
// types/events.d.ts
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':    { userId: string; name: string };
    'user:logout':   { userId: string };
    'cart:updated':  { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

## API

### `eventBus.emit(event, payload)`

Publish an event to all subscribers.

### `eventBus.on(event, handler) → unsubscribe`

Subscribe to an event. Returns an unsubscribe function.

### `eventBus.once(event, handler)`

Subscribe once — handler is removed after first call.

### `eventBus.off(event, handler)`

Remove a specific handler.

### `eventBus.clear(event?)`

Remove all handlers for an event (or all events if omitted).

### `createEventBus<T>()`

Create an isolated event bus instance with its own event map:

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'data:loaded': { items: string[] };
}>();

bus.emit('data:loaded', { items: ['a', 'b'] });
```
