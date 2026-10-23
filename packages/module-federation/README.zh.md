# @tuvix.js/module-federation

> 把 webpack Module Federation remote 变成 Tuvix.js 入口（entry）：加载 remoteEntry.js，只初始化一次 share scope，并返回暴露出来的微应用。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。完整文档：[tuvix.js.org/zh/packages/module-federation](https://tuvix.js.org/zh/packages/module-federation)。

## 安装

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## 快速开始

remote 暴露一个微应用（它的导出或 `default` 导出带有 `mount` 和 `unmount`）：

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

shell（宿主应用）注册它：

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

返回一个加载函数，用于 `register({ entry })` 或 `ModuleLoader.load`。首次挂载时，它加载 `remoteEntry.js`，每个容器只调用一次 `init`，然后调用 `get(modulePath)` 并返回微应用。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | remote 的 `ModuleFederationPlugin` `name`。 |
| `url` | `string` | 必填 | `remoteEntry.js` 的 URL。 |
| `integrity` | `string` | 无 | script 标签的 SRI 哈希。 |
| `scope` | `string` | `name` | remote 入口定义的 `window` 全局变量。 |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

返回：

| 方法 | 行为 |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | 供编排器使用的 `EntryLoader`。remote 未知时立即抛错。 |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | 从暴露的模块或其 `default` 导出得到的 `Promise<MicroAppModule>`。 |
| `loadModule(remoteName, modulePath, signal?)` | 任意暴露的模块；有 `default` 导出时返回该导出。 |
| `loadRemoteContainer(remote, signal?)` | 根据 `RemoteConfig` 加载并初始化一个容器；返回 `FederatedContainer`。 |

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

不传 `shareScope` 时，用 webpack 打包的 shell 会调用 `__webpack_init_sharing__('default')` 并传入 `__webpack_share_scopes__.default`。其他 shell 会传入一个由页面上所有 remote 共享的对象。

### 类型

`ShareScope`（`Record<string, unknown>`）、`FederatedContainer`（`{ init, get }`）、`RemoteConfig`、`FederatedLoaderConfig`（`{ remotes, shareScope? }`）、`FederatedEntryOptions`（`{ shareScope? }`）。

## 边界情况

- 编排器的 `timeout` 会中止对 `remoteEntry.js` 的等待并移除该标签；重试时会添加一个新标签。
- 失败的 `init` 会在下次加载时重试。
- 错误信息：`[Tuvix MF] Remote "<name>" is not configured`、`Failed to load remote entry: <url>`、`Remote container "<scope>" not found on window`、`Module "<path>" not found in remote "<name>"`、`does not export mount/unmount`。
- `remoteEntry.js` 以 `crossorigin="anonymous"` 加载；其他源上的 remote 必须发送 `Access-Control-Allow-Origin`。
- `ModuleLoader.prefetch` 会跳过加载函数，所以 MF 应用不会被预取。

## 它不做什么

- 它不会替你配置 webpack。
- 它从 `window` 读取容器；`library: { type: 'module' }` 形式的 remote 无法使用。
- 它不会发现 remote，也不读取 manifest。

## 从 0.4 迁移

- `federatedEntry(remote)` 以前返回 `{ scripts: [url] }`，会因 "no exports found" 而失败。现在它接收 `modulePath` 并返回 `EntryLoader`。`createFederatedEntry` 也返回 `EntryLoader`。
- `shared` 被 `shareScope` 取代。
- `loadRemoteContainer` 返回 `FederatedContainer`，不再是 `any`。

## 许可证

MIT
