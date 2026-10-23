# Configurazione

Tutta la configurazione avviene nel codice. Tuvix.js non legge variabili d'ambiente né file di configurazione.

## Opzioni dell'orchestratore

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Built-in router. Omit it when you follow an external router with connectRouter().
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // Passing eventBus options gives this orchestrator a private bus.
  // Omit it to share getGlobalBus() with every app on the page.
  eventBus: { maxListeners: 50, debug: false },

  // Forwarded to the module loader.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (default)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| Opzione | Default | Effetto |
| --- | --- | --- |
| `router` | nessuno | Crea il router integrato. Vedi [Routing](/it/guide/routing). |
| `eventBus` | nessuno (bus globale) | Bus privato con queste opzioni. `destroy()` distrugge un bus privato e lascia attivo quello globale. |
| `loader.timeout` | `10000` | Millisecondi prima che un tentativo di caricamento venga interrotto. Limita anche l'attesa dei fogli di stile in sandbox. |
| `loader.retries` | `2` | Tentativi aggiuntivi dopo il primo fallimento. |
| `loader.retryDelay` | `1000` | Millisecondi tra un tentativo e l'altro. |
| `loader.globals` | `{}` | Proprietà scritte su `window` prima che vengano eseguiti gli script di una entry. |
| `prefetch.strategy` | `'none'` | Quando scaricare le entry prima del loro mount. Vedi la tabella sotto. |
| `onError` | nessuno | Chiamato con `(error, appName)` quando falliscono load, bootstrap, mount, update o unmount. |
| `onStatusChange` | nessuno | Chiamato con `(appName, status)` a ogni cambio di stato. |

Per condividere dipendenze come React tra le app, usa `@tuvix.js/module-federation` o le import map. L'orchestratore non ha un'opzione per farlo.

### Strategie di prefetch

| Strategia | Quando vengono scaricate le entry |
| --- | --- |
| `none` | Solo quando un'app viene montata. |
| `immediate` | Tutte le entry registrate, subito dopo `start()`. |
| `idle` | Tutte le entry registrate, nel primo `requestIdleCallback` dopo `start()` (timeout di 200 ms dove l'API manca). |
| `hover` | Quando il puntatore entra in un link dello stesso origin, o il focus ci arriva, e il suo path attiverebbe un'app. Ogni app viene scaricata una sola volta. |

Il prefetch aggiunge `<link rel="modulepreload">` per gli script module e `<link rel="prefetch">` per gli script classici e gli stili. Salta le entry di tipo funzione loader, perché chiamare la funzione eseguirebbe il modulo.

## Registrare una micro app

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| Campo | Tipo | Effetto |
| --- | --- | --- |
| `name` | `string` | Univoco. Deve corrispondere al nome con cui si registra il modulo. |
| `entry` | `string \| EntryConfig \| EntryLoader` | Da dove arriva il codice. Vedi sotto. |
| `container` | `string \| HTMLElement` | Selettore o elemento. Viene risolto al momento del mount, quindi l'elemento deve esistere solo da quel momento. |
| `activeWhen` | `string \| (path) => boolean` | Pattern di route o predicato. Senza di esso, l'app segue le `routes` del router che la nominano, oppure la monti tu. |
| `props` | `Record<string, unknown>` | Props iniziali. `updateAppProps` le unisce a queste. |
| `fallback` | `string` | HTML scritto nel container quando load, bootstrap o mount falliscono. |
| `sandbox` | `boolean \| { css?: boolean }` | `true` renderizza l'app in uno shadow root. Vedi [Sandboxing](/it/guide/sandbox). |
| `mountWhenVisible` | `boolean` | Monta l'app quando il container è visibile al 10%. Da quel momento i cambi di route non la toccano. |

### Forme della entry

```ts
import type { Entry } from 'tuvix.js';

// One classic script (UMD or IIFE bundle).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Scripts and styles. `type: 'module'` for ES module bundles such as Vite's `.js` output.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// A loader function. Your bundler code-splits it; the loader passes an AbortSignal.
const lazy: Entry = () => import('./apps/profile');
```

Senza `type`, gli URL che terminano in `.mjs`, `.mts`, `.ts`, `.tsx` o `.jsx` vengono caricati come moduli e tutto il resto come script classico. Un browser esegue uno script module una sola volta per URL, quindi un'app con `type: 'module'` che rimuovi dalla pagina (unload) non può essere caricata di nuovo dallo stesso URL. Usa una funzione loader quando devi rimuovere e ricaricare un'app.

### Cose da sapere sulla registrazione

- `register` lancia un errore per un nome duplicato, una `entry` mancante o un `container` mancante.
- `register` dopo `start()` ha effetto subito: un'app gestita dalle route viene montata se il path corrente la attiva, e un'app con `mountWhenVisible` viene osservata. Prima di `start()`, `register` si limita a salvare la configurazione.
- Un'app legata al viewport resta montata dopo essere uscita dalla vista. Smontala con `unmountApp(name)`.
- Un'app senza `activeWhen` né una route del router resta come la lasci. Chiama tu `mountApp(name)` e `unmountApp(name)`.
- `fallback` è HTML grezzo. Non costruirlo a partire dall'input dell'utente.

## Opzioni del router

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' reads the path from location.hash
  base: '/app', // stripped before matching, added by push() and replace()
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

I path delle route corrispondono all'intero path, quindi `/settings` corrisponde solo a `/settings` e `/settings/`, e `'/'` corrisponde solo a `/`. Termina un path con `/*` per far corrispondere anche i sotto-path; `'/*'` corrisponde a ogni path.

## Opzioni della sandbox

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // shadow root on activate()
  js: true, // proxy window for execScript()
  allowedGlobals: ['gtag'], // extra globals strict mode lets you write
  strict: false, // true: writing any other global throws a TypeError
});
```

L'orchestratore applica l'isolamento CSS alle app registrate con `sandbox: true`. Non applica mai `JsSandbox`. Vedi [Sandboxing](/it/guide/sandbox).

## Opzioni dell'event bus

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = unlimited; past the limit, `on` still adds the listener and warns once per event
  debug: false, // log every emit and subscription
  logger: console.log,
});
```
