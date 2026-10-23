# 生命周期钩子

编排器按照固定的钩子和状态顺序驱动每个已注册的应用。本页介绍你的模块需要实现的钩子、shell 可以读取的状态，以及出错和快速导航时会发生什么。要从外部得知应用何时出现在页面上，请使用 [生命周期事件](/zh/guide/lifecycle-events)。

## 钩子顺序

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

编排器会 await 每个钩子。它从不对仍在挂载中的应用调用 `mount`，也从不在 `mount` 仍在运行时调用 `unmount`：卸载会等待挂载完成。

## bootstrap

在入口加载完成后、首次 `mount` 之前，对每个已加载的模块运行一次。用它来做应在重新挂载后保留的工作，例如读取配置。

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

如果 `bootstrap` 抛出错误，应用进入 `error` 状态，挂载失败。下一次挂载尝试会再次调用 `bootstrap`。成功运行一次之后，重新挂载会跳过它。

## mount

每次应用变为活动状态，或者你调用 `mountApp(name)` 时运行。上下文包含：

| 字段 | 值 |
| --- | --- |
| `container` | 要渲染进去的元素。对于 `sandbox: true` 的应用，是 shadow root 内的一个元素。 |
| `props` | 已注册的 props 与每次 `updateAppProps` 调用合并后的结果。 |
| `name` | 注册的应用名称。 |
| `bus` | 编排器的事件总线。 |

`mountApp(name)` 在 `mount` 完成后 resolve，并在加载或挂载出错时以该错误 reject。

## update

当应用已挂载期间 shell 调用 `updateAppProps(name, props)` 时运行：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

上下文包含合并后的 `props` 和 `container`。如果缺少 `update` 或应用未挂载，编排器会保存这些 props，并在下一次 `mount` 时传入。它从不会因为 props 变化而重新挂载应用。

`updateAppProps` 会先等待进行中的挂载，因此更新会到达新实例。在更新期间到达的 `unmount` 会等待更新完成。

## unmount

在应用变为非活动状态，以及调用 `unmountApp(name)`、`unregister(name)` 和 `destroy()` 时运行。移除 `mount` 创建的所有内容：框架 root、监听器、定时器、总线订阅。

`unmount` 之后，编排器会从 `document.head` 中移除该应用的入口样式表。下一次挂载会重新添加它们，并等待它们加载完成。

## 应用状态

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| 方法 | 返回值 |
| --- | --- |
| `getAppStatus(name)` | 状态；名称未知时返回 `null`。 |
| `getMountedApps()` | 状态为 `mounted` 的名称。 |
| `getRegisteredApps()` | 所有已注册的名称。 |

## 错误与回退内容

当加载、`bootstrap` 或 `mount` 失败时，编排器会：

1. 如果你设置了应用的 `fallback` HTML，把它写入应用的容器；
2. 设置状态为 `error`；
3. 在总线上以 `{ name, error, phase }` 发出 `OrchestratorEvent.APP_ERROR`（`tuvix:app:error`）；
4. 调用 `onError(error, name)`；
5. reject `mountApp`。路由变化期间的挂载失败则改为用 `console.error` 记录，其他应用仍会挂载。

`update` 或 `unmount` 失败时执行第 2 到第 4 步，并 reject `updateAppProps` 或 `unmountApp`；它不会写入 fallback HTML。`phase` 为 `'load'`（包括解析容器）、`'bootstrap'`、`'mount'`、`'update'` 或 `'unmount'`。

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

下一次激活处于 `error` 状态的应用的路由变化会再次尝试挂载它。

## 快速导航

路由变化一次 reconcile 一个。非活动应用先卸载，活动应用再挂载。当路径到达的速度快于应用挂载的速度时：

- 只有最新排队的路径会在下一次运行；
- 在入口加载期间变为非活动的应用会跳过挂载；
- 在 `mount` 运行期间变为非活动的应用会在 `mount` 完成后被卸载。

因此快速连续地 A → B → A 最终只有 A 处于挂载状态，并且没有应用会渲染到另一个应用仍占用的容器中。

## shell 级钩子

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| 事件 | 载荷 | 发出时机 |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | `bootstrap` 之后 |
| `tuvix:app:mount` | `{ name }` | `mount` 之后 |
| `tuvix:app:unmount` | `{ name }` | `unmount` 之后 |
| `tuvix:app:error` | `{ name, error, phase }` | 加载、bootstrap、mount、update 或 unmount 失败 |
| `tuvix:app:status-change` | `{ name, status }` | 每次状态变化 |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | 仅内置路由器导航 |
| `tuvix:started` | `{}` | `start()` 结束时 |
| `tuvix:destroyed` | `{}` | `destroy()` 结束时 |

这些总线事件来自编排器。[生命周期事件](/zh/guide/lifecycle-events) 中的 `tuvix:mounted` DOM 事件来自适配器和 `defineMicroApp`，对于没有编排器而挂载的 island 也会触发。

## 销毁

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` 会等待正在运行的 reconcile，卸载所有应用，停止路由器、`connectRouter` 订阅、预取和视口观察器，并清空加载器缓存。它会销毁私有事件总线，保留全局总线。调用两次是安全的。之后调用 `register`、`start`、`mountApp`、`unmountApp`、`unregister`、`reconcile` 和 `connectRouter` 会抛出错误；请改为创建一个新的编排器。
