# @tuvix.js/loader

> Lädt Bundles von Micro Apps nach Namen aus Skript-URLs oder Loader-Funktionen, mit Wiederholungen, Timeouts, einer gemeinsamen Modul-Registry und Lifecycle-Events.

Teil des Microfrontend-Frameworks [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Vollständige Dokumentation: [tuvix.js.org/de/packages/loader](https://tuvix.js.org/de/packages/loader).

## Installation

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core` erzeugt für dich einen `ModuleLoader` und übergibt ihm `createOrchestrator({ loader })`. Importiere dieses Paket, wenn du eine Micro App oder einen Adapter schreibst, darauf wartest, dass eine andere App mountet, oder Apps ohne den Orchestrator lädst.

## Schnellstart

Die Micro App, gebaut nach `https://cdn.example.com/dashboard/main.js`:

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

Die Shell:

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

`load()` wirft nie. Ein Fehlschlag löst mit `status: 'error'`, `module: null` und dem letzten Fehler auf.

## Entries

`Entry` ist eines von:

- ein URL-String, gelesen als `{ scripts: [url] }`
- eine `EntryConfig`
- eine Loader-Funktion wie `() => import('./dashboard')`. Sie erhält `{ signal }`, das bei einem Timeout abbricht, und darf zum Modul, zu `{ default: module }` oder nach einem Aufruf von `registerModule(name, module)` zu einem beliebigen Wert auflösen.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `scripts` | `string[]` | erforderlich | Skript-URLs, nacheinander ausgeführt. |
| `styles` | `string[]` | `[]` | Stylesheet-URLs, parallel zu den Skripten geladen. |
| `type` | `'module' \| 'classic'` | pro URL abgeleitet | `.mjs`, `.mts`, `.ts`, `.tsx`, `.jsx` laden als Module, der Rest als klassische Skripte. Setze `'module'` für die `.js`-Ausgabe von Vite. |
| `integrity` | `Record<string, string>` | keiner | SRI-Hashes, nach URL geschlüsselt. |

## API

### `ModuleLoader` und `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | ms pro Versuch, für alle Skripte und Stylesheets zusammen. `0` deaktiviert ihn. |
| `retries` | `number` | `2` | Zusätzliche Versuche nach dem ersten Fehlschlag. |
| `retryDelay` | `number` | `1000` | ms zwischen den Versuchen. |
| `globals` | `Record<string, unknown>` | `{}` | Werden vor jedem Versuch eines URL-Entrys an `window` zugewiesen. |

| Methode | Verhalten |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | Lädt, prüft `mount`/`unmount` und cacht nach Namen. Ermittelt das Modul zuerst über `registerModule(name)`, dann über ein neues UMD-Global mit `mount`. Bei einem gecachten Namen wird `entry` ignoriert; ein Name, der gerade lädt, gibt dasselbe Promise zurück. |
| `prefetch(entry)` | `<link rel="modulepreload">` für Modulskripte, sonst `<link rel="prefetch">`. Überspringt Loader-Funktionen. |
| `removeStyles(name)` | Entfernt die Stylesheets der App, außer eine andere gecachte App verwendet sie. Das nächste `load(name)` fügt sie wieder hinzu. |
| `unload(name)` | Entfernt Styles und Skript-Tags, verwirft den Cache-Eintrag und hebt die Registrierung des Moduls auf, das dieser Loader ermittelt hat. |
| `clearCache()` | `unload` für jede gecachte App. |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | Lesen den Cache. `getStatus` gibt `'idle'`, `'loading'` oder `'loaded'` zurück. |

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

Ein Tag pro URL, gemeinsam genutzt von gleichzeitigen Aufrufern. Ein fehlgeschlagener Ladevorgang entfernt sein Tag und rejected mit `[Tuvix Loader] Failed to load script: <url>`. Ein abgebrochener Aufruf entfernt das Tag, wenn kein anderer Aufrufer darauf wartet. `loadStyle` läuft standardmäßig nach `10000` ms in einen Timeout. Jedes Tag erhält `crossorigin="anonymous"`. Ein String als zweites Argument von `loadScript` ist der Integrity-Hash, eine Zahl bei `loadStyle` ist der Timeout (Formen aus 0.4).

### Laufzeit-Registry und Lifecycle

Der Zustand liegt in `window.__TUVIX_RUNTIME__`, damit Micro Apps, die ihre eigene Kopie bundeln, ihn teilen. Ohne `window` liegt er im Modul.

| Export | Verhalten |
| --- | --- |
| `registerModule(name, module)` | Veröffentlicht ein Modul für den Loader. Die Adapter und `defineMicroApp` rufen es auf. |
| `unregisterModule(name)` | Entfernt es. |
| `getRegisteredModule(name)` | Gibt es zurück oder `undefined`. |
| `emitLifecycle(type, { name, container, hydrated, error? })` | Löst ein bubbelndes, composed `CustomEvent` `tuvix:mounted`, `tuvix:unmounted` oder `tuvix:error` auf `container` aus, oder auf `document`, wenn der Container nicht im DOM hängt, und verfolgt gemountete Container. Die Adapter und `defineMicroApp` rufen es auf. |
| `isMounted(name)` | `true`, solange irgendein Container der App gemountet ist. |
| `whenMounted(name, { signal? })` | Löst mit dem `LifecycleDetail` des ersten Mounts auf, oder sofort mit dem ältesten noch gemounteten Container; rejected bei einem Abbruch mit `signal.reason`. |
| `onLifecycle(type, handler, target = document)` | Lauscht auf `tuvix:<type>`; gibt eine Funktion zum Entfernen zurück. |
| `hasServerMarkup(el)` | `true` bei einem Kindelement oder Text, der nicht nur aus Leerzeichen besteht. |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### Typen

`Entry`, `EntryConfig`, `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppModule`, `MountContext` (`container`, `props?`, `name?`, `bus?`), `UnmountContext`, `UpdateContext` (`props`, `container?`), `MicroAppBus` (`on`, `once`, `emit`, `off`; `IEventBus` erfüllt ihn), `LoaderOptions`, `LoadResult`, `LoadStatus`, `CacheEntry`, `PrefetchStrategy` (vom Loader nicht gelesen), `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.

## Sonderfälle

- Ein Timeout bricht das `signal` des Versuchs ab, entfernt dessen Tags und wiederholt nach `retryDelay`. Eine Loader-Funktion, die `signal` ignoriert, läuft weiter; der Loader hört auf, auf sie zu warten.
- Nach `unload(name)` läuft ein `type: 'module'`-Skript, das sich selbst registriert hat, von derselben URL nicht erneut. Verwende eine Loader-Funktion oder eine neue URL.
- `unload` entfernt jede Skript-URL des Entrys, auch Vendor-Skripte, die andere Apps ebenfalls auflisten.
- Zwei UMD-Bundles laden gleichzeitig: Der Loader ordnet neue Globals dem App-Namen zu und schlägt mit den Kandidatennamen fehl, wenn er sie nicht auseinanderhalten kann.
- Cross-Origin-Skripte und -Styles brauchen `Access-Control-Allow-Origin`.
- Der Mount-Zustand gilt pro Container: Wird einer von zwei Containern unmountet, bleibt `isMounted(name)` `true`. `whenMounted` rejected nicht bei `tuvix:error`.
- Das Lifecycle-Event eines nicht eingehängten Containers wird auf `document` ausgelöst, wobei `detail.container` gesetzt bleibt. `onLifecycle` auf `document` (der Standard) empfängt jedes Event genau einmal.

## Was es nicht tut

- Es lädt keine HTML-Seiten und extrahiert keine Skripte daraus.
- Es isoliert kein JavaScript; Skripte laufen im globalen Scope der Seite.
- Es mountet keine Apps und übernimmt kein Routing.

## Lizenz

MIT
