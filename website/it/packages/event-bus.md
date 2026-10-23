---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="Bus publish/subscribe sincrono per i messaggi tra micro app. Un unico bus globale per pagina, condiviso da ogni copia del pacchetto inclusa nei bundle."
  icon="📡"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Quando usarlo

Le micro app di una pagina devono comunicarsi delle informazioni: l'app del carrello annuncia `cart:updated`, l'header mostra il nuovo conteggio. L'event bus permette di farlo tramite il nome dell'evento, senza che le app si importino a vicenda.

L'orchestratore di `@tuvix.js/core` usa `getGlobalBus()` e lo passa a ogni app come `bus` nel contesto di mount. Dentro una micro app, usa quel `bus` oppure chiama `getGlobalBus()`: entrambi restituiscono la stessa istanza. Crea un bus privato con `createEventBus()` per i test o per i messaggi che restano dentro una sola app.

Scegli un'altra soluzione per lo stato che un subscriber arrivato in ritardo deve poter leggere (uno store, o l'URL) e per i messaggi tra tab o iframe (`BroadcastChannel`, `postMessage`).

## Avvio rapido

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

Una micro app montata dall'orchestratore riceve il bus nel suo contesto di mount:

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

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Numero di listener per evento oltre il quale `on` stampa un `console.warn` quando ne aggiungi un altro, una volta per nome di evento per tutta la vita del bus. Il listener viene aggiunto in ogni caso. `0` disattiva l'avviso. L'avviso ignora `debug`. |
| `debug` | `boolean` | `false` | Registra ogni subscribe, unsubscribe ed emit tramite `logger`. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Riceve i messaggi di debug, ognuno con il prefisso `[Tuvix EventBus]`. L'avviso di `maxListeners` non passa da qui. |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Iscrive `handler` a `event` e restituisce una funzione che annulla l'iscrizione. `T` tipizza il payload; il bus non lo controlla a runtime.

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Come `on`, ma rimuove l'handler prima della sua prima chiamata. Per annullare prima che l'evento venga emesso, chiama la funzione restituita. `off(event, handler)` non lo trova, perché il bus memorizza un wrapper.

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

Chiama ogni handler di `event` nell'ordine di iscrizione, poi ogni handler `onAny`, tutto prima che `emit` ritorni. Un handler che lancia un errore viene registrato con `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` e gli handler rimanenti vengono comunque eseguiti.

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

Rimuove un handler. Eventi e handler sconosciuti vengono ignorati.

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

Con `event`, rimuove ogni handler di quell'evento. Senza, rimuove ogni handler di ogni evento e ogni handler `onAny`.

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

Si iscrive a tutti gli eventi. L'handler riceve `(eventName, data)`. Usalo per il logging e per i devtools.

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

Rimuove un handler `onAny`.

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

Ispezionano le iscrizioni. Gli handler `onAny` non vengono contati, ed `eventNames()` elenca solo gli eventi con almeno un handler.

#### `destroy()`

```ts no-check
destroy(): void;
```

Rimuove ogni handler e segna il bus come distrutto. Da quel momento, `on`, `once`, `emit` e `onAny` lanciano `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.` L'orchestratore distrugge un bus privato (uno creato dalle opzioni `eventBus`) in `destroy()` e lascia attivo il bus globale.

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

Restituisce `new EventBus(options)` tipizzato come `IEventBus`. Accetta le opzioni della tabella precedente.

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

Restituisce il bus condiviso della pagina e lo crea alla prima chiamata. Il bus si trova in `window.__TUVIX_GLOBAL_BUS__`, quindi una micro app che include nel proprio bundle una copia di `@tuvix.js/event-bus` ottiene la stessa istanza della shell. Le `options` valgono solo nella chiamata che crea il bus. Sul server, senza `window`, il bus è un singleton a livello di modulo.

L'orchestratore usa questo bus a meno che tu non passi opzioni `eventBus` a `createOrchestrator`, quindi `orchestrator.getEventBus() === getGlobalBus()`.

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

Distrugge il bus globale e svuota `window.__TUVIX_GLOBAL_BUS__`. Il successivo `getGlobalBus()` crea un nuovo bus. Il codice che ha conservato la vecchia istanza, orchestratore compreso, lancia poi un errore su `emit`. Chiamala tra un test e l'altro.

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### Tipi

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| Tipo | Significato |
| --- | --- |
| `EventHandler<T>` | Handler per un evento. |
| `WildcardHandler<T>` | Handler per `onAny`, riceve il nome dell'evento e i dati. |
| `Unsubscribe` | Funzione restituita da `on`, `once` e `onAny`. |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`. |
| `IEventBus` | Interfaccia implementata da `EventBus`: tutti i metodi elencati sopra. Soddisfa `MicroAppBus` di `@tuvix.js/loader`. |

## Casi limite

- **Snapshot per ogni emit.** `emit` copia prima la lista degli handler. Un handler aggiunto durante un emit viene eseguito dall'emit successivo in poi; un handler rimosso durante un emit viene comunque eseguito in quello corrente.
- **Stessa funzione due volte.** Iscrivere due volte la stessa funzione allo stesso evento la memorizza una sola volta, e un solo `off` la rimuove.
- **Handler asincroni.** `emit` non attende le promise restituite. Una promise rifiutata sfugge al `try`/`catch` del bus e compare come unhandled rejection.
- **Input non valido.** `on`, `once` ed `emit` lanciano `[Tuvix EventBus] Event name must be a non-empty string.` per `''` o per una stringa di soli spazi. `on` e `onAny` lanciano `[Tuvix EventBus] Handler must be a function.` quando l'handler non è una funzione. `once` avvolge prima l'handler, quindi un valore che non è una funzione passa e fallisce al primo `emit`, dove il bus registra l'errore.
- **Dopo `destroy()`.** `off`, `offAll`, `offAny`, `hasListeners`, `listenerCount` ed `eventNames` continuano a funzionare e riportano un bus vuoto.
- **Versioni miste.** Una micro app che include nel bundle `@tuvix.js/event-bus` 0.4 mantiene il proprio bus a livello di modulo e non vede quello condiviso.
- **Limite di listener.** Con `maxListeners: 20`, aggiungere il 21° handler a un evento stampa `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.` Il bus avvisa una volta per nome di evento per tutta la sua vita, quindi rimuovere gli handler e aggiungerli di nuovo non genera un secondo avviso.
- **Iframe.** Ogni finestra ha il proprio `__TUVIX_GLOBAL_BUS__`.

## Cosa non fa

- Non tipizza gli eventi per nome. Non esiste una mappa degli eventi né un'interfaccia `TuvixEvents` da estendere; passa il tipo del payload come `on<T>` ed `emit<T>`.
- Non riproduce gli eventi. Un handler iscritto dopo un `emit` lo perde.
- Non abbina pattern come `user:*`. `onAny` riceve ogni evento.
- Non invia messaggi ad altre tab, finestre o iframe.

## Migrazione dalla 0.4

- `getGlobalBus()` ora conserva il suo singleton in `window.__TUVIX_GLOBAL_BUS__`. Nella 0.4 ogni copia del pacchetto inclusa nei bundle creava il proprio bus "globale", quindi le micro app con una propria copia non ricevevano mai i messaggi della shell. Ora `resetGlobalBus()` chiamato da qualsiasi copia resetta il bus per tutte.
- La versione 0.4 di questa pagina documentava `clear(event?)`, `createEventBus<EventMap>()` e un'interfaccia `TuvixEvents`. Nessuno di questi esisteva. Usa `offAll(event?)` e il generic per singola chiamata `on<T>` / `emit<T>`.
