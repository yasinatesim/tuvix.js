---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Orchestratore core"
  description="Registra le micro app, carica le loro entry e le monta o smonta quando cambia l'URL. Segue il router integrato o uno esterno, isola il CSS delle app in una shadow root su richiesta e segnala gli eventi del ciclo di vita su un event bus condiviso."
  icon="⚙️"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` dipende da `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` e `@tuvix.js/sandbox`. Il tuo package manager li installa insieme.

## Quando usarlo

Usa l'orchestratore nella pagina host (la shell) quando più app compilate in modo indipendente condividono una pagina e l'URL decide quale di esse è visibile. Registri ogni app una volta, con l'URL della sua entry, il suo container e i percorsi che gestisce. L'orchestratore carica l'entry al primo utilizzo, chiama `bootstrap`, `mount` e `unmount` dell'app e mantiene la pagina allineata a ogni navigazione.

Scegli altro in questi casi:

- Renderizzi una island di un framework per pagina e il server decide già cosa mostrare. Gli adapter (`@tuvix.js/react`, `@tuvix.js/vue`, `@tuvix.js/svelte`, `@tuvix.js/angular`) e [`@tuvix.js/vite`](/it/packages/vite) montano le island senza orchestratore.
- Ti serve solo caricare uno script remoto e chiamare tu il suo ciclo di vita. Usa [`@tuvix.js/loader`](/it/packages/loader).
- Vuoi tutto da un solo import. Installa il pacchetto ombrello [`tuvix.js`](/it/packages/tuvix), che riesporta questo pacchetto.

## Avvio rapido

La shell registra due app che condividono `#main`, segue l'URL del browser con il router integrato e trasforma i clic sui link della stessa origine in navigazioni del router:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// Active on /dashboard and every path below it.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// No activeWhen: the router route above activates it on /settings/*.
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Ogni remote pubblica il proprio ciclo di vita con il nome registrato dalla shell. `defineMicroApp` lo fa per il codice DOM puro; gli adapter dei framework lo fanno per i componenti React, Vue, Svelte e Angular.

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Come le app diventano attive {#how-apps-become-active}

Ogni app registrata segue una di cinque regole di attivazione. L'orchestratore sceglie la regola in base alla configurazione dell'app.

| Configurazione | L'app è attiva quando | Chi la smonta |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` è `true` | il reconcile successivo in cui il percorso non corrisponde più |
| `activeWhen: (path) => boolean` | la tua funzione restituisce `true` | il reconcile successivo in cui restituisce `false` |
| nessun `activeWhen`, citata in `router.routes` | una route con `app: name` corrisponde all'intero percorso | il reconcile successivo in cui nessuna route del genere corrisponde |
| nessun `activeWhen`, nessuna route | mai da sola | tu, con `mountApp` / `unmountApp` |
| `mountWhenVisible: true` | il suo container è almeno al 10 % dentro il viewport | tu; i reconcile la saltano e `activeWhen` viene ignorato |

Le stringhe di `activeWhen` passano per [`matchPath`](/it/packages/router) di `@tuvix.js/router`, lo stesso matcher usato dal router e da `@tuvix.js/server`:

- `?query` e `#hash` vengono ignorati, quindi `/dashboard?tab=2` mantiene montata la dashboard.
- Un pattern semplice corrisponde ai suoi sotto-percorsi sui confini dei segmenti: `'/dashboard'` corrisponde a `/dashboard` e `/dashboard/stats`, ma non a `/dashboards`.
- `'/dashboard/*'` corrisponde agli stessi percorsi di `'/dashboard'`.
- `:name` corrisponde a un segmento: `'/users/:id'` corrisponde a `/users/42`.
- `'/'` corrisponde a ogni percorso.
- Gli altri caratteri, come `.` e `(`, corrispondono letteralmente.

Le `routes` del router usano invece una corrispondenza completa. `{ path: '/settings' }` corrisponde solo a `/settings`; scrivi `'/settings/*'` per includere i sotto-percorsi. Una route `'/'` si attiva solo sulla home page, mentre `'/*'` si attiva su ogni percorso. Anche qui query string e hash vengono ignorati.

### Da dove arriva il percorso corrente

L'orchestratore legge il percorso dalla prima fonte disponibile:

1. Il router che hai passato a `connectRouter` (il suo `getPath()`).
2. Il router integrato da `config.router` (il suo `currentPath`).
3. `window.location.pathname`.

Con `config.router` o `connectRouter`, ogni navigazione avvia un reconcile. Senza nessuno dei due, `start()` esegue un solo reconcile su `window.location.pathname` e nulla reagisce alle navigazioni successive finché non chiami `reconcile()`.

### I reconcile vengono eseguiti uno alla volta {#reconciles-run-one-at-a-time}

Un reconcile confronta ogni app gestita dalle route con il percorso e allinea il DOM:

1. Le app che devono essere inattive vengono smontate per prime, tutte in parallelo, così due app che condividono un container non si sovrappongono mai.
2. Le app che devono essere attive vengono poi caricate (solo la prima volta), passano per il bootstrap (finché una chiamata a `bootstrap` riesce) e vengono montate, in parallelo.

Quando arriva una navigazione durante un reconcile, l'orchestratore la mette in coda. Se si accodano tre navigazioni, viene eseguito solo il percorso più recente, e la promise di ogni chiamante si risolve quando la coda si svuota. Un'app che diventa inattiva mentre la sua entry si carica salta il mount. Un'app che diventa inattiva a metà di `mount()` viene smontata appena quel mount si conclude. Navigare rapidamente `/a` → `/b` → `/a` lascia montata solo `a`.

## API

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

Crea un `Orchestrator`. Equivale a `new Orchestrator(config)`.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | nessuno | Crea il router integrato di `@tuvix.js/router` con `mode` (`'history'` o `'hash'`, default `'history'`), `base` e `routes` (obbligatorio, può essere `[]`). Serve per `navigateTo` e per gli eventi `ROUTE_CHANGE`. |
| `eventBus` | `EventBusOptions` | nessuno | Opzioni (`maxListeners`, `debug`, `logger`) per un bus privato. Se lo ometti, l'orchestratore usa `getGlobalBus()`, il bus condiviso da tutte le app della pagina. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Passato al `ModuleLoader` interno. `timeout` vale per ogni tentativo, in ms (`0` lo disattiva); `globals` vengono scritti su `window` prima che gli script di un'entry vengano eseguiti. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | Quando scaricare le entry prima che servano. Vedi sotto. |
| `onError` | `(error: Error, appName: string) => void` | nessuno | Chiamato quando un'app non riesce a caricarsi, eseguire il bootstrap, montarsi, aggiornarsi o smontarsi. `OrchestratorEvent.APP_ERROR` segnala gli stessi errori con la fase. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | nessuno | Chiamato a ogni cambio di stato di ogni app. |

Le strategie di prefetch scaricano gli URL di script e stili con `<link rel="prefetch">` o `<link rel="modulepreload">` senza eseguirli. Le entry di tipo funzione loader vengono saltate, perché chiamare la funzione eseguirebbe il modulo.

- `'immediate'`: tutte le app registrate, durante `start()`.
- `'idle'`: tutte le app registrate, nel primo `requestIdleCallback` dopo `start()` (un `setTimeout` di 200 ms dove quell'API manca).
- `'hover'`: quando il puntatore entra in un link della stessa origine, o il focus arriva su di esso, l'orchestratore esegue il prefetch delle app che il percorso di quel link attiverebbe. Il prefetch di ogni app avviene una sola volta. La modalità hash e `router.base` vengono rispettati.

`destroy()` annulla i prefetch idle e hover in sospeso.

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

Memorizza la configurazione di un'app. Non carica, non monta e non avvia reconcile; lo fanno `start()` e le navigazioni successive.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome univoco dell'app. Il modulo remoto deve registrarsi con lo stesso nome (`defineMicroApp({ name })` o il `name` di un adapter), oppure esporre un nuovo global su `window` con una funzione `mount`. |
| `entry` | `Entry` | obbligatorio | Un URL di script, un `EntryConfig` (`{ scripts, styles?, type?, integrity? }`) o una funzione loader come `() => import('./dashboard')`. Vedi [`@tuvix.js/loader`](/it/packages/loader). |
| `container` | `string \| HTMLElement` | obbligatorio | Selettore CSS o elemento. Un selettore viene risolto con `document.querySelector` a ogni mount. |
| `activeWhen` | `string \| ((path: string) => boolean)` | nessuno | Regola di attivazione. Vedi [Come le app diventano attive](#how-apps-become-active). |
| `props` | `Record<string, unknown>` | nessuno | Passate a `mount()`. `updateAppProps` le unisce con le nuove. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` o `{ css: true }` renderizza l'app dentro una shadow root sul suo container. Vedi [Isolamento CSS](#css-isolation). |
| `fallback` | `string` | nessuno | HTML scritto nel container con `innerHTML` quando caricamento, bootstrap o mount falliscono. Gli errori di update e unmount non toccano il container. |
| `mountWhenVisible` | `boolean` | `false` | Monta l'app quando il container è visibile al 10 %, tramite `IntersectionObserver`. I reconcile ignorano l'app e il suo `activeWhen`. |

Lancia `[Tuvix] App name is required.`, `[Tuvix] App "<name>" is already registered.`, `[Tuvix] App "<name>" requires an entry.` o `[Tuvix] App "<name>" requires a container.`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

Si iscrive al router integrato (se presente), esegue un reconcile sul percorso corrente, configura il prefetch e inizia a osservare i container `mountWhenVisible`. Emette `OrchestratorEvent.STARTED`. Si risolve dopo il primo reconcile, anche quando un'app al suo interno è fallita; gli errori vanno a `onError`, ad `APP_ERROR` e alla console. Una seconda chiamata registra `[Tuvix] Orchestrator is already started.` e ritorna.

#### `mountApp(name)` / `unmountApp(name)`

Montano o smontano a mano una singola app. Usali per le app senza `activeWhen` né route; per le app gestite dalle route, il reconcile successivo sovrascrive la tua scelta.

`mountApp` attende uno smontaggio in corso, poi carica e monta. Rifiuta con l'errore di caricamento o di mount dopo aver renderizzato `fallback`. `unmountApp` attende un caricamento o un mount in corso, poi smonta; se lo chiami durante il caricamento, il mount viene saltato del tutto.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML is already in #chat
  });
});
```

#### `updateAppProps(name, props)`

Esegue un merge superficiale di `props` nelle props correnti dell'app. Un'app montata con una funzione `update` riceve l'oggetto unito come `update({ props, container })`. Altrimenti l'orchestratore memorizza le props unite e le passa al `mount()` successivo. Prima attende un mount in sospeso, così l'aggiornamento raggiunge la nuova istanza. Quando `update` lancia un errore, lo stato diventa `error`, viene eseguito `onError`, la promise viene rifiutata e le props memorizzate restano invariate.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

Mette in coda un reconcile su `path`, o sul percorso corrente se lo ometti. Usalo quando nessun router informa l'orchestratore delle navigazioni. Valgono le regole della coda descritte in [I reconcile vengono eseguiti uno alla volta](#reconciles-run-one-at-a-time).

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

Segue un router esterno (TanStack Router, React Router, il tuo) al posto di quello integrato. `source.subscribe(callback)` deve chiamare `callback` dopo ogni navigazione e restituire una funzione di disiscrizione; `source.getPath()` restituisce il percorso corrente. Dopo `start()`, ogni callback esegue un reconcile su `getPath()`. Anche `start()` legge `getPath()`. Collegare un orchestratore già avviato esegue subito un reconcile. Restituisce `disconnect()`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

// TanStack Router instance created elsewhere in your shell.
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// Later, when the shell tears down:
disconnect();
```

Un data router di React Router (`createBrowserRouter`) si adatta alla stessa forma: `subscribe: (callback) => router.subscribe(() => callback())` e `getPath: () => router.state.location.pathname`.

#### `navigateTo(path)`

Chiama `push(path)` sul router integrato. La promise si risolve dopo il cambio dell'URL; il reconcile che ne deriva gira in background. Lancia `[Tuvix] No router configured.` senza `config.router`.

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` restituisce l'`AppStatus` dell'app, o `null` per un nome sconosciuto. `getRegisteredApps` restituisce tutti i nomi registrati. `getMountedApps` restituisce i nomi con stato `'mounted'` (un'app in `'updating'` è esclusa).

#### `getEventBus()`, `getRouter()`

`getEventBus` restituisce il bus su cui l'orchestratore emette gli `OrchestratorEvent` e che passa a `mount()`: `getGlobalBus()`, o il bus privato se imposti `eventBus`. `getRouter` restituisce il router integrato, o `null`.

#### `unregister(name)`

Smonta l'app (attendendo un mount in corso), smette di osservare il suo container, rimuove i tag script e style dell'entry, scarta il modulo in cache e dimentica l'app. Rifiuta per i nomi sconosciuti. I browser eseguono uno script modulo una sola volta per URL, quindi per registrare di nuovo un'entry URL con `type: 'module'` serve un nuovo URL o una funzione loader.

#### `destroy()`

Ferma il prefetch, annulla l'iscrizione al router integrato e a ogni router collegato, attende un reconcile in corso, smonta ogni app, svuota la cache del loader ed emette `OrchestratorEvent.DESTROYED`. Distrugge un bus privato e lascia attivo il bus globale. Le chiamate ripetute restituiscono la stessa promise. Dopo, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` e `connectRouter` lanciano `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

Valida un oggetto del ciclo di vita, lo pubblica con `registerModule(definition.name, module)` di `@tuvix.js/loader` e lo restituisce. Chiamalo nell'entry dell'app remota. L'orchestratore trova il modulo per nome dopo l'esecuzione degli script dell'entry, sia che l'entry sia un URL sia che sia una funzione loader.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Deve coincidere con il `name` registrato dalla shell. |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Viene eseguito dopo il primo caricamento, prima del primo mount. Se lancia un errore, il mount fallisce e il mount successivo lo richiama; dopo un successo non viene più eseguito per quell'orchestratore. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | obbligatorio | Renderizza dentro `context.container`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | obbligatorio | Smonta tutto e svuota `context.container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | nessuno | Applica `context.props` senza rimontare. Senza di esso, le nuove props aspettano il mount successivo. |
| `ssr` | `boolean` | `false` | Impostalo quando `mount` adotta markup renderizzato sul server. L'evento `tuvix:mounted` segnala allora `hydrated: true` se il container conteneva markup prima dell'esecuzione di `mount`. |

`MountContext` contiene:

| Campo | Tipo | Significato |
| --- | --- | --- |
| `container` | `HTMLElement` | Elemento in cui renderizzare. Per le app con isolamento CSS è un `<div data-tuvix-sandbox-root>` dentro la shadow root. |
| `props` | `Record<string, unknown> \| undefined` | Props correnti. |
| `name` | `string \| undefined` | Il nome registrato dell'app. |
| `bus` | `MicroAppBus \| undefined` | L'event bus dell'orchestratore (`on`, `once`, `emit`, `off`). |

Il modulo restituito avvolge i tuoi `mount` e `unmount` e invia gli stessi eventi DOM del ciclo di vita degli adapter dei framework, quindi `whenMounted(name)`, `isMounted(name)` e `onLifecycle` di `@tuvix.js/loader` funzionano per queste app:

- `tuvix:mounted` dopo che `mount` si risolve, con `{ name, container, hydrated }`.
- `tuvix:unmounted` dopo che `unmount` si risolve.
- `tuvix:error` quando uno dei due lancia un errore. Il wrapper poi rilancia l'errore.

Gli eventi risalgono dal container fino a `document`. Su un container non collegato al documento, il runtime li invia direttamente su `document`. Un `unmount` che arriva mentre `mount` è ancora in esecuzione per lo stesso container attende prima la fine di quel mount.

Lancia `[Tuvix] defineMicroApp requires a "name" property.`, `[Tuvix] defineMicroApp "<name>" requires a "mount" function.` o `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.`.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

Enum di stringhe con gli eventi che l'orchestratore emette sul suo bus. Poiché il bus predefinito è `getGlobalBus()`, qualsiasi app della pagina può ascoltarli.

| Membro | Nome dell'evento | Payload |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`: `{ name, error, phase }`, dove `phase` è `'load'`, `'bootstrap'`, `'mount'`, `'update'` o `'unmount'` |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | il `NavigationEvent` del router integrato (`from`, `to`, `fromRoute`, `toRoute`) |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'` copre sia la risoluzione del container sia il caricamento dell'entry.

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### Isolamento CSS {#css-isolation}

`sandbox: true` o `sandbox: { css: true }` isola il CSS di un'app:

1. Al primo mount l'orchestratore collega una shadow root aperta al container con `CssSandbox` di [`@tuvix.js/sandbox`](/it/packages/sandbox) e sposta i figli esistenti (markup renderizzato sul server) in un `<div data-tuvix-sandbox-root="<name>">` al suo interno. L'app viene montata in quel div.
2. Gli `styles` dell'entry vengono caricati come elementi `<link>` dentro la shadow root invece che in `document.head`. Il mount attende che si carichino o falliscano, per al massimo `loader.timeout` ms (10000 di default; con `0` attende senza limite).
3. Lo smontaggio mantiene la shadow root. Il mount successivo la riusa.

I fogli di stile della pagina non colpiscono più gli elementi dentro l'app, e quelli dell'app non raggiungono più la pagina. Le proprietà ereditate come `color` e `font-family` attraversano comunque il confine della shadow root. `{ css: false }` e `false` renderizzano nel light DOM.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

L'orchestratore non isola JavaScript in una sandbox. `JsSandbox` in [`@tuvix.js/sandbox`](/it/packages/sandbox) è un'utility autonoma che chiami tu.

### Tipi

| Tipo | Significato |
| --- | --- |
| `OrchestratorConfig` | Argomento di `createOrchestrator` e `new Orchestrator`. Vedi la tabella sotto `createOrchestrator`. |
| `MicroAppConfig` | Argomento di `register`. Vedi la tabella sotto `register`. |
| `MicroAppDefinition` | Argomento di `defineMicroApp`: `name`, `bootstrap?`, `mount`, `unmount`, `update?`. |
| `AppSandboxOption` | `boolean \| { css?: boolean }`, il campo `sandbox`. |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`, l'argomento di `connectRouter`. |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`, il payload di `APP_ERROR`. |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`. |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`. Il primo mount percorre `registered → bootstrapping → bootstrapped → mounting → mounted`; un rimontaggio segue `unmounted → mounting → mounted`. |
| `RegisteredApp` | Forma del record che l'orchestratore tiene per un'app: `config`, `status`, `module`, `container`, `error`, `lastUpdated`. Nessun metodo di `Orchestrator` lo restituisce nella 0.5.0. |

### Riesportazioni

`@tuvix.js/core` riesporta questi elementi dalle sue dipendenze, così una shell può importare tutto da un solo pacchetto. Ogni link documenta l'API completa.

| Export | Tipo | Origine |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | funzione | [`@tuvix.js/event-bus`](/it/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | tipo | [`@tuvix.js/event-bus`](/it/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | funzione | [`@tuvix.js/router`](/it/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | tipo | [`@tuvix.js/router`](/it/packages/router) |
| `createLoader` | funzione | [`@tuvix.js/loader`](/it/packages/loader) |
| `Entry`, `MicroAppModule` | tipo | [`@tuvix.js/loader`](/it/packages/loader) |

`getGlobalBus()` conserva la sua istanza in `window.__TUVIX_GLOBAL_BUS__`, così una micro app che include nel bundle la propria copia di `@tuvix.js/event-bus` ottiene lo stesso bus della shell.

## Casi limite

- `register()` prima di `start()` memorizza solo la configurazione. Dopo `start()`, registrare un'app gestita dalle route (ha `activeWhen`, o una route del router la cita) esegue un reconcile sul percorso corrente, quindi l'app viene montata subito se il percorso la attiva.
- Un'app `mountWhenVisible` registrata dopo `start()` viene osservata subito. Un container assente dal DOM in quel momento (o al momento di `start()`) viene saltato e non viene mai osservato. Senza `IntersectionObserver` (server, browser datati) le app legate al viewport non vengono mai montate.
- Un'app legata al viewport il cui mount è fallito resta in `error`; l'observer non riprova.
- Un'app gestita dalle route in `error` riprova al reconcile successivo che la vuole attiva. Un caricamento fallito viene ripetuto. Un `bootstrap` fallito viene rieseguito al nuovo tentativo; uno riuscito non si ripete, quindi un `mount` fallito ritenta solo `mount`.
- Un container mancante fa fallire il mount con `[Tuvix] Container "#main" not found in DOM.`. Al primo mount, `fallback` non ha dove essere renderizzato.
- Gli errori di reconcile non rifiutano `start()`, `reconcile()` né le navigazioni. L'orchestratore scrive `[Tuvix] Failed to mount "<name>":` (o `unmount`) nella console e chiama `onError`. `mountApp` e `unmountApp` invece rifiutano.
- `APP_ERROR` scatta per gli errori di ogni fase, con `phase` che la indica. `fallback` viene renderizzato solo per gli errori di `load`, `bootstrap` e `mount`.
- Un'app il cui unmount lancia un errore finisce in `error` e conta come smontata.
- `fallback` passa per `innerHTML`. Passa solo markup affidabile.
- Lo smontaggio rimuove da `document.head` i fogli di stile dell'entry dell'app, a meno che un'altra app caricata non usi lo stesso URL. Il mount successivo li aggiunge di nuovo e li attende.
- Due orchestratori sulla stessa pagina condividono `getGlobalBus()` e vedono gli `OrchestratorEvent` l'uno dell'altro. Passa `eventBus: {}` per dare a uno di essi un bus privato.
- `resetGlobalBus()` di `@tuvix.js/event-bus` distrugge il bus usato da un orchestratore in esecuzione. L'orchestratore mantiene il bus distrutto; chiama `resetGlobalBus()` solo dopo `destroy()`, per esempio tra un test e l'altro.
- Le callback di `connectRouter` che scattano prima di `start()` vengono ignorate. Chiamare `connectRouter` due volte mantiene entrambe le iscrizioni; la fonte più recente fornisce il percorso per `start()` e `reconcile()`.
- Con sia `config.router` sia `connectRouter`, ogni fonte esegue il reconcile sul proprio percorso. Usane una sola.
- Le funzioni `activeWhen` ricevono il percorso grezzo dalla fonte. Con il router integrato o `connectRouter` quel percorso può contenere una query string; `matchPath` la rimuove per i pattern stringa.
- `updateAppProps` sostituisce gli oggetti annidati: `{ user: { id: 2 } }` sovrascrive l'intera prop `user`.

## Cosa non fa

- Non isola JavaScript in una sandbox. Global, timer e listener creati da un'app restano su `window`. Usa `JsSandbox` di [`@tuvix.js/sandbox`](/it/packages/sandbox).
- Non intercetta i clic sui link. Chiama `interceptLinks` (riesportato qui) o lascia navigare il router del tuo framework.
- Non renderizza sul server. Usa [`@tuvix.js/server`](/it/packages/server) e le entry `./server` degli adapter.
- Non condivide le dipendenze tra le app. Usa [`@tuvix.js/module-federation`](/it/packages/module-federation) o le import map.
- Non emette da solo gli eventi DOM del ciclo di vita (`tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`). Li emettono i moduli creati con `defineMicroApp` e gli adapter dei framework; un `MicroAppModule` scritto a mano non ne emette nessuno, a meno che non chiami `emitLifecycle` di `@tuvix.js/loader`.
- Non mantiene in vita un'app quando viene smontata. Lo stato interno dell'app va perso, a meno che l'app non lo salvi altrove.

## Migrazione dalla 0.4 {#migrating-from-0-4}

Breaking change nella 0.5.0:

- **Event bus condiviso.** Il bus dell'orchestratore è `getGlobalBus()`, a meno che tu non passi `eventBus`. Nella 0.4 ogni orchestratore creava un proprio bus. Ora `destroy()` lascia attivo il bus globale.

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: keep a private bus as in 0.4
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **Le app manuali restano montate.** I reconcile non smontano più le app che non hanno né `activeWhen` né una route del router, né le app `mountWhenVisible`. Nella 0.4 il cambio di route successivo smontava un'app montata a mano. Chiama `unmountApp(name)` dove facevi affidamento su quel comportamento.
- **`sandbox: true` usa una shadow root.** Il CSS della pagina non raggiunge più l'app, e gli `styles` dell'entry non raggiungono più la pagina. Rimuovi `sandbox` o imposta `{ css: false }` per mantenere il rendering della 0.4.
- **`prefetch: { strategy: 'hover' }`** esegue il prefetch solo delle app che un link in hover o con il focus attiva. Nella 0.4 il primo movimento del mouse in qualsiasi punto avviava il prefetch di tutte le app.
- **`activeWhen` usa `matchPath`.** Una query string o un hash non smontano più un'app, i segmenti `:param` funzionano e caratteri come `.` e `(` corrispondono letteralmente.
- **`shared` non esiste più.** `OrchestratorConfig.shared` non veniva mai letto ed è stato rimosso dal tipo. Eliminalo; condividi le dipendenze con [`@tuvix.js/module-federation`](/it/packages/module-federation) o con le import map.
- **Le `routes` del router corrispondono per intero.** Una route `{ path: '/', app: 'home' }` si attiva solo su `/`. Usa `'/*'` per un'app che compare su ogni percorso, oppure `activeWhen: '/'`, che mantiene la corrispondenza per prefisso. `RouteConfig.exact` è stato rimosso; eliminalo.
- **Payload di `APP_ERROR`.** Ora include `phase` e scatta anche per gli errori di update e unmount. Gli handler che davano per scontato un errore di mount devono controllare `phase`.

Il workaround della 0.4 per i router esterni non serve più:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

Le versioni precedenti di questa pagina descrivevano metodi e opzioni che `Orchestrator` non ha. Usa i nomi reali:

| Pagina precedente | API reale |
| --- | --- |
| `createOrchestrator({ container })` | `container` appartiene a ogni app in `register()` |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | `updateAppProps(name, props)` poi `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` o `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `JsSandbox` di `@tuvix.js/sandbox` |
