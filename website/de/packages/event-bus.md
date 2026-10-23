---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="Synchroner Publish/Subscribe-Bus für Nachrichten zwischen Micro Apps. Ein globaler Bus pro Seite, den jede gebündelte Kopie des Pakets teilt."
  icon="📡"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Wann du es verwendest {#when-to-use-it}

Micro Apps auf einer Seite müssen sich gegenseitig Dinge mitteilen: Die Warenkorb-App meldet `cart:updated`, der Header zeigt die neue Anzahl. Der Event Bus erlaubt das über den Event-Namen, ohne dass die Apps sich gegenseitig importieren.

Der Orchestrator aus `@tuvix.js/core` verwendet `getGlobalBus()` und übergibt den Bus jeder App als `bus` im Mount-Kontext. Verwende in einer Micro App diesen `bus` oder ruf `getGlobalBus()` auf. Beide geben dieselbe Instanz zurück. Einen privaten Bus erstellst du mit `createEventBus()` für Tests oder für Nachrichten, die innerhalb einer App bleiben.

Wähle etwas anderes für Zustand, den ein später Subscriber lesen muss (einen Store oder die URL), und für Nachrichten zwischen Tabs oder iframes (`BroadcastChannel`, `postMessage`).

## Schnellstart {#quick-start}

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

interface CartUpdated {
  itemCount: number;
  total: number;
}

const bus = getGlobalBus();

// header app
const stop = bus.on<CartUpdated>('cart:updated', ({ itemCount }) => {
  document.querySelector('#cart-count')!.textContent = String(itemCount);
});

// cart app
bus.emit<CartUpdated>('cart:updated', { itemCount: 3, total: 59.9 });

// header app, on unmount
stop();
```

Eine Micro App, die der Orchestrator mountet, erhält den Bus in ihrem Mount-Kontext:

```ts
import { registerModule } from '@tuvix.js/loader';

let stop: (() => void) | undefined;

registerModule('header', {
  mount({ container, bus }) {
    stop = bus?.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
      container.textContent = `Cart: ${itemCount}`;
    });
  },
  unmount({ container }) {
    stop?.();
    container.replaceChildren();
  },
});
```

## API

### `EventBus`

```ts no-check
class EventBus implements IEventBus {
  constructor(options?: EventBusOptions);
}
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Anzahl der Listener pro Event, ab der `on` beim Hinzufügen eines weiteren ein `console.warn` ausgibt, einmal pro Event-Name für die Lebensdauer des Busses. Der Listener wird in jedem Fall hinzugefügt. `0` schaltet die Warnung ab. Die Warnung ignoriert `debug`. |
| `debug` | `boolean` | `false` | Loggt jedes Subscribe, Unsubscribe und Emit über `logger`. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Erhält Debug-Meldungen, jeweils mit dem Präfix `[Tuvix EventBus]`. Die Warnung von `maxListeners` läuft nicht darüber. |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Meldet `handler` für `event` an und gibt eine Funktion zurück, die ihn wieder abmeldet. `T` typisiert den Payload. Zur Laufzeit prüft der Bus ihn nicht.

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Wie `on`, entfernt den Handler aber vor seinem ersten Aufruf. Um abzubrechen, bevor das Event feuert, ruf die zurückgegebene Funktion auf. `off(event, handler)` findet ihn nicht, weil der Bus einen Wrapper speichert.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
const cancel = bus.once('app:ready', () => console.log('ready'));
cancel();
```

#### `emit(event, data?)`

```ts no-check
emit<T = unknown>(event: string, data?: T): void;
```

Ruft jeden Handler von `event` in der Reihenfolge der Anmeldung auf, danach jeden `onAny`-Handler, alles bevor `emit` zurückkehrt. Wirft ein Handler, wird das mit `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` geloggt, und die übrigen Handler laufen trotzdem.

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

Entfernt einen Handler. Unbekannte Events und Handler werden ignoriert.

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

Mit `event` entfernt es jeden Handler dieses Events. Ohne `event` entfernt es jeden Handler jedes Events und jeden `onAny`-Handler.

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

Meldet sich für jedes Event an. Der Handler erhält `(eventName, data)`. Verwende es für Logging und Devtools.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const stopLogging = getGlobalBus().onAny((event, data) => {
  console.debug('[bus]', event, data);
});
```

#### `offAny(handler)`

```ts no-check
offAny<T = unknown>(handler: WildcardHandler<T>): void;
```

Entfernt einen `onAny`-Handler.

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

Untersuchen die Anmeldungen. `onAny`-Handler werden nicht mitgezählt, und `eventNames()` listet nur Events mit mindestens einem Handler.

#### `destroy()`

```ts no-check
destroy(): void;
```

Entfernt jeden Handler und markiert den Bus als zerstört. Danach werfen `on`, `once`, `emit` und `onAny` den Fehler `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.` Der Orchestrator zerstört in `destroy()` einen privaten Bus (einen, den er aus `eventBus`-Optionen erstellt hat) und lässt den globalen Bus bestehen.

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

