---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Macht aus einem Module-Federation-Remote von webpack einen Tuvix.js-Entry: lädt remoteEntry.js, initialisiert den Share Scope einmal und gibt die bereitgestellte Micro App zurück."
  icon="🌐"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

Das Paket hängt von `@tuvix.js/loader` ab und verwendet dessen `loadScript`.

## Wann du es verwendest

Deine Micro Apps werden mit dem `ModuleFederationPlugin` von webpack gebaut, und jede veröffentlicht eine `remoteEntry.js`. Deine Shell kennt die Remote-URLs erst zur Laufzeit, oder sie wird mit einem anderen Bundler (Vite, Rollup) gebaut und kann die Remotes daher nicht in einer eigenen webpack-Konfiguration auflisten.

`federatedEntry` gibt einen Entry zurück, den der Orchestrator registrieren kann. Beim ersten Mount lädt er `remoteEntry.js`, ruft `init` des Containers mit einem Share Scope auf, ruft `get('./App')` auf und übergibt das bereitgestellte Modul an den Orchestrator.

Ist deine Shell ein webpack-Build und kannst du die Remotes zur Build-Zeit auflisten, funktioniert die eigene Option `remotes` von webpack mit `entry: () => import('dashboard/App')` auch ohne dieses Paket.

## Schnellstart

Das Remote stellt ein Modul bereit, dessen eigene Exporte oder dessen `default`-Export eine Tuvix.js-Micro-App ist:

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

Die Shell registriert das Remote als Entry:

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

Der Loader des Orchestrators ruft den Entry mit einem `signal` auf, daher gelten seine Optionen `timeout` und `retries` auch für `remoteEntry.js`.

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | erforderlich | Das Remote: `name`, `url` und optional `integrity` und `scope` (Tabelle unten). |
| `modulePath` | `string` | `'./App'` | Schlüssel aus `exposes` des Remotes. |
| `options.shareScope` | `ShareScope` | der `default`-Scope von webpack, sonst ein seitenweites Objekt | Share Scope, der an `init` des Containers übergeben wird. |

Gibt einen `EntryLoader` (`({ signal }) => Promise<MicroAppModule>`) für `orchestrator.register({ entry })` oder `ModuleLoader.load(name, entry)` zurück. Jeder Aufruf erzeugt einen eigenen internen Loader; zwei Entries für dasselbe Remote teilen sich trotzdem ein `remoteEntry.js`-Tag und einen `init`-Aufruf.

`RemoteConfig`:

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Name des Remotes, also `name` in der `ModuleFederationPlugin`-Konfiguration des Remotes. |
| `url` | `string` | erforderlich | URL von `remoteEntry.js`. |
| `integrity` | `string` | keiner | SRI-Hash für das Script-Tag von `remoteEntry.js`. |
| `scope` | `string` | `name` | Name der globalen Variable auf `window`, die `remoteEntry.js` definiert, wenn er von `name` abweicht. |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | erforderlich | Alle Remotes, die dieser Loader laden darf. |
| `shareScope` | `ShareScope` | der `default`-Scope von webpack, sonst ein seitenweites Objekt | Share Scope, der an `init` jedes Containers übergeben wird. |

Verwende ihn, wenn mehrere Apps aus einer Liste von Remotes stammen oder wenn du das bereitgestellte Modul selbst brauchst.

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

Gibt einen `EntryLoader` zurück, der `createFederatedApp(remoteName, modulePath, signal)` aufruft. Er wirft sofort einen Fehler, wenn `remoteName` nicht in `remotes` steht. Ein Tippfehler schlägt also schon bei `register` fehl und nicht erst beim ersten Mount.

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

Lädt den Container, ruft `get(modulePath)` auf, führt die Factory aus und gibt die Micro App zurück: das bereitgestellte Modul selbst, wenn es eine Funktion `mount` hat, sonst seinen `default`-Export, wenn dieser eine hat. Andernfalls wirft es `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.`

#### `loadModule(remoteName, modulePath, signal?)`

Gibt ein beliebiges bereitgestelltes Modul zurück, zum Beispiel eine gemeinsame Komponentenbibliothek oder ein Konfigurationsobjekt. Hat das Modul einen `default`-Export, gibt `loadModule` diesen Export zurück.

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

Nimmt eine `RemoteConfig` (keinen Namen), lädt deren `remoteEntry.js` als klassisches Skript, liest den Container aus `window[remote.scope ?? remote.name]`, initialisiert ihn und gibt ihn zurück. Der Loader cacht Container nach Remote-Namen.

### Share Scope

Ohne `shareScope` wählt das Paket einen Scope in dieser Reihenfolge:

