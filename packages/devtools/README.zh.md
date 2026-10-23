# @tuvix.js/devtools

> 页内调试浮层，列出编排器已注册和已挂载的应用、当前路由以及最近的事件总线流量

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。

## 安装

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## 快速开始

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// 在 register() 之前安装，日志才能记录 tuvix:app:registered。
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

右下角会出现一个圆形按钮。它上方的面板每秒刷新一次，显示：

- **Apps**：所有已注册的应用，状态为 `mounted` 时显示绿点，否则显示白点。
- **Route**：`orchestrator.getRouter()?.currentPath`，没有路由器时为 `/`。
- **Events**：最新的 10 个总线事件（时间和名称），最新的在前。

浮层还会设置 `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`。在控制台运行 `__TUVIX_DEVTOOLS__.logger.getEntries()` 可以读取事件的 payload。

## API

### `installDevTools(orchestrator, options?): () => void`

接受任何带有 `getRegisteredApps()`、`getMountedApps()`、`getEventBus()` 和 `getRouter()` 的对象，例如 `Orchestrator`。返回一个清理函数，它会停止轮询、分离日志记录器、移除面板并删除全局变量。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | 日志记录器保留的最大事件数 |
| `autoOpen` | `boolean` | `true` | 为 `false` 时面板以隐藏状态挂载；切换按钮可以打开它 |
| `updateInterval` | `number` | `1000` | 面板刷新间隔（毫秒） |

### `EventLogger`

`new EventLogger(maxEntries = 200)` 通过 `onAny` 记录总线上的每个事件。条目格式为 `{ timestamp, event, data }`。

| 方法 | 行为 |
| --- | --- |
| `attach(bus)` | 订阅所有事件。总线已销毁时抛出错误。 |
| `detach()` | 取消订阅并保留条目 |
| `getEntries()` | 完整日志，最旧的在前 |
| `getRecent(count = 20)` | 最后 `count` 个条目，最旧的在前 |
| `clear()` | 清空日志 |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

不带轮询的浮层 DOM。由你提供状态。

| 方法 | 行为 |
| --- | --- |
| `mount()` | 把 `#tuvix-devtools` 以打开状态追加到 `document.body`。第二次调用不做任何事。 |
| `unmount()` | 移除它 |
| `toggle()` | 显示或隐藏面板主体；按钮保留 |
| `update({ registeredApps, mountedApps, currentRoute, events })` | 重新渲染三个区块 |

### `DevToolsOptions`

上文 `installDevTools` 选项的类型。

## 边界情况

- 日志记录器只能看到 `installDevTools` 之后发出的事件，面板在第一次刷新时（`updateInterval` 毫秒之后）才有内容。
- 仅限浏览器：服务端渲染期间 `installDevTools` 会抛出 `ReferenceError`。
- 处于 `mounting` 或 `error` 状态的应用显示白点；面板不打印状态名。
- 使用默认的全局总线时，`orchestrator.destroy()` 之后日志记录器仍会继续记录，直到你调用清理函数。
- 调用两次 `installDevTools` 会创建两个元素 id 相同的浮层，第二次调用会覆盖 `window.__TUVIX_DEVTOOLS__`。

## 它不做什么

- 没有键盘快捷键，也没有位置、尺寸或主题选项。
- 界面中不显示 payload、入口 URL、加载器状态或耗时。
- 没有浏览器扩展，也不链接到框架的 devtools。
- 不会在生产环境中自动移除：像快速开始中那样，用构建时标志控制导入。

完整文档：[tuvix.js.org/zh/packages/devtools](https://tuvix.js.org/zh/packages/devtools)

## 许可证

MIT
