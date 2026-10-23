---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Transforme un remote webpack Module Federation en entrée Tuvix.js : charge remoteEntry.js, initialise le share scope une seule fois et renvoie la micro app exposée."
  icon="🌐"
  npm="true"
/>

## Installation {#installation}

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

Le paquet dépend de `@tuvix.js/loader` et utilise son `loadScript`.

## Quand l'utiliser {#when-to-use-it}

Vos micro apps sont compilées avec le `ModuleFederationPlugin` de webpack et chacune publie un `remoteEntry.js`. Votre shell ne connaît les URL des remotes qu'à l'exécution, ou il est compilé avec un autre bundler (Vite, Rollup), donc il ne peut pas lister les remotes dans sa propre configuration webpack.

`federatedEntry` renvoie une entrée que l'orchestrateur peut enregistrer. Au premier montage, elle charge `remoteEntry.js`, appelle l'`init` du conteneur avec un share scope, appelle `get('./App')` et transmet le module exposé à l'orchestrateur.

Si votre shell est un build webpack et que vous pouvez lister les remotes au moment du build, l'option `remotes` de webpack avec `entry: () => import('dashboard/App')` fonctionne sans ce paquet.

## Démarrage rapide {#quick-start}

Le remote expose un module dont les exports propres ou l'export `default` sont une micro app Tuvix.js :

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

Le shell enregistre le remote comme entrée :

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

Le loader de l'orchestrateur appelle l'entrée avec un `signal`, donc ses options `timeout` et `retries` s'appliquent aussi à `remoteEntry.js`.

## API {#api}

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | requis | Le remote : `name`, `url`, et en option `integrity` et `scope` (tableau ci-dessous). |
| `modulePath` | `string` | `'./App'` | Clé tirée des `exposes` du remote. |
| `options.shareScope` | `ShareScope` | le scope `default` de webpack, sinon un objet commun à toute la page | Share scope passé à l'`init` du conteneur. |

Renvoie un `EntryLoader` (`({ signal }) => Promise<MicroAppModule>`) pour `orchestrator.register({ entry })` ou `ModuleLoader.load(name, entry)`. Chaque appel crée son propre loader interne ; deux entrées pour le même remote partagent quand même une seule balise `remoteEntry.js` et un seul appel à `init`.

`RemoteConfig` :

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom du remote, le `name` de la configuration `ModuleFederationPlugin` du remote. |
| `url` | `string` | requis | URL de `remoteEntry.js`. |
| `integrity` | `string` | aucun | Hash SRI pour la balise script de `remoteEntry.js`. |
| `scope` | `string` | `name` | Nom de la variable globale de `window` que `remoteEntry.js` définit, quand il diffère de `name`. |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | requis | Tous les remotes que ce loader peut charger. |
| `shareScope` | `ShareScope` | le scope `default` de webpack, sinon un objet commun à toute la page | Share scope passé à l'`init` de chaque conteneur. |

Utilisez-le quand plusieurs apps viennent d'une liste de remotes, ou quand vous avez besoin du module exposé lui-même.

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

Renvoie un `EntryLoader` qui appelle `createFederatedApp(remoteName, modulePath, signal)`. Il lève une erreur immédiatement quand `remoteName` n'est pas dans `remotes`, donc une faute de frappe échoue au moment de `register` et non au premier montage.

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

Charge le conteneur, appelle `get(modulePath)`, exécute la factory et renvoie la micro app : le module exposé lui-même quand il a une fonction `mount`, sinon son export `default` quand celui-ci en a une. Dans les autres cas, il lève `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.`

#### `loadModule(remoteName, modulePath, signal?)`

Renvoie n'importe quel module exposé, par exemple une bibliothèque de composants partagée ou un objet de configuration. Quand le module a un export `default`, `loadModule` renvoie cet export.

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

Prend un `RemoteConfig` (pas un nom), charge son `remoteEntry.js` comme script classique, lit le conteneur dans `window[remote.scope ?? remote.name]`, l'initialise et le renvoie. Le loader met les conteneurs en cache par nom de remote.

### Share scope {#share-scope}

Sans `shareScope`, le paquet en choisit un dans cet ordre :

