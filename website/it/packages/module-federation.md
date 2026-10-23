---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Trasforma un remote webpack Module Federation in una entry Tuvix.js: carica remoteEntry.js, inizializza lo share scope una sola volta e restituisce la micro app esposta."
  icon="🌐"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

Il pacchetto dipende da `@tuvix.js/loader` e usa il suo `loadScript`.

## Quando usarlo

Le tue micro app sono compilate con il `ModuleFederationPlugin` di webpack e ognuna pubblica un `remoteEntry.js`. La tua shell conosce gli URL dei remote solo a runtime, oppure è compilata con un altro bundler (Vite, Rollup), quindi non può elencare i remote nella propria configurazione webpack.

`federatedEntry` restituisce una entry che l'orchestratore può registrare. Al primo mount carica `remoteEntry.js`, chiama `init` del container con uno share scope, chiama `get('./App')` e passa il modulo esposto all'orchestratore.

Se la tua shell è una build webpack e puoi elencare i remote in fase di build, l'opzione `remotes` di webpack con `entry: () => import('dashboard/App')` funziona senza questo pacchetto.

## Avvio rapido

Il remote espone un modulo i cui export, o il cui export `default`, sono una micro app Tuvix.js:

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

La shell registra il remote come entry:

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

Il loader dell'orchestratore chiama la entry con un `signal`, quindi le sue opzioni `timeout` e `retries` valgono anche per `remoteEntry.js`.

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | obbligatorio | Il remote: `name`, `url` e, facoltativamente, `integrity` e `scope` (tabella sotto). |
| `modulePath` | `string` | `'./App'` | Chiave negli `exposes` del remote. |
| `options.shareScope` | `ShareScope` | lo scope `default` di webpack, altrimenti un oggetto condiviso da tutta la pagina | Share scope passato a `init` del container. |

Restituisce un `EntryLoader` (`({ signal }) => Promise<MicroAppModule>`) per `orchestrator.register({ entry })` o `ModuleLoader.load(name, entry)`. Ogni chiamata crea un proprio loader interno; due entry per lo stesso remote condividono comunque un solo tag `remoteEntry.js` e una sola chiamata a `init`.

`RemoteConfig`:

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome del remote, il `name` nella configurazione `ModuleFederationPlugin` del remote. |
| `url` | `string` | obbligatorio | URL di `remoteEntry.js`. |
| `integrity` | `string` | nessuno | Hash SRI per il tag script di `remoteEntry.js`. |
| `scope` | `string` | `name` | Nome della variabile globale su `window` che `remoteEntry.js` definisce, quando è diverso da `name`. |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | obbligatorio | Tutti i remote che questo loader può caricare. |
| `shareScope` | `ShareScope` | lo scope `default` di webpack, altrimenti un oggetto condiviso da tutta la pagina | Share scope passato a `init` di ogni container. |

Usalo quando più app provengono da un elenco di remote, o quando ti serve il modulo esposto in sé.

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

Restituisce un `EntryLoader` che chiama `createFederatedApp(remoteName, modulePath, signal)`. Lancia subito un errore quando `remoteName` non è in `remotes`, così un refuso fallisce al momento di `register` e non al primo mount.

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

Carica il container, chiama `get(modulePath)`, esegue la factory e restituisce la micro app: il modulo esposto stesso quando ha una funzione `mount`, altrimenti il suo export `default` quando questo ne ha una. In caso contrario lancia `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.`

#### `loadModule(remoteName, modulePath, signal?)`

Restituisce qualsiasi modulo esposto, per esempio una libreria di componenti condivisa o un oggetto di configurazione. Quando il modulo ha un export `default`, `loadModule` restituisce quell'export.

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

Accetta un `RemoteConfig` (non un nome), carica il suo `remoteEntry.js` come script classico, legge il container da `window[remote.scope ?? remote.name]`, lo inizializza e lo restituisce. Il loader mette in cache i container per nome del remote.

### Share scope

Senza `shareScope`, il pacchetto ne sceglie uno in quest'ordine:

1. In una shell compilata da webpack, chiama `__webpack_init_sharing__('default')` e passa `__webpack_share_scopes__.default`, così i remote condividono le dipendenze che l'host ha dichiarato nella propria configurazione `shared`.
2. In qualsiasi altra shell, passa un unico oggetto semplice che ricevono tutti i remote della pagina. Attraverso di esso i remote possono condividere dipendenze tra loro; le copie dell'host restano escluse.

