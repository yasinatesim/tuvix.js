# @tuvix.js/core

> 加载微应用，并随 URL 变化挂载或卸载它们的编排器。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。

完整文档：[tuvix.js.org/zh/packages/core](https://tuvix.js.org/zh/packages/core)

## 安装

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

它依赖 `@tuvix.js/router`、`@tuvix.js/event-bus`、`@tuvix.js/loader` 和 `@tuvix.js/sandbox`。

## 快速开始

Shell：

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

远程应用（`dashboard/main.js`）：

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## 应用如何变为激活状态

- `activeWhen: '/path'`：使用 `@tuvix.js/router` 中的 `matchPath` 匹配。忽略查询字符串和 hash；`'/dashboard'` 和 `'/dashboard/*'` 匹配 `/dashboard` 及其所有子路径（不匹配 `/dashboards`）；`:id` 匹配一个路径段；`'/'` 匹配所有路径。
- `activeWhen: (path) => boolean`：由你的函数决定。
- 没有 `activeWhen`，但在 `router.routes` 中被引用：当带有 `app: name` 的路由完整匹配时处于激活状态。`'/'` 路由只表示首页；`'/*'` 表示所有路径。
- 两者都没有：由你调用 `mountApp` / `unmountApp`；协调不会处理该应用。
- `mountWhenVisible: true`：容器可见 10 % 时挂载；忽略 `activeWhen`。

当前路径来自 `connectRouter` 的 `getPath()`，其次是内置路由器，再次是 `window.location.pathname`。协调逐个运行：先卸载非激活的应用，再挂载激活的应用。排队中的导航会合并为最新的路径。加载期间变为非激活的应用会跳过挂载；挂载过程中变为非激活的应用会在挂载完成后卸载。

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | 无 | 内置路由器：`mode`（默认 `'history'`，或 `'hash'`）、`base`、`routes`（必填）。 |
| `eventBus` | `EventBusOptions` | 无 | 私有总线的选项。省略时编排器使用 `getGlobalBus()`。 |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | 传给模块加载器，另加 `globals`。 |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate` 在 `start()` 时预取，`idle` 在第一个空闲时段预取，`hover` 在一个会激活某应用的同源链接获得指针悬停或焦点时预取。 |
| `onError` | `(error: Error, appName: string) => void` | 无 | 加载、初始化、挂载、更新和卸载失败。 |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | 无 | 每次状态变化。 |

### `Orchestrator` 方法

| 方法 | 行为 |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | 保存配置。不加载、不挂载、不协调。 |
| `unregister(name): Promise<void>` | 卸载应用，移除入口的标签和缓存的模块，并删除该应用。 |
| `start(): Promise<void>` | 跟随路由器、执行协调、开始预取和视口观察。发出 `STARTED`。 |
| `mountApp(name): Promise<void>` | 等待进行中的卸载，然后挂载。失败时先渲染 `fallback`，再以该错误 reject。 |
| `unmountApp(name): Promise<void>` | 等待进行中的加载或挂载，然后卸载。 |
| `updateAppProps(name, props): Promise<void>` | 浅合并 props。对已挂载的应用调用 `update({ props, container })`，否则保存 props 供下次挂载使用。 |
| `reconcile(path?): Promise<void>` | 将针对 `path` 或当前路径的协调加入队列。 |
| `connectRouter({ subscribe, getPath }): () => void` | 跟随外部路由器。返回 `disconnect`。 |
| `navigateTo(path): Promise<void>` | 在内置路由器上调用 `push(path)`。没有内置路由器时抛出 `[Tuvix] No router configured.`。 |
| `getAppStatus(name): AppStatus \| null` | 状态，未知名称返回 `null`。 |
| `getRegisteredApps(): string[]` | 已注册的名称。 |
| `getMountedApps(): string[]` | 状态为 `'mounted'` 的名称。 |
| `getEventBus(): IEventBus` | `getGlobalBus()` 或私有总线。 |
| `getRouter(): IRouter \| null` | 内置路由器或 `null`。 |
| `destroy(): Promise<void>` | 等待正在运行的协调，卸载所有应用，停止监听，发出 `DESTROYED`。全局总线保持可用。 |

`register` 选项：

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 唯一；远程应用以同一名称注册。 |
| `entry` | `Entry` | 必填 | URL、`{ scripts, styles?, type?, integrity? }` 或 `() => import('./app')`。 |
| `container` | `string \| HTMLElement` | 必填 | 选择器（每次挂载时解析）或元素。 |
| `activeWhen` | `string \| ((path: string) => boolean)` | 无 | 激活规则。 |
| `props` | `Record<string, unknown>` | 无 | 传给 `mount()`。 |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | 在 shadow root 中渲染，并在其中加载入口的 `styles`。 |
| `fallback` | `string` | 无 | 加载、初始化或挂载失败时通过 `innerHTML` 设置的 HTML。 |
| `mountWhenVisible` | `boolean` | `false` | 在视口中可见 10 % 时挂载。 |

`connectRouter` 搭配 TanStack Router：

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 必须与注册的名称一致。 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 在首次挂载前运行。失败的 bootstrap 会在下次挂载时再次运行；成功的只运行一次。 |
| `mount` | `(context: MountContext) => void \| Promise<void>` | 必填 | 接收 `container`、`props`、`name` 和 `bus`。 |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | 必填 | 接收 `container`。 |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | 无 | 接收 `props` 和 `container`。 |
| `ssr` | `boolean` | `false` | `mount` 接管服务端标记；当容器中已有标记时，`mounted` 事件报告 `hydrated: true`。 |

通过 `@tuvix.js/loader` 的 `registerModule` 发布模块并返回它。该模块会派发 `tuvix:mounted`、`tuvix:unmounted` 和 `tuvix:error` DOM 事件（冒泡到 `document`），因此 `whenMounted`、`isMounted` 和 `onLifecycle` 对它有效。在同一容器上 `mount` 运行期间发生的 `unmount` 会等待其完成。缺少 `name`、`mount` 或 `unmount` 时抛出错误。

### `OrchestratorEvent`

编排器总线上的事件：`APP_REGISTERED`（`tuvix:app:registered`）、`APP_BOOTSTRAP`、`APP_MOUNT`、`APP_UNMOUNT`、`APP_ERROR`（`AppErrorEvent`：`{ name, error, phase }`，对应 `'load'`、`'bootstrap'`、`'mount'`、`'update'` 或 `'unmount'` 失败）、`APP_STATUS_CHANGE`（`{ name, status }`）、`ROUTE_CHANGE`（仅内置路由器）、`STARTED`、`DESTROYED`。

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### CSS 隔离

`sandbox: true` 或 `{ css: true }` 会在容器上附加一个 open shadow root（重新挂载时复用），把应用挂载到其中的 `<div data-tuvix-sandbox-root>`，并在那里加载入口的 `styles`。挂载会等待样式表加载，最长 `loader.timeout`。JavaScript 不做沙箱隔离；`@tuvix.js/sandbox` 中的 `JsSandbox` 是一个独立工具。

### 类型

`OrchestratorConfig`、`MicroAppConfig`、`MicroAppDefinition`、`AppSandboxOption`、`RouterSource`、`AppErrorEvent`、`AppErrorPhase`、`AppStatus`（`registered`、`bootstrapping`、`bootstrapped`、`mounting`、`mounted`、`updating`、`unmounting`、`unmounted`、`error`）、`RegisteredApp`（记录结构；没有方法返回它）。

### 重新导出

- 来自 `@tuvix.js/event-bus`：`createEventBus`、`getGlobalBus`，类型 `IEventBus`、`EventHandler`、`Unsubscribe`。
- 来自 `@tuvix.js/router`：`createRouter`、`matchPath`、`interceptLinks`，类型 `RouterConfig`、`IRouter`、`RouteConfig`、`PathMatch`、`InterceptLinksOptions`。
- 来自 `@tuvix.js/loader`：`createLoader`，类型 `Entry`、`MicroAppModule`。

## 边界情况

- 在 `start()` 之后调用 `register()` 会针对当前路径协调由路由管理的应用，因此激活时会立即挂载。在 `start()` 之后注册的 `mountWhenVisible` 应用会立即被观察；如果此时容器不在 DOM 中，它永远不会被观察。
- 协调失败不会让 `start()` 或 `reconcile()` reject；错误会交给 `onError` 并输出到控制台。`mountApp` 会 reject。
- 处于 `error` 状态的应用会在下一次需要它激活的协调中重试。`fallback` 只在加载、初始化和挂载失败时渲染。
- 卸载会从 `document.head` 移除入口的样式表；下次挂载时重新添加。
- 两个编排器共享 `getGlobalBus()`。传入 `eventBus: {}` 获得私有总线。
- `destroy()` 之后，会修改状态的方法抛出 `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`。

## 它不做什么

- 对 JavaScript 做沙箱隔离。
- 拦截链接点击（使用 `interceptLinks`）。
- 在服务端渲染（使用 `@tuvix.js/server`）。
- 在应用之间共享依赖（使用 `@tuvix.js/module-federation` 或 import map）。
- 为手写模块发出 `tuvix:mounted` DOM 事件；`defineMicroApp` 和框架适配器会发出。

## 从 0.4 迁移

- 除非你传入 `eventBus`，编排器使用 `getGlobalBus()`；`destroy()` 之后全局总线保持可用。
- 协调不再卸载手动挂载的应用或 `mountWhenVisible` 应用。
- `sandbox: true` 在 shadow root 中渲染。
- `prefetch: 'hover'` 只预取被悬停或获得焦点的链接所激活的应用。
- `activeWhen` 使用 `matchPath`：忽略查询字符串和 hash，支持 `:param`，`.` 和 `(` 按字面匹配。
- 移除了 `OrchestratorConfig.shared`（它从未被读取）。请使用 `@tuvix.js/module-federation` 或 import map。
- 路由器的 `routes` 完整匹配：`'/'` 路由只表示首页；所有路径请用 `'/*'`。移除了 `RouteConfig.exact`。
- `APP_ERROR` 携带 `phase`，并且在更新和卸载失败时也会触发。
- `connectRouter({ subscribe, getPath })` 取代了外部路由器使用的 `setTimeout` + `reconcile()` 桥接方式。

## 许可证

MIT
