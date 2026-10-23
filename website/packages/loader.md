---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="Loads micro app bundles by name from script URLs or loader functions, with retries, timeouts, a shared module registry and lifecycle events."
  icon="📦"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## When to use it

`@tuvix.js/loader` turns an entry (a script URL, a list of scripts and styles, or `() => import('./app')`) into a micro app module with `mount` and `unmount`. It adds the `<script>` and `<link>` tags, retries failed attempts, gives up after a timeout and caches the result by app name.

`@tuvix.js/core` creates a `ModuleLoader` for you and passes the `loader` option of `createOrchestrator` to it, so most shells never import this package. Import it when you:

- write a micro app or adapter that publishes itself with `registerModule`, or reports `tuvix:mounted` with `emitLifecycle`
- need to know when another app mounted (`whenMounted`, `onLifecycle`)
- load micro apps without the orchestrator, for example from your own router
- load a single script or stylesheet with deduplication (`loadScript`, `loadStyle`)

If your bundler can import the app at build time and you never load code from another origin, a plain `import()` is enough.

## Quick start

The micro app publishes its module under a name. This file is built to `https://cdn.example.com/dashboard/main.js`:

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

The shell loads it by name and mounts it:

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

`load()` never throws. A failed load comes back with `status: 'error'`, `module: null` and the last error.

## Entry forms

An `Entry` tells the loader where an app's code lives. It takes three forms.

**A URL string.** The loader treats `'https://cdn.example.com/app.js'` as `{ scripts: ['https://cdn.example.com/app.js'] }`.

**An `EntryConfig` object:**

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `scripts` | `string[]` | required | Script URLs. The loader runs them one after another in this order. An empty array loads nothing and resolves the module from the registry. |
| `styles` | `string[]` | `[]` | Stylesheet URLs, loaded in parallel with the scripts. The load waits for both. |
| `type` | `'module' \| 'classic'` | inferred per URL | Script type for every URL in `scripts`. Without it, URLs ending in `.mjs`, `.mts`, `.ts`, `.tsx` or `.jsx` load as `type="module"` and every other URL loads as a classic script. Set `'module'` for Vite or Rollup ES output, which ends in `.js`. |
| `integrity` | `Record<string, string>` | none | Subresource integrity hashes keyed by URL. The loader writes them to the `<script>`, `<link>` and prefetch tags. |

**A loader function (`EntryLoader`).** The loader calls it with `{ signal }` and accepts three results, checked in this order:

1. a module with a `mount` function
2. an object whose `default` export is such a module (an ES module namespace)
3. nothing usable, in which case the loader looks up the module the import registered with `registerModule(name, ...)`

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

Your bundler code-splits `./dashboard` into its own chunk and fetches it on first mount. Loader functions are also how [`@tuvix.js/module-federation`](/packages/module-federation) plugs a federated remote into the orchestrator.

`signal` aborts when the attempt times out. Pass it to anything you `fetch` on the way:

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

Each `ModuleLoader` keeps its own cache of resolved modules by app name. The `<script>` and `<link>` tags are page-wide: two loaders that load the same URL share one tag.

`LoaderOptions`:

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Time limit in ms for one attempt, covering every script and stylesheet of the entry. `0` disables it. |
| `retries` | `number` | `2` | Extra attempts after the first one fails. `2` means up to 3 attempts. |
| `retryDelay` | `number` | `1000` | Wait in ms between attempts. |
| `globals` | `Record<string, unknown>` | `{}` | Properties the loader assigns to `window` before each attempt of a URL entry, for UMD bundles that expect `window.React` or a config object. Loader-function entries ignore it. |

#### `load(name, entry)`

Resolves to a `LoadResult`:

| Field | Type | Meaning |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | Outcome of the load. |
| `module` | `MicroAppModule \| null` | The resolved module, `null` on error. |
| `error` | `Error \| null` | The error of the last attempt. |
| `duration` | `number` | Milliseconds from the call to the result, measured with `performance.now()`. |

