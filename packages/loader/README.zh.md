# @tuvix.js/loader

> 按名称从脚本 URL 或加载函数加载微应用 bundle，支持重试、超时、共享的模块注册表和生命周期事件。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。完整文档：[tuvix.js.org/zh/packages/loader](https://tuvix.js.org/zh/packages/loader)。

## 安装

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core` 会为你创建一个 `ModuleLoader`，并把 `createOrchestrator({ loader })` 传给它。编写微应用或适配器、等待另一个应用挂载，或在不使用编排器的情况下加载应用时，导入本包。

## 快速开始

微应用，构建到 `https://cdn.example.com/dashboard/main.js`：

```ts
import { registerModule } from '@tuvix.js/loader';

registerModule('dashboard', {
  mount({ container, props }) {
    container.innerHTML = `<h2>Dashboard for user ${String(props?.userId)}</h2>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Shell：

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 15000, retries: 1 });
const container = document.getElementById('dashboard')!;

const result = await loader.load('dashboard', {
  scripts: ['https://cdn.example.com/dashboard/main.js'],
  styles: ['https://cdn.example.com/dashboard/main.css'],
  type: 'module',
});

if (result.module) {
  await result.module.mount({ container, props: { userId: 42 } });
} else {
  console.error(result.error);
}
```

`load()` 从不抛出错误。失败时会 resolve 为 `status: 'error'`、`module: null` 和最后一个错误。

## 入口

`Entry` 是以下之一：

- URL 字符串，按 `{ scripts: [url] }` 处理
- `EntryConfig`
- 加载函数，例如 `() => import('./dashboard')`。它接收 `{ signal }`（超时时中止），可以 resolve 为模块、`{ default: module }`，或在调用 `registerModule(name, module)` 之后 resolve 为任意值。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `scripts` | `string[]` | 必填 | 脚本 URL，依次运行。 |
| `styles` | `string[]` | `[]` | 样式表 URL，与脚本并行加载。 |
| `type` | `'module' \| 'classic'` | 按 URL 推断 | `.mjs`、`.mts`、`.ts`、`.tsx`、`.jsx` 作为模块加载，其余作为 classic 脚本。Vite 的 `.js` 输出请设为 `'module'`。 |
| `integrity` | `Record<string, string>` | 无 | 以 URL 为键的 SRI 哈希。 |

## API

### `ModuleLoader` 和 `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | 每次尝试的毫秒数，覆盖所有脚本和样式表。`0` 表示禁用。 |
| `retries` | `number` | `2` | 首次失败后的额外尝试次数。 |
| `retryDelay` | `number` | `1000` | 两次尝试之间的毫秒数。 |
| `globals` | `Record<string, unknown>` | `{}` | 每次尝试加载 URL 入口之前赋值到 `window`。 |

| 方法 | 行为 |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | 加载、校验 `mount`/`unmount` 并按名称缓存。先从 `registerModule(name)` 解析模块，再从新出现的带 `mount` 的 UMD 全局变量解析。已缓存的名称会忽略 `entry`；正在加载的名称返回同一个 promise。 |
| `prefetch(entry)` | 模块脚本使用 `<link rel="modulepreload">`，其他使用 `<link rel="prefetch">`。跳过加载函数。 |
| `removeStyles(name)` | 移除该应用的样式表，除非另一个已缓存的应用在使用它们。下一次 `load(name)` 会重新添加。 |
| `unload(name)` | 移除样式和 script 标签，删除缓存条目，并注销此加载器解析出的模块。 |
| `clearCache()` | 对每个已缓存的应用执行 `unload`。 |
| `isLoaded(name)`、`getModule(name)`、`getStatus(name)`、`getCachedNames()` | 读取缓存。`getStatus` 返回 `'idle'`、`'loading'` 或 `'loaded'`。 |

### `normalizeEntry`

