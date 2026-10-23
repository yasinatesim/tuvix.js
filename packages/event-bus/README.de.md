# @tuvix.js/event-bus

> Synchroner Publish/Subscribe-Bus für Nachrichten zwischen Micro Apps, mit einem globalen Bus pro Seite.

Teil des Microfrontend-Frameworks [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Vollständige Dokumentation: [tuvix.js.org/de/packages/event-bus](https://tuvix.js.org/de/packages/event-bus).

## Installation

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Schnellstart

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

Der Orchestrator aus `@tuvix.js/core` verwendet `getGlobalBus()` (außer du übergibst `eventBus`-Optionen) und übergibt ihn jeder App als `bus` im Mount-Kontext.

## API

### `EventBus` und `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Anzahl pro Event, ab der `on` beim Hinzufügen eines weiteren Handlers ein `console.warn` ausgibt, einmal pro Eventname, mit oder ohne `debug`. Der Listener wird trotzdem hinzugefügt. `0` bedeutet keine Warnung. |
| `debug` | `boolean` | `false` | Protokolliert Aufrufe von Subscribe, Unsubscribe und Emit. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Empfängt die Debug-Ausgabe. |

| Methode | Verhalten |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | Abonniert; gibt eine Funktion zum Entfernen zurück. |
| `once<T>(event, handler): Unsubscribe` | Entfernt den Handler vor seinem ersten Aufruf. Brich ihn über die zurückgegebene Funktion ab, nicht über `off`. |
| `emit<T>(event, data?)` | Ruft die Handler des Events der Reihe nach auf, danach die `onAny`-Handler, bevor es zurückkehrt. Ein Handler, der wirft, wird mit `console.error` protokolliert; die übrigen laufen weiter. |
| `off(event, handler)` | Entfernt einen Handler. |
| `offAll(event?)` | Entfernt die Handler eines Events oder alle Handler einschließlich der `onAny`-Handler. |
| `onAny(handler): Unsubscribe` | Der Handler erhält `(eventName, data)` für jedes Event. |
| `offAny(handler)` | Entfernt einen `onAny`-Handler. |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | Untersuchen die Abonnements; `onAny`-Handler werden nicht mitgezählt. |
| `destroy()` | Entfernt jeden Handler. Spätere Aufrufe von `on`, `once`, `emit` und `onAny` werfen. |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

Gibt den gemeinsamen Bus der Seite zurück, der in `window.__TUVIX_GLOBAL_BUS__` gespeichert ist. So erhalten Micro Apps, die ihre eigene Kopie dieses Pakets bundeln, dieselbe Instanz. `options` gelten nur beim Aufruf, der den Bus erzeugt. Ohne `window` ist der Bus ein Singleton auf Modulebene.

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

Zerstört den globalen Bus; der nächste Aufruf von `getGlobalBus()` erzeugt einen neuen. Alte Referenzen werfen bei Verwendung. Gedacht für Tests.

### Typen

`EventHandler<T>` (`(data: T) => void`), `WildcardHandler<T>` (`(eventName: string, data: T) => void`), `Unsubscribe` (`() => void`), `EventBusOptions`, `IEventBus`.

## Sonderfälle

- `emit` arbeitet auf einer Kopie der Handler-Liste: Handler, die während eines Emits hinzukommen, laufen ab dem nächsten Emit.
- Dieselbe Funktion, die zweimal für ein Event abonniert wird, wird nur einmal gespeichert.
- `emit` wartet nicht auf asynchrone Handler; ihre Rejections bleiben unbehandelt.
- Leere Eventnamen oder solche nur aus Leerzeichen werfen `[Tuvix EventBus] Event name must be a non-empty string.`
- Eine Micro App, die Version 0.4 dieses Pakets bundelt, behält ihren eigenen Bus.

## Was es nicht tut

- Keine Typisierung über eine Event-Map; übergib den Payload-Typ als `on<T>` / `emit<T>`.
- Kein Replay für spät hinzukommende Abonnenten, keine `user:*`-Muster, keine Nachrichten über Tabs oder iframes hinweg.

## Lizenz

MIT
