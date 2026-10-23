# @tuvix.js/module-federation

> Trasforma un remote webpack Module Federation in una entry Tuvix.js: carica remoteEntry.js, inizializza lo share scope una sola volta e restituisce la micro app esposta.

Parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentazione completa: [tuvix.js.org/it/packages/module-federation](https://tuvix.js.org/it/packages/module-federation).

## Installazione

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## Avvio rapido

Il remote espone una micro app (i suoi export o il suo export `default` hanno `mount` e `unmount`):

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

La shell la registra:

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

Restituisce una funzione loader per `register({ entry })` o `ModuleLoader.load`. Al primo mount carica `remoteEntry.js`, chiama `init` una volta per container, chiama `get(modulePath)` e restituisce la micro app.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Il `name` del `ModuleFederationPlugin` del remote. |
| `url` | `string` | obbligatorio | URL di `remoteEntry.js`. |
| `integrity` | `string` | nessuno | Hash SRI per il tag script. |
| `scope` | `string` | `name` | Globale di `window` che la remote entry definisce. |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

Restituisce:

| Metodo | Comportamento |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | `EntryLoader` per l'orchestratore. Lancia subito un errore per un remote sconosciuto. |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | `Promise<MicroAppModule>` dal modulo esposto o dal suo export `default`. |
| `loadModule(remoteName, modulePath, signal?)` | Qualsiasi modulo esposto; il suo export `default` quando ne ha uno. |
| `loadRemoteContainer(remote, signal?)` | Carica e inizializza un container da un `RemoteConfig`; restituisce `FederatedContainer`. |

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

Senza `shareScope`, una shell compilata con webpack chiama `__webpack_init_sharing__('default')` e passa `__webpack_share_scopes__.default`. Qualsiasi altra shell passa un unico oggetto condiviso da tutti i remote della pagina.

### Tipi

`ShareScope` (`Record<string, unknown>`), `FederatedContainer` (`{ init, get }`), `RemoteConfig`, `FederatedLoaderConfig` (`{ remotes, shareScope? }`), `FederatedEntryOptions` (`{ shareScope? }`).

## Casi limite

- Il `timeout` dell'orchestratore interrompe l'attesa di `remoteEntry.js` e rimuove il tag; il nuovo tentativo ne aggiunge uno nuovo.
- Un `init` fallito viene ritentato al caricamento successivo.
- Errori: `[Tuvix MF] Remote "<name>" is not configured`, `Failed to load remote entry: <url>`, `Remote container "<scope>" not found on window`, `Module "<path>" not found in remote "<name>"`, `does not export mount/unmount`.
- `remoteEntry.js` viene caricato con `crossorigin="anonymous"`; i remote su un'altra origine devono inviare `Access-Control-Allow-Origin`.
- `ModuleLoader.prefetch` salta le funzioni loader, quindi le app MF non vengono precaricate con prefetch.

## Cosa non fa

- Non configura webpack al posto tuo.
- Legge i container da `window`; i remote con `library: { type: 'module' }` non funzionano.
- Non scopre i remote e non legge manifest.

## Migrazione dalla 0.4

- `federatedEntry(remote)` restituiva `{ scripts: [url] }`, che falliva con "no exports found". Ora accetta `modulePath` e restituisce un `EntryLoader`. Anche `createFederatedEntry` restituisce un `EntryLoader`.
- `shared` è sostituito da `shareScope`.
- `loadRemoteContainer` restituisce `FederatedContainer` invece di `any`.

## Licenza

MIT
