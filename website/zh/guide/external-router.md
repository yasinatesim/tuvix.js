# 外部路由器

当 TanStack Router、React Router 或其他路由器已经在你的 shell（宿主应用）中负责导航时，让它继续负责。`orchestrator.connectRouter()` 让编排器跟随该路由器，`interceptLinks()` 把微应用中普通 `<a href>` 的点击交给它处理。

## 何时使用

- 你的 shell 是一个自带路由器的 React 应用，其中一些路由承载微应用。
- 你的微应用渲染普通链接（Vue、Svelte、Angular 或 HTML 模板），这些链接应在不重新加载页面的情况下导航。

如果 shell 没有自己的路由器，请改用内置路由器，参见[路由](/zh/guide/routing)。

## connectRouter

```ts
import { createOrchestrator, type RouterSource } from 'tuvix.js';

const source: RouterSource = {
  // 每次导航后调用 `callback`；返回取消订阅函数。
  subscribe(callback) {
    window.addEventListener('popstate', callback);
    return () => window.removeEventListener('popstate', callback);
  },
  // 用于匹配 activeWhen 模式的路径。
  getPath: () => window.location.pathname,
};

const orchestrator = createOrchestrator(); // 不传 `router` 选项
const disconnect = orchestrator.connectRouter(source);
await orchestrator.start();

// 之后
disconnect();
```

- `start()` 按 `getPath()` 执行协调（reconcile）。之后每次 `subscribe` 回调都会为新的 `getPath()` 排队一次协调。
- 连接一个已经启动的编排器会立即执行协调。
- 协调一次只运行一个，下一个只运行最新排队的路径，因此一连串路由器事件对每个稳定下来的路径只产生一次协调。
- `destroy()` 断开所有已连接的路由器。

## TanStack Router

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // 你的 createRouter({ routeTree }) 实例

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'blog',
  entry: () => import('./micro-apps/blog'),
  container: '#micro-app',
  activeWhen: '/blog/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

// 微应用中的普通 <a href> → TanStack history。
interceptLinks({ navigate: (path) => router.history.push(path) });

await orchestrator.start();
```

`onResolved` 在路由器解析完新位置后触发。用它代替 `onLoad` 加 `setTimeout`。

## React Router

使用 `createBrowserRouter` 创建的数据路由器时：

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // createBrowserRouter(routes)

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'account',
  entry: () => import('./micro-apps/account'),
  container: '#micro-app',
  activeWhen: '/account/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe(() => callback()),
  getPath: () => router.state.location.pathname,
});

interceptLinks({ navigate: (path) => router.navigate(path) });

await orchestrator.start();
```

使用 `<BrowserRouter>` 时没有可订阅的路由器对象。在一个读取 `useLocation()` 的组件中做桥接：

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Orchestrator, RouterSource } from 'tuvix.js';

export function TuvixBridge({ orchestrator }: { orchestrator: Orchestrator }) {
  const location = useLocation();
  const listeners = useRef(new Set<() => void>());
  const path = useRef<string>(location.pathname);
  path.current = location.pathname;

  useEffect(() => {
    const source: RouterSource = {
      subscribe(callback) {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
      },
      getPath: () => path.current,
    };
    return orchestrator.connectRouter(source);
  }, [orchestrator]);

  useEffect(() => {
    for (const callback of listeners.current) callback();
  }, [location.pathname]);

  return null;
}
```

## 微应用中的普通链接

你的路由器自带的 `<Link>` 组件本来就在客户端导航。微应用渲染的普通 `<a href>` 链接则不会；没有 `interceptLinks` 时，它们会重新加载页面。`interceptLinks` 跳过带修饰键的点击、其他源、`target="_blank"`、`download`、`rel="external"`、`data-tuvix-reload` 以及当前路径上只有 hash 的链接，其余点击都调用你的 `navigate`。添加 `prefetch` 可以在悬停或聚焦时预热下一个路由。使用 TanStack Router 时：

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

shell 卸载时调用 `stop()`。

## 基础路径

路由器设置了 basename（例如 `/app`）时：

- `activeWhen` 模式匹配 `getPath()` 返回的原样字符串。如果你的路由器报告的路径带 `/app`，就写 `'/app/blog/*'`，或者在 `getPath` 中去掉 base。
- `interceptLinks({ base: '/app', ... })` 忽略 `/app` 之外的链接，并在调用 `navigate` 前去掉 `/app`。当你的路由器的 `navigate` 接收相对于 basename 的路径时使用它（React Router 的 `router.navigate`）。当 `navigate` 接收完整 URL 路径时不要设置 `base`（TanStack 的 `router.history.push`）。

## 由路由渲染的容器 {#containers-rendered-by-routes}

编排器在挂载时查找 `container`。如果容器元素由某个路由组件渲染，路由器回调触发时它可能还不在 DOM 中，挂载会失败并报错 `Container "#micro-app" not found in DOM`。有两种解决办法：

- 把容器放在所有微应用路由共用的布局中，让它在导航前就已存在。
- 在路由组件中直接用 `TuvixIsland`（`@tuvix.js/react`）渲染微应用，该应用不再交给编排器管理。

## connectRouter 不做什么

- 它不负责导航。导航仍由你的路由器负责。
- 它不读取路由参数。请用 `updateAppProps` 把参数作为 props 传入，或在应用内部读取。
- 它不处理链接点击。这件事请调用 `interceptLinks`。
