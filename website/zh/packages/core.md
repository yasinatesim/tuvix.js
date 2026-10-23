---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="核心编排器"
  description="注册微应用，加载它们的入口（entry），并随 URL 变化挂载或卸载它们。可跟随内置路由器或外部路由器，按需在 shadow root 中隔离应用 CSS，并在共享的事件总线上报告生命周期事件。"
  icon="⚙️"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` 依赖 `@tuvix.js/router`、`@tuvix.js/event-bus`、`@tuvix.js/loader` 和 `@tuvix.js/sandbox`。包管理器会一并安装它们。

## 何时使用

当多个独立构建的应用共享一个页面、由 URL 决定显示哪一个时，在宿主页面（shell）中使用编排器。你为每个应用注册一次，提供它的入口 URL、容器和它负责的路径。编排器在首次使用时加载入口，调用应用的 `bootstrap`、`mount` 和 `unmount`，并让页面在每次导航后保持同步。

以下情况请选择其他方案：

- 每个页面只渲染一个框架 island，并且服务端已经决定显示什么。适配器（`@tuvix.js/react`、`@tuvix.js/vue`、`@tuvix.js/svelte`、`@tuvix.js/angular`）和 [`@tuvix.js/vite`](/zh/packages/vite) 无需编排器即可挂载 island。
- 你只需要加载一个远程脚本并自己调用它的生命周期。使用 [`@tuvix.js/loader`](/zh/packages/loader)。
- 你希望从一个 import 获取全部内容。安装聚合包 [`tuvix.js`](/zh/packages/tuvix)，它重新导出了本包。

## 快速开始

下面的 shell 注册了两个共享 `#main` 的应用，用内置路由器跟随浏览器 URL，并把同源链接点击转换为路由器导航：

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// 在 /dashboard 及其下所有路径上激活。
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// 没有 activeWhen：上面的路由器路由在 /settings/* 上激活它。
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

每个远程应用都以 shell 注册的名称发布自己的生命周期。对于普通 DOM 代码，由 `defineMicroApp` 完成；对于 React、Vue、Svelte 和 Angular 组件，由框架适配器完成。

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## 应用如何变为激活状态 {#how-apps-become-active}

每个已注册的应用遵循五种激活规则之一。编排器根据应用的配置选择规则。

| 配置 | 应用处于激活状态的条件 | 由谁卸载 |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` 为 `true` | 路径不再匹配时的下一次协调 |
| `activeWhen: (path) => boolean` | 你的函数返回 `true` | 函数返回 `false` 时的下一次协调 |
| 没有 `activeWhen`，在 `router.routes` 中被指定 | 某个 `app: name` 的路由完整匹配该路径 | 没有此类路由匹配时的下一次协调 |
| 没有 `activeWhen`，也没有路由 | 不会自行激活 | 你自己，通过 `mountApp` / `unmountApp` |
| `mountWhenVisible: true` | 它的容器至少有 10 % 进入视口 | 你自己；协调会跳过它，并忽略 `activeWhen` |

`activeWhen` 字符串经过 `@tuvix.js/router` 的 [`matchPath`](/zh/packages/router) 处理，路由器和 `@tuvix.js/server` 使用的也是这个匹配器：

- `?query` 和 `#hash` 会被忽略，因此 `/dashboard?tab=2` 会让 dashboard 保持挂载。
- 普通模式按段边界匹配其子路径：`'/dashboard'` 匹配 `/dashboard` 和 `/dashboard/stats`，不匹配 `/dashboards`。
- `'/dashboard/*'` 匹配的路径与 `'/dashboard'` 相同。
- `:name` 匹配一个段：`'/users/:id'` 匹配 `/users/42`。
- `'/'` 匹配所有路径。
- 其他字符（例如 `.` 和 `(`）按字面匹配。

路由器的 `routes` 则使用完整匹配。`{ path: '/settings' }` 只匹配 `/settings`；要包含子路径，写成 `'/settings/*'`。`'/'` 路由只在首页激活，`'/*'` 在所有路径上激活。这里同样忽略查询字符串和 hash。

### 当前路径从哪里来

编排器从第一个存在的来源读取路径：

1. 你传给 `connectRouter` 的路由器（它的 `getPath()`）。
2. 由 `config.router` 创建的内置路由器（它的 `currentPath`）。
3. `window.location.pathname`。

