# @tuvix.js/router

> 面向微应用的 history 和 hash 路由、共享的 `matchPath` 匹配器，以及链接拦截

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。完整文档：[tuvix.js.org/zh/packages/router](https://tuvix.js.org/zh/packages/router)。

路由器把 URL 路径映射到微应用名称，并在路径变化时通知你。`matchPath` 是路径模式匹配器，core 的 `activeWhen` 和 `@tuvix.js/server` 也使用它。如果你的 shell（宿主应用）已经在运行 React Router 或 TanStack Router，请改用 `@tuvix.js/core` 的 `orchestrator.connectRouter()` 接入它。

## 安装

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## 快速开始

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

构造函数会挂上 `popstate` 或 `hashchange` 监听器。不需要调用 `start()`。

## API

### `createRouter(config)` 和 `Router`

`createRouter(config)` 返回 `new Router(config)`，类型为 `IRouter`。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | 必填 | `{ path, app, meta? }`。按顺序检查，第一个匹配的生效。路径按完整路径匹配：`'/'` 只匹配首页，`'/*'` 匹配所有路径，`'/blog/*'` 匹配 `/blog` 及其下级路径。 |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` 使用 `pushState` 和 `location.pathname + search`。`hash` 使用 `#/path`。 |
| `base` | `string` | `'/'` | history 模式下的前缀。读取时去掉（只在路径段边界处），写入时加上。 |

| 成员 | 行为 |
| --- | --- |
| `currentPath`、`currentRoute` | 相对于应用的路径（history 模式下包含查询字符串）及其 `MatchedRoute \| null`。 |
| `push(path)`、`replace(path)` | `Promise<void>`。运行守卫，写入 `base + path`（或 `#path`），运行 `onChange` 处理函数。路径相同时不做任何事。 |
| `back()`、`forward()` | `window.history.back()` / `forward()`。 |
| `onChange(handler)` | 每次导航完成后运行。返回一个取消订阅函数。 |
| `beforeEach(guard)` | 守卫按顺序运行。返回 `false`、抛错或 reject 都会取消导航。在后退/前进时，路由器用 `replaceState` 恢复之前的 URL。返回一个移除函数。 |
| `match(path)` | 第一个匹配的路由，或 `null`。 |
| `getActiveApps(path?)` | 所有与完整路径匹配的路由对应的应用，已去重。`'/'` 路由只在 `/` 上激活；要匹配所有页面请用 `'/*'`。 |
| `destroy()` | 移除监听器。之后调用 `push`、`replace`、`back`、`forward`、`onChange`、`beforeEach` 会抛错。 |

### `matchPath(pattern, path, options?)`

返回 `{ matched, params }`。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | 要求不带 `/*` 的路径模式匹配完整路径。 |

- 去掉 `?query` 和 `#hash`，忽略末尾斜杠。
- `:name` 捕获一个路径段，并进行 URI 解码。末尾的 `/*` 匹配基础路径及其下所有路径；其余部分不会被捕获。中间的 `*` 匹配一个路径段。
- 默认情况下，`/docs` 匹配 `/docs/intro`，但不匹配 `/docsify`，并且 `'/'` 匹配所有路径。使用 `{ end: true }` 时，`'/'` 只匹配 `/`。路由器的路由使用 `end: true` 规则；core 的 `activeWhen` 和 `@tuvix.js/server` 的路由使用默认的前缀规则。
- 编译后的路径模式会被缓存。匹配区分大小写。

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### 辅助函数

| 导出 | 行为 |
| --- | --- |
| `matchRoute(path, routes)` | 第一个完整匹配，形式为 `{ route, path, params, query }`，或 `null`。忽略 `#hash`。 |
| `isPathActive(path, pattern)` | 即 `matchPath(pattern, path, { end: true }).matched`，也就是路由使用的完整路径规则。 |
| `pathToRegex(pattern)` | 已缓存的完整匹配 `{ regex, paramNames }`。不要修改 `regex`。 |
| `parseQuery(query)` | 把 `'?a=1&b'` 转为 `{ a: '1', b: '' }`。在第一个 `=` 处分割并解码，编码错误时保留原始文本。 |
| `normalizePath(path)` | 添加开头斜杠，去掉一个末尾斜杠。 |

### `interceptLinks(options)`

把同源 `<a href>` 的点击转换为 `navigate(path)` 调用。返回一个清理函数。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | 必填 | 接收去掉 `base` 的 `pathname + search + hash`。错误会被记录到日志。 |
| `root` | `Document \| HTMLElement` | `document` | 点击监听器所在的位置。 |
| `base` | `string` | `'/'` | 不在其范围内的链接交给浏览器处理；在调用 `navigate`/`prefetch` 之前去掉。 |
| `shouldIntercept` | `(anchor, url, event) => boolean` | 无 | 返回 `false` 让浏览器处理该点击。在内置检查之后运行。 |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | 无 | 在 `pointerenter` 或 `focusin` 时触发，每个 `pathname + search` 只触发一次。 |

以下情况由浏览器处理点击：其他处理函数调用了 `preventDefault()`；非主按钮，或按下了 Ctrl/Meta/Shift/Alt；`target` 不是 `_self`；有 `download`；`rel` 包含 `external`；有 `data-tuvix-reload`；其他源；路径在 `base` 之外；指向当前路径和查询字符串的 hash 链接；或者 `shouldIntercept` 返回 `false`。开放（open）shadow root 内的链接也会被处理；SVG `<a>` 元素交给浏览器处理。

### `resolveLink(event, options?)`

对事件所在的 HTML `<a href>` 返回 `{ anchor, url, path }`；如果该链接应交给浏览器处理，则返回 `null`。`path` 是去掉 `base` 的 `pathname + search + hash`。`interceptLinks` 和编排器的悬停预取都使用它；在你自己的监听器中调用它，就能应用相同的规则。

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

以下情况返回 `null`：SVG `<a>`；没有 `href` 的 `<a>` 或没有 `<a>`（由事件路径上最近的 `<a>` 决定）；`target` 不是 `_self`；有 `download`；`rel` 包含 `external`；有 `data-tuvix-reload`；其他源；路径在 `base` 之外；没有 `window`。它读取 `event.composedPath()`，所以能找到开放（open）shadow root 中的链接，但找不到封闭（closed）shadow root 中的链接。请在事件分发期间调用它。它不检查按钮、修饰键或仅含 hash 的链接。

### 类型

`RouterMode`、`RouterConfig`、`RouteConfig`、`MatchedRoute`、`NavigationEvent`（`{ from, to, fromRoute, toRoute }`，路径不含 `base`）、`NavigationGuard`、`RouteChangeHandler`、`IRouter`、`PathMatch`、`MatchPathOptions`、`InterceptLinksOptions`、`ResolveLinkOptions`（`{ base? }`）、`ResolvedLink`（`{ anchor, url, path }`）。

## 边界情况

- 新导航开始时，路由器不会取消尚未完成的导航；最后完成的守卫链写入 URL。
- 如果其他代码调用了 `history.pushState`，`currentPath` 会保持旧值，直到下一次 `popstate`、`hashchange` 或路由器导航。
- 在服务端，构造函数把 `currentPath` 设为 `'/'`，不挂任何监听器。导航方法需要 `window`。
- 取消后退/前进导航的守卫会修正地址栏；历史记录位置仍停留在浏览器移动到的位置。

## 它不做什么

- 它不挂载应用。挂载由 `@tuvix.js/core` 中的编排器完成，使用 `router` 配置或 `connectRouter`。
- 除非你调用 `interceptLinks`，否则它不拦截链接。
- 不支持嵌套路由、重定向、按路由配置的守卫或滚动位置恢复。

## 从 0.4 迁移

- `push()`/`replace()` 会加上 `base` 前缀：设置 `base: '/app'` 时，`push('/x')` 写入 `/app/x`。请传入相对于 `base` 的路径。
- `base` 只在路径段边界处去掉。
- `match`、`getActiveApps` 和 `isPathActive` 中，路由按完整路径匹配；`'/'` 路由只在 `/` 上激活。需要兜底匹配时请用 `'/*'`。
- 移除了 `RouteConfig.exact`（它以前会被忽略）。
- `pathToRegex(pattern)` 去掉了 `exact` 参数，并返回一个已缓存的 `RegExp`。
- 路径模式中的正则字符按字面匹配；中间的 `*` 匹配一个路径段。
- `matchRoute()` 和 `isPathActive()` 忽略 `#hash`。

## 许可证

MIT