For a URL entry, one attempt:

1. assigns `options.globals` to `window`
2. appends the scripts in order, each waiting for the previous one, and the stylesheets in parallel
3. reads the module from the registry (`getRegisteredModule(name)`)
4. falls back to a UMD global: a `window` property with a `mount` function that appeared during this load

The loader then checks that the module has `mount` and `unmount` functions and caches it under `name`. Later calls with the same name return the cached module and ignore `entry`. A second call while the first is still loading returns the same promise. Loads of different names run in parallel.

#### `prefetch(entry)`

Asks the browser to download an entry's files without running them. Module scripts get `<link rel="modulepreload">`; classic scripts and stylesheets get `<link rel="prefetch">`. Loader-function entries are skipped, because calling the function would run the module. The orchestrator calls this for its `prefetch` setting.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

Removes the stylesheets of a loaded app so its CSS stops applying while it is unmounted. A stylesheet stays when another cached app, whose styles you have not removed, lists the same URL. The next `load(name)` adds the stylesheets back and waits for them before it resolves. The orchestrator calls `removeStyles` after every unmount.

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

Forgets an app: removes its stylesheets and script tags, drops it from the cache, and unregisters it from the shared registry when the registered module is the one this loader resolved. The next `load(name)` fetches and runs the entry again. The orchestrator calls it from `unregister(name)`.

#### `clearCache()`

Calls `unload` for every cached app. The orchestrator calls it from `destroy()`.

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

Read the cache. `getStatus` returns `'loading'` while a load runs, `'loaded'` once the module is cached, and `'idle'` otherwise. A failed load leaves the status at `'idle'`.

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

Same as `new ModuleLoader(options)`. Takes the `LoaderOptions` from the table above.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

To set these options for the orchestrator, pass them as `loader`:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

Turns a URL into `{ scripts: [url] }` and returns an `EntryConfig` unchanged. It does not accept loader functions; check `typeof entry === 'function'` first.

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | inferred from the extension | Script type, with the same rules as `EntryConfig.type`. |
| `integrity` | `string` | none | SRI hash for the `integrity` attribute. |
| `signal` | `AbortSignal` | none | Stops waiting when aborted. The promise rejects with the signal's reason. |

Appends `<script crossorigin="anonymous">` to `document.head` and resolves on its `load` event. Concurrent calls for one URL share one tag, and a call for a URL that already loaded resolves at once. A failed load removes its tag and rejects with `[Tuvix Loader] Failed to load script: <url>`, so the next call starts with a fresh tag. An aborted call removes the tag only when no other caller still waits for it. `loadScript` has no timeout of its own; pass a `signal`.

A string as the second argument is read as the integrity hash, as in 0.4.

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Fails the load after this many ms with `[Tuvix Loader] Style load timed out: <url>`. `0` disables it. |
| `integrity` | `string` | none | SRI hash for the `integrity` attribute. |
| `signal` | `AbortSignal` | none | Stops waiting when aborted. |

Appends `<link rel="stylesheet" crossorigin="anonymous">` to `document.head` with the same sharing, failure and abort rules as `loadScript`. A number as the second argument is read as the timeout, as in 0.4.

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

Removes the tag `loadScript` added for `url`, plus any `<script>` whose `src` attribute equals `url`. A load still in flight for that URL rejects with `[Tuvix Loader] Removed before load: <url>`. The next `loadScript(url)` appends a new tag. Code the script already ran stays in memory.

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

Same as `removeScript` for `<link rel="stylesheet">` tags.

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `'style'` for `.css` URLs, else `'script'` | Resource kind. |
| `type` | `'module' \| 'classic'` | inferred from the extension | Module scripts get `rel="modulepreload"`. |
| `integrity` | `string` | none | SRI hash for the link. |

Appends one `<link>` per URL and page. A URL that `loadScript` or `loadStyle` already handles, or that was prefetched before, is skipped.

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

