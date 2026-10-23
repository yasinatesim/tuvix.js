---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="把 webpack Module Federation remote 变成 Tuvix.js 入口（entry）：加载 remoteEntry.js，只初始化一次 share scope，并返回暴露出来的微应用。"
  icon="🌐"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

这个包依赖 `@tuvix.js/loader`，并使用其中的 `loadScript`。

## 何时使用

你的微应用用 webpack 的 `ModuleFederationPlugin` 构建，每个微应用都发布一个 `remoteEntry.js`。你的 shell（宿主应用）只在运行时才知道 remote 的 URL，或者它用其他打包工具（Vite、Rollup）构建，因此无法在自己的 webpack 配置中列出这些 remote。

`federatedEntry` 返回一个编排器可以注册的入口。首次挂载时，它加载 `remoteEntry.js`，用一个 share scope 调用容器的 `init`，调用 `get('./App')`，并把暴露的模块交给编排器。

如果你的 shell 是 webpack 构建，并且你能在构建时列出 remote，那么 webpack 自带的 `remotes` 选项配合 `entry: () => import('dashboard/App')` 无需这个包即可工作。

## 快速开始

remote 暴露一个模块，该模块自身的导出或其 `default` 导出是一个 Tuvix.js 微应用：

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

shell 把 remote 注册为一个入口：

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

编排器的加载器调用入口时会传入一个 `signal`，因此它的 `timeout` 和 `retries` 选项同样作用于 `remoteEntry.js`。

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | 必填 | remote：`name`、`url`，以及可选的 `integrity` 和 `scope`（见下表）。 |
| `modulePath` | `string` | `'./App'` | remote 的 `exposes` 中的键。 |
| `options.shareScope` | `ShareScope` | webpack 的 `default` scope，否则为一个页面级对象 | 传给容器 `init` 的 share scope。 |

返回一个 `EntryLoader`（`({ signal }) => Promise<MicroAppModule>`），用于 `orchestrator.register({ entry })` 或 `ModuleLoader.load(name, entry)`。每次调用都会创建自己的内部加载器；同一个 remote 的两个入口仍然共享一个 `remoteEntry.js` 标签和一次 `init` 调用。

`RemoteConfig`：

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | remote 名称，即 remote 的 `ModuleFederationPlugin` 配置中的 `name`。 |
| `url` | `string` | 必填 | `remoteEntry.js` 的 URL。 |
| `integrity` | `string` | 无 | `remoteEntry.js` script 标签的 SRI 哈希。 |
| `scope` | `string` | `name` | `remoteEntry.js` 定义的 `window` 全局变量名，在它与 `name` 不同时使用。 |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | 必填 | 这个加载器可以加载的所有 remote。 |
| `shareScope` | `ShareScope` | webpack 的 `default` scope，否则为一个页面级对象 | 传给每个容器 `init` 的 share scope。 |

当多个应用来自一组 remote，或者你需要暴露的模块本身时，使用它。

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

返回一个调用 `createFederatedApp(remoteName, modulePath, signal)` 的 `EntryLoader`。当 `remoteName` 不在 `remotes` 中时，它会立即抛出错误，因此拼写错误会在 `register` 时失败，而不是在首次挂载时。

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

加载容器，调用 `get(modulePath)`，运行工厂函数并返回微应用：如果暴露的模块本身有 `mount` 函数，就返回该模块；否则如果其 `default` 导出有 `mount` 函数，就返回该导出。都不满足时抛出 `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.`

#### `loadModule(remoteName, modulePath, signal?)`

返回任意暴露的模块，例如共享组件库或配置对象。当模块有 `default` 导出时，`loadModule` 返回该导出。

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

接收一个 `RemoteConfig`（不是名称），把它的 `remoteEntry.js` 作为 classic script 加载，从 `window[remote.scope ?? remote.name]` 读取容器，初始化后返回。加载器按 remote 名称缓存容器。

### Share scope

没有传 `shareScope` 时，这个包按以下顺序选择一个：

