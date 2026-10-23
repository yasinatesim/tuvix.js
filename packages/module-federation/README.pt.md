# @tuvix.js/module-federation

> Transforma um remote do webpack Module Federation em uma entry do Tuvix.js: carrega o remoteEntry.js, inicializa o share scope uma única vez e retorna o micro app exposto.

Parte do framework de microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentação completa: [tuvix.js.org/packages/module-federation](https://tuvix.js.org/packages/module-federation).

## Instalação

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## Início rápido

O remote expõe um micro app (os exports dele ou o export `default` têm `mount` e `unmount`):

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

O shell o registra:

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

Retorna uma função loader para `register({ entry })` ou `ModuleLoader.load`. Na primeira montagem, carrega `remoteEntry.js`, chama `init` uma vez por container, chama `get(modulePath)` e retorna o micro app.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | O `name` do `ModuleFederationPlugin` do remote. |
| `url` | `string` | obrigatório | URL do `remoteEntry.js`. |
| `integrity` | `string` | nenhum | Hash SRI para a tag script. |
| `scope` | `string` | `name` | Global de `window` que a entry do remote define. |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

Retorna:

| Método | Comportamento |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | `EntryLoader` para o orquestrador. Lança um erro imediatamente para um remote desconhecido. |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | `Promise<MicroAppModule>` a partir do módulo exposto ou do export `default` dele. |
| `loadModule(remoteName, modulePath, signal?)` | Qualquer módulo exposto; o export `default` dele, quando existir. |
| `loadRemoteContainer(remote, signal?)` | Carrega e inicializa um container a partir de um `RemoteConfig`; retorna `FederatedContainer`. |

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

Sem `shareScope`, um shell empacotado com webpack chama `__webpack_init_sharing__('default')` e passa `__webpack_share_scopes__.default`. Qualquer outro shell passa um único objeto compartilhado por todos os remotes da página.

### Tipos

`ShareScope` (`Record<string, unknown>`), `FederatedContainer` (`{ init, get }`), `RemoteConfig`, `FederatedLoaderConfig` (`{ remotes, shareScope? }`), `FederatedEntryOptions` (`{ shareScope? }`).

## Casos extremos

- O `timeout` do orquestrador interrompe a espera por `remoteEntry.js` e remove a tag; a nova tentativa adiciona uma tag nova.
- Um `init` que falhou é tentado de novo no próximo carregamento.
- Erros: `[Tuvix MF] Remote "<name>" is not configured`, `Failed to load remote entry: <url>`, `Remote container "<scope>" not found on window`, `Module "<path>" not found in remote "<name>"`, `does not export mount/unmount`.
- `remoteEntry.js` é carregado com `crossorigin="anonymous"`; remotes em outra origem precisam enviar `Access-Control-Allow-Origin`.
- `ModuleLoader.prefetch` ignora funções loader, então apps de MF não recebem prefetch.

## O que ele não faz

- Ele não configura o webpack para você.
- Ele lê os containers de `window`; remotes com `library: { type: 'module' }` não funcionam.
- Ele não descobre remotes nem lê manifests.

## Migração a partir da 0.4

- `federatedEntry(remote)` retornava `{ scripts: [url] }`, o que falhava com "no exports found". Agora ele recebe `modulePath` e retorna um `EntryLoader`. `createFederatedEntry` também retorna um `EntryLoader`.
- `shared` foi substituído por `shareScope`.
- `loadRemoteContainer` retorna `FederatedContainer` em vez de `any`.

## Licença

MIT