```ts no-check
normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

### `loadScript`、`loadStyle`、`removeScript`、`removeStyle`、`prefetchResource`

```ts no-check
loadScript(url: string, options?: { type?, integrity?, signal? } | string): Promise<void>;
loadStyle(url: string, options?: { timeout?, integrity?, signal? } | number): Promise<void>;
removeScript(url: string): void;
removeStyle(url: string): void;
prefetchResource(url: string, options?: { as?, type?, integrity? }): void;
```

每个 URL 一个标签，由并发调用方共享。加载失败会移除其标签，并以 `[Tuvix Loader] Failed to load script: <url>` reject。被中止的调用会在没有其他调用方等待时移除标签。`loadStyle` 默认在 `10000` 毫秒后超时。每个标签都带 `crossorigin="anonymous"`。`loadScript` 的第二个参数为字符串时表示 integrity 哈希；`loadStyle` 的第二个参数为数字时表示超时（0.4 的写法）。

### 运行时注册表和生命周期

状态存放在 `window.__TUVIX_RUNTIME__` 上，因此自己打包了本包副本的微应用也共享它。没有 `window` 时，它存放在模块中。

| 导出 | 行为 |
| --- | --- |
| `registerModule(name, module)` | 为加载器发布一个模块。适配器和 `defineMicroApp` 会调用它。 |
| `unregisterModule(name)` | 移除该模块。 |
| `getRegisteredModule(name)` | 返回该模块或 `undefined`。 |
| `emitLifecycle(type, { name, container, hydrated, error? })` | 在 `container` 上（容器已脱离文档时在 `document` 上）派发一个冒泡且 composed 的 `tuvix:mounted`、`tuvix:unmounted` 或 `tuvix:error` `CustomEvent`，并跟踪已挂载的容器。适配器和 `defineMicroApp` 会调用它。 |
| `isMounted(name)` | 该应用的任一容器处于挂载状态时为 `true`。 |
| `whenMounted(name, { signal? })` | 以首次挂载的 `LifecycleDetail` resolve，或立即以仍处于挂载状态的最早容器 resolve；中止时以 `signal.reason` reject。 |
| `onLifecycle(type, handler, target = document)` | 监听 `tuvix:<type>`；返回一个移除函数。 |
| `hasServerMarkup(el)` | 有子元素或非空白文本时为 `true`。 |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### 类型

`Entry`、`EntryConfig`、`EntryLoader`、`EntryLoaderContext`、`ScriptType`、`MicroAppModule`、`MountContext`（`container`、`props?`、`name?`、`bus?`）、`UnmountContext`、`UpdateContext`（`props`、`container?`）、`MicroAppBus`（`on`、`once`、`emit`、`off`；`IEventBus` 满足它）、`LoaderOptions`、`LoadResult`、`LoadStatus`、`CacheEntry`、`PrefetchStrategy`（加载器不读取它）、`ResourceOptions`、`LoadScriptOptions`、`LoadStyleOptions`、`PrefetchOptions`、`LifecycleType`、`LifecycleDetail`、`LifecycleEvent`。

## 边界情况

- 超时会中止本次尝试的 `signal`，移除其标签，并在 `retryDelay` 之后重试。忽略 `signal` 的加载函数会继续运行；加载器不再等待它。
- `unload(name)` 之后，已注册自身的 `type: 'module'` 脚本不会从同一 URL 再次运行。请使用加载函数或新的 URL。
- `unload` 会移除该入口的所有脚本 URL，包括其他应用也列出的第三方脚本。
- 两个 UMD bundle 同时加载时：加载器会把新出现的全局变量与应用名匹配，无法区分时会失败并列出候选名称。
- 跨域的脚本和样式需要 `Access-Control-Allow-Origin`。
- 挂载状态按容器区分：卸载两个容器中的一个后，`isMounted(name)` 仍为 `true`。`whenMounted` 不会因 `tuvix:error` 而 reject。
- 已脱离文档的容器，其生命周期事件在 `document` 上触发，`detail.container` 仍然有值。在 `document` 上（默认）调用 `onLifecycle` 时，每个事件只接收一次。

## 它不做什么

- 不获取 HTML 页面并从中提取脚本。
- 不隔离 JavaScript；脚本在页面的全局作用域中运行。
- 不挂载应用，也不做路由。

## 许可证

MIT
