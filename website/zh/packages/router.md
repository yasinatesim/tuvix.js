---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="路由器"
  description="为微应用提供 history 与 hash 路由，提供与 core 和服务端共用的同一个路径匹配器，并拦截链接点击以实现客户端导航。"
  icon="🔀"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` 依赖这个包，并重新导出 `createRouter`、`matchPath` 和 `interceptLinks`，所以这三个函数也可以从 core 导入。

## 何时使用

路由器把 URL 路径映射到微应用名称，并在路径变化时通知你。当 shell（宿主应用）负责导航、并决定某个 URL 下哪个微应用处于激活状态时，使用它。你向 `createOrchestrator` 传入 `router` 时，编排器会替你创建一个路由器，所以大多数 shell 从不手动构造它。

`matchPath` 是 Tuvix.js 中唯一的路径模式匹配器。core 用它处理 `activeWhen` 字符串，`@tuvix.js/server` 用它处理应用的 `routes`，所以同一个模式在这三处含义相同。你也可以不创建路由器，单独调用它。

如果你的 shell 已经在使用 React Router、TanStack Router 或其他框架路由器，保留它即可。用 `@tuvix.js/core` 中的 `orchestrator.connectRouter({ subscribe, getPath })` 把它接入编排器，不必使用这个路由器。你仍然可以同时使用 `matchPath` 和 `interceptLinks`。

## 快速开始

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> 现在会调用 router.push('/users/42'), 不再重新加载页面。
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// 清理时:
stopLinks();
router.destroy();
```

路由器在构造函数中绑定 `popstate`（history 模式）或 `hashchange`（hash 模式）监听器。不需要调用 `start()`。

配合编排器使用时，把同样的配置作为 `router` 传入，并通过编排器导航：

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

没有 `activeWhen` 的应用会跟随指向它的 `routes`。`orchestrator.getRouter()` 返回 `IRouter` 实例。

## API

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

返回类型为 `IRouter` 的 `new Router(config)`。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | 必填 | 路由表。路由器按数组顺序检查路由，第一个匹配项胜出。 |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` 读取 `location.pathname + location.search`，并用 `pushState` 写入。`hash` 读写 `#/path`。 |
| `base` | `string` | `'/'` | 应用部署所在的路径前缀，仅用于 history 模式。路由器读取 URL 时去掉它，写入时加上它。hash 模式忽略它。 |

每个 `RouteConfig`：

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `path` | `string` | 必填 | `matchPath` 语法的模式，与整个路径匹配。`'/'` 只匹配首页，`'/*'` 匹配所有路径，`'/blog/*'` 匹配 `/blog` 及其下的所有路径。 |
| `app` | `string` | 必填 | 要激活的微应用名称。 |
| `meta` | `Record<string, unknown>` | 无 | 你自己的数据。路由器通过 `MatchedRoute.route.meta` 原样传递它。 |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

`createRouter` 背后的类。它实现了 `IRouter`：

| 成员 | 签名 | 行为 |
| --- | --- | --- |
| `currentPath` | `readonly string` | 相对于应用的路径，不含 `base`。history 模式下包含查询字符串。 |
| `currentRoute` | `readonly MatchedRoute \| null` | `match(currentPath)` 的结果。 |
| `push` | `(path: string) => Promise<void>` | 运行守卫，用 `history.pushState` 写入 URL（history 模式下为 `base + path`，hash 模式下为 `#path`），然后运行 `onChange` 处理函数。 |
| `replace` | `(path: string) => Promise<void>` | 与 `push` 相同，但使用 `history.replaceState`。 |
| `back` | `() => void` | 调用 `window.history.back()`。 |
| `forward` | `() => void` | 调用 `window.history.forward()`。 |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | 每次导航完成后运行 `handler`。返回取消订阅函数。 |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | 添加一个守卫。返回移除该守卫的函数。 |
| `match` | `(path: string) => MatchedRoute \| null` | 第一个匹配 `path` 的路由，没有则为 `null`。 |
| `getActiveApps` | `(path?: string) => string[]` | 所有与整个 `path`（默认：`currentPath`）匹配的路由的应用名称，按路由顺序排列，不含重复项。 |
| `destroy` | `() => void` | 移除 window 监听器，并清空处理函数和守卫。 |