Passa `shareScope` per usare uno scope gestito da te.

### Tipi

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| Tipo | Significato |
| --- | --- |
| `ShareScope` | Oggetto passato a `init` di un container. |
| `FederatedContainer` | La variabile globale `{ init, get }` che `remoteEntry.js` definisce. |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`. |
| `FederatedLoaderConfig` | `{ remotes, shareScope? }` per `createFederatedLoader`. |
| `FederatedEntryOptions` | `{ shareScope? }` per `federatedEntry`. |

## Casi limite

- **Init una sola volta.** Il pacchetto inizializza ogni oggetto container una volta per pagina, anche quando più loader o entry lo usano. Un `init` fallito viene dimenticato, così il caricamento successivo riprova.
- **Timeout e tentativi.** Quando scatta il `timeout` dell'orchestratore, il `signal` annullato interrompe l'attesa di `remoteEntry.js` e rimuove il suo tag, a meno che un altro caricamento lo stia ancora aspettando. Il nuovo tentativo aggiunge un tag nuovo. Un caricamento annullato viene rifiutato con il motivo dell'annullamento; gli altri errori di caricamento riportano `[Tuvix MF] Failed to load remote entry: <url> (<error>)`.
- **Variabile globale non trovata.** Se `remoteEntry.js` si carica ma `window[scope]` non ha `init` e `get`, il caricamento fallisce con `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>`. Verifica che `scope` corrisponda al `name` del remote, o al suo `library.name` se ne imposti uno.
- **Modulo sconosciuto.** Se `get` lancia un errore o restituisce qualcosa di diverso da una factory, ottieni `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"`.
- **Remote sconosciuto.** `createFederatedEntry`, `createFederatedApp` e `loadModule` lanciano `[Tuvix MF] Remote "<name>" is not configured. Available: <names>`.
- **CORS.** `remoteEntry.js` viene caricato con `crossorigin="anonymous"`. Un remote su un'altra origine deve inviare `Access-Control-Allow-Origin`.
- **Unload e rimontaggio.** Il loader dell'orchestratore non rimuove nulla per una entry di tipo funzione loader. Il mount successivo chiama di nuovo `get(modulePath)` e webpack restituisce il modulo in cache.
- **Prefetch.** `ModuleLoader.prefetch` salta le entry di tipo funzione loader, quindi l'impostazione `prefetch` dell'orchestratore non scarica `remoteEntry.js` in anticipo.

## Cosa non fa

- Non configura webpack. Ogni remote aggiunge `ModuleFederationPlugin` da sé.
- Legge i container da `window`. I remote compilati con `library: { type: 'module' }` o con un altro tipo di libreria non globale non funzionano.
- Non legge un manifest dei remote e non scopre i remote. Elenchi tu ogni URL di `remoteEntry.js`.
- Non negozia le versioni. Se ne occupa il runtime webpack dentro ogni container, tramite lo share scope.

## Migrazione dalla 0.4

- `federatedEntry(remote)` restituiva `{ scripts: [remote.url] }`, e il loader falliva poi con "no exports found", perché un container ha solo `init` e `get`. Ora accetta il percorso del modulo esposto e restituisce una funzione loader:

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` restituisce un `EntryLoader` invece di un `EntryConfig`. Le shell che precaricavano i remote con `createFederatedApp` e registravano `entry: { scripts: [] }` possono passare `federation.createFederatedEntry('remote1', './App')` come entry.
- `FederatedLoaderConfig.shared` è sostituito da `shareScope`. Il pacchetto non ha mai letto `shared`.
- `loadRemoteContainer` restituisce `FederatedContainer` invece di `any`.
- Nella 0.4 il pacchetto leggeva `window.__webpack_share_scopes__`, che webpack non definisce mai, quindi ogni remote riceveva un proprio scope vuoto. Un host webpack ora passa il suo vero scope `default`.
- La versione 0.4 di questa pagina mostrava `createFederatedLoader()` senza argomenti e `loader.remote({ url, scope, module })`. Nessuno dei due esisteva.
