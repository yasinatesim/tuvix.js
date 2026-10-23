# @tuvix.js/module-federation

> Turns a webpack Module Federation remote into a Tuvix.js entry: loads remoteEntry.js, initialises the share scope once and returns the exposed micro app.

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework. Full documentation: [tuvix.js.org/packages/module-federation](https://tuvix.js.org/packages/module-federation).

## Installation

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## Quick start

The remote exposes a micro app (its exports or its `default` export have `mount` and `unmount`):

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

The shell registers it:

```ts
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

## API

### `federatedEntry`

```ts no-check
federatedEntry(remote: RemoteConfig, modulePath = './App', options?: { shareScope?: ShareScope }): EntryLoader;
```

Returns a loader function for `register({ entry })` or `ModuleLoader.load`. On first mount it loads `remoteEntry.js`, calls `init` once per container, calls `get(modulePath)` and returns the micro app.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | The remote's `ModuleFederationPlugin` `name`. |
| `url` | `string` | required | URL of `remoteEntry.js`. |
| `integrity` | `string` | none | SRI hash for the script tag. |
| `scope` | `string` | `name` | `window` global the remote entry defines. |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

Returns:

| Method | Behaviour |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | `EntryLoader` for the orchestrator. Throws at once for an unknown remote. |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | `Promise<MicroAppModule>` from the exposed module or its `default` export. |
| `loadModule(remoteName, modulePath, signal?)` | Any exposed module; its `default` export when it has one. |
| `loadRemoteContainer(remote, signal?)` | Loads and initialises a container from a `RemoteConfig`; returns `FederatedContainer`. |

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';
import { createOrchestrator } from '@tuvix.js/core';

const federation = createFederatedLoader({
  remotes: [
    { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
    { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' },
  ],
});

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'remote1', entry: federation.createFederatedEntry('remote1'), container: '#remote1', activeWhen: '/' });
orchestrator.register({ name: 'remote2', entry: federation.createFederatedEntry('remote2'), container: '#remote2', activeWhen: '/' });
await orchestrator.start();
```

### Share scope

Without `shareScope`, a webpack-bundled shell calls `__webpack_init_sharing__('default')` and passes `__webpack_share_scopes__.default`. Any other shell passes one object that every remote on the page shares.

### Types

`ShareScope` (`Record<string, unknown>`), `FederatedContainer` (`{ init, get }`), `RemoteConfig`, `FederatedLoaderConfig` (`{ remotes, shareScope? }`), `FederatedEntryOptions` (`{ shareScope? }`).

## Edge cases

- The orchestrator's `timeout` aborts the wait for `remoteEntry.js` and removes the tag; the retry adds a fresh one.
- A failed `init` is retried on the next load.
- Errors: `[Tuvix MF] Remote "<name>" is not configured`, `Failed to load remote entry: <url>`, `Remote container "<scope>" not found on window`, `Module "<path>" not found in remote "<name>"`, `does not export mount/unmount`.
- `remoteEntry.js` loads with `crossorigin="anonymous"`; remotes on another origin must send `Access-Control-Allow-Origin`.
- `ModuleLoader.prefetch` skips loader functions, so MF apps are not prefetched.

## What it does not do

- It does not configure webpack for you.
- It reads containers from `window`; `library: { type: 'module' }` remotes do not work.
- It does not discover remotes or read manifests.

## Migrating from 0.4

- `federatedEntry(remote)` returned `{ scripts: [url] }`, which failed with "no exports found". It now takes `modulePath` and returns an `EntryLoader`. `createFederatedEntry` returns an `EntryLoader` too.
- `shared` is replaced by `shareScope`.
- `loadRemoteContainer` returns `FederatedContainer` instead of `any`.

## License

MIT