1. 在由 webpack 打包的 shell 中，它调用 `__webpack_init_sharing__('default')` 并传入 `__webpack_share_scopes__.default`，这样 remote 会共享宿主在自己的 `shared` 配置中声明的依赖。
2. 在其他任何 shell 中，它传入同一个普通对象，页面上的每个 remote 都收到这个对象。remote 之间可以通过它共享依赖；宿主自己的副本不参与。

传入 `shareScope` 可以使用你自己管理的 scope。

### 类型

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| 类型 | 含义 |
| --- | --- |
| `ShareScope` | 传给容器 `init` 的对象。 |
| `FederatedContainer` | `remoteEntry.js` 定义的 `{ init, get }` 全局变量。 |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`。 |
| `FederatedLoaderConfig` | `createFederatedLoader` 的 `{ remotes, shareScope? }`。 |
| `FederatedEntryOptions` | `federatedEntry` 的 `{ shareScope? }`。 |

## 边界情况

- **只初始化一次。** 每个容器对象在一个页面中只初始化一次，即使有多个加载器或入口使用它。失败的 `init` 不会被记住，下一次加载会重试。
- **超时和重试。** 编排器的 `timeout` 触发时，被中止的 `signal` 会停止等待 `remoteEntry.js`，并移除其标签，除非还有其他加载在等待它。重试会追加一个新标签。被中止的加载以中止原因 reject；其他加载失败的信息为 `[Tuvix MF] Failed to load remote entry: <url> (<error>)`。
- **找不到全局变量。** 如果 `remoteEntry.js` 已加载，但 `window[scope]` 没有 `init` 和 `get`，加载会以 `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>` 失败。请检查 `scope` 是否与 remote 的 `name` 一致，如果你设置了 `library.name`，则检查是否与它一致。
- **未知模块。** `get` 抛出错误或返回的不是工厂函数时，得到 `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"`。
- **未知 remote。** `createFederatedEntry`、`createFederatedApp` 和 `loadModule` 抛出 `[Tuvix MF] Remote "<name>" is not configured. Available: <names>`。
- **CORS。** `remoteEntry.js` 以 `crossorigin="anonymous"` 加载。位于其他源的 remote 必须发送 `Access-Control-Allow-Origin`。
- **卸载后重新挂载。** 对于加载器函数形式的入口，编排器的加载器不会移除任何东西。下一次挂载会再次调用 `get(modulePath)`，webpack 返回其缓存的模块。
- **预取。** `ModuleLoader.prefetch` 会跳过加载器函数形式的入口，因此编排器的 `prefetch` 设置不会提前下载 `remoteEntry.js`。

## 它不做什么

- 它不配置 webpack。每个 remote 自己添加 `ModuleFederationPlugin`。
- 它从 `window` 读取容器。用 `library: { type: 'module' }` 或其他非全局 library 类型构建的 remote 无法使用。
- 它不读取 remote manifest，也不发现 remote。你需要列出每个 `remoteEntry.js` 的 URL。
- 它不协商版本。版本协商由每个容器内的 webpack 运行时通过 share scope 完成。

## 从 0.4 迁移

- `federatedEntry(remote)` 过去返回 `{ scripts: [remote.url] }`，随后加载器会以 "no exports found" 失败，因为容器只有 `init` 和 `get`。现在它接收暴露模块的路径，并返回一个加载器函数：

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) 返回的是 EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` 返回 `EntryLoader`，不再返回 `EntryConfig`。过去用 `createFederatedApp` 预加载 remote 并注册 `entry: { scripts: [] }` 的 shell，现在可以把 `federation.createFederatedEntry('remote1', './App')` 作为入口传入。
- `FederatedLoaderConfig.shared` 被 `shareScope` 取代。这个包从未读取过 `shared`。
- `loadRemoteContainer` 返回 `FederatedContainer`，不再返回 `any`。
- 在 0.4 中，这个包读取 `window.__webpack_share_scopes__`，而 webpack 从不定义它，所以每个 remote 都得到自己的空 scope。现在 webpack 宿主会传入它真正的 `default` scope。
- 这个页面的 0.4 版本展示了不带参数的 `createFederatedLoader()` 和 `loader.remote({ url, scope, module })`。两者都不存在。
