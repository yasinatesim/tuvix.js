# tuvix.js

> 一个包含 Tuvix.js 编排器、路由器、事件总线、加载器和沙箱的包。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。

完整文档：[tuvix.js.org/zh/packages/tuvix](https://tuvix.js.org/zh/packages/tuvix)

## 安装

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

这会安装 `@tuvix.js/core`、`@tuvix.js/router`、`@tuvix.js/event-bus`、`@tuvix.js/loader` 和 `@tuvix.js/sandbox`。每个包都声明了 `"sideEffects": false`，所以打包工具会去掉你从未导入的导出。

## 何时使用

如果你的 shell（宿主应用）同时使用编排器和路由器、事件总线或沙箱，请使用 `tuvix.js`。如果某个微应用只需要其中一部分（例如用 `@tuvix.js/event-bus` 获取 `getGlobalBus()`），或者你需要聚合包没有包含的导出（见下文），请改为安装带作用域的单独包。两者可以在同一个项目中共存：`getGlobalBus()` 和生命周期注册表通过 `window` 共享状态。

## 快速开始

```ts
import { createOrchestrator, defineMicroApp, interceptLinks } from 'tuvix.js';

// Normally this lives in the remote app's bundle.
defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});

const orchestrator = createOrchestrator({ router: { routes: [] } });
orchestrator.register({
  name: 'about',
  entry: { scripts: [] },
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

## API

所有导出都是重新导出。

| 来源 | 运行时导出 | 类型 |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/zh/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/zh/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/zh/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/zh/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/zh/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

未包含：`registerModule`、`emitLifecycle`、`hasServerMarkup`、脚本辅助函数以及 `EntryLoader` / `MicroAppBus` 类型（请安装 `@tuvix.js/loader`）；`pathToRegex`、`parseQuery`、`isPathActive`（请安装 `@tuvix.js/router`）；框架适配器、`@tuvix.js/server`、`@tuvix.js/module-federation`、`@tuvix.js/vite` 和 `@tuvix.js/devtools`。

## 边界情况

- 只有一个入口点。`tuvix.js/core` 和其他子路径无法解析。
- 如果带作用域的单独包与聚合包所用的版本不同，你会得到两份副本。`window` 上的共享状态仍然有效；跨副本的 `instanceof` 检查会失败。
- `whenMounted`、`onLifecycle` 和 `isMounted` 监听 `tuvix:*` DOM 事件，这些事件由 `defineMicroApp` 模块和框架适配器发出。只要应用的任一容器处于挂载状态，`isMounted(name)` 就保持为 `true`。
- `resetGlobalBus()` 会销毁正在运行的编排器持有的事件总线。请在 `destroy()` 之后调用它。
- `@tuvix.js/core` 和 `@tuvix.js/router` 0.5.0 中的破坏性变更在这里同样适用。

## 它不做什么

- 它不添加任何自己的代码。
- 它不包含适配器、服务端渲染、Module Federation、Vite 或 DevTools。

## 许可证

MIT