Publishes a module under a name so a loader can find it after the app's script runs. A second call with the same name replaces the first module. The React, Vue, Svelte and Angular adapters and core's `defineMicroApp` call it for you; call it yourself when you write the module by hand.

The registry and the mounted-app state live on `window.__TUVIX_RUNTIME__`, and the module map is also reachable as `window.__TUVIX_MODULES__`. Micro apps that each bundle their own copy of `@tuvix.js/loader` read and write the same registry. On the server, without `window`, the state lives in the module.

A hand-written micro app that follows the adapter contract:

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

Removes a module from the registry. `ModuleLoader.unload` calls it for modules it resolved.

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

Returns the registered module, or `undefined`.

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

Records a lifecycle change and dispatches a `CustomEvent` named `tuvix:mounted`, `tuvix:unmounted` or `tuvix:error`. The event bubbles and is `composed`, so a listener on `document` hears events from containers inside shadow roots. When `detail.container` is in the DOM, the event fires on the container and bubbles to `document` once. When the container is detached (`isConnected` is `false`), for example because React removed an island before the adapter reported `unmounted`, the event fires on `document` itself, since an event on a detached element never reaches it. `detail.container` still points at the element in both cases. `event.detail` is the `LifecycleDetail`:

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Micro app name. |
| `container` | `HTMLElement` | Element the app rendered into. |
| `hydrated` | `boolean` | `true` when the adapter adopted server-rendered markup instead of rendering fresh. |
| `error` | `unknown` | The thrown value, set on `error` events. |

`mounted` records the container as mounted for `detail.name` and resolves pending `whenMounted(name)` promises. `unmounted` removes that container from the record. `error` only dispatches the event. The React, Vue, Svelte and Angular adapters and core's `defineMicroApp` call this after mount and unmount finish and when either throws.

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

`true` while at least one container of `name` is mounted. The runtime tracks mounted containers per app, so if one module mounts into two containers and you unmount one, `isMounted(name)` stays `true` until the second unmounts.

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

Resolves with the `LifecycleDetail` of the first mount. If the app is mounted already, it resolves at once with the detail of its earliest still-mounted container. Abort `signal` to stop waiting; the promise then rejects with the signal's reason.

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

Listens for `tuvix:<type>` on `target` (default `document`) and returns a function that removes the listener. With the default target the handler runs once per event, for attached and detached containers alike. A listener on a container element does not hear events dispatched while that container is detached.

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

Without this package, listen to the DOM event:

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

`true` when the element has a child element or a text node with non-whitespace text. Comments and whitespace do not count. Adapters use it to choose between hydrating and rendering fresh.

### Types

The interfaces a micro app module implements:

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

The orchestrator passes `name` and `bus` on every mount. `bus` is the orchestrator's [`@tuvix.js/event-bus`](/packages/event-bus) instance; `MicroAppBus` describes it structurally, so the loader has no dependency on the event bus package.

