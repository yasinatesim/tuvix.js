---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="Carica i bundle delle micro app per nome da URL di script o da funzioni loader, con retry, timeout, un registro di moduli condiviso ed eventi del ciclo di vita."
  icon="📦"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## Quando usarlo

`@tuvix.js/loader` trasforma una entry (un URL di script, un elenco di script e stili, oppure `() => import('./app')`) in un modulo di micro app con `mount` e `unmount`. Aggiunge i tag `<script>` e `<link>`, ripete i tentativi falliti, si arrende dopo un timeout e mette in cache il risultato per nome dell'app.

`@tuvix.js/core` crea un `ModuleLoader` per te e gli passa l'opzione `loader` di `createOrchestrator`, quindi la maggior parte delle shell non importa mai questo pacchetto. Importalo quando:

- scrivi una micro app o un adapter che si pubblica con `registerModule`, o che segnala `tuvix:mounted` con `emitLifecycle`
- devi sapere quando un'altra app è stata montata (`whenMounted`, `onLifecycle`)
- carichi micro app senza l'orchestratore, per esempio dal tuo router
- carichi un singolo script o foglio di stile con deduplicazione (`loadScript`, `loadStyle`)

Se il tuo bundler può importare l'app in fase di build e non carichi mai codice da un'altra origine, basta un semplice `import()`.

## Avvio rapido

La micro app pubblica il proprio modulo sotto un nome. Questo file viene compilato in `https://cdn.example.com/dashboard/main.js`:

```ts
// dashboard/src/main.ts
import { registerModule } from '@tuvix.js/loader';

registerModule('dashboard', {
  mount({ container, props }) {
    container.innerHTML = `<h2>Dashboard for user ${String(props?.userId)}</h2>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

La shell lo carica per nome e lo monta:

```ts
// shell/src/main.ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 15000, retries: 1 });
const container = document.getElementById('dashboard')!;

const result = await loader.load('dashboard', {
  scripts: ['https://cdn.example.com/dashboard/main.js'],
  styles: ['https://cdn.example.com/dashboard/main.css'],
  type: 'module',
});

if (result.module) {
  await result.module.mount({ container, props: { userId: 42 } });
} else {
  container.textContent = 'The dashboard is unavailable.';
  console.error(result.error);
}
```

`load()` non lancia mai eccezioni. Un caricamento fallito restituisce `status: 'error'`, `module: null` e l'ultimo errore.

## Forme di entry {#entry-forms}

Una `Entry` indica al loader dove si trova il codice di un'app. Ha tre forme.

**Una stringa URL.** Il loader tratta `'https://cdn.example.com/app.js'` come `{ scripts: ['https://cdn.example.com/app.js'] }`.

**Un oggetto `EntryConfig`:**

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `scripts` | `string[]` | obbligatorio | URL degli script. Il loader li esegue uno dopo l'altro in questo ordine. Un array vuoto non carica nulla e risolve il modulo dal registro. |
| `styles` | `string[]` | `[]` | URL dei fogli di stile, caricati in parallelo agli script. Il caricamento attende entrambi. |
| `type` | `'module' \| 'classic'` | dedotto per URL | Tipo di script per ogni URL in `scripts`. Senza questa opzione, gli URL che terminano in `.mjs`, `.mts`, `.ts`, `.tsx` o `.jsx` vengono caricati come `type="module"` e tutti gli altri come script classici. Imposta `'module'` per l'output ES di Vite o Rollup, che termina in `.js`. |
| `integrity` | `Record<string, string>` | nessuno | Hash di Subresource Integrity indicizzati per URL. Il loader li scrive nei tag `<script>`, `<link>` e di prefetch. |

**Una funzione loader (`EntryLoader`).** Il loader la chiama con `{ signal }` e accetta tre risultati, verificati in questo ordine:

1. un modulo con una funzione `mount`
2. un oggetto il cui export `default` è un modulo di questo tipo (un namespace di modulo ES)
3. niente di utilizzabile: in questo caso il loader cerca il modulo che l'import ha registrato con `registerModule(name, ...)`

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

