# @tuvix.js/react

> 把 React 组件变成 Tuvix.js 微应用，并在 React 树中托管任意微应用，支持 SSR 水合。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。

## 安装

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

需要 React 18 或更高版本。

## 快速开始

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

该模块通过 `@tuvix.js/loader` 的 `registerModule` 以 `'dashboard'` 为名注册自己，因此脚本加载后编排器就能找到它。给编排器提供一个 `entry`（例如 `() => import('./dashboard')`）、一个 `container` 和 `props`。

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 注册表中的名称；生命周期事件会携带它。 |
| `App` | `ComponentType<P>` | 必填 | 根组件。接收挂载时的 props；必填 props 会经过类型检查。 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 一次性初始化。 |
| `ssr` | `boolean` | `false` | 当容器中有服务端标记（元素或非空白文本）时，用 `hydrateRoot` 进行水合。 |

- 每个容器都有自己的 React root，所以一个模块可以挂载到多个位置。
- `mount({ container, props })` 在第一次提交后 resolve，并派发带有 `hydrated` 的 `tuvix:mounted`。
- `update({ props, container })` 重新渲染一个容器；不传 `container` 时重新渲染所有容器。组件状态会保留。
- `unmount({ container })` 卸载 root、清空容器并派发 `tuvix:unmounted`。
- `react-dom/client` 在 `mount` 内部按需加载，所以服务端 bundle 可以导入该模块。

### `createSsrReactMicroApp(config)`

即 `createReactMicroApp({ ...config, ssr: true })`。选项：`name`、`App`、`bootstrap`。它渲染的树与 `TuvixReactApp` 相同，所以水合 `TuvixReactApp` 的标记时不会出现不匹配。

### `TuvixIsland`

在 React 树中托管任意微应用模块（Vue、Svelte、Angular、React 或手写的 `{ mount, unmount, update? }`）。

| Prop | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 写入 `data-tuvix-app`，并传给 `mount`。 |
| `app` | `MicroAppModule` | 必填 | 要挂载的模块。 |
| `props` | `Record<string, unknown>` | `{}` | 浅比较；发生变化时调用 `app.update({ props, container })`，模块没有 `update` 时重新挂载。 |
| `ssrHtml` | `string` | 无 | 该 island 在服务端渲染出的 HTML。只在服务端传入。 |
| `fallback` | `ReactNode` | `null` | 当 `mount` 或 `update` reject 时渲染。 |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | 包裹元素的标签。 |
| `className` | `string` | 无 | 包裹元素的 class。 |

手写的 `<div dangerouslySetInnerHTML={{ __html }} />` 桥接会在父组件下次重新渲染时丢失微应用的 DOM 和监听器，因为 React 每遇到一个新的 `{ __html }` 对象都会重新赋值 `innerHTML`。`TuvixIsland` 只创建一次这个对象。水合期间，它通过 `data-tuvix-island` 属性（来自 `useId`）找到自己的元素，并从页面读回 HTML，所以客户端不需要 `ssrHtml`。新的 `name` 或 `app` 会触发重新挂载；移除时调用 `app.unmount`。调用按顺序执行，所以卸载会等待尚未完成的挂载。

```tsx
// Layout.tsx, rendered on the server with footerHtml and on the client without it
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

在宿主树中以内联方式渲染一个 React 微应用，外层是 `<div data-tuvix-app={name}>`。

| Prop | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 必须与模块的 `name` 一致。 |
| `App` | `ComponentType<P>` | 必填 | 要渲染的组件。 |
| `fallback` | `ReactNode` | `null` | 在 `App` 挂起（suspend）时或抛错后显示。 |
| 其他 props | `P` | 由 `P` 决定是否必填 | 传给 `App`。 |

`App` 位于一个错误边界和一个 `<Suspense fallback>` 中。服务端渲染出错时，只有这个应用被替换为 `fallback`，React 会在客户端重试。客户端渲染出错时显示 `fallback` 并派发 `tuvix:error`。它会派发 `tuvix:mounted`（带有 `hydrated`）和 `tuvix:unmounted`。

### `useTuvixBus(bus, event, handler)`

在 effect 中订阅，并在卸载时取消订阅。最新的 `handler` 保存在 ref 中，所以不会在每次渲染时重新订阅。传入 `@tuvix.js/event-bus` 的 `getGlobalBus()`；适配器不会把编排器的事件总线交给 `App`。

### `useTuvixProps(initialProps, bus?, updateEvent?)`

返回 props，并把 `bus` 上每次 `updateEvent`（默认为 `'tuvix:props:update'`）的载荷合并进去。Tuvix 中没有任何代码会发出这个事件；需要你自己发出。由 `createReactMicroApp` 创建的模块不需要这个 hook，它们通过 `update` 接收新的 props。

### 类型

`ReactMicroAppConfig<P>`、`TuvixIslandProps`、`TuvixReactAppProps<P>`。

## 边界情况

- 第一次渲染时抛错会让 `mount` reject、清空容器并派发 `tuvix:error`。之后再抛错会让应用变为空白，直到你重新挂载。
- 在 `mount` 尚未完成时调用 `unmount`，会等待挂载完成，然后让容器保持为空。
- 对模块已经持有的容器调用 `mount`，会卸载旧的 root（派发 `tuvix:unmounted`），再用新的 props 重新渲染，与 Vue、Svelte 和 Angular 适配器的行为相同。
- 对未知容器调用 `unmount` 和 `update` 不做任何事。
- React 移除 `TuvixIsland` 时，模块会在元素脱离 DOM 之后报告 `tuvix:unmounted`。该事件派发到 `document`（并设置 `detail.container`），所以 `document` 上的监听器和 `onLifecycle` 能收到它；容器及其祖先上的监听器收不到。当该应用不再有任何已挂载的容器时，`isMounted(name)` 变为 `false`。
- 开发环境下在 `<StrictMode>` 中，React 会把 island 的挂载 effect 运行两次，但 island 会跳过被丢弃的第一次运行：模块只挂载一次，并接管服务端标记。
- 挂载失败后，新的 `app` 或 `name` 会挂载到一个空元素中。它永远不会收到失败应用的服务端 HTML。

## 它不做什么

- 按 URL 加载模块。请使用 `@tuvix.js/core` 或 `@tuvix.js/loader`。
- 渲染为字符串。请使用 `react-dom/server`，或者用 `renderVueToString` 等函数生成 `ssrHtml`。
- 加载 island 的 CSS。请使用 `@tuvix.js/vite`。

## 0.5 中的破坏性变更

- `TuvixReactApp` 的服务端 HTML 现在带有 Suspense 注释标记；请同时升级服务端和客户端。
- 第一次渲染抛错时 `mount` 会 reject。
- 对模块从未挂载过的容器调用 `unmount` 不做任何事。

完整文档：[tuvix.js.org/zh/packages/react](https://tuvix.js.org/zh/packages/react)

## 许可证

MIT
