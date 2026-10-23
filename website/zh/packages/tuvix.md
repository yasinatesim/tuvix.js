---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js（聚合包）"
  description="一个包，一个导入路径。重新导出 @tuvix.js/core 中的编排器，以及 @tuvix.js/router、@tuvix.js/event-bus、@tuvix.js/loader 和 @tuvix.js/sandbox 的公共 API。"
  icon="🎁"
  github="tuvix"
/>

## 安装

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

安装 `tuvix.js` 会同时安装 `@tuvix.js/core`、`@tuvix.js/router`、`@tuvix.js/event-bus`、`@tuvix.js/loader` 和 `@tuvix.js/sandbox`。这六个包都提供 ES 模块和 CommonJS 构建，并声明 `"sideEffects": false`。

## 何时使用

在同时使用编排器和路由器、事件总线或沙箱的 shell（宿主应用）中安装 `tuvix.js`。你只需管理一个依赖的版本和一个导入路径，打包工具会去掉你从未导入的导出。

以下情况请改为安装带作用域的包：

- 微应用只与 shell 通信。单独使用 `@tuvix.js/event-bus` 就能获得 `getGlobalBus()`，不会把编排器带进它的 `node_modules`。
- 你需要聚合包没有包含的导出，例如 `@tuvix.js/loader` 的 `registerModule` 或 `emitLifecycle`，或 `@tuvix.js/router` 的 `pathToRegex`。参见[未包含的内容](#not-included)。
- 你希望 `package.json` 明确写出一个包依赖 Tuvix.js 的哪些部分。

两者混用是安全的。聚合包重新导出的是相同的模块，所以从 `tuvix.js` 和从 `@tuvix.js/event-bus` 导入的 `getGlobalBus` 返回同一个总线，生命周期辅助函数也共享 `window` 上的同一个注册表。

## 快速开始

一个 shell：在 `/about` 上挂载 `about`，把链接点击转为路由器导航，并记录应用错误：

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

`about` 应用，构建到 `https://cdn.example.com/about/main.js`：

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

点击 `<a href="/about?ref=nav">` 会推入 `/about?ref=nav`，编排器会把 `about` 挂载到 `#main` 中（查询字符串不影响匹配）。

## API

下面的每个导出都是重新导出。链接的包页面记录了它的签名、选项和边界情况。

### 来自 `@tuvix.js/core`

文档：[`@tuvix.js/core`](/zh/packages/core)。

| 导出 | 种类 | 作用 |
| --- | --- | --- |
| `createOrchestrator` | 函数 | 创建一个 `Orchestrator`。 |
| `Orchestrator` | 类 | 注册应用，根据 URL 协调应用，跟随路由器（`connectRouter`），更新 props，销毁。 |
| `defineMicroApp` | 函数 | 校验 `{ name, bootstrap?, mount, unmount, update?, ssr? }` 对象，为加载器注册它，并让它发出 `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error`。 |
| `OrchestratorEvent` | 枚举 | 编排器在其总线上发出的事件名（`tuvix:app:mount`、`tuvix:app:error` 等）。 |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | 类型 | `createOrchestrator`、`register` 和 `defineMicroApp` 的参数。 |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | 类型 | 应用状态联合类型、`sandbox` 选项、`connectRouter` 的参数、应用记录的结构。 |
| `AppErrorEvent`, `AppErrorPhase` | 类型 | `APP_ERROR` 的载荷 `{ name, error, phase }` 及其阶段联合类型（`'load'`、`'bootstrap'`、`'mount'`、`'update'`、`'unmount'`）。 |

### 来自 `@tuvix.js/event-bus`

文档：[`@tuvix.js/event-bus`](/zh/packages/event-bus)。

| 导出 | 种类 | 作用 |
| --- | --- | --- |
| `EventBus` | 类 | 发布/订阅总线，提供 `on`、`once`、`emit`、`off`、`onAny`。 |
| `createEventBus` | 函数 | 创建一个新的、独立的 `EventBus`。 |
| `getGlobalBus` | 函数 | 返回存放在 `window.__TUVIX_GLOBAL_BUS__` 上的页面级总线。编排器默认使用它。 |
| `resetGlobalBus` | 函数 | 销毁页面级总线；下一次调用 `getGlobalBus()` 会创建新的总线。 |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | 类型 | 总线接口、处理函数签名、取消订阅函数、构造函数选项。 |

### 来自 `@tuvix.js/router`

文档：[`@tuvix.js/router`](/zh/packages/router)。

| 导出 | 种类 | 作用 |
| --- | --- | --- |
| `Router` | 类 | 把路径映射到应用名的 history 或 hash 路由器。 |
| `createRouter` | 函数 | 创建一个 `Router`。 |
| `matchPath` | 函数 | 用模式匹配路径（支持 `:param`、`/*`，忽略查询字符串和 hash）。`activeWhen` 字符串使用它。 |
| `matchRoute` | 函数 | 返回 `RouteConfig[]` 中第一个完整匹配路径的路由，附带 `params` 和 `query`。 |
| `normalizePath` | 函数 | 添加开头的斜杠并去掉结尾的斜杠。 |
| `interceptLinks` | 函数 | 把同源链接点击转为 `navigate(path)` 调用，可选按意图预取。 |
| `resolveLink` | 函数 | 返回事件发生所在 HTML 链接的 `{ anchor, url, path }`，浏览器应当处理该链接时返回 `null`。 |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | 类型 | 路由器接口、选项和路由结构。 |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | 类型 | 导航载荷、守卫和监听器的签名。 |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | 类型 | `matchPath` 的结果和选项，`interceptLinks` 的选项，`resolveLink` 的结果和选项。 |

### 来自 `@tuvix.js/loader`

文档：[`@tuvix.js/loader`](/zh/packages/loader)。

| 导出 | 种类 | 作用 |
| --- | --- | --- |
| `ModuleLoader` | 类 | 加载入口（URL、脚本/样式配置或加载器函数），支持超时、重试和缓存。 |
| `createLoader` | 函数 | 创建一个 `ModuleLoader`。 |
| `whenMounted` | 函数 | 在应用发出 `mounted` 生命周期事件时 resolve。 |
| `onLifecycle` | 函数 | 监听 `tuvix:mounted`、`tuvix:unmounted` 或 `tuvix:error` DOM 事件。 |
| `isMounted` | 函数 | 根据生命周期事件，只要应用的任一容器处于挂载状态就返回 `true`。 |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | 类型 | 入口格式，以及微应用要实现的生命周期契约。 |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | 类型 | 加载器选项和结果。 |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | 类型 | 生命周期事件名、载荷和 DOM 事件类型。 |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### 来自 `@tuvix.js/sandbox`

文档：[`@tuvix.js/sandbox`](/zh/packages/sandbox)。

| 导出 | 种类 | 作用 |
| --- | --- | --- |
| `CssSandbox` | 类 | 把容器移入 shadow root，并在其中加载样式表。编排器在 `sandbox: true` 时使用它。 |
| `JsSandbox` | 类 | 代理 `window`，让脚本写入的全局变量不进入真实的 `window`。 |
| `Sandbox` | 类 | 用一对 `activate` / `deactivate` 统一控制 `CssSandbox` 和 `JsSandbox`。 |
| `createSandbox` | 函数 | 创建一个 `Sandbox`。 |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | 类型 | 各沙箱的选项和接口。 |
| `AdoptStylesOptions`, `AdoptedStyles` | 类型 | `CssSandbox.adoptStyles` 的参数和返回值。 |

### 未包含的内容 {#not-included}

聚合包没有包含以下内容。请安装提供它们的包。

| 你需要 | 安装 |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`，以及类型 `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` | [`@tuvix.js/loader`](/zh/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/zh/packages/router) |
| React、Vue、Svelte 或 Angular 微应用 | [`@tuvix.js/react`](/zh/packages/react), [`@tuvix.js/vue`](/zh/packages/vue), [`@tuvix.js/svelte`](/zh/packages/svelte), [`@tuvix.js/angular`](/zh/packages/angular) |
| 服务端组合 | [`@tuvix.js/server`](/zh/packages/server) |
| Module Federation 远程模块 | [`@tuvix.js/module-federation`](/zh/packages/module-federation) |
| Vite 构建中的 island 资源 | [`@tuvix.js/vite`](/zh/packages/vite) |
| DevTools 面板 | [`@tuvix.js/devtools`](/zh/packages/devtools) |
| 项目脚手架 | [`create-tuvix-app`](/zh/packages/create-tuvix-app) |

## 边界情况

- `tuvix.js` 只有一个入口点。`tuvix.js/core` 或 `tuvix.js/router` 这类子路径导入无法解析；请从 `tuvix.js` 或带作用域的包导入。
- 聚合包把依赖固定到同一个发布版本。在 `tuvix.js` 旁边安装另一个版本的带作用域包，会得到该包的两个副本。`getGlobalBus()` 和生命周期注册表仍然通过 `window` 共享状态，但跨副本的 `instanceof Orchestrator` 或 `instanceof EventBus` 检查会失败。
- `whenMounted`、`onLifecycle` 和 `isMounted` 响应 `tuvix:*` DOM 事件。来自 `defineMicroApp` 和框架适配器的模块会发出这些事件；手写的模块除非调用 `@tuvix.js/loader` 的 `emitLifecycle`，否则不会发出任何事件。针对文档之外的容器的事件会在 `document` 上派发。
- `resetGlobalBus()` 会销毁正在运行的编排器持有的总线。编排器会继续持有这个已销毁的总线，因此它的事件不再到达下一次 `getGlobalBus()` 的订阅者。请在测试之间、`orchestrator.destroy()` 之后调用它。
- `@tuvix.js/core` 和 `@tuvix.js/router` 中的行为变更和破坏性变更在这里同样适用。参见[从 0.4 迁移](/zh/packages/core#migrating-from-0-4)。

## 它不做什么

- 它不添加任何自己的代码。每个导出都来自五个带作用域的包之一。
- 它不包含框架适配器、server 包、Module Federation、Vite 或 DevTools。
- 它不为每个包提供子路径入口。
