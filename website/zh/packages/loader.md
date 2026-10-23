---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="加载器"
  description="按名称从脚本 URL 或加载函数加载微应用 bundle，支持重试、超时、共享模块注册表和生命周期事件。"
  icon="📦"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## 何时使用

`@tuvix.js/loader` 把一个入口（entry）（脚本 URL、脚本和样式列表，或 `() => import('./app')`）转换成带有 `mount` 和 `unmount` 的微应用模块。它负责添加 `<script>` 和 `<link>` 标签，重试失败的尝试，超时后放弃，并按应用名称缓存结果。

`@tuvix.js/core` 会为你创建 `ModuleLoader`，并把 `createOrchestrator` 的 `loader` 选项传给它，所以大多数 shell（宿主应用）从不需要导入这个包。以下情况需要导入它：

- 编写微应用或适配器，用 `registerModule` 发布自身，或用 `emitLifecycle` 报告 `tuvix:mounted`
- 需要知道另一个应用何时挂载（`whenMounted`、`onLifecycle`）
- 不通过编排器加载微应用，例如从你自己的路由器加载
- 带去重地加载单个脚本或样式表（`loadScript`、`loadStyle`）

如果你的打包工具能在构建时导入应用，且你从不从其他源加载代码，用普通的 `import()` 就够了。

## 快速开始

微应用以某个名称发布它的模块。这个文件构建后输出到 `https://cdn.example.com/dashboard/main.js`：

```ts
// dashboard/src/main.ts
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

shell 按名称加载并挂载它：

```ts
// shell/src/main.ts
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
  container.textContent = 'The dashboard is unavailable.';
  console.error(result.error);
}
```

`load()` 从不抛出异常。加载失败时返回 `status: 'error'`、`module: null` 和最后一次的错误。

## 入口形式 {#entry-forms}

`Entry` 告诉加载器应用代码在哪里。它有三种形式。

**URL 字符串。** 加载器把 `'https://cdn.example.com/app.js'` 当作 `{ scripts: ['https://cdn.example.com/app.js'] }` 处理。

**`EntryConfig` 对象：**

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `scripts` | `string[]` | 必填 | 脚本 URL。加载器按此顺序依次运行它们。空数组不加载任何内容，直接从注册表解析模块。 |
| `styles` | `string[]` | `[]` | 样式表 URL，与脚本并行加载。加载会等待两者都完成。 |
| `type` | `'module' \| 'classic'` | 按 URL 推断 | `scripts` 中每个 URL 的脚本类型。不设置时，以 `.mjs`、`.mts`、`.ts`、`.tsx` 或 `.jsx` 结尾的 URL 以 `type="module"` 加载，其他 URL 都以经典脚本加载。Vite 或 Rollup 的 ES 输出以 `.js` 结尾，需设置为 `'module'`。 |
| `integrity` | `Record<string, string>` | 无 | 以 URL 为键的子资源完整性（SRI）哈希。加载器把它们写入 `<script>`、`<link>` 和 prefetch 标签。 |

**加载函数（`EntryLoader`）。** 加载器以 `{ signal }` 调用它，接受三种结果，按以下顺序检查：

1. 带有 `mount` 函数的模块
2. `default` 导出为此类模块的对象（ES 模块命名空间）
3. 没有可用内容，此时加载器查找该导入通过 `registerModule(name, ...)` 注册的模块

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

你的打包工具会把 `./dashboard` 拆分成单独的 chunk，并在首次挂载时获取它。[`@tuvix.js/module-federation`](/zh/packages/module-federation) 也是通过加载函数把联邦远程模块接入编排器的。

尝试超时时 `signal` 会中止。把它传给过程中所有的 `fetch` 调用：

```ts
import type { EntryLoader } from '@tuvix.js/loader';

