---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="Overlay di debug nella pagina per un orchestratore. Elenca le micro app registrate e montate, la route corrente e il traffico più recente sull'event bus."
  icon="🛠️"
  npm="true"
/>

## Installazione

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Quando usarlo

Installalo in sviluppo quando vuoi vedere quali micro app conosce l'orchestratore, quali sono montate in questo momento e quali eventi passano sul bus. L'overlay si trova nell'angolo in basso a destra della pagina e si aggiorna una volta al secondo.

Usa invece i DevTools del browser o un'estensione devtools del framework quando ti servono alberi di componenti, tempi di rete o payload degli eventi in un'interfaccia. Questo pacchetto mostra i nomi delle app, una stringa di route e i nomi degli eventi con un timestamp. I payload restano nel logger, che puoi leggere dalla console.

## Avvio rapido

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

Apri `/dashboard` e l'overlay elenca `dashboard` con un pallino verde e `settings` con uno bianco. La riga Route mostra `/dashboard` e l'elenco Events riporta gli eventi `tuvix:app:status-change` e `tuvix:app:mount` del montaggio di dashboard.

## Cosa mostra il pannello

`installDevTools` aggiunge un `<div id="tuvix-devtools">` a `document.body`. Contiene un pulsante rotondo di apertura (fisso a 12px dall'angolo in basso a destra, `z-index: 99999`) e, sopra di esso, un pannello largo 280px con tre sezioni:

| Sezione | Origine | Contenuto |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` e `getMountedApps()` | Una riga per ogni app registrata. Un pallino verde indica lo stato `mounted`. Un pallino bianco copre tutti gli altri stati, compresi `loading` ed `error`. |
| Route | `orchestrator.getRouter()?.currentPath` | Il percorso corrente del router: senza prefisso `base`, query string inclusa. Mostra `/` quando l'orchestratore non ha un router. |
| Events | `EventLogger` collegato a `orchestrator.getEventBus()` | I 10 eventi più recenti, dal più nuovo. Ogni riga mostra l'ora locale, un trattino e il nome dell'evento. |

Per impostazione predefinita l'orchestratore usa `getGlobalBus()`, quindi l'elenco Events mostra anche gli eventi che le tue micro app emettono sul bus condiviso, accanto agli eventi dell'orchestratore stesso:

| Evento | Emesso quando |
| --- | --- |
| `tuvix:app:registered` | `register()` aggiunge un'app |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | Un'app attraversa quella fase del ciclo di vita |
| `tuvix:app:error` | Il caricamento, il bootstrap o il montaggio di un'app fallisce |
| `tuvix:app:status-change` | Lo stato di un'app cambia. Aspettati più eventi per ogni mount. |
| `tuvix:route:change` | Il router naviga |
| `tuvix:started`, `tuvix:destroyed` | `start()` e `destroy()` terminano |

Il pannello espone anche `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Esegui `__TUVIX_DEVTOOLS__.logger.getEntries()` nella console del browser per leggere i payload che il pannello non stampa.

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

Il primo argomento accetta qualsiasi oggetto con questi quattro metodi. Va bene un `Orchestrator` di `@tuvix.js/core` o di `tuvix.js`.

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Numero massimo di eventi conservati dal logger. Il pannello ne stampa 10; gli altri restano leggibili tramite `__TUVIX_DEVTOOLS__.logger`. |
| `autoOpen` | `boolean` | `true` | Con `false` il pannello viene montato nascosto. Il pulsante di apertura resta visibile e lo apre. |
| `updateInterval` | `number` | `1000` | Millisecondi tra un aggiornamento del pannello e il successivo. |

A ogni chiamata la funzione:

1. crea un `DevToolsPanel` e un `EventLogger(maxLogEntries)`,
2. collega il logger a `orchestrator.getEventBus()` con `onAny`,
3. monta il pannello e lo nasconde quando `autoOpen` è `false`,
4. avvia un `setInterval` che legge l'orchestratore e chiama `panel.update()`,
5. imposta `window.__TUVIX_DEVTOOLS__`.

Restituisce una funzione di pulizia che cancella l'intervallo, scollega il logger, rimuove il pannello ed elimina `window.__TUVIX_DEVTOOLS__`.

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger` registra ogni evento di un bus tramite `bus.onAny`. Ogni voce contiene `timestamp` (`Date.now()` al momento dell'emissione), `event` (il nome) e `data` (il payload così come è stato emesso, non clonato). Quando il log supera `maxEntries`, il logger scarta le voci più vecchie.

| Metodo | Comportamento |
| --- | --- |
| `attach(bus)` | Si iscrive a tutti gli eventi di `bus`. Lancia un errore quando il bus è distrutto. |
| `detach()` | Annulla l'iscrizione. Le voci registrate restano. |
| `getEntries()` | Restituisce l'intero log, dalla voce più vecchia. |
| `getRecent(count)` | Restituisce le ultime `count` voci, dalla più vecchia. |
| `clear()` | Svuota il log e mantiene l'iscrizione. |

Usalo senza il pannello per verificare il traffico sul bus in un test o per stampare gli eventi di una pagina:

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel` è la parte DOM dell'overlay, senza alcun polling. Chiami `update()` con lo stato che vuoi mostrare.

| Metodo | Comportamento |
| --- | --- |
| `mount()` | Aggiunge `#tuvix-devtools` a `document.body`, aperto. Una seconda chiamata sulla stessa istanza non fa nulla. |
| `unmount()` | Rimuove l'elemento. |
| `toggle()` | Mostra o nasconde il corpo del pannello. Il pulsante di apertura resta. Non fa nulla prima di `mount()`. |
| `update(state)` | Ricostruisce le sezioni Apps, Route ed Events. Stampa gli ultimi 10 elementi di `events`, dal più recente. Non fa nulla prima di `mount()`. |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### Tipi

| Nome | Significato |
| --- | --- |
| `DevToolsOptions` | Opzioni di `installDevTools`: `maxLogEntries`, `autoOpen`, `updateInterval`. |

La forma dell'orchestratore e quella delle voci di log non sono esportate. Usa `Parameters<typeof installDevTools>[0]` e `ReturnType<EventLogger['getEntries']>[number]` quando ti servono come tipi.

## Build di produzione

Il pacchetto dichiara `"sideEffects": false`, ma un `import { installDevTools } from '@tuvix.js/devtools'` statico che il tuo codice chiama finisce comunque nel bundle. Caricalo dietro un flag di build con un `import()` dinamico, come nell'avvio rapido. I bundler sostituiscono `process.env.NODE_ENV` con una stringa ed eliminano il ramo morto e il relativo chunk. In un'app Vite puoi controllare `import.meta.env.DEV` al suo posto.

Lasciare l'overlay attivo in produzione ti costa un `setInterval` che ricostruisce tre sezioni DOM ogni secondo, un'iscrizione a ogni evento del bus e una variabile globale che consegna l'orchestratore a qualsiasi script nella pagina.

## Casi limite

- Installalo prima di `register()` e `start()`. Il logger vede solo gli eventi emessi dopo `attach`, e il pannello resta vuoto fino al primo aggiornamento, `updateInterval` millisecondi dopo la chiamata.
- `installDevTools` richiede `document` e `window`. Chiamarlo durante il rendering lato server lancia un `ReferenceError`. Chiamalo da codice solo client.
- Con `connectRouter()` e senza l'opzione `router`, `getRouter()` restituisce `null` e la riga Route mostra `/`.
- `getMountedApps()` conta solo lo stato `mounted`. Un'app in `mounting` o `error` riceve un pallino bianco, e il pannello non stampa mai il nome dello stato.
- Un bus privato (`createOrchestrator({ eventBus: {...} })`) viene distrutto da `orchestrator.destroy()`. Un'installazione successiva lancia un errore da `onAny`. Con il bus globale predefinito il logger continua a registrare dopo `destroy()` finché non chiami la funzione di pulizia.
- Ogni chiamata crea un nuovo pannello. Due chiamate mettono nella pagina due overlay con gli stessi id di elemento, e la seconda chiamata sovrascrive `window.__TUVIX_DEVTOOLS__`. La prima funzione di pulizia elimina poi la variabile globale impostata dalla seconda chiamata.
- Chiamare `EventLogger.attach()` due volte sulla stessa istanza sostituisce la funzione di annullamento salvata. `detach()` rimuove quindi solo la seconda iscrizione.
- Quando il log raggiunge `maxLogEntries`, il logger copia l'array a ogni nuovo evento. Tieni `maxLogEntries` nell'ordine delle centinaia nelle pagine con bus molto attivi.
- Il pannello scrive nomi delle app, route e nomi degli eventi con `textContent`, quindi il markup in un nome di evento viene mostrato come testo.

## Cosa non fa

- Nessuna scorciatoia da tastiera e nessuna opzione per posizione, dimensioni o tema. L'overlay sta sempre in basso a destra con stili inline.
- Nessun payload degli eventi, URL delle entry, stato della cache del loader o tempo di montaggio nell'interfaccia. Leggi i payload da `__TUVIX_DEVTOOLS__.logger.getEntries()`.
- Nessuna estensione del browser e nessun collegamento con i devtools di React, Vue, Svelte o Angular.
- Nessun time travel né replay degli eventi. Il logger registra e non riemette mai.
- Nessuna rimozione automatica nelle build di produzione. Il controllo sull'import spetta a te.
