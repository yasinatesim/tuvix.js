# @tuvix.js/module-federation

> Transforme un remote webpack Module Federation en entrée Tuvix.js : charge remoteEntry.js, initialise le share scope une seule fois et renvoie la micro app exposée.

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentation complète : [tuvix.js.org/packages/module-federation](https://tuvix.js.org/packages/module-federation).

## Installation

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## Démarrage rapide

Le remote expose une micro app (ses exports ou son export `default` ont `mount` et `unmount`) :

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

Le shell l'enregistre :

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

Renvoie une fonction loader pour `register({ entry })` ou `ModuleLoader.load`. Au premier montage, elle charge `remoteEntry.js`, appelle `init` une fois par conteneur, appelle `get(modulePath)` et renvoie la micro app.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Le `name` du `ModuleFederationPlugin` du remote. |
| `url` | `string` | requis | URL de `remoteEntry.js`. |
| `integrity` | `string` | aucun | Hash SRI pour la balise script. |
| `scope` | `string` | `name` | Global `window` que définit l'entrée du remote. |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

Renvoie :

| Méthode | Comportement |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | `EntryLoader` pour l'orchestrateur. Lève une erreur immédiatement pour un remote inconnu. |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | `Promise<MicroAppModule>` issue du module exposé ou de son export `default`. |
| `loadModule(remoteName, modulePath, signal?)` | N'importe quel module exposé ; son export `default` s'il en a un. |
| `loadRemoteContainer(remote, signal?)` | Charge et initialise un conteneur à partir d'une `RemoteConfig` ; renvoie un `FederatedContainer`. |

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

Sans `shareScope`, un shell construit avec webpack appelle `__webpack_init_sharing__('default')` et passe `__webpack_share_scopes__.default`. Tout autre shell passe un objet unique que partagent tous les remotes de la page.

### Types

`ShareScope` (`Record<string, unknown>`), `FederatedContainer` (`{ init, get }`), `RemoteConfig`, `FederatedLoaderConfig` (`{ remotes, shareScope? }`), `FederatedEntryOptions` (`{ shareScope? }`).

## Cas particuliers

- Le `timeout` de l'orchestrateur interrompt l'attente de `remoteEntry.js` et retire la balise ; la nouvelle tentative en ajoute une neuve.
- Un `init` en échec est retenté au chargement suivant.
- Erreurs : `[Tuvix MF] Remote "<name>" is not configured`, `Failed to load remote entry: <url>`, `Remote container "<scope>" not found on window`, `Module "<path>" not found in remote "<name>"`, `does not export mount/unmount`.
- `remoteEntry.js` se charge avec `crossorigin="anonymous"` ; les remotes sur une autre origine doivent envoyer `Access-Control-Allow-Origin`.
- `ModuleLoader.prefetch` ignore les fonctions loader, donc les apps MF ne sont pas préchargées (prefetch).

## Ce qu'il ne fait pas

- Il ne configure pas webpack à votre place.
- Il lit les conteneurs depuis `window` ; les remotes `library: { type: 'module' }` ne fonctionnent pas.
- Il ne découvre pas les remotes et ne lit pas de manifestes.

## Migrer depuis la 0.4

- `federatedEntry(remote)` renvoyait `{ scripts: [url] }`, ce qui échouait avec « no exports found ». Il prend désormais `modulePath` et renvoie un `EntryLoader`. `createFederatedEntry` renvoie aussi un `EntryLoader`.
- `shared` est remplacé par `shareScope`.
- `loadRemoteContainer` renvoie `FederatedContainer` au lieu de `any`.

## Licence

MIT
