---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="Lädt Micro-App-Bundles per Name aus Skript-URLs oder Loader-Funktionen, mit Wiederholungen, Timeouts, einer gemeinsamen Modul-Registry und Lifecycle-Events."
  icon="📦"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## Wann du es verwendest

`@tuvix.js/loader` macht aus einem Entry (einer Skript-URL, einer Liste von Skripten und Styles oder `() => import('./app')`) ein Micro-App-Modul mit `mount` und `unmount`. Es fügt die `<script>`- und `<link>`-Tags hinzu, wiederholt fehlgeschlagene Versuche, gibt nach einem Timeout auf und cacht das Ergebnis nach App-Name.

`@tuvix.js/core` erstellt einen `ModuleLoader` für dich und übergibt ihm die Option `loader` von `createOrchestrator`. Die meisten Shells importieren dieses Paket daher nie. Importiere es, wenn du:

- eine Micro App oder einen Adapter schreibst, der sich mit `registerModule` veröffentlicht oder `tuvix:mounted` mit `emitLifecycle` meldet
- wissen musst, wann eine andere App gemountet hat (`whenMounted`, `onLifecycle`)
- Micro Apps ohne den Orchestrator lädst, zum Beispiel aus deinem eigenen Router
- ein einzelnes Skript oder Stylesheet mit Deduplizierung lädst (`loadScript`, `loadStyle`)

Kann dein Bundler die App zur Build-Zeit importieren und lädst du nie Code von einer anderen Origin, reicht ein einfaches `import()`.

## Schnellstart

Die Micro App veröffentlicht ihr Modul unter einem Namen. Diese Datei wird nach `https://cdn.example.com/dashboard/main.js` gebaut:

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

Die Shell lädt sie per Name und mountet sie:

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

`load()` wirft nie. Ein fehlgeschlagener Ladevorgang kommt mit `status: 'error'`, `module: null` und dem letzten Fehler zurück.

## Entry-Formen {#entry-forms}

Ein `Entry` sagt dem Loader, wo der Code einer App liegt. Es gibt drei Formen.

**Ein URL-String.** Der Loader behandelt `'https://cdn.example.com/app.js'` wie `{ scripts: ['https://cdn.example.com/app.js'] }`.

**Ein `EntryConfig`-Objekt:**

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `scripts` | `string[]` | erforderlich | Skript-URLs. Der Loader führt sie in dieser Reihenfolge nacheinander aus. Ein leeres Array lädt nichts und löst das Modul aus der Registry auf. |
| `styles` | `string[]` | `[]` | Stylesheet-URLs, parallel zu den Skripten geladen. Der Ladevorgang wartet auf beides. |
| `type` | `'module' \| 'classic'` | pro URL abgeleitet | Skripttyp für jede URL in `scripts`. Ohne ihn laden URLs mit der Endung `.mjs`, `.mts`, `.ts`, `.tsx` oder `.jsx` als `type="module"`, alle anderen als klassisches Skript. Setze `'module'` für ES-Ausgaben von Vite oder Rollup, die auf `.js` enden. |
| `integrity` | `Record<string, string>` | keiner | Subresource-Integrity-Hashes, nach URL geordnet. Der Loader schreibt sie in die `<script>`-, `<link>`- und Prefetch-Tags. |

**Eine Loader-Funktion (`EntryLoader`).** Der Loader ruft sie mit `{ signal }` auf und akzeptiert drei Ergebnisse, in dieser Reihenfolge geprüft:

1. ein Modul mit einer `mount`-Funktion
2. ein Objekt, dessen `default`-Export ein solches Modul ist (ein ES-Modul-Namespace)
3. nichts Brauchbares; dann sucht der Loader das Modul, das der Import mit `registerModule(name, ...)` registriert hat

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

Dein Bundler teilt `./dashboard` in einen eigenen Chunk auf und lädt ihn beim ersten Mount. Über Loader-Funktionen bindet auch [`@tuvix.js/module-federation`](/de/packages/module-federation) ein föderiertes Remote an den Orchestrator an.

`signal` bricht ab, wenn der Versuch in einen Timeout läuft. Gib es an alles weiter, was du unterwegs per `fetch` abrufst:

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

Jeder `ModuleLoader` führt seinen eigenen Cache aufgelöster Module nach App-Name. Die `<script>`- und `<link>`-Tags gelten seitenweit: Zwei Loader, die dieselbe URL laden, teilen sich ein Tag.