Il tuo bundler separa `./dashboard` in un chunk dedicato e lo scarica al primo mount. Le funzioni loader sono anche il modo in cui [`@tuvix.js/module-federation`](/it/packages/module-federation) collega un remote federato all'orchestratore.

`signal` viene annullato quando il tentativo va in timeout. Passalo a qualsiasi `fetch` che esegui nel frattempo:

```ts
import type { EntryLoader } from '@tuvix.js/loader';

const entry: EntryLoader = async ({ signal }) => {
  const response = await fetch('/api/manifest/dashboard.json', { signal });
  const { url } = (await response.json()) as { url: string };
  return import(/* @vite-ignore */ url);
};
```

## API

### `ModuleLoader`

```ts no-check
class ModuleLoader {
  constructor(options?: LoaderOptions);
  load(name: string, entry: Entry): Promise<LoadResult>;
  prefetch(entry: Entry): void;
  removeStyles(name: string): void;
  unload(name: string): void;
  clearCache(): void;
  isLoaded(name: string): boolean;
  getModule(name: string): MicroAppModule | null;
  getStatus(name: string): LoadStatus;
  getCachedNames(): string[];
}
```

Ogni `ModuleLoader` mantiene una propria cache dei moduli risolti per nome dell'app. I tag `<script>` e `<link>` valgono per tutta la pagina: due loader che caricano lo stesso URL condividono un solo tag.

`LoaderOptions`:

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Limite di tempo in ms per un tentativo, che copre tutti gli script e i fogli di stile della entry. `0` lo disattiva. |
| `retries` | `number` | `2` | Tentativi aggiuntivi dopo il fallimento del primo. `2` significa fino a 3 tentativi. |
| `retryDelay` | `number` | `1000` | Attesa in ms tra un tentativo e l'altro. |
| `globals` | `Record<string, unknown>` | `{}` | Proprietà che il loader assegna a `window` prima di ogni tentativo di una entry URL, per i bundle UMD che si aspettano `window.React` o un oggetto di configurazione. Le entry con funzione loader la ignorano. |

#### `load(name, entry)`

Si risolve in un `LoadResult`:

| Campo | Tipo | Significato |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | Esito del caricamento. |
| `module` | `MicroAppModule \| null` | Il modulo risolto, `null` in caso di errore. |
| `error` | `Error \| null` | L'errore dell'ultimo tentativo. |
| `duration` | `number` | Millisecondi dalla chiamata al risultato, misurati con `performance.now()`. |

Per una entry URL, un tentativo:

1. assegna `options.globals` a `window`
2. aggiunge gli script in ordine, ciascuno in attesa del precedente, e i fogli di stile in parallelo
3. legge il modulo dal registro (`getRegisteredModule(name)`)
4. in mancanza, ripiega su un global UMD: una proprietà di `window` con una funzione `mount` comparsa durante questo caricamento

Il loader poi verifica che il modulo abbia le funzioni `mount` e `unmount` e lo mette in cache sotto `name`. Le chiamate successive con lo stesso nome restituiscono il modulo in cache e ignorano `entry`. Una seconda chiamata mentre la prima è ancora in corso restituisce la stessa promise. I caricamenti di nomi diversi vengono eseguiti in parallelo.

#### `prefetch(entry)`

Chiede al browser di scaricare i file di una entry senza eseguirli. Gli script modulo ricevono `<link rel="modulepreload">`; gli script classici e i fogli di stile ricevono `<link rel="prefetch">`. Le entry con funzione loader vengono saltate, perché chiamare la funzione eseguirebbe il modulo. L'orchestratore lo chiama per la sua impostazione `prefetch`.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

