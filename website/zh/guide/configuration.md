# 配置

所有配置都在代码中完成。Tuvix.js 不读取环境变量，也不读取配置文件。

## 编排器选项

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // 内置路由器。使用 connectRouter() 跟随外部路由器时省略它。
  router: {
    mode: 'history', // 或 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // 传入 eventBus 选项会给这个编排器一个私有总线。
  // 省略它则与页面上的所有应用共享 getGlobalBus()。
  eventBus: { maxListeners: 50, debug: false },

  // 转发给模块加载器。
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (默认)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| 选项 | 默认值 | 作用 |
| --- | --- | --- |
| `router` | 无 | 创建内置路由器。参见 [路由](/zh/guide/routing)。 |
| `eventBus` | 无（全局总线）| 使用这些选项的私有总线。`destroy()` 会销毁私有总线，并保留全局总线。 |
| `loader.timeout` | `10000` | 单次加载尝试中止前的毫秒数。同时也是等待沙箱样式表的上限。 |
| `loader.retries` | `2` | 首次失败后的额外尝试次数。 |
| `loader.retryDelay` | `1000` | 两次尝试之间的毫秒数。 |
| `loader.globals` | `{}` | 在入口脚本运行前写入 `window` 的属性。 |
| `prefetch.strategy` | `'none'` | 何时在挂载前获取入口。参见下表。 |
| `onError` | 无 | 当加载、初始化（bootstrap）、挂载、更新或卸载失败时，以 `(error, appName)` 调用。 |
| `onStatusChange` | 无 | 每次状态变化时以 `(appName, status)` 调用。 |

要在应用之间共享 React 等依赖，请使用 `@tuvix.js/module-federation` 或 import map。编排器没有提供这方面的选项。

### 预取策略

| 策略 | 何时获取入口 |
| --- | --- |
| `none` | 仅在应用挂载时。 |
| `immediate` | 在 `start()` 之后立即获取所有已注册的入口。 |
| `idle` | 在 `start()` 之后的第一个 `requestIdleCallback` 中获取所有已注册的入口（在缺少该 API 的环境中使用 200 ms 超时）。 |
| `hover` | 当指针进入或焦点落在一个同源链接上，且该链接的路径会激活某个应用时。每个应用只获取一次。 |

预取会为模块脚本添加 `<link rel="modulepreload">`，为经典脚本和样式添加 `<link rel="prefetch">`。它会跳过加载函数入口，因为调用该函数就会运行模块。

## 注册微应用

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `name` | `string` | 唯一。必须与模块注册时使用的名称一致。 |
| `entry` | `string \| EntryConfig \| EntryLoader` | 代码的来源。见下文。 |
| `container` | `string \| HTMLElement` | 选择器或元素。在挂载时解析，所以元素只需在那时存在即可。 |
| `activeWhen` | `string \| (path) => boolean` | 路由模式或判断函数。没有它时，应用跟随指名它的路由器 `routes`，或者由你自己挂载。 |
| `props` | `Record<string, unknown>` | 初始 props。`updateAppProps` 会合并到其中。 |
| `fallback` | `string` | 加载、初始化（bootstrap）或挂载失败时写入容器的 HTML。 |
| `sandbox` | `boolean \| { css?: boolean }` | `true` 会在 shadow root 中渲染应用。参见 [沙箱隔离](/zh/guide/sandbox)。 |
| `mountWhenVisible` | `boolean` | 容器可见 10% 时挂载。之后路由变化不再影响该应用。 |

### 入口形式

```ts
import type { Entry } from 'tuvix.js';

// 一个经典脚本（UMD 或 IIFE bundle）。
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// 脚本和样式。ES 模块 bundle（例如 Vite 的 `.js` 输出）使用 `type: 'module'`。
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// 加载函数。打包工具会对它做代码分割；加载器会传入一个 AbortSignal。
const lazy: Entry = () => import('./apps/profile');
```

没有 `type` 时，以 `.mjs`、`.mts`、`.ts`、`.tsx` 或 `.jsx` 结尾的 URL 作为模块加载，其他都作为经典脚本加载。浏览器对每个 URL 只运行一次模块脚本，所以你卸载的 `type: 'module'` 应用无法从同一个 URL 再次加载。需要卸载后重新加载时，请使用加载函数。

### 注册须知

- 名称重复、缺少 `entry` 或缺少 `container` 时，`register` 会抛出错误。
- 在 `start()` 之后调用 `register` 会立即生效：如果当前路径激活了由路由管理的应用，它会被挂载；`mountWhenVisible` 应用会开始被观察。在 `start()` 之前，`register` 只保存配置。
- 视口应用滚出视图后仍保持挂载。用 `unmountApp(name)` 卸载它。
- 既没有 `activeWhen` 也没有路由器路由的应用会保持你留给它的状态。请自己调用 `mountApp(name)` 和 `unmountApp(name)`。
- `fallback` 是原始 HTML。不要用用户输入构建它。

## 路由器选项

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' 从 location.hash 读取路径
  base: '/app', // 匹配前去掉，push() 和 replace() 时加上
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

路由路径匹配整个路径，所以 `/settings` 只匹配 `/settings` 和 `/settings/`，`'/'` 只匹配 `/`。以 `/*` 结尾的路径会匹配子路径；`'/*'` 匹配所有路径。

## 沙箱选项

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // activate() 时创建 shadow root
  js: true, // 为 execScript() 提供代理 window
  allowedGlobals: ['gtag'], // 严格模式下允许你写入的额外全局变量
  strict: false, // true：写入任何其他全局变量都会抛出 TypeError
});
```

编排器会为以 `sandbox: true` 注册的应用应用 CSS 隔离。它从不应用 `JsSandbox`。参见 [沙箱隔离](/zh/guide/sandbox)。

## 事件总线选项

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = 不限制；超过上限后 `on` 仍会添加监听器，并且每个事件只警告一次
  debug: false, // 记录每次 emit 和订阅
  logger: console.log,
});
```
