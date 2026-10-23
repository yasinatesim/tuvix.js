---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Convierte un remote de Module Federation de webpack en una entrada de Tuvix.js: carga remoteEntry.js, inicializa el share scope una sola vez y devuelve la micro app expuesta."
  icon="🌐"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

El paquete depende de `@tuvix.js/loader` y usa su `loadScript`.

## Cuándo usarlo

Tus micro apps se construyen con el `ModuleFederationPlugin` de webpack y cada una publica un `remoteEntry.js`. Tu shell solo conoce las URLs de los remotes en runtime, o se construye con otro bundler (Vite, Rollup), así que no puede listar los remotes en su propia configuración de webpack.

`federatedEntry` devuelve una entrada que el orquestador puede registrar. En el primer montaje carga `remoteEntry.js`, llama al `init` del contenedor con un share scope, llama a `get('./App')` y entrega el módulo expuesto al orquestador.

Si tu shell es un build de webpack y puedes listar los remotes en tiempo de build, la opción `remotes` del propio webpack con `entry: () => import('dashboard/App')` funciona sin este paquete.

## Inicio rápido

El remote expone un módulo cuyos propios exports o cuyo export `default` es una micro app de Tuvix.js:

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

La shell registra el remote como una entrada:

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

El loader del orquestador llama a la entrada con un `signal`, así que sus opciones `timeout` y `retries` también se aplican a `remoteEntry.js`.

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | obligatorio | El remote: `name`, `url` y, opcionalmente, `integrity` y `scope` (tabla de abajo). |
| `modulePath` | `string` | `'./App'` | Clave de `exposes` del remote. |
| `options.shareScope` | `ShareScope` | el scope `default` de webpack o, si no, un objeto compartido por toda la página | Share scope que se pasa al `init` del contenedor. |

Devuelve un `EntryLoader` (`({ signal }) => Promise<MicroAppModule>`) para `orchestrator.register({ entry })` o `ModuleLoader.load(name, entry)`. Cada llamada crea su propio loader interno; dos entradas para el mismo remote siguen compartiendo una sola etiqueta `remoteEntry.js` y una sola llamada a `init`.

`RemoteConfig`:

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre del remote, el `name` de la configuración `ModuleFederationPlugin` del remote. |
| `url` | `string` | obligatorio | URL de `remoteEntry.js`. |
| `integrity` | `string` | ninguno | Hash SRI para la etiqueta script de `remoteEntry.js`. |
| `scope` | `string` | `name` | Nombre de la variable global de `window` que define `remoteEntry.js`, cuando es distinto de `name`. |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | obligatorio | Todos los remotes que puede cargar este loader. |
| `shareScope` | `ShareScope` | el scope `default` de webpack o, si no, un objeto compartido por toda la página | Share scope que se pasa al `init` de cada contenedor. |

Úsalo cuando varias apps vienen de una lista de remotes, o cuando necesitas el propio módulo expuesto.

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

Devuelve un `EntryLoader` que llama a `createFederatedApp(remoteName, modulePath, signal)`. Lanza un error de inmediato cuando `remoteName` no está en `remotes`, así que una errata falla al llamar a `register` y no en el primer montaje.

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

Carga el contenedor, llama a `get(modulePath)`, ejecuta la factory y devuelve la micro app: el propio módulo expuesto cuando tiene una función `mount` o, si no, su export `default` cuando este la tiene. En otro caso lanza `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.`

#### `loadModule(remoteName, modulePath, signal?)`

Devuelve cualquier módulo expuesto, por ejemplo una librería de componentes compartida o un objeto de configuración. Cuando el módulo tiene un export `default`, `loadModule` devuelve ese export.

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

Recibe un `RemoteConfig` (no un nombre), carga su `remoteEntry.js` como un script clásico, lee el contenedor de `window[remote.scope ?? remote.name]`, lo inicializa y lo devuelve. El loader cachea los contenedores por nombre de remote.

### Share scope

Sin `shareScope`, el paquete elige uno en este orden:

1. En una shell que empaqueta webpack, llama a `__webpack_init_sharing__('default')` y pasa `__webpack_share_scopes__.default`, así que los remotes comparten las dependencias que el host declaró en su propia configuración `shared`.
2. En cualquier otra shell, pasa un único objeto plano que reciben todos los remotes de la página. Los remotes pueden compartir dependencias entre sí a través de él; las copias propias del host no participan.

Pasa `shareScope` para usar un scope que gestionas tú.

### Tipos

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| Tipo | Significado |
| --- | --- |
| `ShareScope` | Objeto que se pasa al `init` de un contenedor. |
| `FederatedContainer` | La variable global `{ init, get }` que define `remoteEntry.js`. |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`. |
| `FederatedLoaderConfig` | `{ remotes, shareScope? }` para `createFederatedLoader`. |
| `FederatedEntryOptions` | `{ shareScope? }` para `federatedEntry`. |

## Casos límite

- **Init una sola vez.** El paquete inicializa cada objeto contenedor una vez por página, aunque lo usen varios loaders o entradas. Un `init` fallido se olvida, así que la siguiente carga lo vuelve a intentar.
- **Timeouts y reintentos.** Cuando se dispara el `timeout` del orquestador, el `signal` abortado detiene la espera de `remoteEntry.js` y elimina su etiqueta, salvo que otra carga siga esperándola. El reintento añade una etiqueta nueva. Una carga abortada se rechaza con el motivo del aborto; los demás fallos de carga dicen `[Tuvix MF] Failed to load remote entry: <url> (<error>)`.
- **Variable global no encontrada.** Si `remoteEntry.js` se carga pero `window[scope]` no tiene `init` y `get`, la carga falla con `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>`. Comprueba que `scope` coincide con el `name` del remote, o con su `library.name` si lo definiste.
- **Módulo desconocido.** Si `get` lanza un error o devuelve algo que no es una factory, obtienes `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"`.
- **Remote desconocido.** `createFederatedEntry`, `createFederatedApp` y `loadModule` lanzan `[Tuvix MF] Remote "<name>" is not configured. Available: <names>`.
- **CORS.** `remoteEntry.js` se carga con `crossorigin="anonymous"`. Un remote en otro origen debe enviar `Access-Control-Allow-Origin`.
- **Descarga y nuevo montaje.** El loader del orquestador no elimina nada en una entrada que es una función loader. El siguiente montaje vuelve a llamar a `get(modulePath)` y webpack devuelve su módulo cacheado.
- **Precarga.** `ModuleLoader.prefetch` omite las entradas que son funciones loader, así que la opción `prefetch` del orquestador no descarga `remoteEntry.js` por adelantado.

## Lo que no hace

- No configura webpack. Cada remote añade `ModuleFederationPlugin` por su cuenta.
- Lee los contenedores de `window`. Los remotes construidos con `library: { type: 'module' }` u otro tipo de librería que no sea global no funcionan.
- No lee un manifiesto de remotes ni descubre remotes. Tú listas cada URL de `remoteEntry.js`.
- No negocia versiones. De eso se encarga el runtime de webpack dentro de cada contenedor a través del share scope.

## Migrar desde 0.4

- `federatedEntry(remote)` devolvía `{ scripts: [remote.url] }`, y después el loader fallaba con "no exports found", porque un contenedor solo tiene `init` y `get`. Ahora recibe la ruta del módulo expuesto y devuelve una función loader:

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` devuelve un `EntryLoader` en lugar de un `EntryConfig`. Las shells que precargaban remotes con `createFederatedApp` y registraban `entry: { scripts: [] }` pueden pasar `federation.createFederatedEntry('remote1', './App')` como entrada.
- `FederatedLoaderConfig.shared` se sustituye por `shareScope`. El paquete nunca leía `shared`.
- `loadRemoteContainer` devuelve `FederatedContainer` en lugar de `any`.
- En 0.4 el paquete leía `window.__webpack_share_scopes__`, que webpack nunca define, así que cada remote recibía su propio scope vacío. Un host de webpack pasa ahora su scope `default` real.
- La versión 0.4 de esta página mostraba `createFederatedLoader()` sin argumentos y `loader.remote({ url, scope, module })`. Ninguno de los dos existía.