Rimuove i fogli di stile di un'app caricata, così il suo CSS smette di applicarsi mentre è smontata. Un foglio di stile resta quando un'altra app in cache, di cui non hai rimosso gli stili, elenca lo stesso URL. Il successivo `load(name)` aggiunge di nuovo i fogli di stile e li attende prima di risolversi. L'orchestratore chiama `removeStyles` dopo ogni smontaggio.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
const container = document.getElementById('cart')!;
const { module } = await loader.load('cart', { scripts: ['/cart.js'], styles: ['/cart.css'] });

await module?.mount({ container });
await module?.unmount({ container });
loader.removeStyles('cart');
```

#### `unload(name)`

Dimentica un'app: rimuove i suoi fogli di stile e i tag script, la elimina dalla cache e la deregistra dal registro condiviso quando il modulo registrato è quello che questo loader ha risolto. Il successivo `load(name)` scarica ed esegue di nuovo la entry. L'orchestratore lo chiama da `unregister(name)`.

#### `clearCache()`

Chiama `unload` per ogni app in cache. L'orchestratore lo chiama da `destroy()`.

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

Leggono la cache. `getStatus` restituisce `'loading'` mentre un caricamento è in corso, `'loaded'` quando il modulo è in cache e `'idle'` negli altri casi. Un caricamento fallito lascia lo stato a `'idle'`.

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

Equivale a `new ModuleLoader(options)`. Accetta le `LoaderOptions` della tabella precedente.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

Per impostare queste opzioni per l'orchestratore, passale come `loader`:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

Trasforma un URL in `{ scripts: [url] }` e restituisce un `EntryConfig` invariato. Non accetta funzioni loader: verifica prima `typeof entry === 'function'`.

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | dedotto dall'estensione | Tipo di script, con le stesse regole di `EntryConfig.type`. |
| `integrity` | `string` | nessuno | Hash SRI per l'attributo `integrity`. |
| `signal` | `AbortSignal` | nessuno | Smette di attendere quando viene annullato. La promise viene rifiutata con il motivo del signal. |

Aggiunge `<script crossorigin="anonymous">` a `document.head` e si risolve al suo evento `load`. Le chiamate concorrenti per uno stesso URL condividono un solo tag, e una chiamata per un URL già caricato si risolve subito. Un caricamento fallito rimuove il proprio tag e viene rifiutato con `[Tuvix Loader] Failed to load script: <url>`, così la chiamata successiva parte con un tag nuovo. Una chiamata annullata rimuove il tag solo quando nessun altro chiamante lo sta ancora aspettando. `loadScript` non ha un timeout proprio: passa un `signal`.

Una stringa come secondo argomento viene letta come hash di integrità, come nella 0.4.

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Fa fallire il caricamento dopo questi ms con `[Tuvix Loader] Style load timed out: <url>`. `0` lo disattiva. |
| `integrity` | `string` | nessuno | Hash SRI per l'attributo `integrity`. |
| `signal` | `AbortSignal` | nessuno | Smette di attendere quando viene annullato. |

Aggiunge `<link rel="stylesheet" crossorigin="anonymous">` a `document.head` con le stesse regole di condivisione, fallimento e annullamento di `loadScript`. Un numero come secondo argomento viene letto come timeout, come nella 0.4.

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

Rimuove il tag che `loadScript` ha aggiunto per `url`, più qualsiasi `<script>` il cui attributo `src` sia uguale a `url`. Un caricamento ancora in corso per quell'URL viene rifiutato con `[Tuvix Loader] Removed before load: <url>`. Il successivo `loadScript(url)` aggiunge un nuovo tag. Il codice che lo script ha già eseguito resta in memoria.

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

Equivale a `removeScript` per i tag `<link rel="stylesheet">`.

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `'style'` per gli URL `.css`, altrimenti `'script'` | Tipo di risorsa. |
| `type` | `'module' \| 'classic'` | dedotto dall'estensione | Gli script modulo ricevono `rel="modulepreload"`. |
| `integrity` | `string` | nessuno | Hash SRI per il link. |

Aggiunge un solo `<link>` per URL e pagina. Un URL già gestito da `loadScript` o `loadStyle`, o già sottoposto a prefetch, viene saltato.

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

Pubblica un modulo sotto un nome, così un loader può trovarlo dopo l'esecuzione dello script dell'app. Una seconda chiamata con lo stesso nome sostituisce il primo modulo. Gli adapter React, Vue, Svelte e Angular e `defineMicroApp` di core lo chiamano per te; chiamalo tu quando scrivi il modulo a mano.

Il registro e lo stato delle app montate si trovano in `window.__TUVIX_RUNTIME__`, e la mappa dei moduli è raggiungibile anche come `window.__TUVIX_MODULES__`. Le micro app che includono ciascuna una propria copia di `@tuvix.js/loader` leggono e scrivono lo stesso registro. Sul server, senza `window`, lo stato vive nel modulo.

Una micro app scritta a mano che segue il contratto degli adapter:

```ts
import { emitLifecycle, hasServerMarkup, registerModule } from '@tuvix.js/loader';

