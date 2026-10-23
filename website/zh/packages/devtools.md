---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="编排器的页内调试浮层。列出已注册和已挂载的微应用、当前路由以及事件总线上最近的事件。"
  icon="🛠️"
  npm="true"
/>

## 安装

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## 何时使用

在开发时，如果你需要查看编排器知道哪些微应用、其中哪些当前已挂载、以及哪些事件经过了事件总线，就安装它。浮层位于页面右下角，每秒刷新一次。

如果你需要在界面中查看组件树、网络耗时或事件 payload，请改用浏览器的 DevTools 或框架的 devtools 扩展。这个包只显示应用名称、一个路由字符串，以及带时间戳的事件名称。payload 保留在 logger 中，你可以在控制台读取。

## 快速开始

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// 在 register() 之前安装，日志才能记录 tuvix:app:registered。
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

打开 `/dashboard`，浮层会列出带绿点的 `dashboard` 和带白点的 `settings`。Route 一行显示 `/dashboard`，Events 列表显示 dashboard 挂载过程中的 `tuvix:app:status-change` 和 `tuvix:app:mount` 事件。

## 面板显示的内容

`installDevTools` 会向 `document.body` 追加一个 `<div id="tuvix-devtools">`。它包含一个圆形切换按钮（固定在距右下角 12px 处，`z-index: 99999`），以及按钮上方一个 280px 宽的面板，面板分为三个区域：

| 区域 | 来源 | 内容 |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` 和 `getMountedApps()` | 每个已注册应用占一行。绿点表示其状态为 `mounted`。白点表示其他所有状态，包括 `loading` 和 `error`。 |
| Route | `orchestrator.getRouter()?.currentPath` | 路由器的当前路径：不含 `base` 前缀，包含查询字符串。编排器没有路由器时显示 `/`。 |
| Events | 附加到 `orchestrator.getEventBus()` 的 `EventLogger` | 最新的 10 个事件，最新的在前。每行显示本地时间、一个短横线和事件名称。 |

编排器默认使用 `getGlobalBus()`，因此 Events 列表除了编排器自己的事件，还会显示你的微应用在共享总线上发出的事件：

| 事件 | 触发时机 |
| --- | --- |
| `tuvix:app:registered` | `register()` 添加一个应用 |
| `tuvix:app:bootstrap`、`tuvix:app:mount`、`tuvix:app:unmount` | 应用经历对应的生命周期步骤 |
| `tuvix:app:error` | 应用的加载、初始化（bootstrap）或挂载失败 |
| `tuvix:app:status-change` | 应用的状态发生变化。每次挂载会出现多次。 |
| `tuvix:route:change` | 路由器发生导航 |
| `tuvix:started`、`tuvix:destroyed` | `start()` 和 `destroy()` 完成 |

面板还会暴露 `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`。在浏览器控制台运行 `__TUVIX_DEVTOOLS__.logger.getEntries()`，可以读取面板不打印的 payload。

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

第一个参数接受任何具有这四个方法的对象。来自 `@tuvix.js/core` 或 `tuvix.js` 的 `Orchestrator` 都符合。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | logger 保留的最大事件数。面板打印其中 10 个，其余可以通过 `__TUVIX_DEVTOOLS__.logger` 读取。 |
| `autoOpen` | `boolean` | `true` | 设为 `false` 时面板以隐藏状态挂载。切换按钮保持可见，点击即可打开面板。 |
| `updateInterval` | `number` | `1000` | 面板两次刷新之间的毫秒数。 |

每次调用时它会：

1. 创建一个 `DevToolsPanel` 和一个 `EventLogger(maxLogEntries)`，
2. 通过 `onAny` 将 logger 附加到 `orchestrator.getEventBus()`，
3. 挂载面板，并在 `autoOpen` 为 `false` 时将其隐藏，
4. 启动一个 `setInterval`，读取编排器并调用 `panel.update()`，
5. 设置 `window.__TUVIX_DEVTOOLS__`。

它返回一个清理函数，该函数会清除定时器、分离 logger、移除面板并删除 `window.__TUVIX_DEVTOOLS__`。

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// 之后，例如在热模块替换的 dispose 钩子中：
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger` 通过 `bus.onAny` 记录总线上的每个事件。每条记录包含 `timestamp`（发出时的 `Date.now()`）、`event`（事件名称）和 `data`（按原样发出的 payload，不做克隆）。日志超过 `maxEntries` 时，logger 会丢弃最旧的记录。

