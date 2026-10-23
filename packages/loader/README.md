# @tuvix.js/loader

> Loads micro app bundles by name from script URLs or loader functions, with retries, timeouts, a shared module registry and lifecycle events.

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework. Full documentation: [tuvix.js.org/packages/loader](https://tuvix.js.org/packages/loader).

## Installation

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core` creates a `ModuleLoader` for you and passes `createOrchestrator({ loader })` to it. Import this package when you write a micro app or adapter, wait for another app to mount, or load apps without the orchestrator.

## Quick start

The micro app, built to `https://cdn.example.com/dashboard/main.js`:

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

The shell:

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

`load()` never throws. A failure resolves with `status: 'error'`, `module: null` and the last error.

## Entries

`Entry` is one of:

- a URL string, read as `{ scripts: [url] }`
- an `EntryConfig`
- a loader function such as `() => import('./dashboard')`. It receives `{ signal }`, which aborts on timeout, and may resolve to the module, to `{ default: module }`, or to anything after calling `registerModule(name, module)`.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `scripts` | `string[]` | required | Script URLs, run one after another. |
| `styles` | `string[]` | `[]` | Stylesheet URLs, loaded in parallel with the scripts. |
| `type` | `'module' \| 'classic'` | inferred per URL | `.mjs`, `.mts`, `.ts`, `.tsx`, `.jsx` load as modules, the rest as classic. Set `'module'` for Vite `.js` output. |
| `integrity` | `Record<string, string>` | none | SRI hashes keyed by URL. |

## API

### `ModuleLoader` and `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | ms per attempt, covering every script and stylesheet. `0` disables it. |
| `retries` | `number` | `2` | Extra attempts after the first failure. |
| `retryDelay` | `number` | `1000` | ms between attempts. |
| `globals` | `Record<string, unknown>` | `{}` | Assigned to `window` before each attempt of a URL entry. |

| Method | Behaviour |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | Loads, validates `mount`/`unmount` and caches by name. Resolves the module from `registerModule(name)` first, then from a new UMD global with `mount`. A cached name ignores `entry`; a name already loading returns the same promise. |
| `prefetch(entry)` | `<link rel="modulepreload">` for module scripts, `<link rel="prefetch">` otherwise. Skips loader functions. |
| `removeStyles(name)` | Removes the app's stylesheets unless another cached app uses them. The next `load(name)` re-adds them. |
| `unload(name)` | Removes styles and script tags, drops the cache entry and unregisters the module this loader resolved. |
| `clearCache()` | `unload` for every cached app. |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | Read the cache. `getStatus` returns `'idle'`, `'loading'` or `'loaded'`. |

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

One tag per URL, shared by concurrent callers. A failed load removes its tag and rejects with `[Tuvix Loader] Failed to load script: <url>`. An aborted call removes the tag when no other caller waits for it. `loadStyle` times out after `10000` ms by default. Every tag gets `crossorigin="anonymous"`. A string second argument to `loadScript` is the integrity hash; a number to `loadStyle` is the timeout (0.4 forms).

### Runtime registry and lifecycle

State lives on `window.__TUVIX_RUNTIME__`, so micro apps that bundle their own copy share it. Without `window` it lives in the module.

| Export | Behaviour |
| --- | --- |
| `registerModule(name, module)` | Publishes a module for the loader. The adapters and `defineMicroApp` call it. |
| `unregisterModule(name)` | Removes it. |
| `getRegisteredModule(name)` | Returns it or `undefined`. |
| `emitLifecycle(type, { name, container, hydrated, error? })` | Dispatches a bubbling, composed `tuvix:mounted`, `tuvix:unmounted` or `tuvix:error` `CustomEvent` on `container`, or on `document` when the container is detached, and tracks mounted containers. The adapters and `defineMicroApp` call it. |
| `isMounted(name)` | `true` while any container of the app is mounted. |
| `whenMounted(name, { signal? })` | Resolves with the `LifecycleDetail` of the first mount, or at once with the earliest container still mounted; rejects with `signal.reason` on abort. |
| `onLifecycle(type, handler, target = document)` | Listens for `tuvix:<type>`; returns a remover. |
| `hasServerMarkup(el)` | `true` for a child element or non-whitespace text. |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### Types

`Entry`, `EntryConfig`, `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppModule`, `MountContext` (`container`, `props?`, `name?`, `bus?`), `UnmountContext`, `UpdateContext` (`props`, `container?`), `MicroAppBus` (`on`, `once`, `emit`, `off`; `IEventBus` satisfies it), `LoaderOptions`, `LoadResult`, `LoadStatus`, `CacheEntry`, `PrefetchStrategy` (not read by the loader), `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.

## Edge cases

- A timeout aborts the attempt's `signal`, removes its tags and retries after `retryDelay`. A loader function that ignores `signal` keeps running; the loader stops waiting.
- After `unload(name)`, a `type: 'module'` script that registered itself does not run again from the same URL. Use a loader function or a new URL.
- `unload` removes every script URL of the entry, including vendor scripts other apps list.
- Two UMD bundles loading at once: the loader matches new globals to the app name and fails with the candidate names when it cannot tell them apart.
- Cross-origin scripts and styles need `Access-Control-Allow-Origin`.
- Mounted state is per container: unmounting one of two containers keeps `isMounted(name)` `true`. `whenMounted` does not reject on `tuvix:error`.
- A detached container's lifecycle event fires on `document` with `detail.container` still set. `onLifecycle` on `document` (the default) receives every event once.

## What it does not do

- It does not fetch HTML pages and extract scripts.
- It does not isolate JavaScript; scripts run in the page's global scope.
- It does not mount apps or route.

## License

MIT
