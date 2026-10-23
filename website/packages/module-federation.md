---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Turns a webpack Module Federation remote into a Tuvix.js entry: loads remoteEntry.js, initialises the share scope once and returns the exposed micro app."
  icon="🌐"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

The package depends on `@tuvix.js/loader` and uses its `loadScript`.

## When to use it

Your micro apps are built with webpack's `ModuleFederationPlugin` and each one publishes a `remoteEntry.js`. Your shell knows the remote URLs only at runtime, or it is built with a different bundler (Vite, Rollup), so it cannot list the remotes in its own webpack config.

`federatedEntry` returns an entry the orchestrator can register. On first mount it loads `remoteEntry.js`, calls the container's `init` with a share scope, calls `get('./App')` and hands the exposed module to the orchestrator.

If your shell is a webpack build and you can list the remotes at build time, webpack's own `remotes` option with `entry: () => import('dashboard/App')` works without this package.

## Quick start

The remote exposes a module whose own exports or `default` export is a Tuvix.js micro app:

```js
// dashboard/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  output: { publicPath: 'auto' },
  devServer: { port: 3001, headers: { 'Access-Control-Allow-Origin': '*' } },
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboard',
      filename: 'remoteEntry.js',
      exposes: { './App': './src/App' },
    }),
  ],
};
```

```tsx
// dashboard/src/App.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard() {
  return <h2>Dashboard</h2>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

The shell registers the remote as an entry:

```ts
// shell/src/main.ts
import { createOrchestrator } from '@tuvix.js/core';
import { federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'http://localhost:3001/remoteEntry.js' }, './App'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

The orchestrator's loader calls the entry with a `signal`, so its `timeout` and `retries` options apply to `remoteEntry.js` too.

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | required | The remote: `name`, `url`, and optionally `integrity` and `scope` (table below). |
| `modulePath` | `string` | `'./App'` | Key from the remote's `exposes`. |
| `options.shareScope` | `ShareScope` | webpack's `default` scope, else a page-wide object | Share scope passed to the container's `init`. |

Returns an `EntryLoader` (`({ signal }) => Promise<MicroAppModule>`) for `orchestrator.register({ entry })` or `ModuleLoader.load(name, entry)`. Each call creates its own internal loader; two entries for the same remote still share one `remoteEntry.js` tag and one `init` call.

`RemoteConfig`:

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Remote name, the `name` in the remote's `ModuleFederationPlugin` config. |
| `url` | `string` | required | URL of `remoteEntry.js`. |
| `integrity` | `string` | none | SRI hash for the `remoteEntry.js` script tag. |
| `scope` | `string` | `name` | Name of the `window` global that `remoteEntry.js` defines, when it differs from `name`. |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | required | Every remote this loader may load. |
| `shareScope` | `ShareScope` | webpack's `default` scope, else a page-wide object | Share scope passed to each container's `init`. |

Use it when several apps come from a list of remotes, or when you need the exposed module itself.

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [
    { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
    { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' },
  ],
});

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'remote1',
  entry: federation.createFederatedEntry('remote1', './App'),
  container: '#remote1-container',
  activeWhen: '/',
});

orchestrator.register({
  name: 'remote2',
  entry: federation.createFederatedEntry('remote2', './App'),
  container: '#remote2-container',
  activeWhen: '/',
});

