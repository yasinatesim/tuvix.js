# Event Bus

`@tuvix.js/event-bus` bietet einen typisierten Publish/Subscribe-Kanal für die Kommunikation zwischen Apps - ohne gemeinsame Globale oder Kopplung zwischen Micro Apps.

## Import

```ts
import { eventBus } from '@tuvix.js/event-bus';
```

## Grundlegende Verwendung

```ts
// Ein Event veröffentlichen
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// Ein Event abonnieren
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// Abonnement beenden wenn fertig (wichtig im unmount!)
unsubscribe();
```

## Typisierte Events

Definieren Sie Ihre Event-Map mit TypeScript für vollständige Typsicherheit:

```ts
// events.d.ts (gemeinsame Typen)
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

Jetzt erzwingt TypeScript den Event-Namen und den Payload:

```ts
// ✅ Korrekt
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ Korrekt
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ TypeScript-Fehler - falscher Payload
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

Abonnieren Sie ein Event nur einmal - der Handler wird nach dem ersten Aufruf automatisch entfernt:

```ts
eventBus.once('user:login', (payload) => {
  // Einmal aufgerufen, dann entfernt
  initUserSession(payload.userId);
});
```

## Aufräumen in Micro Apps

Beenden Sie Abonnements immer in `unmount`, um Speicherlecks zu vermeiden:

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

## Einen eigenen Bus erstellen

Wenn Sie einen isolierten Event-Kanal benötigen (z.B. für Tests):

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## API-Referenz

| Methode | Signatur | Beschreibung |
|---------|----------|-------------|
| `emit` | `emit(event, payload)` | Ein Event veröffentlichen |
| `on` | `on(event, handler) → unsub` | Abonnieren, gibt Abmeldefunktion zurück |
| `once` | `once(event, handler)` | Einmal abonnieren, wird automatisch entfernt |
| `off` | `off(event, handler)` | Einen bestimmten Handler entfernen |
| `clear` | `clear(event?)` | Alle Handler entfernen (optional für ein Event) |
