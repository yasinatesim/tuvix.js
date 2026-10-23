# @tuvix.js/core

> Orchestratore che carica le micro app e le monta o smonta al cambiare dell'URL.

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Documentazione completa: [tuvix.js.org/it/packages/core](https://tuvix.js.org/it/packages/core)

## Installazione

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

Dipende da `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` e `@tuvix.js/sandbox`.

## Avvio rapido

Shell:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

App remota (`dashboard/main.js`):

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Come le app diventano attive

- `activeWhen: '/path'`: confrontato con `matchPath` di `@tuvix.js/router`. Query e hash vengono ignorati, `'/dashboard'` e `'/dashboard/*'` corrispondono a `/dashboard` e a ogni sotto-percorso (non a `/dashboards`), `:id` corrisponde a un segmento, `'/'` corrisponde a ogni percorso.
- `activeWhen: (path) => boolean`: decide la tua funzione.
- Nessun `activeWhen`, nome presente in `router.routes`: attiva finché una route con `app: name` corrisponde per intero. Una route `'/'` indica solo la home page; `'/*'` indica ogni percorso.
- Nessuno dei due: chiami tu `mountApp` / `unmountApp`; le riconciliazioni non toccano l'app.
- `mountWhenVisible: true`: monta quando il container è visibile al 10 %; `activeWhen` viene ignorato.

Il percorso corrente viene da `getPath()` di `connectRouter`, altrimenti dal router integrato, altrimenti da `window.location.pathname`. Le riconciliazioni vengono eseguite una alla volta: prima vengono smontate le app inattive, poi montate quelle attive. Le navigazioni in coda si riducono al percorso più recente. Un'app che diventa inattiva durante il caricamento salta il proprio mount; un'app che diventa inattiva a metà mount viene smontata quando il mount si conclude.

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | nessuno | Router integrato: `mode` (`'history'` di default oppure `'hash'`), `base`, `routes` (obbligatorio). |
| `eventBus` | `EventBusOptions` | nessuno | Opzioni del bus privato. Se omesso, l'orchestratore usa `getGlobalBus()`. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Passate al module loader, insieme a `globals`. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate` su `start()`, `idle` nel primo periodo di inattività, `hover` quando un link same-origin che attiva un'app riceve il puntatore o il focus. |
| `onError` | `(error: Error, appName: string) => void` | nessuno | Errori di caricamento, bootstrap, mount, update e unmount. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | nessuno | Ogni cambio di stato. |

### Metodi di `Orchestrator`

| Metodo | Comportamento |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | Memorizza la configurazione. Non carica, non monta e non riconcilia. |
| `unregister(name): Promise<void>` | Smonta, rimuove i tag della entry e il modulo in cache, dimentica l'app. |
| `start(): Promise<void>` | Segue il router, riconcilia, avvia il prefetch e l'osservazione del viewport. Emette `STARTED`. |
| `mountApp(name): Promise<void>` | Attende un unmount in corso, poi monta. Rifiuta con l'errore dopo aver renderizzato `fallback`. |
| `unmountApp(name): Promise<void>` | Attende un caricamento o un mount in corso, poi smonta. |
| `updateAppProps(name, props): Promise<void>` | Unisce le props in modo shallow. Chiama `update({ props, container })` su un'app montata, altrimenti le memorizza per il mount successivo. |
| `reconcile(path?): Promise<void>` | Mette in coda una riconciliazione su `path` o sul percorso corrente. |
| `connectRouter({ subscribe, getPath }): () => void` | Segue un router esterno. Restituisce `disconnect`. |
| `navigateTo(path): Promise<void>` | `push(path)` sul router integrato. Senza router lancia `[Tuvix] No router configured.`. |
| `getAppStatus(name): AppStatus \| null` | Stato, oppure `null` per nomi sconosciuti. |
| `getRegisteredApps(): string[]` | Nomi registrati. |
| `getMountedApps(): string[]` | Nomi con stato `'mounted'`. |
| `getEventBus(): IEventBus` | `getGlobalBus()` oppure il bus privato. |
| `getRouter(): IRouter \| null` | Router integrato oppure `null`. |
| `destroy(): Promise<void>` | Attende una riconciliazione in corso, smonta ogni app, smette di ascoltare, emette `DESTROYED`. Lascia attivo il bus globale. |

Opzioni di `register`:

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Univoco; l'app remota si registra con lo stesso nome. |
| `entry` | `Entry` | obbligatorio | URL, `{ scripts, styles?, type?, integrity? }` oppure `() => import('./app')`. |
| `container` | `string \| HTMLElement` | obbligatorio | Selettore (risolto a ogni mount) o elemento. |
| `activeWhen` | `string \| ((path: string) => boolean)` | nessuno | Regola di attivazione. |
| `props` | `Record<string, unknown>` | nessuno | Passate a `mount()`. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | Renderizza dentro uno shadow root in cui vengono caricati gli `styles` della entry. |
| `fallback` | `string` | nessuno | HTML impostato con `innerHTML` in caso di errore di caricamento, bootstrap o mount. |
| `mountWhenVisible` | `boolean` | `false` | Monta quando il container è visibile al 10 % nel viewport. |

`connectRouter` con TanStack Router:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Deve essere uguale al nome registrato. |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Eseguito prima del primo mount. Un bootstrap fallito viene rieseguito al mount successivo; uno riuscito viene eseguito una sola volta. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | obbligatorio | Riceve `container`, `props`, `name` e `bus`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | obbligatorio | Riceve `container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | nessuno | Riceve `props` e `container`. |
| `ssr` | `boolean` | `false` | `mount` adotta il markup del server; l'evento `mounted` riporta `hydrated: true` quando il container conteneva markup. |

Pubblica il modulo con `registerModule` di `@tuvix.js/loader` e lo restituisce. Il modulo invia gli eventi DOM `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error` (con bubbling fino a `document`), quindi `whenMounted`, `isMounted` e `onLifecycle` funzionano anche per lui. Un `unmount` durante un `mount` in corso sullo stesso container lo attende. Lancia un errore se mancano `name`, `mount` o `unmount`.

### `OrchestratorEvent`

Eventi sul bus dell'orchestratore: `APP_REGISTERED` (`tuvix:app:registered`), `APP_BOOTSTRAP`, `APP_MOUNT`, `APP_UNMOUNT`, `APP_ERROR` (`AppErrorEvent`: `{ name, error, phase }` per errori in `'load'`, `'bootstrap'`, `'mount'`, `'update'` o `'unmount'`), `APP_STATUS_CHANGE` (`{ name, status }`), `ROUTE_CHANGE` (solo router integrato), `STARTED`, `DESTROYED`.

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### Isolamento CSS

`sandbox: true` oppure `{ css: true }` collega uno shadow root aperto al container (riutilizzato al rimontaggio), monta l'app in un `<div data-tuvix-sandbox-root>` al suo interno e vi carica gli `styles` della entry. Il mount attende i fogli di stile fino a `loader.timeout`. Il JavaScript non viene isolato in sandbox; `JsSandbox` di `@tuvix.js/sandbox` è un'utility autonoma.

### Tipi

`OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition`, `AppSandboxOption`, `RouterSource`, `AppErrorEvent`, `AppErrorPhase`, `AppStatus` (`registered`, `bootstrapping`, `bootstrapped`, `mounting`, `mounted`, `updating`, `unmounting`, `unmounted`, `error`), `RegisteredApp` (forma del record; nessun metodo lo restituisce).

### Re-export

- Da `@tuvix.js/event-bus`: `createEventBus`, `getGlobalBus`, i tipi `IEventBus`, `EventHandler`, `Unsubscribe`.
- Da `@tuvix.js/router`: `createRouter`, `matchPath`, `interceptLinks`, i tipi `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions`.
- Da `@tuvix.js/loader`: `createLoader`, i tipi `Entry`, `MicroAppModule`.

## Casi limite

- `register()` dopo `start()` riconcilia un'app gestita dalle route rispetto al percorso corrente, quindi la monta subito se è attiva. Un'app `mountWhenVisible` registrata dopo `start()` viene osservata subito; un container assente dal DOM in quel momento non viene mai osservato.
- Gli errori di riconciliazione non fanno rifiutare `start()` né `reconcile()`; finiscono in `onError` e nella console. `mountApp` rifiuta.
- Un'app in stato `error` riprova alla riconciliazione successiva che la vuole attiva. `fallback` viene renderizzato solo per errori di caricamento, bootstrap e mount.
- L'unmount rimuove i fogli di stile della entry da `document.head`; il mount successivo li aggiunge di nuovo.
- Due orchestratori condividono `getGlobalBus()`. Passa `eventBus: {}` per un bus privato.
- Dopo `destroy()`, i metodi che modificano lo stato lanciano `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

## Cosa non fa

- Isolare il JavaScript in sandbox.
- Intercettare i clic sui link (usa `interceptLinks`).
- Renderizzare sul server (usa `@tuvix.js/server`).
- Condividere dipendenze tra le app (usa `@tuvix.js/module-federation` o le import map).
- Emettere eventi DOM `tuvix:mounted` per i moduli scritti a mano; lo fanno `defineMicroApp` e gli adapter dei framework.

## Migrazione dalla 0.4

- L'orchestratore usa `getGlobalBus()` a meno che tu non passi `eventBus`; `destroy()` lascia attivo il bus globale.
- Le riconciliazioni non smontano più le app montate manualmente o con `mountWhenVisible`.
- `sandbox: true` renderizza dentro uno shadow root.
- `prefetch: 'hover'` esegue il prefetch solo delle app attivate da un link in hover o con il focus.
- `activeWhen` usa `matchPath`: query e hash ignorati, `:param` funziona, `.` e `(` corrispondono letteralmente.
- `OrchestratorConfig.shared` è stato rimosso (non veniva mai letto). Usa `@tuvix.js/module-federation` o le import map.
- Le `routes` del router corrispondono per intero: una route `'/'` è solo la home page; usa `'/*'` per ogni percorso. `RouteConfig.exact` è stato rimosso.
- `APP_ERROR` contiene `phase` e viene emesso anche per errori di update e unmount.
- `connectRouter({ subscribe, getPath })` sostituisce il bridge `setTimeout` + `reconcile()` per i router esterni.

## Licenza

MIT