使用 `config.router` 或 `connectRouter` 时，每次导航都会触发一次协调。两者都不用时，`start()` 会针对 `window.location.pathname` 协调一次，之后的导航都不会触发任何响应，直到你调用 `reconcile()`。

### 协调逐个运行 {#reconciles-run-one-at-a-time}

一次协调会把每个由路由管理的应用与路径进行比较，并让 DOM 与之一致：

1. 应处于非激活状态的应用先并行卸载，因此共享容器的两个应用永远不会重叠。
2. 然后，应处于激活状态的应用并行地加载（仅第一次）、初始化（直到某次 `bootstrap` 调用成功）并挂载。

协调期间到达的导航会被编排器排队。如果有三个导航在排队，接下来只运行最新的路径，每个调用方的 promise 都会在队列清空时 resolve。在入口加载期间变为非激活的应用会跳过挂载。在 `mount()` 执行过程中变为非激活的应用会在该次挂载结束后立即卸载。快速地从 `/a` → `/b` → `/a` 导航，最后只有 `a` 处于挂载状态。

## API

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

创建一个 `Orchestrator`。等同于 `new Orchestrator(config)`。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | 无 | 使用 `mode`（`'history'` 或 `'hash'`，默认 `'history'`）、`base` 和 `routes`（必填，可以是 `[]`）创建 `@tuvix.js/router` 的内置路由器。`navigateTo` 和 `ROUTE_CHANGE` 事件需要它。 |
| `eventBus` | `EventBusOptions` | 无 | 私有总线的选项（`maxListeners`、`debug`、`logger`）。省略时，编排器使用 `getGlobalBus()`，即页面上所有应用共享的总线。 |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | 传给内部的 `ModuleLoader`。`timeout` 是每次尝试的毫秒数（`0` 表示禁用）；`globals` 会在入口脚本运行前写入 `window`。 |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | 何时在需要之前下载入口。见下文。 |
| `onError` | `(error: Error, appName: string) => void` | 无 | 应用加载、初始化、挂载、更新或卸载失败时调用。`OrchestratorEvent.APP_ERROR` 会报告相同的失败，并附带阶段。 |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | 无 | 每个应用的每次状态变化时调用。 |

预取策略通过 `<link rel="prefetch">` 或 `<link rel="modulepreload">` 下载脚本和样式 URL，但不运行它们。加载函数形式的入口会被跳过，因为调用该函数就会运行模块。

- `'immediate'`：在 `start()` 期间预取所有已注册的应用。
- `'idle'`：在 `start()` 之后的第一个 `requestIdleCallback` 中预取所有已注册的应用（不支持该 API 时使用 200 ms 的 `setTimeout`）。
- `'hover'`：当指针进入同源链接或焦点落到该链接上时，编排器预取该链接路径会激活的应用。每个应用只预取一次。会遵循 hash 模式和 `router.base`。

`destroy()` 会取消尚未执行的 idle 和 hover 预取。

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

