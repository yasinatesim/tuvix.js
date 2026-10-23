---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Transforma um remote do webpack Module Federation em uma entry do Tuvix.js: carrega o remoteEntry.js, inicializa o share scope uma única vez e retorna o micro app exposto."
  icon="🌐"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

O pacote depende de `@tuvix.js/loader` e usa o `loadScript` dele.

## Quando usar

Seus micro apps são construídos com o `ModuleFederationPlugin` do webpack e cada um publica um `remoteEntry.js`. Seu shell só conhece as URLs dos remotes em tempo de execução, ou é construído com outro bundler (Vite, Rollup), então não consegue listar os remotes na própria config do webpack.

`federatedEntry` retorna uma entry que o orquestrador pode registrar. Na primeira montagem, ela carrega o `remoteEntry.js`, chama o `init` do container com um share scope, chama `get('./App')` e entrega o módulo exposto ao orquestrador.

Se o seu shell é um build do webpack e você consegue listar os remotes em tempo de build, a própria opção `remotes` do webpack com `entry: () => import('dashboard/App')` funciona sem este pacote.

## Início rápido

O remote expõe um módulo cujos próprios exports ou cujo export `default` é um micro app do Tuvix.js:

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

O shell registra o remote como uma entry:

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

O loader do orquestrador chama a entry com um `signal`, então as opções `timeout` e `retries` dele também se aplicam ao `remoteEntry.js`.

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | obrigatório | O remote: `name`, `url` e, opcionalmente, `integrity` e `scope` (tabela abaixo). |
| `modulePath` | `string` | `'./App'` | Chave do `exposes` do remote. |
| `options.shareScope` | `ShareScope` | scope `default` do webpack, senão um objeto compartilhado por toda a página | Share scope passado ao `init` do container. |

Retorna um `EntryLoader` (`({ signal }) => Promise<MicroAppModule>`) para `orchestrator.register({ entry })` ou `ModuleLoader.load(name, entry)`. Cada chamada cria seu próprio loader interno; duas entries para o mesmo remote continuam compartilhando uma única tag de `remoteEntry.js` e uma única chamada de `init`.

`RemoteConfig`:

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome do remote, o `name` na config do `ModuleFederationPlugin` do remote. |
| `url` | `string` | obrigatório | URL do `remoteEntry.js`. |
| `integrity` | `string` | nenhum | Hash SRI para a tag de script do `remoteEntry.js`. |
| `scope` | `string` | `name` | Nome da variável global de `window` que o `remoteEntry.js` define, quando ele é diferente de `name`. |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | obrigatório | Todos os remotes que este loader pode carregar. |
| `shareScope` | `ShareScope` | scope `default` do webpack, senão um objeto compartilhado por toda a página | Share scope passado ao `init` de cada container. |

Use-o quando vários apps vêm de uma lista de remotes, ou quando você precisa do próprio módulo exposto.

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

Retorna um `EntryLoader` que chama `createFederatedApp(remoteName, modulePath, signal)`. Ele lança um erro na hora quando `remoteName` não está em `remotes`, então um erro de digitação falha no momento do `register`, e não na primeira montagem.

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

Carrega o container, chama `get(modulePath)`, executa a factory e retorna o micro app: o próprio módulo exposto quando ele tem uma função `mount`, senão o export `default` dele quando esse export tem uma. Caso contrário, lança `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.`

#### `loadModule(remoteName, modulePath, signal?)`

Retorna qualquer módulo exposto, por exemplo uma biblioteca de componentes compartilhada ou um objeto de configuração. Quando o módulo tem um export `default`, `loadModule` retorna esse export.

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

Recebe um `RemoteConfig` (não um nome), carrega o `remoteEntry.js` dele como um script clássico, lê o container em `window[remote.scope ?? remote.name]`, inicializa-o e o retorna. O loader faz cache dos containers pelo nome do remote.

### Share scope

Sem `shareScope`, o pacote escolhe um nesta ordem:

1. Em um shell empacotado pelo webpack, ele chama `__webpack_init_sharing__('default')` e passa `__webpack_share_scopes__.default`, para que os remotes compartilhem as dependências que o host declarou na própria config `shared`.
2. Em qualquer outro shell, ele passa um único objeto simples que todos os remotes da página recebem. Os remotes podem compartilhar dependências entre si por meio dele; as cópias do próprio host não participam.

Passe `shareScope` para usar um scope que você mesmo gerencia.

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
| `ShareScope` | Objeto passado ao `init` de um container. |
| `FederatedContainer` | A variável global `{ init, get }` que o `remoteEntry.js` define. |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`. |
| `FederatedLoaderConfig` | `{ remotes, shareScope? }` para `createFederatedLoader`. |
| `FederatedEntryOptions` | `{ shareScope? }` para `federatedEntry`. |

## Casos extremos

- **Init uma única vez.** O pacote inicializa cada objeto container uma vez por página, mesmo quando vários loaders ou entries o usam. Um `init` que falhou é esquecido, então o próximo carregamento tenta de novo.
- **Timeouts e retries.** Quando o `timeout` do orquestrador dispara, o `signal` abortado interrompe a espera pelo `remoteEntry.js` e remove a tag dele, a menos que outro carregamento ainda esteja esperando por ela. O retry adiciona uma tag nova. Um carregamento abortado rejeita com o motivo do abort; as outras falhas de carregamento aparecem como `[Tuvix MF] Failed to load remote entry: <url> (<error>)`.
- **Variável global não encontrada.** Se o `remoteEntry.js` carrega mas `window[scope]` não tem `init` e `get`, o carregamento falha com `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>`. Confira se `scope` corresponde ao `name` do remote, ou ao `library.name` dele, quando você definir um.
- **Módulo desconhecido.** Se `get` lança um erro ou retorna algo que não é uma factory, o resultado é `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"`.
- **Remote desconhecido.** `createFederatedEntry`, `createFederatedApp` e `loadModule` lançam `[Tuvix MF] Remote "<name>" is not configured. Available: <names>`.
- **CORS.** O `remoteEntry.js` é carregado com `crossorigin="anonymous"`. Um remote em outra origem precisa enviar `Access-Control-Allow-Origin`.
- **Descarregar e remontar.** O loader do orquestrador não remove nada para uma entry do tipo função loader. A próxima montagem chama `get(modulePath)` de novo e o webpack retorna o módulo em cache.
- **Prefetch.** `ModuleLoader.prefetch` ignora entries do tipo função loader, então a configuração `prefetch` do orquestrador não baixa o `remoteEntry.js` antecipadamente.

## O que ele não faz

- Não configura o webpack. Cada remote adiciona o `ModuleFederationPlugin` por conta própria.
- Lê os containers de `window`. Remotes construídos com `library: { type: 'module' }` ou outro tipo de library não global não funcionam.
- Não lê um manifest de remotes nem descobre remotes. Você lista a URL de cada `remoteEntry.js`.
- Não negocia versões. O runtime do webpack dentro de cada container faz isso por meio do share scope.

## Migração a partir da 0.4

- `federatedEntry(remote)` retornava `{ scripts: [remote.url] }`, e o loader então falhava com "no exports found", porque um container só tem `init` e `get`. Agora ele recebe o caminho do módulo exposto e retorna uma função loader:

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` retorna um `EntryLoader` em vez de um `EntryConfig`. Shells que pré-carregavam remotes com `createFederatedApp` e registravam `entry: { scripts: [] }` podem passar `federation.createFederatedEntry('remote1', './App')` como entry.
- `FederatedLoaderConfig.shared` foi substituído por `shareScope`. O pacote nunca leu `shared`.
- `loadRemoteContainer` retorna `FederatedContainer` em vez de `any`.
- Na 0.4, o pacote lia `window.__webpack_share_scopes__`, que o webpack nunca define, então cada remote recebia o próprio scope vazio. Um host webpack agora passa o scope `default` real dele.
- A versão 0.4 desta página mostrava `createFederatedLoader()` sem argumentos e `loader.remote({ url, scope, module })`. Nenhum dos dois existia.