const entry: EntryLoader = async ({ signal }) => {
  const response = await fetch('/api/manifest/dashboard.json', { signal });
  const { url } = (await response.json()) as { url: string };
  return import(/* @vite-ignore */ url);
};
```

## API

### `ModuleLoader`

```ts no-check
class ModuleLoader {
  constructor(options?: LoaderOptions);
  load(name: string, entry: Entry): Promise<LoadResult>;
  prefetch(entry: Entry): void;
  removeStyles(name: string): void;
  unload(name: string): void;
  clearCache(): void;
  isLoaded(name: string): boolean;
  getModule(name: string): MicroAppModule | null;
  getStatus(name: string): LoadStatus;
  getCachedNames(): string[];
}
```

每个 `ModuleLoader` 按应用名称维护自己的已解析模块缓存。`<script>` 和 `<link>` 标签是整个页面共享的：两个加载器加载同一个 URL 时共用一个标签。

`LoaderOptions`：

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | 单次尝试的时间上限（毫秒），覆盖入口的所有脚本和样式表。`0` 表示禁用。 |
| `retries` | `number` | `2` | 第一次失败后的额外尝试次数。`2` 表示最多 3 次尝试。 |
| `retryDelay` | `number` | `1000` | 两次尝试之间的等待时间（毫秒）。 |
| `globals` | `Record<string, unknown>` | `{}` | 加载器在 URL 入口每次尝试前赋值到 `window` 上的属性，用于需要 `window.React` 或配置对象的 UMD bundle。加载函数入口会忽略它。 |

#### `load(name, entry)`

解析为一个 `LoadResult`：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | 加载结果。 |
| `module` | `MicroAppModule \| null` | 解析出的模块，出错时为 `null`。 |
| `error` | `Error \| null` | 最后一次尝试的错误。 |
| `duration` | `number` | 从调用到得到结果的毫秒数，用 `performance.now()` 测量。 |

对于 URL 入口，一次尝试会：

1. 把 `options.globals` 赋值到 `window`
2. 按顺序追加脚本，每个脚本等待前一个完成，同时并行追加样式表
3. 从注册表读取模块（`getRegisteredModule(name)`）
4. 回退到 UMD 全局变量：本次加载期间出现的、带有 `mount` 函数的 `window` 属性

随后加载器检查模块是否有 `mount` 和 `unmount` 函数，并以 `name` 缓存它。之后使用相同名称的调用返回缓存的模块，并忽略 `entry`。第一次调用仍在加载时，第二次调用返回同一个 promise。不同名称的加载并行运行。

#### `prefetch(entry)`

让浏览器下载入口的文件但不运行。模块脚本使用 `<link rel="modulepreload">`；经典脚本和样式表使用 `<link rel="prefetch">`。加载函数入口会被跳过，因为调用该函数就会运行模块。编排器根据它的 `prefetch` 设置调用此方法。

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

移除已加载应用的样式表，让应用卸载期间它的 CSS 不再生效。如果另一个已缓存且样式未被移除的应用列出了同一个 URL，该样式表会保留。下一次 `load(name)` 会重新添加这些样式表，并在解析前等待它们加载完成。编排器在每次卸载后调用 `removeStyles`。

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
const container = document.getElementById('cart')!;
const { module } = await loader.load('cart', { scripts: ['/cart.js'], styles: ['/cart.css'] });

await module?.mount({ container });
await module?.unmount({ container });
loader.removeStyles('cart');
```

#### `unload(name)`

遗忘一个应用：移除它的样式表和脚本标签，把它从缓存中删除；当注册的模块正是此加载器解析的模块时，还会从共享注册表中注销它。下一次 `load(name)` 会重新获取并运行入口。编排器在 `unregister(name)` 中调用它。

#### `clearCache()`

对每个已缓存的应用调用 `unload`。编排器在 `destroy()` 中调用它。

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

读取缓存。`getStatus` 在加载进行中返回 `'loading'`，模块缓存后返回 `'loaded'`，其他情况返回 `'idle'`。加载失败后状态保持为 `'idle'`。

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

等同于 `new ModuleLoader(options)`。接受上表中的 `LoaderOptions`。

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

要为编排器设置这些选项，把它们作为 `loader` 传入：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

把 URL 转换为 `{ scripts: [url] }`，`EntryConfig` 则原样返回。它不接受加载函数；请先检查 `typeof entry === 'function'`。

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | 根据扩展名推断 | 脚本类型，规则与 `EntryConfig.type` 相同。 |
| `integrity` | `string` | 无 | 用于 `integrity` 属性的 SRI 哈希。 |
| `signal` | `AbortSignal` | 无 | 中止时停止等待。promise 以该 signal 的 reason 拒绝。 |