1. In einer Shell, die webpack bündelt, ruft es `__webpack_init_sharing__('default')` auf und übergibt `__webpack_share_scopes__.default`. Die Remotes teilen sich so die Abhängigkeiten, die der Host in seiner eigenen `shared`-Konfiguration deklariert hat.
2. In jeder anderen Shell übergibt es ein einfaches Objekt, das jedes Remote auf der Seite erhält. Darüber können Remotes Abhängigkeiten untereinander teilen; die eigenen Kopien des Hosts sind nicht beteiligt.

Übergib `shareScope`, um einen Scope zu verwenden, den du selbst verwaltest.

### Typen

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| Typ | Bedeutung |
| --- | --- |
| `ShareScope` | Objekt, das an `init` eines Containers übergeben wird. |
| `FederatedContainer` | Die globale Variable `{ init, get }`, die `remoteEntry.js` definiert. |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`. |
| `FederatedLoaderConfig` | `{ remotes, shareScope? }` für `createFederatedLoader`. |
| `FederatedEntryOptions` | `{ shareScope? }` für `federatedEntry`. |

## Sonderfälle

- **Einmal initialisieren.** Das Paket initialisiert jedes Container-Objekt einmal pro Seite, auch wenn mehrere Loader oder Entries es verwenden. Ein fehlgeschlagenes `init` wird vergessen, sodass der nächste Ladevorgang es erneut versucht.
- **Timeouts und Wiederholungen.** Läuft der `timeout` des Orchestrators ab, beendet das abgebrochene `signal` das Warten auf `remoteEntry.js` und entfernt dessen Tag, sofern kein anderer Ladevorgang noch darauf wartet. Die Wiederholung hängt ein neues Tag an. Ein abgebrochener Ladevorgang wird mit dem Abbruchgrund abgelehnt; andere Ladefehler lauten `[Tuvix MF] Failed to load remote entry: <url> (<error>)`.
- **Globale Variable nicht gefunden.** Lädt `remoteEntry.js`, aber `window[scope]` hat kein `init` und kein `get`, schlägt der Ladevorgang mit `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>` fehl. Prüfe, ob `scope` dem `name` des Remotes entspricht, oder dessen `library.name`, wenn du einen gesetzt hast.
- **Unbekanntes Modul.** Wirft `get` einen Fehler oder gibt es etwas anderes als eine Factory zurück, ergibt das `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"`.
- **Unbekanntes Remote.** `createFederatedEntry`, `createFederatedApp` und `loadModule` werfen `[Tuvix MF] Remote "<name>" is not configured. Available: <names>`.
- **CORS.** `remoteEntry.js` lädt mit `crossorigin="anonymous"`. Ein Remote auf einer anderen Origin muss `Access-Control-Allow-Origin` senden.
- **Entladen und erneut mounten.** Der Loader des Orchestrators entfernt bei einem Entry als Loader-Funktion nichts. Der nächste Mount ruft `get(modulePath)` erneut auf, und webpack gibt sein gecachtes Modul zurück.
- **Prefetch.** `ModuleLoader.prefetch` überspringt Entries als Loader-Funktion, daher lädt die `prefetch`-Einstellung des Orchestrators `remoteEntry.js` nicht vorab herunter.

## Was es nicht tut

- Es konfiguriert webpack nicht. Jedes Remote fügt `ModuleFederationPlugin` selbst hinzu.
- Es liest Container aus `window`. Remotes, die mit `library: { type: 'module' }` oder einem anderen nicht globalen Library-Typ gebaut sind, funktionieren nicht.
- Es liest kein Remote-Manifest und entdeckt keine Remotes. Du listest jede URL von `remoteEntry.js` auf.
- Es verhandelt keine Versionen. Das übernimmt die webpack-Runtime in jedem Container über den Share Scope.

## Migration von 0.4 {#migrating-from-0-4}

- `federatedEntry(remote)` gab `{ scripts: [remote.url] }` zurück, und der Loader schlug dann mit „no exports found“ fehl, weil ein Container nur `init` und `get` hat. Jetzt nimmt es den Pfad des bereitgestellten Moduls entgegen und gibt eine Loader-Funktion zurück:

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` gibt einen `EntryLoader` statt einer `EntryConfig` zurück. Shells, die Remotes mit `createFederatedApp` vorgeladen und `entry: { scripts: [] }` registriert haben, können `federation.createFederatedEntry('remote1', './App')` als Entry übergeben.
- `FederatedLoaderConfig.shared` wird durch `shareScope` ersetzt. Das Paket hat `shared` nie gelesen.
- `loadRemoteContainer` gibt `FederatedContainer` statt `any` zurück.
- In 0.4 las das Paket `window.__webpack_share_scopes__`, das webpack nie definiert, daher bekam jedes Remote einen eigenen leeren Scope. Ein webpack-Host übergibt jetzt seinen echten `default`-Scope.
- Die Version dieser Seite für 0.4 zeigte `createFederatedLoader()` ohne Argumente und `loader.remote({ url, scope, module })`. Beides gab es nie.