`LoaderOptions`:

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Zeitlimit in ms für einen Versuch, über alle Skripte und Stylesheets des Entrys. `0` deaktiviert es. |
| `retries` | `number` | `2` | Zusätzliche Versuche, nachdem der erste fehlschlägt. `2` bedeutet bis zu 3 Versuche. |
| `retryDelay` | `number` | `1000` | Wartezeit in ms zwischen Versuchen. |
| `globals` | `Record<string, unknown>` | `{}` | Eigenschaften, die der Loader vor jedem Versuch eines URL-Entrys auf `window` setzt, für UMD-Bundles, die `window.React` oder ein Config-Objekt erwarten. Entries als Loader-Funktion ignorieren sie. |

#### `load(name, entry)`

Wird zu einem `LoadResult` aufgelöst:

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | Ergebnis des Ladevorgangs. |
| `module` | `MicroAppModule \| null` | Das aufgelöste Modul, bei einem Fehler `null`. |
| `error` | `Error \| null` | Der Fehler des letzten Versuchs. |
| `duration` | `number` | Millisekunden vom Aufruf bis zum Ergebnis, gemessen mit `performance.now()`. |

Bei einem URL-Entry macht ein Versuch Folgendes:

1. setzt `options.globals` auf `window`
2. hängt die Skripte der Reihe nach an, wobei jedes auf das vorherige wartet, und die Stylesheets parallel
3. liest das Modul aus der Registry (`getRegisteredModule(name)`)
4. greift ersatzweise auf ein UMD-Global zurück: eine `window`-Eigenschaft mit einer `mount`-Funktion, die während dieses Ladevorgangs erschienen ist

Danach prüft der Loader, ob das Modul `mount`- und `unmount`-Funktionen hat, und cacht es unter `name`. Spätere Aufrufe mit demselben Namen geben das gecachte Modul zurück und ignorieren `entry`. Ein zweiter Aufruf, während der erste noch lädt, gibt dasselbe Promise zurück. Ladevorgänge verschiedener Namen laufen parallel.

#### `prefetch(entry)`

Bittet den Browser, die Dateien eines Entrys herunterzuladen, ohne sie auszuführen. Modul-Skripte erhalten `<link rel="modulepreload">`, klassische Skripte und Stylesheets `<link rel="prefetch">`. Entries als Loader-Funktion werden übersprungen, weil der Aufruf der Funktion das Modul ausführen würde. Der Orchestrator ruft dies für seine `prefetch`-Einstellung auf.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

Entfernt die Stylesheets einer geladenen App, damit ihr CSS nicht mehr greift, solange sie unmountet ist. Ein Stylesheet bleibt, wenn eine andere gecachte App, deren Styles du nicht entfernt hast, dieselbe URL aufführt. Das nächste `load(name)` fügt die Stylesheets wieder hinzu und wartet auf sie, bevor es aufgelöst wird. Der Orchestrator ruft `removeStyles` nach jedem Unmount auf.

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

Vergisst eine App: entfernt ihre Stylesheets und Script-Tags, löscht sie aus dem Cache und meldet sie aus der gemeinsamen Registry ab, wenn das registrierte Modul dasjenige ist, das dieser Loader aufgelöst hat. Das nächste `load(name)` lädt und führt den Entry erneut aus. Der Orchestrator ruft es aus `unregister(name)` auf.

#### `clearCache()`

Ruft `unload` für jede gecachte App auf. Der Orchestrator ruft es aus `destroy()` auf.

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

Lesen den Cache. `getStatus` gibt `'loading'` zurück, solange ein Ladevorgang läuft, `'loaded'`, sobald das Modul gecacht ist, und sonst `'idle'`. Nach einem fehlgeschlagenen Ladevorgang bleibt der Status `'idle'`.

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

Entspricht `new ModuleLoader(options)`. Nimmt die `LoaderOptions` aus der Tabelle oben.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

Um diese Optionen für den Orchestrator zu setzen, übergib sie als `loader`:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

Macht aus einer URL `{ scripts: [url] }` und gibt eine `EntryConfig` unverändert zurück. Loader-Funktionen akzeptiert es nicht; prüfe vorher `typeof entry === 'function'`.

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | aus der Endung abgeleitet | Skripttyp, mit denselben Regeln wie `EntryConfig.type`. |
| `integrity` | `string` | keiner | SRI-Hash für das Attribut `integrity`. |
| `signal` | `AbortSignal` | keiner | Beendet das Warten beim Abbruch. Das Promise lehnt dann mit dem Grund des Signals ab. |

