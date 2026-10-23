---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (pacchetto ombrello)"
  description="Un pacchetto, un percorso di import. Riesporta l'orchestratore di @tuvix.js/core e le API pubbliche di @tuvix.js/router, @tuvix.js/event-bus, @tuvix.js/loader e @tuvix.js/sandbox."
  icon="🎁"
  github="tuvix"
/>

## Installazione

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Installare `tuvix.js` installa `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` e `@tuvix.js/sandbox`. Tutti e sei i pacchetti includono build ES module e CommonJS e dichiarano `"sideEffects": false`.

## Quando usarlo

Installa `tuvix.js` in un'applicazione shell che usa l'orchestratore insieme al router, all'event bus o alla sandbox. Hai una sola dipendenza da versionare e un solo percorso di import, e il bundler scarta gli export che non importi mai.

Installa invece i pacchetti con scope quando:

- Una micro app parla solo con la shell. `@tuvix.js/event-bus` da solo le fornisce `getGlobalBus()`, senza portare l'orchestratore nei suoi `node_modules`.
- Ti serve un export che il pacchetto ombrello non include, come `registerModule` o `emitLifecycle` da `@tuvix.js/loader`, oppure `pathToRegex` da `@tuvix.js/router`. Vedi [Non incluso](#not-included).
- Vuoi che il tuo `package.json` dichiari da quali parti di Tuvix.js dipende un pacchetto.

Puoi usarli insieme senza problemi. Il pacchetto ombrello riesporta gli stessi moduli, quindi `getGlobalBus` da `tuvix.js` e da `@tuvix.js/event-bus` restituiscono lo stesso bus, e gli helper del ciclo di vita condividono un unico registro su `window`.

## Avvio rapido

Una shell che monta `about` su `/about`, trasforma i clic sui link in navigazioni del router e registra gli errori delle app:

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

L'app `about`, compilata in `https://cdn.example.com/about/main.js`:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Un clic su `<a href="/about?ref=nav">` esegue il push di `/about?ref=nav` e l'orchestratore monta `about` in `#main` (la query string non influisce sul confronto).

## API

Ogni export qui sotto è una riesportazione. La pagina del pacchetto collegata ne documenta firma, opzioni e casi limite.

### Da `@tuvix.js/core`

Documentazione: [`@tuvix.js/core`](/it/packages/core).

| Export | Tipo | Cosa fa |
| --- | --- | --- |
| `createOrchestrator` | funzione | Crea un `Orchestrator`. |
| `Orchestrator` | classe | Registra le app, le riconcilia con l'URL, segue un router (`connectRouter`), aggiorna le props, distrugge. |
| `defineMicroApp` | funzione | Valida un oggetto `{ name, bootstrap?, mount, unmount, update?, ssr? }`, lo registra per il loader e gli fa emettere `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error`. |
| `OrchestratorEvent` | enum | Nomi degli eventi che l'orchestratore emette sul suo bus (`tuvix:app:mount`, `tuvix:app:error`, ...). |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | tipo | Argomenti di `createOrchestrator`, `register` e `defineMicroApp`. |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | tipo | Union degli stati di un'app, l'opzione `sandbox`, l'argomento di `connectRouter`, la forma del record di un'app. |
| `AppErrorEvent`, `AppErrorPhase` | tipo | Payload di `APP_ERROR` `{ name, error, phase }` e la union delle sue fasi (`'load'`, `'bootstrap'`, `'mount'`, `'update'`, `'unmount'`). |

### Da `@tuvix.js/event-bus`

Documentazione: [`@tuvix.js/event-bus`](/it/packages/event-bus).

| Export | Tipo | Cosa fa |
| --- | --- | --- |
| `EventBus` | classe | Bus pub/sub con `on`, `once`, `emit`, `off`, `onAny`. |
| `createEventBus` | funzione | Crea un nuovo `EventBus` separato. |
| `getGlobalBus` | funzione | Restituisce il bus a livello di pagina salvato in `window.__TUVIX_GLOBAL_BUS__`. L'orchestratore lo usa per impostazione predefinita. |
| `resetGlobalBus` | funzione | Distrugge il bus a livello di pagina; la chiamata successiva a `getGlobalBus()` ne crea uno nuovo. |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | tipo | Interfaccia del bus, firme degli handler, funzione di disiscrizione, opzioni del costruttore. |

### Da `@tuvix.js/router`

Documentazione: [`@tuvix.js/router`](/it/packages/router).

| Export | Tipo | Cosa fa |
| --- | --- | --- |
| `Router` | classe | Router history o hash che associa i percorsi ai nomi delle app. |
| `createRouter` | funzione | Crea un `Router`. |
| `matchPath` | funzione | Confronta un percorso con un pattern (`:param`, `/*`, query e hash ignorati). Le stringhe di `activeWhen` lo usano. |
| `matchRoute` | funzione | Restituisce la prima route di un `RouteConfig[]` che corrisponde per intero a un percorso, con `params` e `query`. |
| `normalizePath` | funzione | Aggiunge uno slash iniziale e rimuove quello finale. |
| `interceptLinks` | funzione | Trasforma i clic sui link dello stesso origin in una chiamata `navigate(path)`, con prefetch su intenzione opzionale. |
| `resolveLink` | funzione | Restituisce `{ anchor, url, path }` per il link HTML su cui si è verificato un evento, oppure `null` quando deve gestirlo il browser. |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | tipo | Interfaccia del router, opzioni e forme delle route. |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | tipo | Payload di navigazione, firme di guard e listener. |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | tipo | Risultato e opzioni di `matchPath`, opzioni di `interceptLinks`, risultato e opzioni di `resolveLink`. |

### Da `@tuvix.js/loader`

Documentazione: [`@tuvix.js/loader`](/it/packages/loader).

| Export | Tipo | Cosa fa |
| --- | --- | --- |
| `ModuleLoader` | classe | Carica una entry (URL, configurazione di script/stili o funzione loader) con timeout, tentativi ripetuti e cache. |
| `createLoader` | funzione | Crea un `ModuleLoader`. |
| `whenMounted` | funzione | Si risolve quando un'app emette il suo evento del ciclo di vita `mounted`. |
| `onLifecycle` | funzione | Ascolta gli eventi DOM `tuvix:mounted`, `tuvix:unmounted` o `tuvix:error`. |
| `isMounted` | funzione | `true` finché un qualsiasi container dell'app è montato, secondo gli eventi del ciclo di vita. |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | tipo | Formati di entry e il contratto del ciclo di vita che una micro app implementa. |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | tipo | Opzioni e risultati del loader. |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | tipo | Nomi degli eventi del ciclo di vita, payload e tipo dell'evento DOM. |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### Da `@tuvix.js/sandbox`

Documentazione: [`@tuvix.js/sandbox`](/it/packages/sandbox).

| Export | Tipo | Cosa fa |
| --- | --- | --- |
| `CssSandbox` | classe | Sposta un container in una shadow root e carica i fogli di stile al suo interno. L'orchestratore la usa per `sandbox: true`. |
| `JsSandbox` | classe | `window` proxy che tiene le variabili globali scritte da uno script lontane dal `window` reale. |
| `Sandbox` | classe | `CssSandbox` e `JsSandbox` dietro un'unica coppia `activate` / `deactivate`. |
| `createSandbox` | funzione | Crea una `Sandbox`. |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | tipo | Opzioni e interfacce delle sandbox. |
| `AdoptStylesOptions`, `AdoptedStyles` | tipo | Argomento e valore di ritorno di `CssSandbox.adoptStyles`. |

### Non incluso {#not-included}

Il pacchetto ombrello non include questi elementi. Installa il pacchetto che li fornisce.

| Ti serve | Installa |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource` e i tipi `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` | [`@tuvix.js/loader`](/it/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/it/packages/router) |
| Micro app React, Vue, Svelte o Angular | [`@tuvix.js/react`](/it/packages/react), [`@tuvix.js/vue`](/it/packages/vue), [`@tuvix.js/svelte`](/it/packages/svelte), [`@tuvix.js/angular`](/it/packages/angular) |
| Composizione lato server | [`@tuvix.js/server`](/it/packages/server) |
| Remote di Module Federation | [`@tuvix.js/module-federation`](/it/packages/module-federation) |
| Asset delle island nelle build Vite | [`@tuvix.js/vite`](/it/packages/vite) |
| Il pannello DevTools | [`@tuvix.js/devtools`](/it/packages/devtools) |
| Scaffolding del progetto | [`create-tuvix-app`](/it/packages/create-tuvix-app) |

## Casi limite

- `tuvix.js` ha un solo entry point. Gli import di sottopercorsi come `tuvix.js/core` o `tuvix.js/router` non si risolvono: importa da `tuvix.js` o dal pacchetto con scope.
- Il pacchetto ombrello fissa le sue dipendenze alla stessa release. Se installi `tuvix.js` accanto a una versione diversa di un pacchetto con scope, ottieni due copie di quel pacchetto. `getGlobalBus()` e il registro del ciclo di vita condividono comunque lo stato tramite `window`, ma i controlli `instanceof Orchestrator` o `instanceof EventBus` falliscono tra le due copie.
- `whenMounted`, `onLifecycle` e `isMounted` reagiscono agli eventi DOM `tuvix:*`. I moduli creati con `defineMicroApp` e gli adapter per i framework li emettono; un modulo scritto a mano non ne emette nessuno, a meno che non chiami `emitLifecycle` da `@tuvix.js/loader`. Gli eventi per un container fuori dal documento vengono emessi su `document`.
- `resetGlobalBus()` distrugge il bus usato da un orchestratore in esecuzione. L'orchestratore conserva quel bus distrutto, quindi i suoi eventi non raggiungono più chi si iscrive al successivo `getGlobalBus()`. Chiamalo tra un test e l'altro, dopo `orchestrator.destroy()`.
- Le modifiche di comportamento e le breaking change di `@tuvix.js/core` e `@tuvix.js/router` valgono anche qui senza variazioni. Vedi [Migrazione dalla 0.4](/it/packages/core#migrating-from-0-4).

## Cosa non fa

- Non aggiunge codice proprio. Ogni export proviene da uno dei cinque pacchetti con scope.
- Non include gli adapter per i framework, il pacchetto server, Module Federation, Vite o DevTools.
- Non offre entry di sottopercorso per i singoli pacchetti.