向 `document.head` 追加 `<script crossorigin="anonymous">`，并在其 `load` 事件触发时解析。对同一 URL 的并发调用共用一个标签，对已加载完成的 URL 的调用会立即解析。加载失败会移除该标签并以 `[Tuvix Loader] Failed to load script: <url>` 拒绝，因此下一次调用会使用新的标签。被中止的调用只在没有其他调用方仍在等待该标签时才移除它。`loadScript` 本身没有超时；请传入 `signal`。

第二个参数为字符串时，会被当作 integrity 哈希读取，与 0.4 相同。

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | 超过此毫秒数后加载失败，错误为 `[Tuvix Loader] Style load timed out: <url>`。`0` 表示禁用。 |
| `integrity` | `string` | 无 | 用于 `integrity` 属性的 SRI 哈希。 |
| `signal` | `AbortSignal` | 无 | 中止时停止等待。 |

向 `document.head` 追加 `<link rel="stylesheet" crossorigin="anonymous">`，共享、失败和中止规则与 `loadScript` 相同。第二个参数为数字时，会被当作超时时间读取，与 0.4 相同。

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

移除 `loadScript` 为 `url` 添加的标签，以及所有 `src` 属性等于 `url` 的 `<script>`。该 URL 仍在进行中的加载会以 `[Tuvix Loader] Removed before load: <url>` 拒绝。下一次 `loadScript(url)` 会追加新标签。脚本已经运行的代码仍留在内存中。

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

与 `removeScript` 相同，作用于 `<link rel="stylesheet">` 标签。

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `.css` URL 为 `'style'`，否则为 `'script'` | 资源类型。 |
| `type` | `'module' \| 'classic'` | 根据扩展名推断 | 模块脚本使用 `rel="modulepreload"`。 |
| `integrity` | `string` | 无 | 用于该 link 的 SRI 哈希。 |

每个 URL 在每个页面中只追加一个 `<link>`。已由 `loadScript` 或 `loadStyle` 处理过，或之前已预取过的 URL 会被跳过。

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

以某个名称发布模块，让加载器在应用脚本运行后能找到它。用相同名称再次调用会替换第一个模块。React、Vue、Svelte 和 Angular 适配器以及 core 的 `defineMicroApp` 会替你调用它；手写模块时需要自己调用。

注册表和已挂载应用状态存放在 `window.__TUVIX_RUNTIME__` 上，模块映射也可以通过 `window.__TUVIX_MODULES__` 访问。各自打包了一份 `@tuvix.js/loader` 的微应用读写的是同一个注册表。在没有 `window` 的服务端，这些状态保存在模块内部。

一个遵循适配器约定的手写微应用：

```ts
import { emitLifecycle, hasServerMarkup, registerModule } from '@tuvix.js/loader';

registerModule('clock', {
  mount({ container }) {
    const hydrated = hasServerMarkup(container);
    if (!hydrated) container.textContent = new Date().toLocaleTimeString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
});
```

### `unregisterModule`

```ts no-check
function unregisterModule(name: string): void;
```

从注册表中移除模块。`ModuleLoader.unload` 会对它解析过的模块调用此函数。

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

返回已注册的模块，或 `undefined`。

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

记录一次生命周期变化，并派发名为 `tuvix:mounted`、`tuvix:unmounted` 或 `tuvix:error` 的 `CustomEvent`。该事件会冒泡且为 `composed`，因此 `document` 上的监听器能收到来自 shadow root 内部容器的事件。当 `detail.container` 在 DOM 中时，事件在容器上触发，并冒泡到 `document` 一次。当容器已脱离 DOM（`isConnected` 为 `false`）时，例如 React 在适配器报告 `unmounted` 之前移除了某个 island，事件直接在 `document` 上触发，因为在已脱离的元素上派发的事件永远到不了 `document`。两种情况下 `detail.container` 都指向该元素。`event.detail` 是 `LifecycleDetail`：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `name` | `string` | 微应用名称。 |
| `container` | `HTMLElement` | 应用渲染到的元素。 |
| `hydrated` | `boolean` | 适配器复用了服务端渲染的标记而不是重新渲染时为 `true`。 |
| `error` | `unknown` | 抛出的值，在 `error` 事件上设置。 |

`mounted` 为 `detail.name` 记录该容器已挂载，并解析等待中的 `whenMounted(name)` promise。`unmounted` 从记录中移除该容器。`error` 只派发事件。React、Vue、Svelte 和 Angular 适配器以及 core 的 `defineMicroApp` 会在挂载和卸载完成后、以及其中任一抛出异常时调用它。

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