传给 `push` 和 `replace` 的路径要相对于 `base`。设置 `base: '/app'` 时，`router.push('/x')` 写入 `/app/x`，`currentPath` 变为 `/x`。

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (第一个匹配项胜出)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, 不新增历史记录条目
router.back();
```

`match`、`getActiveApps` 和 `isPathActive` 使用相同的整路径规则。路由 `'/'` 只在 `/` 上激活；要让某个应用在每个页面都显示，使用 `'/*'`。

#### 守卫

守卫按添加顺序逐个运行，在 URL 变化之前执行。resolve 为 `false` 会取消导航，并跳过剩余守卫。其他任何值都会让导航继续。守卫抛出异常或 reject 时会取消导航，路由器用 `console.error` 记录错误。

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

浏览器的后退和前进按钮也会触发守卫。此时浏览器已经跳转，所以守卫取消导航时，路由器会调用 `history.replaceState`，把之前的 URL（带 `base`）放回地址栏。历史记录条目停留在浏览器跳转到的位置。

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | 为 `true` 时，不含 `/*` 的模式必须匹配整个路径。为 `false` 时也匹配所有子路径。 |

返回 `{ matched, params }`。规则：

- 匹配器会去掉 `path` 中的 `?query` 和 `#hash`，并忽略两侧的末尾斜杠。
- `:name` 捕获一个非空路径段，经过 URI 解码后存入 `params.name`。百分号编码格式错误的值保持原样。一个路径段可以混合文本和参数：`/v:version` 匹配 `/v2`。
- 末尾的 `/*` 匹配基础路径及其下的所有路径：`/docs/*` 匹配 `/docs` 和 `/docs/a/b`。剩余部分不会被捕获到 `params` 中。
- 模式中间的 `*` 匹配一个路径段。
- 默认情况下，普通模式在路径段边界上匹配其子路径：`/docs` 匹配 `/docs/intro`，不匹配 `/docsify`。
- `'/'` 默认匹配所有路径。设置 `{ end: true }` 时只匹配 `/`。路由器的路由始终使用 `end: true` 规则；core 的 `activeWhen` 字符串和 `@tuvix.js/server` 的应用 `routes` 使用默认的前缀规则。
- 模式中的其他正则字符按字面匹配。匹配区分大小写。

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

匹配器对每个模式只编译一次，并缓存其 `RegExp`，所以你可以在每次导航时调用它。

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

返回第一个 `path` 完整匹配 `path` 的路由（`end: true` 规则），附带清理后的路径、解码后的参数和解析后的查询参数。它忽略 `#hash`。`Router.match` 会调用它。

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

即 `matchPath(pattern, path, { end: true }).matched`：路由使用的整路径规则，所以 `'/'` 只在 `/` 上激活。`Router.getActiveApps` 使用它。

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

返回某个模式编译后的整路径匹配 `RegExp`，以及按顺序排列的参数名。`regex` 对象来自共享缓存：不要修改它的 `lastIndex` 或其他状态。这个正则针对不含查询参数和 hash 的规范化路径运行；路径可能包含它们时，使用 `matchPath`。

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

解析 `a=1&b=2`，开头的 `?` 可有可无。它按第一个 `=` 拆分每个键值对，所以 JWT 这类值会保留其中的 `=` 字符；它会解码键和值，解码失败时保留原始文本。没有 `=` 的键映射为 `''`。重复的键保留最后一个值。

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

添加开头的斜杠，并去掉一个末尾斜杠。它不处理查询参数和 hash。

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

监听 `root` 下 `<a href>` 元素的点击，对它处理的点击调用 `preventDefault()`，并把路径传给 `navigate`。返回一个函数，用于移除它添加的所有监听器。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | 必填 | 接收去掉 `base` 后的 `pathname + search + hash`。函数会用 `console.error` 记录抛出的错误或被 reject 的 promise。 |
| `root` | `Document \| HTMLElement` | `document` | 绑定点击监听器的元素。 |
| `base` | `string` | `'/'` | 应用部署所在的路径前缀。前缀之外的链接交给浏览器处理。函数在调用 `navigate` 和 `prefetch` 之前去掉它。 |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | 无 | 在内置检查之后运行。返回 `false` 时由浏览器处理这次点击。 |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | 无 | 在符合条件的链接上触发 `pointerenter` 或 `focusin` 时运行，每个 `pathname + search` 只运行一次。路径不含 hash。 |

满足以下任一条件时，`interceptLinks` 把点击交给浏览器处理：

- 其他处理函数已经调用了 `preventDefault()`。
- 按下的不是主按钮，或按住了 Ctrl、Meta、Shift 或 Alt。
- 链接的 `target` 不是 `_self`，或带有 `download` 属性、`rel` 包含 `external`、带有 `data-tuvix-reload` 属性。
- 解析后的 URL 与页面不同源。
- URL 路径在 `base` 之外（`/app` 覆盖 `/app` 和 `/app/...`，不覆盖 `/application`）。
- 链接带有 hash，且路径和查询参数与当前页面相同。浏览器会滚动到锚点。
- `shouldIntercept` 返回 `false`。

`prefetch` 会执行属性、源和 `base` 检查。它忽略修饰键和仅 hash 变化的规则，并且对指向当前页面的链接也会触发。

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks` 通过 [`resolveLink`](#resolvelink) 查找链接元素，所以开放模式 shadow root 中的链接也能正常工作，SVG `<a>` 元素则交给浏览器处理。在没有 `document` 或 `window` 的环境中，它返回一个空操作的清理函数。

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

找到事件发生所在的 `<a href>`，并连同它的绝对 URL 和应用相对路径一起返回。浏览器应当处理该链接时，它返回 `null`。`interceptLinks` 和编排器的 `prefetch: { strategy: 'hover' }` 使用它。当你需要同样的链接规则时，在自己的监听器中调用它，例如在悬停时预热数据，或记录应用内导航。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | 应用部署所在的路径前缀。前缀之外的链接返回 `null`。函数会从 `path` 中去掉它。 |

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | `<a>` 元素。 |
| `url` | `URL` | 链接的绝对 URL。 |
| `path` | `string` | 去掉 `base` 后的 `pathname + search + hash`。 |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter 不会冒泡，所以在捕获阶段监听。
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

满足以下任一条件时，`resolveLink` 返回 `null`：

- 事件路径上最近的 `<a>` 是 SVG `<a>`，或是没有 `href` 的 HTML `<a>`，或根本没有 `<a>`。查找在遇到的第一个 `<a>` 处停止。
- 链接的 `target` 不是 `_self`，或带有 `download` 属性、`rel` 包含 `external`、带有 `data-tuvix-reload` 属性。
- URL 与页面不同源。
- URL 路径在 `base` 之外（`/app` 覆盖 `/app` 和 `/app/...`，不覆盖 `/application`）。
- 没有 `window`，例如在服务端。

它读取 `event.composedPath()`，所以 `document` 上的监听器能找到开放模式 shadow root 中的链接。封闭模式 shadow root 中的链接对它不可见。在事件分发期间调用它：分发结束后，composed path 为空，函数会回退到 `event.target.closest('a')`，而后者无法查看 shadow root 内部。

它不检查鼠标按键、修饰键、`defaultPrevented` 或仅 hash 变化的规则。`interceptLinks` 在处理点击时额外应用这些规则。

### 类型

| 类型 | 含义 |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`。 |
| `RouterConfig` | `{ mode?, base?, routes }`，即 `createRouter` 的选项。 |
| `RouteConfig` | `{ path, app, meta? }`，一条路由。 |
| `MatchedRoute` | `{ route, path, params, query }`。`path` 是清理后的 pathname，`params` 是解码后的 `:param` 值，`query` 是解析后的查询字符串。 |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`。`from` 和 `to` 是不含 `base` 的应用相对路径。 |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`。 |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`。 |
| `IRouter` | `Router` 实现、`createRouter` 返回的接口。 |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`，即 `matchPath` 的结果。没有匹配时 `params` 为 `{}`。 |
| `MatchPathOptions` | `{ end?: boolean }`。 |
| `InterceptLinksOptions` | `interceptLinks` 的选项。 |
| `ResolveLinkOptions` | `{ base?: string }`，即 `resolveLink` 的选项。 |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`，即 `resolveLink` 的结果。 |

## 边界情况

- 对当前所在路径（字符串完全相同，包括查询参数）调用 `push` 和 `replace` 会直接返回，不运行守卫和处理函数。
- 发起新导航时，路由器不会取消进行中的导航。每次 `push` 等待自己的守卫完成后写入 URL，所以最后完成的守卫链胜出。
- 路由器通过自身的 `push`/`replace` 以及 `popstate`/`hashchange` 得知 URL 变化。如果其他代码调用 `history.pushState`，`currentPath` 会保持过期状态，直到下一个事件或路由器导航。
- 调用 `destroy()` 之后，`push`、`replace`、`back`、`forward`、`onChange` 和 `beforeEach` 会抛出 `[Tuvix Router] Cannot use a destroyed Router. Create a new one.`。`match` 和 `getActiveApps` 仍然可用。
- `onChange` 处理函数抛出异常时，路由器用 `console.error` 记录它，并继续调用其他处理函数。
- 设置 `base: '/app'` 时，路由器把 `/application` 读作 `/application`：它只在路径段边界上去掉 base。history 模式下，读取 URL 时会丢弃 `#hash`。
- 在服务端（没有 `window`），构造函数把 `currentPath` 设为 `'/'`，不绑定监听器。`push`、`replace`、`back` 和 `forward` 需要 `window`。
- 使用 `/*` 模式的 `matchPath` 会匹配基础路径本身：`/dashboard/*` 匹配 `/dashboard`。
- `<svg>` 内 `<a>` 上的事件会解析为 `null`，即使有 HTML `<a>` 包裹该 SVG。`interceptLinks` 和编排器的悬停预取会把该链接交给浏览器，由浏览器加载整个页面。

## 它不做什么

- 它不挂载或卸载微应用。它报告匹配结果和变化；由 `@tuvix.js/core` 中的编排器据此执行操作。
- 除非你调用 `interceptLinks`，否则它不拦截链接点击。
- 它没有嵌套路由、命名路由、重定向或单路由守卫。使用 `beforeEach` 并检查 `to` 或 `toRoute`。
- 它不会把路径中 `/*` 的剩余部分捕获到 `params` 中。
- 它不恢复滚动位置。

## 从 0.4 迁移

`push()` 和 `replace()` 现在会加上 `base` 前缀。传入相对于 `base` 的路径：

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') 写入 /app/x, router.push('/x') 写入 /x
// 0.5: router.push('/x') 写入 /app/x
await router.push('/x');
```

其他破坏性变更：

- `base` 只在路径段边界上去掉：`/application` 不再被读作 `/lication`。
- 路由在 `match`、`getActiveApps` 和 `isPathActive` 中匹配整个路径。在 0.4 中，`getActiveApps` 和 `isPathActive` 会把 `'/'` 路由视为在所有路径上激活。把兜底路由 `{ path: '/', app }` 改为 `{ path: '/*', app }`。
- `RouteConfig.exact` 已移除。它以前会被接受但被忽略；从你的路由对象中删除它。
- `pathToRegex(pattern)` 去掉了第二个参数 `exact`，并返回缓存的 `RegExp`。
- 模式中的正则字符按字面匹配，模式中间的 `*` 匹配一个路径段。
- `matchRoute()` 和 `isPathActive()` 忽略路径中的 `#hash`。
- 0.4 文档列出了 `navigate`、`go` 和 `onRouteChange`、路由器的 `orchestrator` 选项和单路由 `guard`。这些都不存在。请使用 `push`、`back`/`forward`、`onChange`、编排器的 `router` 配置和 `beforeEach`。