Hängt `<script crossorigin="anonymous">` an `document.head` an und wird bei dessen `load`-Event aufgelöst. Gleichzeitige Aufrufe für eine URL teilen sich ein Tag, und ein Aufruf für eine bereits geladene URL wird sofort aufgelöst. Ein fehlgeschlagener Ladevorgang entfernt sein Tag und lehnt mit `[Tuvix Loader] Failed to load script: <url>` ab, sodass der nächste Aufruf mit einem frischen Tag beginnt. Ein abgebrochener Aufruf entfernt das Tag nur, wenn kein anderer Aufrufer mehr darauf wartet. `loadScript` hat kein eigenes Timeout; übergib ein `signal`.

Ein String als zweites Argument wird wie in 0.4 als Integrity-Hash gelesen.

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Lässt den Ladevorgang nach so vielen ms mit `[Tuvix Loader] Style load timed out: <url>` fehlschlagen. `0` deaktiviert es. |
| `integrity` | `string` | keiner | SRI-Hash für das Attribut `integrity`. |
| `signal` | `AbortSignal` | keiner | Beendet das Warten beim Abbruch. |

Hängt `<link rel="stylesheet" crossorigin="anonymous">` an `document.head` an, mit denselben Regeln für Teilen, Fehler und Abbruch wie `loadScript`. Eine Zahl als zweites Argument wird wie in 0.4 als Timeout gelesen.

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

Entfernt das Tag, das `loadScript` für `url` hinzugefügt hat, sowie jedes `<script>`, dessen Attribut `src` gleich `url` ist. Ein noch laufender Ladevorgang für diese URL lehnt mit `[Tuvix Loader] Removed before load: <url>` ab. Das nächste `loadScript(url)` hängt ein neues Tag an. Code, den das Skript bereits ausgeführt hat, bleibt im Speicher.

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

Wie `removeScript`, für `<link rel="stylesheet">`-Tags.

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `'style'` für `.css`-URLs, sonst `'script'` | Art der Ressource. |
| `type` | `'module' \| 'classic'` | aus der Endung abgeleitet | Modul-Skripte erhalten `rel="modulepreload"`. |
| `integrity` | `string` | keiner | SRI-Hash für den Link. |

Hängt ein `<link>` pro URL und Seite an. Eine URL, die `loadScript` oder `loadStyle` bereits verarbeitet oder die schon vorab geladen wurde, wird übersprungen.

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

Veröffentlicht ein Modul unter einem Namen, damit ein Loader es findet, nachdem das Skript der App gelaufen ist. Ein zweiter Aufruf mit demselben Namen ersetzt das erste Modul. Die Adapter für React, Vue, Svelte und Angular sowie `defineMicroApp` aus Core rufen es für dich auf; rufe es selbst auf, wenn du das Modul von Hand schreibst.

Die Registry und der Zustand gemounteter Apps liegen auf `window.__TUVIX_RUNTIME__`, und die Modul-Map ist auch als `window.__TUVIX_MODULES__` erreichbar. Micro Apps, die jeweils ihre eigene Kopie von `@tuvix.js/loader` bündeln, lesen und schreiben dieselbe Registry. Auf dem Server, ohne `window`, liegt der Zustand im Modul.

Eine handgeschriebene Micro App, die dem Adapter-Vertrag folgt:

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

Entfernt ein Modul aus der Registry. `ModuleLoader.unload` ruft es für Module auf, die es aufgelöst hat.

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

Gibt das registrierte Modul zurück oder `undefined`.

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

Erfasst eine Lifecycle-Änderung und löst ein `CustomEvent` namens `tuvix:mounted`, `tuvix:unmounted` oder `tuvix:error` aus. Das Event steigt auf und ist `composed`, daher hört ein Listener auf `document` auch Events aus Containern in Shadow Roots. Hängt `detail.container` im DOM, feuert das Event auf dem Container und steigt einmal bis `document` auf. Ist der Container abgehängt (`isConnected` ist `false`), etwa weil React eine Island entfernt hat, bevor der Adapter `unmounted` gemeldet hat, feuert das Event auf `document` selbst, denn ein Event auf einem abgehängten Element erreicht `document` nie. `detail.container` zeigt in beiden Fällen weiterhin auf das Element. `event.detail` ist das `LifecycleDetail`:

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `name` | `string` | Name der Micro App. |
| `container` | `HTMLElement` | Element, in das die App gerendert hat. |
| `hydrated` | `boolean` | `true`, wenn der Adapter serverseitig gerendertes Markup übernommen hat, statt neu zu rendern. |
| `error` | `unknown` | Der geworfene Wert, gesetzt bei `error`-Events. |