| 方法 | 行为 |
| --- | --- |
| `attach(bus)` | 订阅 `bus` 的所有事件。总线已销毁时抛出错误。 |
| `detach()` | 取消订阅。已记录的条目保留。 |
| `getEntries()` | 返回整个日志，最旧的在前。 |
| `getRecent(count)` | 返回最后 `count` 条记录，最旧的在前。 |
| `clear()` | 清空日志，保留订阅。 |

你可以不用面板单独使用它，在测试中对总线流量做断言，或者导出页面上的事件：

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel` 是浮层的 DOM 部分，不做任何轮询。你用想要显示的状态调用 `update()`。

| 方法 | 行为 |
| --- | --- |
| `mount()` | 将 `#tuvix-devtools` 以展开状态追加到 `document.body`。在同一实例上再次调用不做任何事。 |
| `unmount()` | 移除该元素。 |
| `toggle()` | 显示或隐藏面板主体。切换按钮保留。在 `mount()` 之前调用不做任何事。 |
| `update(state)` | 重建 Apps、Route 和 Events 区域。打印 `events` 的最后 10 项，最新的在前。在 `mount()` 之前调用不做任何事。 |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### 类型

| 名称 | 含义 |
| --- | --- |
| `DevToolsOptions` | `installDevTools` 的选项：`maxLogEntries`、`autoOpen`、`updateInterval`。 |

编排器的结构类型和日志记录的结构类型没有导出。需要它们作为类型时，使用 `Parameters<typeof installDevTools>[0]` 和 `ReturnType<EventLogger['getEntries']>[number]`。

## 生产构建

这个包声明了 `"sideEffects": false`，但如果你的代码静态导入 `import { installDevTools } from '@tuvix.js/devtools'` 并调用它，它仍然会进入 bundle。像快速开始中那样，在构建时标志之后用动态 `import()` 加载它。打包工具会把 `process.env.NODE_ENV` 替换为字符串，并删除无用分支及其 chunk。在 Vite 应用中，你也可以改为判断 `import.meta.env.DEV`。

在生产环境中保留浮层的代价是：一个每秒重建三个 DOM 区域的 `setInterval`，一个对所有总线事件的订阅，以及一个把编排器交给页面上任意脚本的全局变量。

## 边界情况

- 在 `register()` 和 `start()` 之前安装。logger 只能看到 `attach` 之后发出的事件，面板在首次刷新之前保持为空，首次刷新发生在调用后 `updateInterval` 毫秒。
- `installDevTools` 需要 `document` 和 `window`。在服务端渲染期间调用会抛出 `ReferenceError`。请在仅客户端运行的代码中调用。
- 使用 `connectRouter()` 且没有 `router` 选项时，`getRouter()` 返回 `null`，Route 一行显示 `/`。
- `getMountedApps()` 只统计 `mounted` 状态。处于 `mounting` 或 `error` 的应用显示白点，面板从不打印状态名称。
- 私有总线（`createOrchestrator({ eventBus: {...} })`）会被 `orchestrator.destroy()` 销毁。在那之后安装会从 `onAny` 抛出错误。使用默认的全局总线时，`destroy()` 之后 logger 会继续记录，直到你调用清理函数。
- 每次调用都会创建一个新面板。调用两次会在页面上放置两个元素 id 相同的浮层，第二次调用会覆盖 `window.__TUVIX_DEVTOOLS__`。之后第一个清理函数会删除第二次调用设置的全局变量。
- 在同一实例上调用两次 `EventLogger.attach()` 会替换已存储的取消订阅函数。之后 `detach()` 只会移除第二个订阅。
- 日志达到 `maxLogEntries` 后，logger 每收到一个新事件都会复制一次数组。在总线事件频繁的页面上，把 `maxLogEntries` 控制在几百以内。
- 面板用 `textContent` 写入应用名称、路由和事件名称，因此事件名称中的标记会以文本形式显示。

## 它不做什么

- 没有键盘快捷键，也没有位置、尺寸或主题选项。浮层始终以内联样式位于右下角。
- 界面中不显示事件 payload、入口（entry）URL、加载器缓存状态或挂载耗时。请从 `__TUVIX_DEVTOOLS__.logger.getEntries()` 读取 payload。
- 没有浏览器扩展，也不与 React、Vue、Svelte 或 Angular 的 devtools 连接。
- 没有时间旅行或事件重放。logger 只记录，从不重新发出事件。
- 不会在生产构建中自动移除。你需要自己控制导入。
