# @tuvix.js/module-federation

> Macht aus einem Remote von webpack Module Federation einen Tuvix.js-Entry: lädt remoteEntry.js, initialisiert den Share Scope einmal und gibt die bereitgestellte Micro App zurück.

Teil des Microfrontend-Frameworks [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Vollständige Dokumentation: [tuvix.js.org/de/packages/module-federation](https://tuvix.js.org/de/packages/module-federation).

## Installation

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## Schnellstart

Das Remote stellt eine Micro App bereit (seine Exporte oder sein `default`-Export haben `mount` und `unmount`):

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

Die Shell registriert es:

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

Gibt eine Loader-Funktion für `register({ entry })` oder `ModuleLoader.load` zurück. Beim ersten Mount lädt sie `remoteEntry.js`, ruft `init` einmal pro Container auf, ruft `get(modulePath)` auf und gibt die Micro App zurück.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Der `name` aus dem `ModuleFederationPlugin` des Remotes. |
| `url` | `string` | erforderlich | URL von `remoteEntry.js`. |
| `integrity` | `string` | keiner | SRI-Hash für das Skript-Tag. |
| `scope` | `string` | `name` | Globale Variable auf `window`, die der Remote-Entry definiert. |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

Gibt zurück:

| Methode | Verhalten |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | `EntryLoader` für den Orchestrator. Wirft bei einem unbekannten Remote sofort. |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | `Promise<MicroAppModule>` aus dem bereitgestellten Modul oder seinem `default`-Export. |
| `loadModule(remoteName, modulePath, signal?)` | Jedes bereitgestellte Modul; seinen `default`-Export, wenn es einen hat. |
| `loadRemoteContainer(remote, signal?)` | Lädt und initialisiert einen Container aus einer `RemoteConfig`; gibt `FederatedContainer` zurück. |

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

### Share Scope

Ohne `shareScope` ruft eine mit webpack gebundelte Shell `__webpack_init_sharing__('default')` auf und übergibt `__webpack_share_scopes__.default`. Jede andere Shell übergibt ein Objekt, das sich alle Remotes auf der Seite teilen.

### Typen

`ShareScope` (`Record<string, unknown>`), `FederatedContainer` (`{ init, get }`), `RemoteConfig`, `FederatedLoaderConfig` (`{ remotes, shareScope? }`), `FederatedEntryOptions` (`{ shareScope? }`).

## Sonderfälle

- Der `timeout` des Orchestrators bricht das Warten auf `remoteEntry.js` ab und entfernt das Tag; der erneute Versuch fügt ein neues hinzu.
- Ein fehlgeschlagenes `init` wird beim nächsten Laden wiederholt.
- Fehler: `[Tuvix MF] Remote "<name>" is not configured`, `Failed to load remote entry: <url>`, `Remote container "<scope>" not found on window`, `Module "<path>" not found in remote "<name>"`, `does not export mount/unmount`.
- `remoteEntry.js` lädt mit `crossorigin="anonymous"`; Remotes auf einem anderen Origin müssen `Access-Control-Allow-Origin` senden.
- `ModuleLoader.prefetch` überspringt Loader-Funktionen, daher werden MF-Apps nicht vorab geladen.

## Was es nicht tut

- Es konfiguriert webpack nicht für dich.
- Es liest Container aus `window`; Remotes mit `library: { type: 'module' }` funktionieren nicht.
- Es findet keine Remotes selbst und liest keine Manifeste.

## Migration von 0.4

- `federatedEntry(remote)` gab `{ scripts: [url] }` zurück, was mit „no exports found“ fehlschlug. Jetzt nimmt es `modulePath` entgegen und gibt einen `EntryLoader` zurück. Auch `createFederatedEntry` gibt einen `EntryLoader` zurück.
- `shared` wird durch `shareScope` ersetzt.
- `loadRemoteContainer` gibt `FederatedContainer` statt `any` zurück.

## Lizenz

MIT