只要 `name` 至少有一个容器处于挂载状态，就返回 `true`。运行时按应用跟踪已挂载的容器，所以如果一个模块挂载到两个容器中，你卸载了其中一个，`isMounted(name)` 会保持 `true`，直到第二个也被卸载。

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

以第一次挂载的 `LifecycleDetail` 解析。如果应用已经挂载，它会立即以最早仍处于挂载状态的容器的 detail 解析。中止 `signal` 可停止等待；此时 promise 以该 signal 的 reason 拒绝。

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

在 `target`（默认为 `document`）上监听 `tuvix:<type>`，并返回一个移除监听器的函数。使用默认 target 时，无论容器是否已脱离 DOM，处理函数对每个事件都只运行一次。容器元素上的监听器收不到该容器脱离 DOM 期间派发的事件。

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

不使用这个包时，监听 DOM 事件：

```ts
import type { LifecycleEvent } from '@tuvix.js/loader';

document.addEventListener('tuvix:mounted', (event) => {
  const { name, hydrated } = (event as LifecycleEvent).detail;
  console.log(name, hydrated);
});
```

### `hasServerMarkup`

```ts no-check
function hasServerMarkup(container: Element): boolean;
```

当元素有子元素，或有包含非空白文本的文本节点时返回 `true`。注释和空白不计入。适配器用它在水合和重新渲染之间做选择。

### 类型

微应用模块实现的接口：

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: (context: MountContext) => void | Promise<void>;
  unmount: (context: UnmountContext) => void | Promise<void>;
  update?: (context: UpdateContext) => void | Promise<void>;
  [key: string]: unknown;
}

interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
  /** App name the orchestrator registered this module under */
  name?: string;
  /** The orchestrator's event bus */
  bus?: MicroAppBus;
}

interface UnmountContext {
  container: HTMLElement;
}

interface UpdateContext {
  props: Record<string, unknown>;
  /** Container to update; without it, adapters update every mounted instance */
  container?: HTMLElement;
}

interface MicroAppBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  emit<T = unknown>(event: string, data?: T): void;
  off<T = unknown>(event: string, handler: (data: T) => void): void;
}
```

编排器在每次挂载时传入 `name` 和 `bus`。`bus` 是编排器的 [`@tuvix.js/event-bus`](/zh/packages/event-bus) 实例；`MicroAppBus` 以结构化方式描述它，所以加载器不依赖事件总线包。

| 类型 | 含义 |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`。 |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`，参见[入口形式](#entry-forms)。 |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`。 |
| `EntryLoaderContext` | `{ signal: AbortSignal }`。 |
| `ScriptType` | `'module' \| 'classic'`。 |
| `MicroAppModule` | 微应用导出的生命周期对象。 |
| `MountContext`, `UnmountContext`, `UpdateContext` | `mount`、`unmount` 和 `update` 的参数。 |
| `MicroAppBus` | `{ on, once, emit, off }`；`IEventBus` 满足此类型。 |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`。 |
| `LoadResult` | `{ status, module, error, duration }`。 |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`。 |
| `CacheEntry` | `{ module, loadedAt, entry }`，一个已缓存的模块。 |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`。加载器不读取它。 |
| `ResourceOptions` | `{ integrity?, signal? }`，由 `loadScript` 和 `loadStyle` 共用。 |
| `LoadScriptOptions` | `ResourceOptions` 加上 `type?`。 |
| `LoadStyleOptions` | `ResourceOptions` 加上 `timeout?`。 |
| `PrefetchOptions` | `{ as?, type?, integrity? }`。 |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`。 |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`。 |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`。 |

## 边界情况

