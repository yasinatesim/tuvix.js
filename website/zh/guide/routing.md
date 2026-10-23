# 路由

Tuvix.js 根据当前路径决定挂载哪些应用。你可以在每个应用上用 `activeWhen` 描述，也可以在内置路由器上用 `routes` 描述，或者两者同时使用。所有模式都由同一个匹配器解释，即 `@tuvix.js/router` 中的 `matchPath`，因此 `activeWhen`、路由器和 `@tuvix.js/server` 对 `/users/:id` 的理解是一致的。

## 模式规则

`activeWhen` 字符串使用前缀匹配：

| 模式 | 匹配 | 不匹配 | 参数 |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`、`/dashboard/`、`/dashboard/stats` | `/dashboards` | 无 |
| `/dashboard/*` | 与 `/dashboard` 相同的路径 | `/dashboards` | 无 |
| `/users/:id` | `/users/42`、`/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | 所有路径 | 无 | 无 |

- 匹配器在匹配前会去掉 `?query` 和 `#hash`，所以 `/dashboard?tab=1` 仍然匹配 `/dashboard`。
- 它会解码参数：`/users/J%C3%BCrgen` 得到 `{ id: 'Jürgen' }`。
- `.` 和 `(` 等字符按字面匹配。
- 模式中间的 `*` 匹配一个路径段。

你可以自己检查一个模式：

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## 用 activeWhen 激活应用

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  activeWhen: '/users/:id',
});

orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header'),
  container: '#header',
  activeWhen: '/', // 所有页面
});

await orchestrator.start();
```

函数接收路径并返回布尔值。用它实现精确匹配、多个前缀或功能开关。

## 内置路由器

把 `router` 传给 `createOrchestrator`，路由器每次导航后编排器都会执行一次协调（reconcile）：

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/settings', app: 'settings' },
      { path: '/billing/*', app: 'billing' },
    ],
  },
});

orchestrator.register({ name: 'settings', entry: () => import('./apps/settings'), container: '#app' });
orchestrator.register({ name: 'billing', entry: () => import('./apps/billing'), container: '#app' });

await orchestrator.start();
await orchestrator.navigateTo('/billing/invoices');
```

没有 `activeWhen` 的应用跟随指向它的路由。与 `activeWhen` 有两点不同：

- 路由路径完整匹配。`/settings` 匹配 `/settings` 和 `/settings/`，不匹配 `/settings/profile`。需要子路径时加上 `/*`。
- 路径为 `/` 的路由只在 `/` 上激活它的应用。需要匹配所有路径的路由请用 `/*`。

应用设置了 `activeWhen` 时，编排器使用它并忽略 `routes`。

路由器监听 `popstate`（history 模式）或 `hashchange`（hash 模式）。它不拦截链接点击，见下一节。

## 链接点击

`interceptLinks` 把同源 `<a href>` 的点击转为对你的 `navigate` 函数的调用，并返回一个清理函数：

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// 之后，shell 离开页面时
stop();
```

以下点击交给浏览器处理：

- 按下修饰键（Ctrl、Meta、Shift、Alt），或使用主按键以外的按键；
- `event.defaultPrevented` 已经为 true；
- `target` 不是 `_self`，或带有 `download` 属性、`rel="external"` 或 `data-tuvix-reload`；
- 其他源，或位于 `base` 之外的路径；
- 当前路径上只有 hash 的链接，让浏览器滚动。

`prefetch(path)` 在 pointerenter 或 focus 时运行，每个路径只运行一次。`shouldIntercept(anchor, url, event)` 用于添加你自己的过滤条件；返回 `false` 让浏览器处理这次点击。`root` 把监听范围限制在一个元素内。

## 导航与守卫

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/users/:id', app: 'user' }] });

const offGuard = router.beforeEach(async ({ to }) => {
  if (!to.startsWith('/admin')) return true;
  const response = await fetch('/api/me');
  return response.ok;
});

const offChange = router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} → ${to}`, toRoute?.params);
});

await router.push('/users/42'); // pushState
await router.replace('/users/43'); // replaceState
router.back();

router.currentPath; // '/users/43'
router.currentRoute?.params; // { id: '43' }
router.currentRoute?.query; // parsed ?query
router.match('/users/7'); // MatchedRoute | null, no navigation
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- 守卫在 `push`、`replace` 以及后退/前进之前按顺序运行。返回 `false` 会取消导航。抛出异常的守卫会取消导航并记录错误。
- 被取消的后退/前进导航会用 `replaceState` 恢复之前的 URL。
- `push` 到当前路径不做任何事。
- `router.match` 返回第一个匹配的路由；`getActiveApps` 返回所有路由匹配的应用。

## 基础路径

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL 变为 /app/reports
```

使用 `base: '/app'` 时：

- 路由器在匹配前去掉 `/app`，所以路由和 `activeWhen` 模式中不写它；
- `push('/x')` 和 `replace('/x')` 写入 `/app/x`；
- `/application` 保持为 `/application`：base 只在路径段边界处去掉；
- `interceptLinks` 需要相同的 `base`，否则它会把 `/app/x` 交给 `navigateTo`，结果写入 `/app/app/x`。

## Hash 模式

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

在无法把所有路径重写到 `index.html` 的静态托管上使用它。hash 模式下路由器忽略 `base`。

## 在应用中读取参数

挂载上下文中没有参数。你可以从路径中读取，或者把它们作为 props 推送给应用：

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { routes: [{ path: '/users/:id', app: 'user' }] },
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  props: { id: matchPath('/users/:id', location.pathname).params.id },
});

orchestrator.getRouter()?.onChange(({ toRoute }) => {
  if (toRoute?.route.app === 'user') {
    void orchestrator.updateAppProps('user', { id: toRoute.params.id });
  }
});

await orchestrator.start();
```

## 外部路由器

如果由 TanStack Router、React Router 或其他路由器负责导航，不要设置 `config.router`，改为调用 `orchestrator.connectRouter({ subscribe, getPath })`。参见[外部路由器](/zh/guide/external-router)。

## 路由不做什么

- 它不渲染路由组件。应用自己渲染到容器中。
- 它不加载数据。请使用守卫、`onChange` 或应用自己的 `mount`。
- 除非你调用 `interceptLinks`，否则路由器不处理链接点击。