Gibt `new EventBus(options)` mit dem Typ `IEventBus` zurück. Nimmt die Optionen aus der Tabelle oben.

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
bus.on<string>('hello', (name) => console.log(`Hello, ${name}!`));
bus.emit('hello', 'World');
```

### `getGlobalBus`

```ts no-check
function getGlobalBus(options?: EventBusOptions): IEventBus;
```

Gibt den gemeinsamen Bus der Seite zurück und erstellt ihn beim ersten Aufruf. Der Bus liegt auf `window.__TUVIX_GLOBAL_BUS__`. Eine Micro App, die ihre eigene Kopie von `@tuvix.js/event-bus` bündelt, bekommt deshalb dieselbe Instanz wie die Shell. `options` gelten nur bei dem Aufruf, der den Bus erstellt. Auf dem Server ohne `window` ist der Bus ein Singleton auf Modulebene.

Der Orchestrator verwendet diesen Bus, sofern du `createOrchestrator` keine `eventBus`-Optionen übergibst. Dann gilt `orchestrator.getEventBus() === getGlobalBus()`.

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

Zerstört den globalen Bus und leert `window.__TUVIX_GLOBAL_BUS__`. Der nächste Aufruf von `getGlobalBus()` erstellt einen neuen Bus. Code, der die alte Instanz behalten hat, ein Orchestrator eingeschlossen, wirft danach bei `emit`. Ruf die Funktion zwischen Tests auf.

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### Typen {#types}

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| Typ | Bedeutung |
| --- | --- |
| `EventHandler<T>` | Handler für ein Event. |
| `WildcardHandler<T>` | Handler für `onAny`, erhält den Event-Namen und die Daten. |
| `Unsubscribe` | Funktion, die `on`, `once` und `onAny` zurückgeben. |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`. |
| `IEventBus` | Interface, das `EventBus` implementiert: alle oben aufgeführten Methoden. Es erfüllt `MicroAppBus` aus `@tuvix.js/loader`. |

## Sonderfälle {#edge-cases}

- **Snapshot pro Emit.** `emit` kopiert zuerst die Liste der Handler. Ein Handler, der während eines Emits hinzukommt, läuft ab dem nächsten Emit. Ein Handler, der während eines Emits entfernt wird, läuft im aktuellen noch.
- **Dieselbe Funktion zweimal.** Meldest du eine Funktion zweimal für ein Event an, wird sie nur einmal gespeichert, und ein einziges `off` entfernt sie.
- **Async-Handler.** `emit` wartet nicht auf zurückgegebene Promises. Ein rejectetes Promise entkommt dem `try`/`catch` des Busses und erscheint als Unhandled Rejection.
- **Ungültige Eingaben.** `on`, `once` und `emit` werfen `[Tuvix EventBus] Event name must be a non-empty string.` für `''` oder reinen Leerraum. `on` und `onAny` werfen `[Tuvix EventBus] Handler must be a function.`, wenn der Handler keine Funktion ist. `once` verpackt den Handler zuerst. Eine Nicht-Funktion kommt deshalb durch und scheitert erst beim ersten `emit`, wo der Bus den Fehler loggt.
- **Nach `destroy()`.** `off`, `offAll`, `offAny`, `hasListeners`, `listenerCount` und `eventNames` funktionieren weiter und melden einen leeren Bus.
- **Gemischte Versionen.** Eine Micro App, die `@tuvix.js/event-bus` 0.4 bündelt, behält ihren eigenen Bus auf Modulebene und sieht den gemeinsamen nicht.
- **Listener-Limit.** Mit `maxListeners: 20` gibt das Hinzufügen des 21. Handlers zu einem Event `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.` aus. Der Bus warnt einmal pro Event-Name für seine gesamte Lebensdauer. Entfernst du Handler und fügst sie wieder hinzu, kommt keine zweite Warnung.
- **Iframes.** Jedes Window hat sein eigenes `__TUVIX_GLOBAL_BUS__`.

## Was es nicht tut {#what-it-does-not-do}

- Es typisiert Events nicht über ihren Namen. Es gibt keine Event-Map und kein `TuvixEvents`-Interface zum Erweitern. Übergib den Payload-Typ als `on<T>` und `emit<T>`.
- Es spielt Events nicht erneut ab. Ein Handler, der sich nach einem `emit` anmeldet, verpasst es.
- Es vergleicht keine Patterns wie `user:*`. `onAny` erhält jedes Event.
- Es sendet keine Nachrichten an andere Tabs, Windows oder iframes.

## Migration von 0.4 {#migrating-from-0-4}

- `getGlobalBus()` hält sein Singleton jetzt auf `window.__TUVIX_GLOBAL_BUS__`. In 0.4 erstellte jede gebündelte Kopie des Pakets ihren eigenen „globalen“ Bus. Micro Apps mit eigener Kopie hörten die Shell deshalb nie. `resetGlobalBus()` aus einer beliebigen Kopie setzt den Bus jetzt für alle zurück.
- Die Version dieser Seite für 0.4 dokumentierte `clear(event?)`, `createEventBus<EventMap>()` und ein `TuvixEvents`-Interface. Nichts davon existierte. Verwende `offAll(event?)` und das Generic pro Aufruf `on<T>` / `emit<T>`.