await orchestrator.start();
```

#### `createFederatedEntry(remoteName, modulePath = './App')`

Returns an `EntryLoader` that calls `createFederatedApp(remoteName, modulePath, signal)`. It throws at once when `remoteName` is not in `remotes`, so a typo fails at `register` time and not on first mount.

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

Loads the container, calls `get(modulePath)`, runs the factory and returns the micro app: the exposed module itself when it has a `mount` function, else its `default` export when that has one. Otherwise it throws `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.`

#### `loadModule(remoteName, modulePath, signal?)`

Returns any exposed module, for example a shared component library or a config object. When the module has a `default` export, `loadModule` returns that export.

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

Takes a `RemoteConfig` (not a name), loads its `remoteEntry.js` as a classic script, reads the container from `window[remote.scope ?? remote.name]`, initialises it and returns it. The loader caches containers by remote name.

### Share scope

Without `shareScope`, the package picks one in this order:

1. In a shell that webpack bundles, it calls `__webpack_init_sharing__('default')` and passes `__webpack_share_scopes__.default`, so remotes share the dependencies the host declared in its own `shared` config.
2. In any other shell, it passes one plain object that every remote on the page receives. Remotes can share dependencies with each other through it; the host's own copies take no part.

Pass `shareScope` to use a scope you manage yourself.

### Types

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| Type | Meaning |
| --- | --- |
| `ShareScope` | Object passed to a container's `init`. |
| `FederatedContainer` | The `{ init, get }` global that `remoteEntry.js` defines. |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`. |
| `FederatedLoaderConfig` | `{ remotes, shareScope? }` for `createFederatedLoader`. |
| `FederatedEntryOptions` | `{ shareScope? }` for `federatedEntry`. |

## Edge cases

- **Init once.** The package initialises each container object once per page, even when several loaders or entries use it. A failed `init` is forgotten, so the next load tries again.
- **Timeouts and retries.** When the orchestrator's `timeout` fires, the aborted `signal` stops the wait for `remoteEntry.js` and removes its tag unless another load still waits for it. The retry appends a fresh tag. An aborted load rejects with the abort reason; other load failures read `[Tuvix MF] Failed to load remote entry: <url> (<error>)`.
- **Global not found.** If `remoteEntry.js` loads but `window[scope]` has no `init` and `get`, the load fails with `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>`. Check that `scope` matches the remote's `name`, or its `library.name` when you set one.
- **Unknown module.** `get` throwing or returning something other than a factory gives `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"`.
- **Unknown remote.** `createFederatedEntry`, `createFederatedApp` and `loadModule` throw `[Tuvix MF] Remote "<name>" is not configured. Available: <names>`.
- **CORS.** `remoteEntry.js` loads with `crossorigin="anonymous"`. A remote on another origin must send `Access-Control-Allow-Origin`.
- **Unload and remount.** The orchestrator's loader removes nothing for a loader-function entry. The next mount calls `get(modulePath)` again and webpack returns its cached module.
- **Prefetch.** `ModuleLoader.prefetch` skips loader-function entries, so the orchestrator's `prefetch` setting does not download `remoteEntry.js` ahead of time.

## What it does not do

- It does not configure webpack. Each remote adds `ModuleFederationPlugin` itself.
- It reads containers from `window`. Remotes built with `library: { type: 'module' }` or another non-global library type do not work.
- It does not read a remote manifest or discover remotes. You list each `remoteEntry.js` URL.
- It does not negotiate versions. The webpack runtime inside each container does that through the share scope.

## Migrating from 0.4

- `federatedEntry(remote)` returned `{ scripts: [remote.url] }`, and the loader then failed with "no exports found", because a container only has `init` and `get`. It now takes the exposed module path and returns a loader function:

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` returns an `EntryLoader` instead of an `EntryConfig`. Shells that pre-loaded remotes with `createFederatedApp` and registered `entry: { scripts: [] }` can pass `federation.createFederatedEntry('remote1', './App')` as the entry.
- `FederatedLoaderConfig.shared` is replaced by `shareScope`. The package never read `shared`.
- `loadRemoteContainer` returns `FederatedContainer` instead of `any`.
- In 0.4 the package read `window.__webpack_share_scopes__`, which webpack never defines, so every remote got its own empty scope. A webpack host now passes its real `default` scope.
- The 0.4 version of this page showed `createFederatedLoader()` without arguments and `loader.remote({ url, scope, module })`. Neither existed.