registerModule('clock', {
  mount({ container }) {
    const hydrated = hasServerMarkup(container);
    if (!hydrated) container.textContent = new Date().toLocaleTimeString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
});
```

### `unregisterModule`

```ts no-check
function unregisterModule(name: string): void;
```

Rimuove un modulo dal registro. `ModuleLoader.unload` lo chiama per i moduli che ha risolto.

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

Restituisce il modulo registrato, oppure `undefined`.

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

Registra un cambio del ciclo di vita e invia un `CustomEvent` chiamato `tuvix:mounted`, `tuvix:unmounted` o `tuvix:error`. L'evento fa bubbling ed è `composed`, quindi un listener su `document` riceve gli eventi dai container dentro le shadow root. Quando `detail.container` è nel DOM, l'evento parte dal container e risale fino a `document` una sola volta. Quando il container è staccato (`isConnected` è `false`), per esempio perché React ha rimosso un'island prima che l'adapter segnalasse `unmounted`, l'evento parte da `document` stesso, perché un evento su un elemento staccato non lo raggiunge mai. In entrambi i casi `detail.container` punta comunque all'elemento. `event.detail` è il `LifecycleDetail`:

| Campo | Tipo | Significato |
| --- | --- | --- |
| `name` | `string` | Nome della micro app. |
| `container` | `HTMLElement` | Elemento in cui l'app ha eseguito il rendering. |
| `hydrated` | `boolean` | `true` quando l'adapter ha adottato il markup renderizzato dal server invece di eseguire un nuovo rendering. |
| `error` | `unknown` | Il valore lanciato, impostato negli eventi `error`. |

`mounted` registra il container come montato per `detail.name` e risolve le promise `whenMounted(name)` in attesa. `unmounted` rimuove quel container dal registro. `error` invia solo l'evento. Gli adapter React, Vue, Svelte e Angular e `defineMicroApp` di core lo chiamano al termine di mount e unmount e quando uno dei due lancia un'eccezione.

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

`true` finché almeno un container di `name` è montato. Il runtime tiene traccia dei container montati per ogni app, quindi se un modulo viene montato in due container e ne smonti uno, `isMounted(name)` resta `true` finché non viene smontato anche il secondo.

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

Si risolve con il `LifecycleDetail` del primo mount. Se l'app è già montata, si risolve subito con il detail del suo container montato da più tempo. Annulla `signal` per smettere di attendere; la promise viene allora rifiutata con il motivo del signal.

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

Ascolta `tuvix:<type>` su `target` (default `document`) e restituisce una funzione che rimuove il listener. Con il target di default l'handler viene eseguito una volta per evento, sia per i container collegati sia per quelli staccati. Un listener su un elemento container non riceve gli eventi inviati mentre quel container è staccato.

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

Senza questo pacchetto, ascolta l'evento DOM:

```ts
import type { LifecycleEvent } from '@tuvix.js/loader';

document.addEventListener('tuvix:mounted', (event) => {
  const { name, hydrated } = (event as LifecycleEvent).detail;
  console.log(name, hydrated);
});
```

### `hasServerMarkup`

```ts no-check
function hasServerMarkup(container: Element): boolean;
```

`true` quando l'elemento ha un elemento figlio o un nodo di testo con testo non composto solo da spazi. Commenti e spazi bianchi non contano. Gli adapter lo usano per scegliere tra hydration e un nuovo rendering.

### Tipi

Le interfacce che un modulo di micro app implementa:

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: (context: MountContext) => void | Promise<void>;
  unmount: (context: UnmountContext) => void | Promise<void>;
  update?: (context: UpdateContext) => void | Promise<void>;
  [key: string]: unknown;
}

interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
  /** App name the orchestrator registered this module under */
  name?: string;
  /** The orchestrator's event bus */
  bus?: MicroAppBus;
}

interface UnmountContext {
  container: HTMLElement;
}

interface UpdateContext {
  props: Record<string, unknown>;
  /** Container to update; without it, adapters update every mounted instance */
  container?: HTMLElement;
}

interface MicroAppBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  emit<T = unknown>(event: string, data?: T): void;
  off<T = unknown>(event: string, handler: (data: T) => void): void;
}
```

L'orchestratore passa `name` e `bus` a ogni mount. `bus` è l'istanza [`@tuvix.js/event-bus`](/it/packages/event-bus) dell'orchestratore; `MicroAppBus` la descrive strutturalmente, quindi il loader non dipende dal pacchetto event bus.

| Tipo | Significato |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`. |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`, vedi [Forme di entry](#entry-forms). |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`. |
| `EntryLoaderContext` | `{ signal: AbortSignal }`. |
| `ScriptType` | `'module' \| 'classic'`. |
| `MicroAppModule` | Oggetto del ciclo di vita esportato da una micro app. |
| `MountContext`, `UnmountContext`, `UpdateContext` | Argomenti di `mount`, `unmount` e `update`. |
| `MicroAppBus` | `{ on, once, emit, off }`; `IEventBus` lo soddisfa. |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`. |
| `LoadResult` | `{ status, module, error, duration }`. |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`. |
| `CacheEntry` | `{ module, loadedAt, entry }`, un modulo in cache. |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`. Il loader non lo legge. |
| `ResourceOptions` | `{ integrity?, signal? }`, condiviso da `loadScript` e `loadStyle`. |
| `LoadScriptOptions` | `ResourceOptions` più `type?`. |
| `LoadStyleOptions` | `ResourceOptions` più `timeout?`. |
| `PrefetchOptions` | `{ as?, type?, integrity? }`. |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`. |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`. |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`. |

## Casi limite

- **Timeout.** `timeout` copre un intero tentativo. Quando scatta, il loader annulla il `signal` del tentativo, rimuove i tag del tentativo che nessun altro caricamento sta aspettando, attende `retryDelay` e riprova. L'errore è `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms`. Una funzione loader che ignora `signal` continua a girare in background; il loader smette di attenderla.
- **Retry.** Uno `<script>` fallito viene rimosso prima del tentativo successivo, quindi un retry aggiunge un solo tag nuovo. Dopo l'ultimo tentativo `load()` si risolve con l'ultimo errore.
- **Stesso URL, più app.** Due entry che elencano lo stesso script vendor condividono un solo tag e un solo download.
- **Entry in cache.** `load(name, otherEntry)` restituisce il modulo in cache sotto `name` e ignora `otherEntry`. Chiama prima `unload(name)` per cambiare entry.
- **Gli script modulo vengono eseguiti una volta per URL.** Dopo `unload(name)`, un'app il cui script `type: 'module'` ha chiamato `registerModule` non si carica di nuovo dallo stesso URL, perché il browser non esegue due volte uno script modulo. Il caricamento fallisce con `no exports found`. Usa una entry con funzione loader o un nuovo URL (un hash del contenuto o `?v=2`).
- **`unload` rimuove i tag script condivisi.** Rimuove ogni URL di script della entry, compreso uno script vendor elencato anche da un'altra app. Il codice già eseguito resta; un caricamento successivo che elenca l'URL aggiunge di nuovo il tag e uno script classico viene rieseguito.
- **CORS.** Il loader imposta `crossorigin="anonymous"` su ogni tag. Uno script o un foglio di stile da un'altra origine richiede un header `Access-Control-Allow-Origin`, altrimenti il browser lo blocca e il caricamento fallisce.
- **Global UMD.** Quando due bundle UMD vengono caricati nello stesso momento, il loader salta i global già rivendicati da un altro caricamento e associa i restanti al nome dell'app, ignorando maiuscole e punteggiatura (`my-app` corrisponde a `MyApp`). Se restano più candidati, il caricamento fallisce con `several globals with mount() appeared while it loaded (<names>)`. `registerModule` evita di dover indovinare.
- **Ciclo di vita mancante.** Un modulo senza `mount` o `unmount` fallisce con `[Tuvix Loader] Module "<name>" is missing required "unmount" function.`
- **Nessun modulo trovato.** Una entry URL i cui script non registrano un modulo né definiscono un global UMD fallisce con `Module "<name>" loaded but no exports found`.
- **Più container.** Il runtime tiene traccia dello stato di mount per container. Smontare uno di due container lascia `isMounted(name)` a `true`; `whenMounted(name)` restituisce il container montato da più tempo ancora attivo.
- **Container staccati.** Quando un framework host rimuove il container prima che l'adapter segnali `unmounted` o `error`, `emitLifecycle` invia l'evento su `document`. Ascolta su `document` (il default di `onLifecycle`) per ricevere ogni evento.
- **`whenMounted` ignora gli errori.** Un evento `tuvix:error` non la rifiuta. Passa un `signal` o ascolta con `onLifecycle('error', ...)`.
- **Server.** Le funzioni del runtime funzionano senza `window`; `emitLifecycle` salta l'evento DOM quando `CustomEvent` non è definito. `ModuleLoader`, `loadScript`, `loadStyle` e `prefetchResource` richiedono `document`.

## Cosa non fa

- Non scarica una pagina HTML per estrarne gli script. Elenca gli URL di script e stili, oppure usa una funzione loader.
- Non isola il JavaScript. Gli script vengono eseguiti nello scope globale della pagina. Per l'isolamento CSS usa l'opzione `sandbox` dell'orchestratore o [`@tuvix.js/sandbox`](/it/packages/sandbox).
- Non monta le app. `module.mount` lo chiami tu o l'orchestratore.
- Non mantiene una cache tra un caricamento di pagina e l'altro. Se ne occupa la cache HTTP del browser.
- Non legge `PrefetchStrategy`; è l'impostazione `prefetch` dell'orchestratore a decidere quando chiamare `prefetch`.

## Migrazione dalla 0.4

- `LoaderOptions.fetch` e `EntryConfig.html` sono stati rimossi. Il loader non li leggeva mai. Eliminali dalla tua configurazione.
- `loadScript(url, integrity)` e `loadStyle(url, timeoutMs)` funzionano ancora. La forma con oggetto di opzioni aggiunge `type` e `signal`:

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- L'output ES di Vite che termina in `.js` veniva caricato come script classico nella 0.4 e falliva alla prima istruzione `import`. Imposta `type: 'module'` sulla entry.
- Una entry `type: 'module'` non si carica più di nuovo dallo stesso URL dopo `unload`. Usa una funzione loader o un nuovo URL.
- `load()` per un modulo in cache riporta la `duration` reale invece di `0`.
- La versione 0.4 di questa pagina mostrava `loader.load(url)`, `result.app`, `onLoadStart`, `cache` e `loader.clear()`. Nessuno di questi esisteva. Usa `load(name, entry)`, `result.module`, `unload(name)` e `clearCache()`.