- **超时。** `timeout` 覆盖一次完整的尝试。超时触发时，加载器会中止该次尝试的 `signal`，移除该次尝试中没有其他加载在等待的标签，等待 `retryDelay` 后再试。错误信息为 `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms`。忽略 `signal` 的加载函数会在后台继续运行；加载器不再等待它。
- **重试。** 失败的 `<script>` 会在下一次尝试前被移除，因此每次重试只追加一个新标签。最后一次尝试结束后，`load()` 以最后一次的错误解析。
- **多个应用使用同一 URL。** 两个入口列出同一个第三方脚本时，共用一个标签和一次下载。
- **已缓存的入口。** `load(name, otherEntry)` 返回以 `name` 缓存的模块，并忽略 `otherEntry`。要切换入口，先调用 `unload(name)`。
- **模块脚本每个 URL 只运行一次。** `unload(name)` 之后，如果应用的 `type: 'module'` 脚本调用了 `registerModule`，它无法再从同一个 URL 加载，因为浏览器不会运行同一个模块脚本两次。加载会以 `no exports found` 失败。请使用加载函数入口或新的 URL（内容哈希或 `?v=2`）。
- **`unload` 会移除共享的脚本标签。** 它移除入口中的每个脚本 URL，包括另一个应用也列出的第三方脚本。已经运行的代码会保留；之后列出该 URL 的加载会重新添加标签，经典脚本会再次运行。
- **CORS。** 加载器在每个标签上设置 `crossorigin="anonymous"`。来自其他源的脚本或样式表需要 `Access-Control-Allow-Origin` 响应头，否则浏览器会拦截它，加载失败。
- **UMD 全局变量。** 两个 UMD bundle 同时加载时，加载器跳过已被另一个加载认领的全局变量，并把剩余的与应用名称匹配，忽略大小写和标点（`my-app` 匹配 `MyApp`）。如果仍剩多个候选，加载会以 `several globals with mount() appeared while it loaded (<names>)` 失败。使用 `registerModule` 可以避免这种猜测。
- **缺少生命周期函数。** 没有 `mount` 或 `unmount` 的模块会以 `[Tuvix Loader] Module "<name>" is missing required "unmount" function.` 失败。
- **什么都没找到。** URL 入口的脚本既没有注册模块也没有定义 UMD 全局变量时，加载以 `Module "<name>" loaded but no exports found` 失败。
- **多个容器。** 运行时按容器跟踪挂载状态。卸载两个容器中的一个后，`isMounted(name)` 仍为 `true`；`whenMounted(name)` 返回最早仍处于挂载状态的容器。
- **已脱离 DOM 的容器。** 当宿主框架在适配器报告 `unmounted` 或 `error` 之前移除了容器，`emitLifecycle` 会在 `document` 上派发事件。在 `document` 上监听（`onLifecycle` 的默认行为）才能收到所有事件。
- **`whenMounted` 忽略错误。** `tuvix:error` 事件不会让它拒绝。请传入 `signal`，或用 `onLifecycle('error', ...)` 监听。
- **服务端。** 运行时函数在没有 `window` 时也能工作；`CustomEvent` 未定义时，`emitLifecycle` 会跳过 DOM 事件。`ModuleLoader`、`loadScript`、`loadStyle` 和 `prefetchResource` 需要 `document`。

## 它不做什么

- 它不会获取 HTML 页面并从中提取脚本。请列出脚本和样式 URL，或使用加载函数。
- 它不隔离 JavaScript。脚本在页面的全局作用域中运行。要隔离 CSS，请使用编排器的 `sandbox` 选项或 [`@tuvix.js/sandbox`](/zh/packages/sandbox)。
- 它不挂载应用。由你或编排器调用 `module.mount`。
- 它不在页面加载之间保留缓存。这由浏览器的 HTTP 缓存负责。
- 它不读取 `PrefetchStrategy`；由编排器的 `prefetch` 设置决定何时调用 `prefetch`。

## 从 0.4 迁移

- `LoaderOptions.fetch` 和 `EntryConfig.html` 已移除。加载器从未读取过它们。请从配置中删除。
- `loadScript(url, integrity)` 和 `loadStyle(url, timeoutMs)` 仍然可用。选项形式新增了 `type` 和 `signal`：

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- 以 `.js` 结尾的 Vite ES 输出在 0.4 中会以经典脚本加载，并在第一条 `import` 语句处失败。请在入口上设置 `type: 'module'`。
- `type: 'module'` 入口在 `unload` 之后不再能从同一个 URL 重新加载。请使用加载函数或新的 URL。
- 对已缓存模块调用 `load()` 时，报告真实的 `duration`，而不是 `0`。
- 本页的 0.4 版本展示了 `loader.load(url)`、`result.app`、`onLoadStart`、`cache` 和 `loader.clear()`。它们都不存在。请使用 `load(name, entry)`、`result.module`、`unload(name)` 和 `clearCache()`。
