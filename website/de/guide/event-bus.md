# Event Bus

`@tuvix.js/event-bus` ist ein synchroner Publish/Subscribe-Kanal. Apps auf einer Seite teilen einander darüber mit, was passiert ist („Warenkorb aktualisiert“, „Benutzer abgemeldet“), ohne den Code der jeweils anderen zu importieren.

## Einen Bus wählen

| Bus | Erhältst du mit | Verwende ihn, wenn |
| --- | --- | --- |
| Globaler Bus | `getGlobalBus()` | Standard. Jede App auf der Seite erhält in jedem Bundle dieselbe Instanz. |
| Orchestrator-Bus | `orchestrator.getEventBus()` oder `bus` im Mount-Kontext | Innerhalb von Micro Apps. Er ist der globale Bus, außer die Shell hat `eventBus`-Optionen übergeben. |
| Privater Bus | `createEventBus(options)` | Tests oder ein Kanal, den nur eine App nutzt. |

`getGlobalBus()` legt seine Instanz auf `window.__TUVIX_GLOBAL_BUS__` ab. Zwei Micro Apps, die jeweils `@tuvix.js/event-bus` bündeln, teilen sie trotzdem. Auf dem Server ohne `window` hat jede Modulkopie ihre eigene.

## Senden und abonnieren

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit` ruft jeden Handler auf, bevor es zurückkehrt. Ein Handler, der einen Fehler wirft, wird mit `console.error` protokolliert; die übrigen Handler laufen trotzdem. Nichts wird zwischengespeichert: Ein Abonnent, der nach einem `emit` hinzukommt, sieht es nicht.

## Typisierte Events

Der Generic an `on`, `once` und `emit` typisiert den Payload. Für eine projektweite Map kapselst du den Bus:

```ts
import { getGlobalBus, type IEventBus } from '@tuvix.js/event-bus';

export interface AppEvents {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'cart:updated': { itemCount: number; total: number };
}

export function emit<E extends keyof AppEvents>(bus: IEventBus, event: E, payload: AppEvents[E]): void {
  bus.emit(event, payload);
}

export function on<E extends keyof AppEvents>(
  bus: IEventBus,
  event: E,
  handler: (payload: AppEvents[E]) => void,
): () => void {
  return bus.on<AppEvents[E]>(event, handler);
}

emit(getGlobalBus(), 'cart:updated', { itemCount: 3, total: 42 });
```

## Den Bus in einer Micro App nutzen

Nimm den Bus aus dem Mount-Kontext und beende die Abonnements in `unmount`:

```ts
import { defineMicroApp } from '@tuvix.js/core';

const subscriptions: Array<() => void> = [];

export default defineMicroApp({
  name: 'header',

  mount({ container, bus }) {
    const badge = document.createElement('span');
    container.replaceChildren(badge);
    if (!bus) return;
    subscriptions.push(
      bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
        badge.textContent = String(itemCount);
      }),
      bus.on('user:logout', () => {
        badge.textContent = '';
      }),
    );
  },

  unmount({ container }) {
    for (const off of subscriptions.splice(0)) off();
    container.replaceChildren();
  },
});
```

React- und Vue-Komponenten können `useTuvixBus(bus, event, handler)` verwenden, das das Abonnement beendet, wenn die Komponente unmountet. Siehe [React](/de/guide/react) und [Vue](/de/guide/vue).

## once und Wildcards

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

`onAny`-Handler laufen bei jedem Event nach den benannten Handlern, auch bei den `tuvix:app:*`-Events des Orchestrators.

## Listener entfernen

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // one handler
bus.offAll('ping'); // every handler for 'ping'
bus.offAll(); // every handler, wildcards included
```

Rufe `offAll()` auf dem globalen Bus nur auf, wenn dir die ganze Seite gehört. Es entfernt auch die Listener anderer Apps.

## Fehler und zerstörte Busse

- `on`, `once`, `emit` und `onAny` werfen bei einem leeren Event-Namen oder einem Handler, der keine Funktion ist.
- Nach `bus.destroy()` wirft jede Methode, die abonniert oder sendet. `resetGlobalBus()` zerstört den globalen Bus; der nächste Aufruf von `getGlobalBus()` erstellt einen neuen.
- `orchestrator.destroy()` zerstört nur einen privaten Bus.

## Introspektion

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## Was der Bus nicht tut

- Er speichert keine Events und spielt sie nicht erneut ab. Übergib den aktuellen Zustand als Props, oder lass die später geladene App mit einem Event danach fragen, auf das der Besitzer antwortet.
- Er funktioniert nicht über Fenster, Tabs oder iframes hinweg. Nutze dafür `BroadcastChannel` oder `postMessage`.
- Er validiert Payloads nicht zur Laufzeit. Die Generics wirken nur zur Kompilierzeit.
