# @tuvix.js/loader

> Carica i bundle delle micro app per nome da URL di script o da funzioni loader, con retry, timeout, un registro dei moduli condiviso ed eventi del ciclo di vita.

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentazione completa: [tuvix.js.org/it/packages/loader](https://tuvix.js.org/it/packages/loader).

## Installazione

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core` crea un `ModuleLoader` per te e gli passa `createOrchestrator({ loader })`. Importa questo pacchetto quando scrivi una micro app o un adapter, quando attendi il mount di un'altra app o quando carichi app senza l'orchestratore.

## Avvio rapido

La micro app, compilata in `https://cdn.example.com/dashboard/main.js`:

```ts
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

La shell:

```ts
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
  console.error(result.error);
}
```

`load()` non lancia mai eccezioni. Un fallimento si risolve con `status: 'error'`, `module: null` e l'ultimo errore.

## Entry

`Entry` è uno tra:

- una stringa URL, letta come `{ scripts: [url] }`
- un `EntryConfig`
- una funzione loader come `() => import('./dashboard')`. Riceve `{ signal }`, che viene annullato al timeout, e può risolversi nel modulo, in `{ default: module }` oppure in qualsiasi valore dopo aver chiamato `registerModule(name, module)`.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `scripts` | `string[]` | obbligatorio | URL degli script, eseguiti uno dopo l'altro. |
| `styles` | `string[]` | `[]` | URL dei fogli di stile, caricati in parallelo con gli script. |
| `type` | `'module' \| 'classic'` | dedotto per URL | `.mjs`, `.mts`, `.ts`, `.tsx`, `.jsx` vengono caricati come moduli, il resto come classic. Imposta `'module'` per l'output `.js` di Vite. |
| `integrity` | `Record<string, string>` | nessuno | Hash SRI indicizzati per URL. |

## API

### `ModuleLoader` e `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | ms per tentativo, per tutti gli script e i fogli di stile. `0` lo disattiva. |
| `retries` | `number` | `2` | Tentativi aggiuntivi dopo il primo fallimento. |
| `retryDelay` | `number` | `1000` | ms tra un tentativo e l'altro. |
| `globals` | `Record<string, unknown>` | `{}` | Assegnati a `window` prima di ogni tentativo di una entry URL. |

| Metodo | Comportamento |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | Carica, verifica `mount`/`unmount` e mette in cache per nome. Risolve il modulo prima da `registerModule(name)`, poi da un nuovo global UMD con `mount`. Un nome già in cache ignora `entry`; un nome in fase di caricamento restituisce la stessa promise. |
| `prefetch(entry)` | `<link rel="modulepreload">` per gli script modulo, altrimenti `<link rel="prefetch">`. Salta le funzioni loader. |
| `removeStyles(name)` | Rimuove i fogli di stile dell'app, a meno che un'altra app in cache non li usi. Il successivo `load(name)` li aggiunge di nuovo. |
| `unload(name)` | Rimuove stili e tag script, elimina la voce dalla cache e annulla la registrazione del modulo risolto da questo loader. |
| `clearCache()` | `unload` per ogni app in cache. |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | Leggono la cache. `getStatus` restituisce `'idle'`, `'loading'` o `'loaded'`. |

### `normalizeEntry`

```ts no-check
normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

### `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`

```ts no-check
loadScript(url: string, options?: { type?, integrity?, signal? } | string): Promise<void>;
loadStyle(url: string, options?: { timeout?, integrity?, signal? } | number): Promise<void>;
removeScript(url: string): void;
removeStyle(url: string): void;
prefetchResource(url: string, options?: { as?, type?, integrity? }): void;
```

Un tag per URL, condiviso tra chiamanti concorrenti. Un caricamento fallito rimuove il proprio tag e rifiuta con `[Tuvix Loader] Failed to load script: <url>`. Una chiamata annullata rimuove il tag quando nessun altro chiamante lo sta aspettando. `loadStyle` va in timeout dopo `10000` ms per impostazione predefinita. Ogni tag riceve `crossorigin="anonymous"`. Un secondo argomento stringa di `loadScript` è l'hash di integrity; un numero passato a `loadStyle` è il timeout (forme della 0.4).

### Registro di runtime e ciclo di vita

Lo stato vive su `window.__TUVIX_RUNTIME__`, così le micro app che includono nel bundle una propria copia lo condividono. Senza `window` vive nel modulo.

| Export | Comportamento |
| --- | --- |
| `registerModule(name, module)` | Pubblica un modulo per il loader. Gli adapter e `defineMicroApp` lo chiamano. |
| `unregisterModule(name)` | Lo rimuove. |
| `getRegisteredModule(name)` | Lo restituisce oppure `undefined`. |
| `emitLifecycle(type, { name, container, hydrated, error? })` | Invia un `CustomEvent` `tuvix:mounted`, `tuvix:unmounted` o `tuvix:error` con bubbling e composed su `container`, oppure su `document` quando il container è staccato, e tiene traccia dei container montati. Gli adapter e `defineMicroApp` lo chiamano. |
| `isMounted(name)` | `true` finché un qualsiasi container dell'app è montato. |
| `whenMounted(name, { signal? })` | Si risolve con il `LifecycleDetail` del primo mount, oppure subito con il primo container ancora montato; rifiuta con `signal.reason` in caso di abort. |
| `onLifecycle(type, handler, target = document)` | Ascolta `tuvix:<type>`; restituisce una funzione di rimozione. |
| `hasServerMarkup(el)` | `true` per un elemento figlio o per testo che non sia solo spazi. |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### Tipi

`Entry`, `EntryConfig`, `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppModule`, `MountContext` (`container`, `props?`, `name?`, `bus?`), `UnmountContext`, `UpdateContext` (`props`, `container?`), `MicroAppBus` (`on`, `once`, `emit`, `off`; `IEventBus` lo soddisfa), `LoaderOptions`, `LoadResult`, `LoadStatus`, `CacheEntry`, `PrefetchStrategy` (non letto dal loader), `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.

## Casi limite

- Un timeout annulla il `signal` del tentativo, rimuove i suoi tag e riprova dopo `retryDelay`. Una funzione loader che ignora `signal` continua a girare; il loader smette di aspettarla.
- Dopo `unload(name)`, uno script `type: 'module'` che si è registrato da solo non viene rieseguito dallo stesso URL. Usa una funzione loader o un nuovo URL.
- `unload` rimuove tutti gli URL di script della entry, compresi gli script vendor elencati da altre app.
- Due bundle UMD caricati contemporaneamente: il loader associa i nuovi global al nome dell'app e fallisce indicando i nomi candidati quando non riesce a distinguerli.
- Script e stili cross-origin richiedono `Access-Control-Allow-Origin`.
- Lo stato di mount è per container: smontare uno di due container lascia `isMounted(name)` a `true`. `whenMounted` non rifiuta su `tuvix:error`.
- L'evento del ciclo di vita di un container staccato viene emesso su `document` con `detail.container` ancora impostato. `onLifecycle` su `document` (il default) riceve ogni evento una sola volta.

## Cosa non fa

- Non scarica pagine HTML per estrarne gli script.
- Non isola il JavaScript; gli script girano nello scope globale della pagina.
- Non monta app e non gestisce il routing.

## Licenza

MIT
