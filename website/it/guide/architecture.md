# Architettura

Tuvix.js è diviso in pacchetti piccoli. L'orchestratore di `@tuvix.js/core` li tiene insieme; ogni altro pacchetto funziona anche da solo.

## I pacchetti e i loro compiti

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## Dalla navigazione al mount

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

La fase 1 termina prima che inizi la fase 2, quindi due app che condividono `#app` non vi si trovano mai nello stesso momento. Se arriva un nuovo path mentre è in corso un reconcile, l'orchestratore completa il passo corrente e poi esegue il reconcile del path più recente. Navigare A → B → A in rapida successione lascia montata solo A.

## Il contratto del modulo

Ogni micro app, scritta a mano o prodotta da un adapter, ha questa forma (`MicroAppModule` di `@tuvix.js/loader`):

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // once, before the first mount
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap` viene eseguito una volta per ogni modulo caricato.
- `mount` riceve il container, le props correnti, il nome dell'app e l'event bus dell'orchestratore.
- `update` riceve le props unite quando la shell chiama `updateAppProps`. `container` indica a un modulo montato in più punti quale mount aggiornare.
- `unmount` deve rimuovere tutto ciò che `mount` ha creato.

## Come il loader trova un modulo

1. **Entry funzione loader** (`() => import('./app')`): il loader usa il modulo risolto, altrimenti il suo export `default`, altrimenti il modulo registrato con il nome dell'app.
2. **Entry URL**: il loader aggiunge i tag `<script>` e `<link>`, li attende e legge il modulo dal registro che `registerModule(name, module)` popola. Gli adapter e `defineMicroApp` chiamano `registerModule` al posto tuo.
3. **Fallback UMD**: se non si è registrato nulla, il loader sceglie una nuova variabile globale di `window` che abbia una funzione `mount`. Se ne sono comparse diverse, sceglie quella il cui nome corrisponde al nome dell'app, altrimenti fallisce.

Il registro e lo stato del ciclo di vita risiedono in `window.__TUVIX_RUNTIME__`, quindi le micro app con bundle separati, ognuna con la propria copia di `@tuvix.js/loader`, vedono comunque un unico registro.

Gli script vengono caricati come `type="module"` quando la entry imposta `type: 'module'` o l'URL termina in `.mjs`, `.mts`, `.ts`, `.tsx` o `.jsx`. Gli altri URL vengono caricati come script classici.

## Stato condiviso del runtime

| Stato | Dove risiede | Perché |
| --- | --- | --- |
| Registro dei moduli | `window.__TUVIX_RUNTIME__` (anche `window.__TUVIX_MODULES__`) | Il loader trova le app di qualsiasi bundle |
| App montate e attese in corso | `window.__TUVIX_RUNTIME__` | `whenMounted` funziona tra bundle diversi |
| Event bus globale | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` restituisce un solo bus per pagina |

Sul server, senza `window`, ognuno di questi ha scope di modulo.

## Modello di isolamento

- **CSS**: `sandbox: true` su `register` renderizza l'app dentro uno shadow root e vi carica gli `styles` della sua entry. Vedi [Sandboxing](/it/guide/sandbox).
- **JavaScript**: nessuno per impostazione predefinita. Tutte le app condividono `window`, `document` e le variabili globali. `JsSandbox` isola solo il codice che esegui tramite il suo proxy.

## Dove guardare dopo

- [Hook del ciclo di vita](/it/guide/lifecycle): il contratto in dettaglio.
- [Eventi del ciclo di vita](/it/guide/lifecycle-events): scopri quando un'app è sulla pagina.
- [Routing](/it/guide/routing): le regole dei pattern.