保存应用的配置。它不会加载、挂载或协调任何内容；这些由 `start()` 和之后的导航完成。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 唯一的应用名称。远程模块必须以相同名称注册（`defineMicroApp({ name })` 或适配器的 `name`），或者暴露一个带有 `mount` 函数的新 `window` 全局变量。 |
| `entry` | `Entry` | 必填 | 脚本 URL、`EntryConfig`（`{ scripts, styles?, type?, integrity? }`），或加载函数，例如 `() => import('./dashboard')`。参见 [`@tuvix.js/loader`](/zh/packages/loader)。 |
| `container` | `string \| HTMLElement` | 必填 | CSS 选择器或元素。选择器在每次挂载时通过 `document.querySelector` 解析。 |
| `activeWhen` | `string \| ((path: string) => boolean)` | 无 | 激活规则。参见[应用如何变为激活状态](#how-apps-become-active)。 |
| `props` | `Record<string, unknown>` | 无 | 传给 `mount()`。`updateAppProps` 会合并到其中。 |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` 或 `{ css: true }` 会在应用容器上的 shadow root 中渲染应用。参见 [CSS 隔离](#css-isolation)。 |
| `fallback` | `string` | 无 | 加载、初始化或挂载失败时，通过 `innerHTML` 写入容器的 HTML。更新和卸载失败不会改动容器。 |
| `mountWhenVisible` | `boolean` | `false` | 容器有 10 % 可见时挂载，使用 `IntersectionObserver`。协调会忽略该应用及其 `activeWhen`。 |

会抛出 `[Tuvix] App name is required.`、`[Tuvix] App "<name>" is already registered.`、`[Tuvix] App "<name>" requires an entry.` 或 `[Tuvix] App "<name>" requires a container.`。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

订阅内置路由器（如果有），针对当前路径进行协调，设置预取，并开始观察 `mountWhenVisible` 容器。发出 `OrchestratorEvent.STARTED`。在第一次协调后 resolve，即使其中有应用失败也是如此；失败会交给 `onError`、`APP_ERROR` 和控制台。第二次调用会输出 `[Tuvix] Orchestrator is already started.` 并返回。

#### `mountApp(name)` / `unmountApp(name)`

手动挂载或卸载单个应用。用于没有 `activeWhen` 或路由的应用；对于由路由管理的应用，下一次协调会覆盖你的操作。

`mountApp` 会等待进行中的卸载完成，然后加载并挂载。失败时先渲染 `fallback`，再以加载或挂载错误 reject。`unmountApp` 会等待进行中的加载或挂载完成，然后卸载；如果在加载期间调用，则完全跳过挂载。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML 已经在 #chat 中
  });
});
```

#### `updateAppProps(name, props)`

把 `props` 浅合并到应用当前的 props 中。带有 `update` 函数的已挂载应用会以 `update({ props, container })` 的形式收到合并后的对象。否则，编排器保存合并后的 props，并在下一次 `mount()` 时传入。它会先等待尚未完成的挂载，因此更新会送达新实例。当 `update` 抛出错误时，状态变为 `error`，`onError` 运行，promise reject，保存的 props 保持不变。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

将一次针对 `path` 的协调加入队列，省略时使用当前路径。在没有路由器通知编排器导航时使用。适用[协调逐个运行](#reconciles-run-one-at-a-time)中的队列规则。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

跟随外部路由器（TanStack Router、React Router 或你自己的路由器），而不是内置路由器。`source.subscribe(callback)` 必须在每次导航后调用 `callback`，并返回一个取消订阅函数；`source.getPath()` 返回当前路径。`start()` 之后，每次回调都会针对 `getPath()` 进行协调。`start()` 也会读取 `getPath()`。对已经启动的编排器调用连接会立即协调。返回 `disconnect()`。

```ts
import { createOrchestrator } from '@tuvix.js/core';

// 在 shell 其他地方创建的 TanStack Router 实例。
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// 之后，在 shell 销毁时：
disconnect();
```

React Router 的数据路由器（`createBrowserRouter`）也符合同样的结构：`subscribe: (callback) => router.subscribe(() => callback())` 和 `getPath: () => router.state.location.pathname`。

#### `navigateTo(path)`

在内置路由器上调用 `push(path)`。promise 在 URL 变化后 resolve；它触发的协调在后台运行。没有 `config.router` 时抛出 `[Tuvix] No router configured.`。

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` 返回应用的 `AppStatus`，名称未知时返回 `null`。`getRegisteredApps` 返回所有已注册的名称。`getMountedApps` 返回状态为 `'mounted'` 的名称（处于 `'updating'` 的应用不包括在内）。

#### `getEventBus()`, `getRouter()`

`getEventBus` 返回编排器用来发出 `OrchestratorEvent` 并传给 `mount()` 的总线：`getGlobalBus()`，或者在你设置了 `eventBus` 时返回私有总线。`getRouter` 返回内置路由器，或 `null`。

#### `unregister(name)`

卸载应用（会等待进行中的挂载），停止观察它的容器，移除入口的 script 和 style 标签，丢弃缓存的模块并忘记该应用。名称未知时 reject。浏览器对每个 URL 只运行一次模块脚本，因此再次注册 `type: 'module'` 的 URL 入口时，需要使用新的 URL 或加载函数。

#### `destroy()`

停止预取，取消对内置路由器和所有已连接路由器的订阅，等待正在运行的协调，卸载所有应用，清空加载器缓存，并发出 `OrchestratorEvent.DESTROYED`。它会销毁私有总线，保留全局总线。重复调用返回同一个 promise。之后，`register`、`start`、`mountApp`、`unmountApp`、`unregister`、`reconcile` 和 `connectRouter` 会抛出 `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`。

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

校验生命周期对象，用 `@tuvix.js/loader` 的 `registerModule(definition.name, module)` 发布它，并将其返回。在远程应用的入口中调用它。入口脚本运行后，编排器按名称找到该模块，无论入口是 URL 还是加载函数。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 必须与 shell 注册的 `name` 相同。 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 在首次加载之后、首次挂载之前运行。抛出错误时，挂载失败，下一次挂载会再次调用它；成功一次之后，对该编排器不再运行。 |
| `mount` | `(context: MountContext) => void \| Promise<void>` | 必填 | 渲染到 `context.container` 中。 |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | 必填 | 销毁并清空 `context.container`。 |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | 无 | 不重新挂载，直接应用 `context.props`。没有它时，新的 props 会等到下一次挂载。 |
| `ssr` | `boolean` | `false` | 当 `mount` 接管服务端渲染的标记时设置。如果 `mount` 运行前容器中已有标记，`tuvix:mounted` 事件会报告 `hydrated: true`。 |

`MountContext` 包含：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `container` | `HTMLElement` | 要渲染到的元素。对于 CSS 隔离的应用，它是 shadow root 内的 `<div data-tuvix-sandbox-root>`。 |
| `props` | `Record<string, unknown> \| undefined` | 当前的 props。 |
| `name` | `string \| undefined` | 注册的应用名称。 |
| `bus` | `MicroAppBus \| undefined` | 编排器的事件总线（`on`、`once`、`emit`、`off`）。 |

返回的模块包装了你的 `mount` 和 `unmount`，并派发与框架适配器相同的 DOM 生命周期事件，因此 `@tuvix.js/loader` 的 `whenMounted(name)`、`isMounted(name)` 和 `onLifecycle` 对这些应用同样可用：

- `tuvix:mounted`：在 `mount` resolve 之后，携带 `{ name, container, hydrated }`。
- `tuvix:unmounted`：在 `unmount` resolve 之后。
- `tuvix:error`：任一函数抛出错误时。之后包装器会重新抛出该错误。

这些事件从容器冒泡到 `document`。如果容器没有挂到文档上，运行时会直接在 `document` 上派发它们。在同一容器的 `mount` 仍在运行时到达的 `unmount`，会先等待该次挂载完成。

会抛出 `[Tuvix] defineMicroApp requires a "name" property.`、`[Tuvix] defineMicroApp "<name>" requires a "mount" function.` 或 `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.`。

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

编排器在其总线上发出的事件的字符串枚举。由于默认总线是 `getGlobalBus()`，页面上的任何应用都可以监听。

| 成员 | 事件名 | 载荷 |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`：`{ name, error, phase }`，其中 `phase` 为 `'load'`、`'bootstrap'`、`'mount'`、`'update'` 或 `'unmount'` |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | 内置路由器的 `NavigationEvent`（`from`、`to`、`fromRoute`、`toRoute`） |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'` 既包括解析容器，也包括加载入口。

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### CSS 隔离 {#css-isolation}

`sandbox: true` 或 `sandbox: { css: true }` 会隔离应用的 CSS：

1. 首次挂载时，编排器使用 [`@tuvix.js/sandbox`](/zh/packages/sandbox) 的 `CssSandbox` 在容器上附加一个 open 模式的 shadow root，并把已有的子节点（服务端渲染的标记）移入其中的 `<div data-tuvix-sandbox-root="<name>">`。应用挂载到这个 div 中。
2. 入口的 `styles` 以 `<link>` 元素的形式加载到 shadow root 内，而不是 `document.head`。挂载会等待它们加载完成或失败，最多等待 `loader.timeout` 毫秒（默认 10000；为 `0` 时无限等待）。
3. 卸载时保留 shadow root。下一次挂载会复用它。

页面样式表不再匹配应用内的元素，应用的样式表也不再影响页面。`color` 和 `font-family` 等可继承属性仍会穿过 shadow 边界。`{ css: false }` 和 `false` 会渲染到 light DOM 中。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

编排器不对 JavaScript 进行沙箱隔离。[`@tuvix.js/sandbox`](/zh/packages/sandbox) 中的 `JsSandbox` 是一个需要你自己调用的独立工具。

### 类型

| 类型 | 含义 |
| --- | --- |
| `OrchestratorConfig` | `createOrchestrator` 和 `new Orchestrator` 的参数。参见 `createOrchestrator` 下的表格。 |
| `MicroAppConfig` | `register` 的参数。参见 `register` 下的表格。 |
| `MicroAppDefinition` | `defineMicroApp` 的参数：`name`、`bootstrap?`、`mount`、`unmount`、`update?`。 |
| `AppSandboxOption` | `boolean \| { css?: boolean }`，即 `sandbox` 字段。 |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`，即 `connectRouter` 的参数。 |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`，即 `APP_ERROR` 的载荷。 |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`。 |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`。首次挂载依次经过 `registered → bootstrapping → bootstrapped → mounting → mounted`；重新挂载经过 `unmounted → mounting → mounted`。 |
| `RegisteredApp` | 编排器为单个应用保存的记录结构：`config`、`status`、`module`、`container`、`error`、`lastUpdated`。在 0.5.0 中没有 `Orchestrator` 方法返回它。 |

### 重新导出

`@tuvix.js/core` 从其依赖中重新导出以下内容，因此 shell 可以从一个包中导入所有内容。每个链接都记录了完整的 API。

| 导出 | 类别 | 来源 |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | 函数 | [`@tuvix.js/event-bus`](/zh/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | 类型 | [`@tuvix.js/event-bus`](/zh/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | 函数 | [`@tuvix.js/router`](/zh/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | 类型 | [`@tuvix.js/router`](/zh/packages/router) |
| `createLoader` | 函数 | [`@tuvix.js/loader`](/zh/packages/loader) |
| `Entry`, `MicroAppModule` | 类型 | [`@tuvix.js/loader`](/zh/packages/loader) |

`getGlobalBus()` 把实例保存在 `window.__TUVIX_GLOBAL_BUS__` 上，因此自带一份 `@tuvix.js/event-bus` 副本的微应用与 shell 得到的是同一个总线。

## 边界情况

- 在 `start()` 之前调用 `register()` 只会保存配置。`start()` 之后，注册由路由管理的应用（它有 `activeWhen`，或某个路由器路由指定了它）会针对当前路径进行协调，因此当路径激活该应用时，它会立即挂载。
- 在 `start()` 之后注册的 `mountWhenVisible` 应用会立即被观察。如果此时（或在 `start()` 时）DOM 中没有该容器，它会被跳过，并且永远不会被观察。没有 `IntersectionObserver`（服务端、旧浏览器）时，视口应用永远不会挂载。
- 挂载失败的视口应用会停留在 `error`；观察器不会重试。
- 处于 `error` 的路由管理应用会在下一次希望它激活的协调中重试。加载失败会重新加载。`bootstrap` 失败时，重试会再次运行 `bootstrap`；成功的 `bootstrap` 不会重复执行，因此 `mount` 失败时只重试 `mount`。
- 容器缺失会让挂载失败，并报 `[Tuvix] Container "#main" not found in DOM.`。首次挂载时，`fallback` 无处渲染。
- 协调失败不会让 `start()`、`reconcile()` 或导航 reject。编排器会向控制台输出 `[Tuvix] Failed to mount "<name>":`（或 `unmount`），并调用 `onError`。`mountApp` 和 `unmountApp` 会 reject。
- 每个阶段的失败都会触发 `APP_ERROR`，由 `phase` 指明阶段。`fallback` 只在 `load`、`bootstrap` 和 `mount` 失败时渲染。
- 卸载抛出错误的应用会停在 `error`，并被视为已卸载。
- `fallback` 通过 `innerHTML` 写入。只传入可信的标记。
- 卸载会从 `document.head` 中移除应用的入口样式表，除非另一个已加载的应用使用相同的 URL。下一次挂载会把它们加回来并等待加载。
- 同一页面上的两个编排器共享 `getGlobalBus()`，会看到彼此的 `OrchestratorEvent`。传入 `eventBus: {}` 可以给其中一个分配私有总线。
- `@tuvix.js/event-bus` 的 `resetGlobalBus()` 会销毁正在运行的编排器持有的总线。编排器会继续持有已销毁的总线；只在 `destroy()` 之后调用 `resetGlobalBus()`，例如在测试之间。
- 在 `start()` 之前触发的 `connectRouter` 回调会被忽略。调用两次 `connectRouter` 会保留两个订阅；最新的来源为 `start()` 和 `reconcile()` 提供路径。
- 同时使用 `config.router` 和 `connectRouter` 时，每个来源都会针对自己的路径进行协调。只用其中一个。
- `activeWhen` 函数收到的是来源提供的原始路径。使用内置路由器或 `connectRouter` 时，该路径可能包含查询字符串；对于字符串模式，`matchPath` 会去掉它。
- `updateAppProps` 会替换嵌套对象：`{ user: { id: 2 } }` 会覆盖整个 `user` prop。

## 它不做什么

- 它不对 JavaScript 进行沙箱隔离。应用创建的全局变量、定时器和监听器都留在 `window` 上。使用 [`@tuvix.js/sandbox`](/zh/packages/sandbox) 的 `JsSandbox`。
- 它不拦截链接点击。调用 `interceptLinks`（在此包中重新导出），或让你的框架路由器负责导航。
- 它不在服务端渲染。使用 [`@tuvix.js/server`](/zh/packages/server) 和各适配器的 `./server` 入口。
- 它不在应用之间共享依赖。使用 [`@tuvix.js/module-federation`](/zh/packages/module-federation) 或 import maps。
- 它自己不发出 DOM 生命周期事件（`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`）。这些事件由 `defineMicroApp` 生成的模块和框架适配器发出；手写的 `MicroAppModule` 不会发出任何事件，除非它调用 `@tuvix.js/loader` 的 `emitLifecycle`。
- 应用卸载时，它不会让应用保持存活。应用内部的状态会丢失，除非应用把它存到别处。

## 从 0.4 迁移 {#migrating-from-0-4}

0.5.0 中的破坏性变更：

- **共享事件总线。** 除非你传入 `eventBus`，否则编排器的总线是 `getGlobalBus()`。在 0.4 中，每个编排器都会创建自己的总线。`destroy()` 现在会保留全局总线。

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5：像 0.4 一样保留私有总线
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **手动应用保持挂载。** 协调不再卸载既没有 `activeWhen` 也没有路由器路由的应用，也不再卸载 `mountWhenVisible` 应用。在 0.4 中，下一次路由变化会卸载手动挂载的应用。如果你依赖这一行为，请调用 `unmountApp(name)`。
- **`sandbox: true` 使用 shadow root。** 页面 CSS 不再影响应用，入口的 `styles` 也不再影响页面。移除 `sandbox` 或设置 `{ css: false }` 可以保持 0.4 的渲染方式。
- **`prefetch: { strategy: 'hover' }`** 只预取被悬停或获得焦点的链接会激活的应用。在 0.4 中，页面任意位置的第一次鼠标移动都会预取所有应用。
- **`activeWhen` 使用 `matchPath`。** 查询字符串或 hash 不再导致应用卸载，`:param` 段可以使用，`.` 和 `(` 等字符按字面匹配。
- **`shared` 已移除。** `OrchestratorConfig.shared` 从未被读取，现已从类型中移除。删除它；使用 [`@tuvix.js/module-federation`](/zh/packages/module-federation) 或 import maps 共享依赖。
- **路由器 `routes` 完整匹配。** `{ path: '/', app: 'home' }` 路由只在 `/` 上激活。对于在所有路径上显示的应用，使用 `'/*'`，或使用保留前缀匹配的 `activeWhen: '/'`。`RouteConfig.exact` 已移除；删掉它。
- **`APP_ERROR` 载荷。** 它现在带有 `phase`，并且在更新和卸载失败时也会触发。假定失败来自挂载的处理函数应检查 `phase`。

0.4 中针对外部路由器的变通写法可以删除了：

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

本页的早期版本描述了 `Orchestrator` 并不具备的方法和选项。请使用真实的名称：

| 旧页面 | 实际 API |
| --- | --- |
| `createOrchestrator({ container })` | `container` 属于 `register()` 中的每个应用 |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | 先 `updateAppProps(name, props)`，再 `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` 或 `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `@tuvix.js/sandbox` 的 `JsSandbox` |