`mounted` erfasst den Container als gemountet für `detail.name` und löst ausstehende `whenMounted(name)`-Promises auf. `unmounted` entfernt diesen Container aus dem Eintrag. `error` löst nur das Event aus. Die Adapter für React, Vue, Svelte und Angular sowie `defineMicroApp` aus Core rufen dies auf, nachdem Mount und Unmount abgeschlossen sind und wenn einer von beiden wirft.

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

`true`, solange mindestens ein Container von `name` gemountet ist. Die Runtime verfolgt gemountete Container pro App. Mountet ein Modul in zwei Container und du unmountest einen davon, bleibt `isMounted(name)` daher `true`, bis auch der zweite unmountet.

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

Wird mit dem `LifecycleDetail` des ersten Mounts aufgelöst. Ist die App bereits gemountet, wird es sofort mit dem Detail ihres frühesten noch gemounteten Containers aufgelöst. Brich `signal` ab, um das Warten zu beenden; das Promise lehnt dann mit dem Grund des Signals ab.

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

Lauscht auf `tuvix:<type>` an `target` (Standard `document`) und gibt eine Funktion zurück, die den Listener entfernt. Mit dem Standard-Target läuft der Handler einmal pro Event, für angehängte und abgehängte Container gleichermaßen. Ein Listener auf einem Container-Element hört keine Events, die ausgelöst werden, während dieser Container abgehängt ist.

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

Ohne dieses Paket lauschst du auf das DOM-Event:

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

`true`, wenn das Element ein Kindelement oder einen Textknoten mit Text außer Leerzeichen hat. Kommentare und Leerraum zählen nicht. Adapter entscheiden damit zwischen Hydration und neuem Rendern.

### Typen

Die Interfaces, die ein Micro-App-Modul implementiert:

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

Der Orchestrator übergibt `name` und `bus` bei jedem Mount. `bus` ist die [`@tuvix.js/event-bus`](/de/packages/event-bus)-Instanz des Orchestrators; `MicroAppBus` beschreibt sie strukturell, daher hängt der Loader nicht vom Event-Bus-Paket ab.

