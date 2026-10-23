# @tuvix.js/event-bus

> Bus publish/subscribe sincrono per i messaggi tra micro app, con un bus globale per pagina.

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentazione completa: [tuvix.js.org/it/packages/event-bus](https://tuvix.js.org/it/packages/event-bus).

## Installazione

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Avvio rapido

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

L'orchestratore di `@tuvix.js/core` usa `getGlobalBus()` (a meno che tu non passi le opzioni `eventBus`) e lo passa a ogni app come `bus` nel contesto di mount.

## API

### `EventBus` e `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Numero di listener per evento oltre il quale `on` stampa un `console.warn` quando ne aggiungi un altro, una volta per nome di evento, con o senza `debug`. Il listener viene comunque aggiunto. `0` significa nessun avviso. |
| `debug` | `boolean` | `false` | Registra nel log le chiamate di subscribe, unsubscribe ed emit. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Riceve l'output di debug. |

| Metodo | Comportamento |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | Sottoscrive; restituisce una funzione di rimozione. |
| `once<T>(event, handler): Unsubscribe` | Rimuove l'handler prima della sua prima chiamata. Annullalo con la funzione restituita, non con `off`. |
| `emit<T>(event, data?)` | Chiama in ordine gli handler dell'evento, poi gli handler `onAny`, prima di restituire. Un handler che lancia un'eccezione viene registrato con `console.error`; gli altri vengono eseguiti comunque. |
| `off(event, handler)` | Rimuove un handler. |
| `offAll(event?)` | Rimuove gli handler di un evento, oppure tutti gli handler, compresi quelli `onAny`. |
| `onAny(handler): Unsubscribe` | L'handler riceve `(eventName, data)` per ogni evento. |
| `offAny(handler)` | Rimuove un handler `onAny`. |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | Ispezionano le sottoscrizioni; gli handler `onAny` non vengono contati. |
| `destroy()` | Rimuove tutti gli handler. Le chiamate successive a `on`, `once`, `emit` e `onAny` lanciano un'eccezione. |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

Restituisce il bus condiviso della pagina, salvato in `window.__TUVIX_GLOBAL_BUS__`, così le micro app che includono nel bundle una propria copia di questo pacchetto ottengono la stessa istanza. Le `options` si applicano solo alla chiamata che lo crea. Senza `window`, il bus è un singleton a livello di modulo.

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

Distrugge il bus globale; il `getGlobalBus()` successivo ne crea uno nuovo. I vecchi riferimenti lanciano un'eccezione quando li usi. Pensato per i test.

### Tipi

`EventHandler<T>` (`(data: T) => void`), `WildcardHandler<T>` (`(eventName: string, data: T) => void`), `Unsubscribe` (`() => void`), `EventBusOptions`, `IEventBus`.

## Casi limite

- `emit` lavora su una copia della lista degli handler: gli handler aggiunti durante un emit vengono eseguiti dall'emit successivo in poi.
- La stessa funzione sottoscritta due volte allo stesso evento viene salvata una sola volta.
- `emit` non attende gli handler asincroni; i loro rifiuti restano non gestiti.
- I nomi di evento vuoti o composti da soli spazi lanciano `[Tuvix EventBus] Event name must be a non-empty string.`
- Una micro app che include nel bundle la 0.4 di questo pacchetto mantiene il proprio bus.

## Cosa non fa

- Nessuna tipizzazione tramite mappa degli eventi; passa il tipo del payload come `on<T>` / `emit<T>`.
- Nessun replay per i subscriber tardivi, nessun pattern `user:*`, nessun messaggio tra schede o iframe.

## Licenza

MIT