1. Dans un shell que webpack bundle, il appelle `__webpack_init_sharing__('default')` et passe `__webpack_share_scopes__.default`, donc les remotes partagent les dépendances que l'hôte a déclarées dans sa propre configuration `shared`.
2. Dans tout autre shell, il passe un unique objet simple que reçoit chaque remote de la page. Les remotes peuvent partager des dépendances entre eux à travers lui ; les copies propres à l'hôte n'y participent pas.

Passez `shareScope` pour utiliser un scope que vous gérez vous-même.

### Types {#types}

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| Type | Signification |
| --- | --- |
| `ShareScope` | Objet passé à l'`init` d'un conteneur. |
| `FederatedContainer` | La variable globale `{ init, get }` que `remoteEntry.js` définit. |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`. |
| `FederatedLoaderConfig` | `{ remotes, shareScope? }` pour `createFederatedLoader`. |
| `FederatedEntryOptions` | `{ shareScope? }` pour `federatedEntry`. |

## Cas limites {#edge-cases}

- **Init unique.** Le paquet initialise chaque objet conteneur une seule fois par page, même quand plusieurs loaders ou entrées l'utilisent. Un `init` échoué est oublié, donc le chargement suivant réessaie.
- **Timeouts et retries.** Quand le `timeout` de l'orchestrateur se déclenche, le `signal` annulé arrête l'attente de `remoteEntry.js` et retire sa balise, sauf si un autre chargement l'attend encore. Le retry ajoute une nouvelle balise. Un chargement annulé est rejeté avec la raison de l'annulation ; les autres échecs de chargement affichent `[Tuvix MF] Failed to load remote entry: <url> (<error>)`.
- **Variable globale introuvable.** Si `remoteEntry.js` se charge mais que `window[scope]` n'a ni `init` ni `get`, le chargement échoue avec `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>`. Vérifiez que `scope` correspond au `name` du remote, ou à son `library.name` si vous en définissez un.
- **Module inconnu.** Si `get` lève une erreur ou renvoie autre chose qu'une factory, vous obtenez `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"`.
- **Remote inconnu.** `createFederatedEntry`, `createFederatedApp` et `loadModule` lèvent `[Tuvix MF] Remote "<name>" is not configured. Available: <names>`.
- **CORS.** `remoteEntry.js` se charge avec `crossorigin="anonymous"`. Un remote sur une autre origine doit envoyer `Access-Control-Allow-Origin`.
- **Déchargement et remontage.** Le loader de l'orchestrateur ne retire rien pour une entrée de type fonction loader. Le montage suivant appelle de nouveau `get(modulePath)` et webpack renvoie son module en cache.
- **Prefetch.** `ModuleLoader.prefetch` ignore les entrées de type fonction loader, donc le réglage `prefetch` de l'orchestrateur ne télécharge pas `remoteEntry.js` à l'avance.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne configure pas webpack. Chaque remote ajoute lui-même `ModuleFederationPlugin`.
- Il lit les conteneurs dans `window`. Les remotes compilés avec `library: { type: 'module' }` ou un autre type de bibliothèque non global ne fonctionnent pas.
- Il ne lit pas de manifeste de remote et ne découvre pas les remotes. Vous listez chaque URL de `remoteEntry.js`.
- Il ne négocie pas les versions. Le runtime webpack de chaque conteneur s'en charge via le share scope.

## Migrer depuis 0.4 {#migrating-from-0-4}

- `federatedEntry(remote)` renvoyait `{ scripts: [remote.url] }`, et le loader échouait ensuite avec « no exports found », car un conteneur n'a que `init` et `get`. La fonction prend maintenant le chemin du module exposé et renvoie une fonction loader :

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` renvoie un `EntryLoader` au lieu d'un `EntryConfig`. Les shells qui préchargeaient les remotes avec `createFederatedApp` et enregistraient `entry: { scripts: [] }` peuvent passer `federation.createFederatedEntry('remote1', './App')` comme entrée.
- `FederatedLoaderConfig.shared` est remplacé par `shareScope`. Le paquet ne lisait jamais `shared`.
- `loadRemoteContainer` renvoie `FederatedContainer` au lieu de `any`.
- En 0.4, le paquet lisait `window.__webpack_share_scopes__`, que webpack ne définit jamais, donc chaque remote recevait son propre scope vide. Un hôte webpack passe maintenant son vrai scope `default`.
- La version 0.4 de cette page montrait `createFederatedLoader()` sans argument et `loader.remote({ url, scope, module })`. Aucun des deux n'existait.