| Typ | Bedeutung |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`. |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`, siehe [Entry-Formen](#entry-forms). |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`. |
| `EntryLoaderContext` | `{ signal: AbortSignal }`. |
| `ScriptType` | `'module' \| 'classic'`. |
| `MicroAppModule` | Lifecycle-Objekt, das eine Micro App exportiert. |
| `MountContext`, `UnmountContext`, `UpdateContext` | Argumente von `mount`, `unmount` und `update`. |
| `MicroAppBus` | `{ on, once, emit, off }`; `IEventBus` erfüllt es. |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`. |
| `LoadResult` | `{ status, module, error, duration }`. |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`. |
| `CacheEntry` | `{ module, loadedAt, entry }`, ein gecachtes Modul. |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`. Der Loader liest es nicht. |
| `ResourceOptions` | `{ integrity?, signal? }`, gemeinsam genutzt von `loadScript` und `loadStyle`. |
| `LoadScriptOptions` | `ResourceOptions` plus `type?`. |
| `LoadStyleOptions` | `ResourceOptions` plus `timeout?`. |
| `PrefetchOptions` | `{ as?, type?, integrity? }`. |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`. |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`. |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`. |

## Sonderfälle

- **Timeouts.** `timeout` umfasst einen ganzen Versuch. Läuft er ab, bricht der Loader das `signal` des Versuchs ab, entfernt die Tags des Versuchs, auf die kein anderer Ladevorgang wartet, wartet `retryDelay` und versucht es erneut. Der Fehler lautet `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms`. Eine Loader-Funktion, die `signal` ignoriert, läuft im Hintergrund weiter; der Loader wartet nur nicht mehr auf sie.
- **Wiederholungen.** Ein fehlgeschlagenes `<script>` wird vor dem nächsten Versuch entfernt, daher hängt ein erneuter Versuch genau ein frisches Tag an. Nach dem letzten Versuch wird `load()` mit dem letzten Fehler aufgelöst.
- **Gleiche URL, mehrere Apps.** Zwei Entries, die dasselbe Vendor-Skript aufführen, teilen sich ein Tag und einen Download.
- **Gecachte Entries.** `load(name, otherEntry)` gibt das unter `name` gecachte Modul zurück und ignoriert `otherEntry`. Rufe zuerst `unload(name)` auf, um den Entry zu wechseln.
- **Modul-Skripte laufen einmal pro URL.** Nach `unload(name)` lädt eine App, deren Skript mit `type: 'module'` `registerModule` aufgerufen hat, nicht erneut von derselben URL, weil der Browser ein Modul-Skript nicht zweimal ausführt. Der Ladevorgang schlägt mit `no exports found` fehl. Verwende einen Entry als Loader-Funktion oder eine neue URL (einen Content-Hash oder `?v=2`).
- **`unload` entfernt gemeinsam genutzte Script-Tags.** Es entfernt jede Skript-URL des Entrys, auch ein Vendor-Skript, das eine andere App ebenfalls aufführt. Bereits ausgeführter Code bleibt; ein späterer Ladevorgang, der die URL aufführt, fügt das Tag erneut hinzu, und ein klassisches Skript läuft erneut.
- **CORS.** Der Loader setzt `crossorigin="anonymous"` auf jedem Tag. Ein Skript oder Stylesheet von einer anderen Origin braucht einen `Access-Control-Allow-Origin`-Header, sonst blockiert der Browser es und der Ladevorgang schlägt fehl.
- **UMD-Globals.** Laden zwei UMD-Bundles gleichzeitig, überspringt der Loader Globals, die ein anderer Ladevorgang bereits beansprucht hat, und ordnet den Rest dem App-Namen zu, ohne Groß- und Kleinschreibung und Satzzeichen zu beachten (`my-app` passt auf `MyApp`). Bleiben mehrere Kandidaten übrig, schlägt der Ladevorgang mit `several globals with mount() appeared while it loaded (<names>)` fehl. `registerModule` erspart das Raten.
- **Fehlender Lifecycle.** Ein Modul ohne `mount` oder `unmount` schlägt mit `[Tuvix Loader] Module "<name>" is missing required "unmount" function.` fehl.
- **Nichts gefunden.** Ein URL-Entry, dessen Skripte weder ein Modul registrieren noch ein UMD-Global definieren, schlägt mit `Module "<name>" loaded but no exports found` fehl.
- **Mehrere Container.** Die Runtime verfolgt den Mount-Zustand pro Container. Wird einer von zwei Containern unmountet, bleibt `isMounted(name)` `true`; `whenMounted(name)` gibt den frühesten noch gemounteten Container zurück.
- **Abgehängte Container.** Entfernt ein Host-Framework den Container, bevor der Adapter `unmounted` oder `error` meldet, löst `emitLifecycle` das Event auf `document` aus. Lausche auf `document` (der Standard von `onLifecycle`), um jedes Event zu empfangen.
- **`whenMounted` ignoriert Fehler.** Ein `tuvix:error`-Event lehnt es nicht ab. Übergib ein `signal` oder lausche mit `onLifecycle('error', ...)`.
- **Server.** Die Runtime-Funktionen funktionieren ohne `window`; `emitLifecycle` überspringt das DOM-Event, wenn `CustomEvent` nicht definiert ist. `ModuleLoader`, `loadScript`, `loadStyle` und `prefetchResource` brauchen `document`.

## Was es nicht tut

- Es ruft keine HTML-Seite ab, um Skripte daraus zu extrahieren. Führe die Skript- und Style-URLs auf oder verwende eine Loader-Funktion.
- Es isoliert kein JavaScript. Skripte laufen im globalen Scope der Seite. Für CSS-Isolation verwende die Option `sandbox` des Orchestrators oder [`@tuvix.js/sandbox`](/de/packages/sandbox).
- Es mountet keine Apps. Du oder der Orchestrator ruft `module.mount` auf.
- Es hält keinen Cache über Seitenaufrufe hinweg. Das übernimmt der HTTP-Cache des Browsers.
- Es liest `PrefetchStrategy` nicht; die `prefetch`-Einstellung des Orchestrators entscheidet, wann `prefetch` aufgerufen wird.

## Migration von 0.4 {#migrating-from-0-4}

- `LoaderOptions.fetch` und `EntryConfig.html` entfallen. Der Loader hat sie nie gelesen. Lösche sie aus deiner Config.
- `loadScript(url, integrity)` und `loadStyle(url, timeoutMs)` funktionieren weiterhin. Die Options-Form ergänzt `type` und `signal`:

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- Vite-ES-Ausgaben mit der Endung `.js` luden in 0.4 als klassisches Skript und scheiterten an ihrem ersten `import`-Statement. Setze `type: 'module'` auf dem Entry.
- Ein Entry mit `type: 'module'` lädt nach `unload` nicht mehr erneut von derselben URL. Verwende eine Loader-Funktion oder eine neue URL.
- `load()` meldet für ein gecachtes Modul die echte `duration` statt `0`.
- Die 0.4-Version dieser Seite zeigte `loader.load(url)`, `result.app`, `onLoadStart`, `cache` und `loader.clear()`. Nichts davon existierte. Verwende `load(name, entry)`, `result.module`, `unload(name)` und `clearCache()`.