| Type | Meaning |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`. |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`, see [Entry forms](#entry-forms). |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`. |
| `EntryLoaderContext` | `{ signal: AbortSignal }`. |
| `ScriptType` | `'module' \| 'classic'`. |
| `MicroAppModule` | Lifecycle object a micro app exports. |
| `MountContext`, `UnmountContext`, `UpdateContext` | Arguments of `mount`, `unmount` and `update`. |
| `MicroAppBus` | `{ on, once, emit, off }`; `IEventBus` satisfies it. |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`. |
| `LoadResult` | `{ status, module, error, duration }`. |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`. |
| `CacheEntry` | `{ module, loadedAt, entry }`, one cached module. |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`. The loader does not read it. |
| `ResourceOptions` | `{ integrity?, signal? }`, shared by `loadScript` and `loadStyle`. |
| `LoadScriptOptions` | `ResourceOptions` plus `type?`. |
| `LoadStyleOptions` | `ResourceOptions` plus `timeout?`. |
| `PrefetchOptions` | `{ as?, type?, integrity? }`. |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`. |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`. |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`. |

## Edge cases

- **Timeouts.** `timeout` covers one whole attempt. When it fires, the loader aborts the attempt's `signal`, removes the attempt's tags that no other load waits for, waits `retryDelay` and tries again. The error reads `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms`. A loader function that ignores `signal` keeps running in the background; the loader stops waiting for it.
- **Retries.** A failed `<script>` is removed before the next attempt, so a retry appends one fresh tag. After the last attempt `load()` resolves with the last error.
- **Same URL, several apps.** Two entries that list the same vendor script share one tag and one download.
- **Cached entries.** `load(name, otherEntry)` returns the module cached under `name` and ignores `otherEntry`. Call `unload(name)` first to switch entries.
- **Module scripts run once per URL.** After `unload(name)`, an app whose `type: 'module'` script called `registerModule` does not load again from the same URL, because the browser does not run a module script twice. The load fails with `no exports found`. Use a loader-function entry or a new URL (a content hash or `?v=2`).
- **`unload` removes shared script tags.** It removes every script URL of the entry, including a vendor script another app also lists. Code that already ran stays; a later load that lists the URL adds the tag again and a classic script runs again.
- **CORS.** The loader sets `crossorigin="anonymous"` on every tag. A script or stylesheet from another origin needs an `Access-Control-Allow-Origin` header, or the browser blocks it and the load fails.
- **UMD globals.** When two UMD bundles load at the same time, the loader skips globals another load already claimed and matches the rest to the app name, ignoring case and punctuation (`my-app` matches `MyApp`). If several candidates remain, the load fails with `several globals with mount() appeared while it loaded (<names>)`. `registerModule` avoids the guesswork.
- **Missing lifecycle.** A module without `mount` or `unmount` fails with `[Tuvix Loader] Module "<name>" is missing required "unmount" function.`
- **Nothing found.** A URL entry whose scripts neither register a module nor define a UMD global fails with `Module "<name>" loaded but no exports found`.
- **Several containers.** The runtime tracks mounted state per container. Unmounting one of two containers keeps `isMounted(name)` `true`; `whenMounted(name)` returns the earliest container still mounted.
- **Detached containers.** When a host framework removes the container before the adapter reports `unmounted` or `error`, `emitLifecycle` dispatches the event on `document`. Listen on `document` (the `onLifecycle` default) to receive every event.
- **`whenMounted` ignores errors.** A `tuvix:error` event does not reject it. Pass a `signal` or listen with `onLifecycle('error', ...)`.
- **Server.** The runtime functions work without `window`; `emitLifecycle` skips the DOM event when `CustomEvent` is undefined. `ModuleLoader`, `loadScript`, `loadStyle` and `prefetchResource` need `document`.

## What it does not do

- It does not fetch an HTML page and pull scripts out of it. List the script and style URLs, or use a loader function.
- It does not isolate JavaScript. Scripts run in the page's global scope. For CSS isolation use the orchestrator's `sandbox` option or [`@tuvix.js/sandbox`](/packages/sandbox).
- It does not mount apps. You or the orchestrator call `module.mount`.
- It does not keep a cache across page loads. The browser's HTTP cache does that.
- It does not read `PrefetchStrategy`; the orchestrator's `prefetch` setting decides when to call `prefetch`.

## Migrating from 0.4

- `LoaderOptions.fetch` and `EntryConfig.html` are gone. The loader never read them. Delete them from your config.
- `loadScript(url, integrity)` and `loadStyle(url, timeoutMs)` still work. The options form adds `type` and `signal`:

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- Vite ES output ending in `.js` loaded as a classic script in 0.4 and failed on its first `import` statement. Set `type: 'module'` on the entry.
- A `type: 'module'` entry no longer loads again from the same URL after `unload`. Use a loader function or a new URL.
- `load()` for a cached module reports the real `duration` instead of `0`.
- The 0.4 version of this page showed `loader.load(url)`, `result.app`, `onLoadStart`, `cache` and `loader.clear()`. None of them existed. Use `load(name, entry)`, `result.module`, `unload(name)` and `clearCache()`.
