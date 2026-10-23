# @tuvix.js/devtools

> Overlay di debug nella pagina che elenca le app registrate e montate di un orchestratore, la route corrente e il traffico recente dell'event bus

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installazione

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Avvio rapido

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

Nell'angolo in basso a destra compare un pulsante rotondo. Il pannello sopra di esso si aggiorna ogni secondo e mostra:

- **Apps**: ogni app registrata, con un punto verde quando il suo stato è `mounted` e un punto bianco negli altri casi.
- **Route**: `orchestrator.getRouter()?.currentPath`, o `/` senza router.
- **Events**: i 10 eventi del bus più recenti (orario e nome), dal più recente.

L'overlay imposta anche `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Esegui `__TUVIX_DEVTOOLS__.logger.getEntries()` nella console per leggere i payload degli eventi.

## API

### `installDevTools(orchestrator, options?): () => void`

Accetta qualsiasi oggetto con `getRegisteredApps()`, `getMountedApps()`, `getEventBus()` e `getRouter()`, come un `Orchestrator`. Restituisce una funzione di cleanup che ferma il polling, scollega il logger, rimuove il pannello ed elimina la variabile globale.

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Numero massimo di eventi che il logger conserva |
| `autoOpen` | `boolean` | `true` | `false` monta il pannello nascosto; il pulsante di attivazione lo apre |
| `updateInterval` | `number` | `1000` | Millisecondi tra un aggiornamento del pannello e il successivo |

### `EventLogger`

`new EventLogger(maxEntries = 200)` registra ogni evento di un bus tramite `onAny`. Le voci sono `{ timestamp, event, data }`.

| Metodo | Comportamento |
| --- | --- |
| `attach(bus)` | Si sottoscrive a tutti gli eventi. Lancia un'eccezione su un bus distrutto. |
| `detach()` | Annulla la sottoscrizione e conserva le voci |
| `getEntries()` | L'intero log, dalla voce più vecchia |
| `getRecent(count = 20)` | Le ultime `count` voci, dalla più vecchia |
| `clear()` | Svuota il log |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

Il DOM dell'overlay senza polling. Sei tu a fornirgli lo stato.

| Metodo | Comportamento |
| --- | --- |
| `mount()` | Aggiunge `#tuvix-devtools` a `document.body`, aperto. Una seconda chiamata non fa nulla. |
| `unmount()` | Lo rimuove |
| `toggle()` | Mostra o nasconde il corpo del pannello; il pulsante resta |
| `update({ registeredApps, mountedApps, currentRoute, events })` | Renderizza di nuovo le tre sezioni |

### `DevToolsOptions`

Tipo delle opzioni di `installDevTools` descritte sopra.

## Casi limite

- Il logger vede solo gli eventi emessi dopo `installDevTools`, e il pannello si popola al primo aggiornamento, `updateInterval` ms dopo.
- Solo browser: `installDevTools` lancia un `ReferenceError` durante il rendering lato server.
- Un'app in `mounting` o `error` mostra un punto bianco; il pannello non stampa i nomi degli stati.
- Con il bus globale predefinito, il logger continua a registrare dopo `orchestrator.destroy()` finché non chiami la funzione di cleanup.
- Due chiamate a `installDevTools` creano due overlay con gli stessi id degli elementi, e la seconda sovrascrive `window.__TUVIX_DEVTOOLS__`.

## Cosa non fa

- Nessuna scorciatoia da tastiera e nessuna opzione per posizione, dimensioni o tema.
- Nessun payload, URL delle entry, stato del loader o tempi nell'interfaccia.
- Nessuna estensione del browser o collegamento ai devtools dei framework.
- Nessuna rimozione automatica in produzione: proteggi l'import con un flag in fase di build, come nell'avvio rapido.

Documentazione completa: [tuvix.js.org/it/packages/devtools](https://tuvix.js.org/it/packages/devtools)

## Licenza

MIT
