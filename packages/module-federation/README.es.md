# @tuvix.js/module-federation

> Convierte un remote de Module Federation de webpack en una entrada de Tuvix.js: carga remoteEntry.js, inicializa el share scope una sola vez y devuelve la micro app expuesta.

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentación completa: [tuvix.js.org/packages/module-federation](https://tuvix.js.org/packages/module-federation).

## Instalación

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## Inicio rápido

El remote expone una micro app (sus exports o su export `default` tienen `mount` y `unmount`):

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

Devuelve una función loader para `register({ entry })` o `ModuleLoader.load`. En el primer montaje carga `remoteEntry.js`, llama a `init` una vez por contenedor, llama a `get(modulePath)` y devuelve la micro app.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | El `name` del `ModuleFederationPlugin` del remote. |
| `url` | `string` | obligatorio | URL de `remoteEntry.js`. |
| `integrity` | `string` | ninguno | Hash SRI para la etiqueta script. |
| `scope` | `string` | `name` | Variable global de `window` que define la entrada del remote. |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

Devuelve:

| Método | Comportamiento |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | `EntryLoader` para el orquestador. Lanza un error de inmediato si el remote es desconocido. |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | `Promise<MicroAppModule>` a partir del módulo expuesto o de su export `default`. |
| `loadModule(remoteName, modulePath, signal?)` | Cualquier módulo expuesto; su export `default` cuando lo tiene. |
| `loadRemoteContainer(remote, signal?)` | Carga e inicializa un contenedor a partir de un `RemoteConfig`; devuelve `FederatedContainer`. |

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

Sin `shareScope`, una shell empaquetada con webpack llama a `__webpack_init_sharing__('default')` y pasa `__webpack_share_scopes__.default`. Cualquier otra shell pasa un único objeto que comparten todos los remotes de la página.

### Tipos

`ShareScope` (`Record<string, unknown>`), `FederatedContainer` (`{ init, get }`), `RemoteConfig`, `FederatedLoaderConfig` (`{ remotes, shareScope? }`), `FederatedEntryOptions` (`{ shareScope? }`).

## Casos límite

- El `timeout` del orquestador cancela la espera de `remoteEntry.js` y elimina la etiqueta; el reintento añade una nueva.
- Un `init` fallido se reintenta en la siguiente carga.
- Errores: `[Tuvix MF] Remote "<name>" is not configured`, `Failed to load remote entry: <url>`, `Remote container "<scope>" not found on window`, `Module "<path>" not found in remote "<name>"`, `does not export mount/unmount`.
- `remoteEntry.js` se carga con `crossorigin="anonymous"`; los remotes de otro origen deben enviar `Access-Control-Allow-Origin`.
- `ModuleLoader.prefetch` omite las funciones loader, así que las apps de Module Federation no se precargan.

## Lo que no hace

- No configura webpack por ti.
- Lee los contenedores desde `window`; los remotes con `library: { type: 'module' }` no funcionan.
- No descubre remotes ni lee manifiestos.

## Migrar desde 0.4

- `federatedEntry(remote)` devolvía `{ scripts: [url] }`, lo que fallaba con "no exports found". Ahora recibe `modulePath` y devuelve un `EntryLoader`. `createFederatedEntry` también devuelve un `EntryLoader`.
- `shared` se reemplaza por `shareScope`.
- `loadRemoteContainer` devuelve `FederatedContainer` en lugar de `any`.

## Licencia

MIT
