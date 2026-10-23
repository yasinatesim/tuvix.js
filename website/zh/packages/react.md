---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React 绑定"
  description="把 React 组件变成 Tuvix.js 微应用，并在 React 树中托管任意微应用（Vue、Svelte、Angular、React、原生 JS），支持服务端渲染和水合。"
  icon="⚛️"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

这个包需要 React 18 或更新版本（`react` 和 `react-dom` 的 peer 范围为 `>=18.0.0`）。它依赖 `@tuvix.js/loader` 和 `@tuvix.js/event-bus`。

## 何时使用

这个包覆盖两个方向：

- **React 作为微应用。** `createReactMicroApp` 和 `createSsrReactMicroApp` 把 React 组件包装成编排器和加载器需要的 `{ bootstrap, mount, unmount, update }` 模块。当 React 应用是 Tuvix shell（宿主应用）加载的微应用之一时，使用它们。
- **React 作为宿主。** `TuvixIsland` 在 React 页面中挂载任意微应用模块，并在重新渲染时保持它的 DOM 不变。`TuvixReactApp` 在宿主树中内联渲染 React 微应用。当你的 shell 是 TanStack Start、Next.js 或 Remix 这类 React SSR 框架时，使用它们。

如果你的 shell 是不含 React 的纯 HTML，你只需要第一组函数加上 [`@tuvix.js/core`](/zh/packages/core)。对于 Vue、Svelte 或 Angular 微应用，用 [`@tuvix.js/vue`](/zh/packages/vue)、[`@tuvix.js/svelte`](/zh/packages/svelte) 或 [`@tuvix.js/angular`](/zh/packages/angular) 创建模块；`TuvixIsland` 可以托管其中任何一个。

## 快速开始

创建微应用模块：

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

在 shell 中注册它。路由匹配时编排器调用 `mount`，你修改 props 时它调用 `update`：

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// 重新渲染 <Dashboard userId="u_43" />；组件状态保留。
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 模块通过 `@tuvix.js/loader` 的 `registerModule` 注册时使用的名称。生命周期事件会携带它。 |
| `App` | `ComponentType<P>` | 必填 | 根组件。它把挂载时的 props 作为自己的 props 接收，所以带必填 props（例如 `{ page: 'privacy' \| 'terms' }`）的组件也能通过类型检查。 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 一次性初始化。模块的 `bootstrap()` 会等待它完成。 |
| `ssr` | `boolean` | `false` | 当容器包含元素或非空白文本时，用 `hydrateRoot` 水合服务端标记。只含空白或注释的容器会用 `createRoot` 全新渲染。 |

返回的模块有四个方法：

- `mount({ container, props })` 为该容器创建一个 React root。它在 React 提交首次渲染后 resolve，然后在容器上派发 `tuvix:mounted`，并带上 `hydrated: true` 或 `false`。如果 `App` 在首次渲染时挂起，`mount` 会等到内容提交。
- `update({ props, container })` 用 `props` 在该容器中重新渲染 `App`。不传 `container` 时，它会重新渲染模块已挂载的所有容器。因为树的结构不变，React 会保留组件状态。
- `unmount({ container })` 卸载 root，用 `replaceChildren()` 清空容器，并派发 `tuvix:unmounted`。
- `bootstrap()` 执行 `config.bootstrap`。

每个容器都有自己的 root，所以一个模块可以同时挂载到多个位置：

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// 只有右侧的 badge 发生变化。
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

模块在 `mount` 内部懒加载 `react-dom/client`。服务端 bundle 可以导入这个模块（例如为了与 `TuvixReactApp` 共享 `App`），而不会引入客户端渲染器。

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

等同于 `createReactMicroApp({ ...config, ssr: true })`。选项：`name`、`App`、`bootstrap`，含义见上表。

当容器中已有服务端为同一组件渲染的 HTML 时，在客户端使用它。它渲染的树与 `TuvixReactApp` 渲染的树一致（错误边界加 `<Suspense>`），所以水合 `TuvixReactApp` 的标记时不会出现不匹配：

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland`

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| Prop | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 微应用名称。island 把它写入 `data-tuvix-app`，并传给 `app.mount`。 |
| `app` | `MicroAppModule` | 必填 | 要挂载的模块：`createVueMicroApp`、`createSvelteMicroApp`、`createAngularMicroApp`、`createReactMicroApp` 及其 `createSsr*` 变体的返回值，或手写的 `{ mount, unmount, update? }` 对象。 |
| `props` | `Record<string, unknown>` | `{}` | 传给模块的 props。island 在每次渲染时对它们做浅比较。 |
| `ssrHtml` | `string` | 无 | island 的服务端渲染 HTML，例如来自 `renderVueToString`。只在服务端传入。 |
| `fallback` | `ReactNode` | `null` | 当 `mount` 或 `update` reject 时，代替 island 渲染。 |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | 包裹元素的标签。 |
| `className` | `string` | 无 | 包裹元素的 class 名。 |

`TuvixIsland` 在 React 页面中托管非 React 微应用（或单独打包的 React 微应用）。手写的桥接如果渲染 <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span>，会在父组件第一次重新渲染时出问题：React 看到一个新的 `{ __html }` 对象，再次赋值 `innerHTML`，销毁微应用挂上的 DOM 和监听器。`TuvixIsland` 避免了这一点：

- **服务端渲染。** 它渲染 `<div data-tuvix-app={name} data-tuvix-island={id}>`，并把 `ssrHtml` 作为内部 HTML。`id` 来自 React 的 `useId`，所以服务端和客户端算出的值相同。
- **水合。** 在客户端首次渲染时，它通过 `data-tuvix-island` 在页面中找到自己的元素，并从 DOM 读回内部 HTML。你不需要把 `ssrHtml` 再发送给客户端一次，客户端渲染结果也与服务端一致。
- **稳定的 DOM。** island 只在 `useState` 中创建一次 `{ __html }` 对象。之后的渲染复用这个对象，所以 React 不会重写 island 的子节点。父组件重新渲染时，微应用的节点和监听器都会保留。
- **挂载。** 首次提交后，island 调用 `app.mount({ container, props, name })`。用 `ssr: true` 创建的模块（`createSsrVueMicroApp` 等）在这里接管服务端 DOM。不带 SSR 的模块会在容器中全新渲染。
- **Props。** 当 `props` 在浅比较下发生变化（键不同，或某个值未通过 `Object.is`）时，island 调用 `app.update({ props, container })`。没有 `update` 的模块会依次经历 `unmount`、清空容器和新的 `mount`。值相同的内联对象字面量不会触发更新。
- **身份。** 新的 `name` 或 `app` 会卸载旧模块并挂载新模块。
- **移除。** island 离开树时，会调用 `app.unmount({ container })` 并清空容器。
- **顺序。** mount、update 和 unmount 调用依次执行。在 `mount` 尚未完成时到达的 unmount 会等待它。
- **错误。** 如果 `mount` 或 `update` reject，island 会渲染 `fallback` 代替包裹元素。适配器自己派发 `tuvix:error`；island 不额外派发事件。之后修改 `name` 或 `app` 会重试。

一个完整的服务端和客户端配置示例，React 布局中包含一个 Vue footer：

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// 这里不传 footerHtml：island 从页面中读取 footer 的 HTML。
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

服务端 HTML 在任何 JavaScript 之前到达浏览器，所以只要你在 `<head>` 中输出 footer 的样式表，它在首次绘制时就可见且带样式。[`@tuvix.js/vite`](/zh/packages/vite) 会为你提供这些 `<link>` 标签。

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 微应用名称，写入 `data-tuvix-app`。与你传给 `createSsrReactMicroApp` 的 `name` 保持一致。 |
| `App` | `ComponentType<P>` | 必填 | 要渲染的组件。 |
| `fallback` | `ReactNode` | `null` | 在 `App` 挂起时以及抛出错误后显示。 |
| 其他 props | `P` | 由 `P` 决定是否必填 | 传给 `App`。 |

`TuvixReactApp` 把 React 微应用作为宿主 React 树的一部分内联渲染，所以由你的 SSR 框架渲染它的 HTML。它输出 `<div data-tuvix-app={name}>`，并用错误边界和 `<Suspense fallback>` 包裹 `App`：

- **服务端错误不扩散。** 服务端渲染时 `App` 内部抛出错误，React 只为这个应用渲染 `fallback`。页面其余部分照常渲染，React 会在客户端重试 `App`。
- **客户端错误不扩散。** 错误边界在客户端捕获渲染错误，显示 `fallback`，并在包裹元素上派发 `tuvix:error`。
- **生命周期事件。** 首次提交后，它派发 `tuvix:mounted`。当包裹元素来自服务端 HTML 时，`hydrated` 为 `true`。组件离开树时，它会在 React 分离包裹元素之前派发 `tuvix:unmounted`，所以 `document` 上的监听器能收到它。如果一个已显示的 `<Suspense>` 边界再次挂起，应用会报告 `unmounted`，内容恢复后再报告 `mounted`。

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

要托管 Vue、Svelte、Angular 或原生 JS 微应用，请使用 `TuvixIsland`。

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

在 effect 中把 `handler` 订阅到 `bus` 上的 `event`，并在卸载时取消订阅。hook 把最新的 `handler` 保存在 ref 中，所以读取最新状态的 handler 不会在每次渲染时重新订阅。新的 `bus` 或 `event` 会重新订阅。订阅只存在于客户端；服务端渲染时 effect 不会执行。

适配器不会把编排器的事件总线传给 `App`。除非你给编排器传了 `eventBus` 选项，否则它使用 `getGlobalBus()`，所以从那里读取事件总线：

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| 参数 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `initialProps` | `T` | 必填 | 初始值。hook 在首次渲染时读取它，之后的变化会被忽略。 |
| `bus` | `IEventBus` | 无 | 要监听的事件总线。不传时，hook 原样返回 `initialProps`。 |
| `updateEvent` | `string` | `'tuvix:props:update'` | hook 会把这个事件的 payload 合并进当前 props（`{ ...prev, ...payload }`）。 |

编排器和适配器都不会发出 `tuvix:props:update`，需要你自己发出。由 `createReactMicroApp` 创建的模块不需要用这个 hook 接收编排器的 props：`update({ props })` 会用新的 props 重新渲染 `App`。

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// 在其他地方：getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### 类型

| 类型 | 含义 |
| --- | --- |
| `ReactMicroAppConfig<P>` | `createReactMicroApp` 的配置：`name`、`App`、`bootstrap?`、`ssr?`。 |
| `TuvixIslandProps` | `TuvixIsland` 的 props：`name`、`app`、`props?`、`ssrHtml?`、`fallback?`、`as?`、`className?`。 |
| `TuvixReactAppProps<P>` | `TuvixReactApp` 的 props：`name`、`App`、`fallback?`，以及 `App` 的 props。 |

## 边界情况

- **首次渲染抛出错误。** `mount` 以该错误 reject，卸载 root，清空容器，并派发 `tuvix:error`。在 0.4 中，`mount` 会 resolve，错误交给 React 的 root 错误处理器。
- **后续渲染抛出错误。** 错误边界把应用清空并派发 `tuvix:error`。宿主页面继续运行。应用会保持空白，直到你卸载并重新挂载它；`update` 不能让它恢复。
- **挂载期间卸载。** 如果 `unmount` 在 `mount` 仍在加载 `react-dom/client` 或等待首次提交时到达，它会等待 `mount`，然后让容器保持为空，并且不派发 `mounted` 事件。
- **向同一容器挂载两次。** 对模块已持有的容器再次调用 `mount`，会卸载旧的 root，派发 `tuvix:unmounted`，然后用新的 props 全新渲染，并派发 `tuvix:mounted`。组件状态会重置。Vue、Svelte 和 Angular 适配器的行为相同。要保留状态，请调用 `update`。
- **未知容器。** 对模块从未挂载过的容器调用 `unmount` 和 `update` 不做任何事。
- **Props 整体替换。** 模块的 `update` 只用你传入的 props 渲染 `App`，不带其他值。`orchestrator.updateAppProps` 会先把新 props 合并到注册时的 props 上，再调用 `update`。
- **`ssr: true` 时容器只含空白。** 模块会全新渲染，因为 `hasServerMarkup` 忽略空白文本和注释。
- **island 被 React 移除。** React 会在模块报告 `tuvix:unmounted` 之前分离 island 的元素。这时 `emitLifecycle` 会在 `document` 上派发事件，而不是在已分离的元素上派发，所以 `document` 上的监听器（或 `@tuvix.js/loader` 的 `onLifecycle`）仍然能收到它，`detail.container` 指向被移除的元素。容器本身或其祖先上的监听器收不到。只要应用仍挂载在其他任一容器中，`isMounted(name)` 就保持 `true`，最后一个容器卸载后变为 `false`。
- **开发环境中 island 位于 `<StrictMode>` 下。** React 会执行挂载 effect、它的清理函数，然后再次执行 effect。island 把模块调用排入队列，并跳过第一次执行，因为它的清理函数已经运行过，所以模块只挂载一次，并接管服务端 DOM。
- **挂载失败后换用新应用。** 当 `mount` reject 时，island 会丢弃它的服务端 HTML。如果你随后传入不同的 `app` 或 `name`，新模块会挂载到一个空元素中，而不是接管失败应用的标记。
- **修改 island 的 `ssrHtml`。** island 只在首次渲染时读取 `ssrHtml`。新内容请通过 `props` 传入。
- **同一名称使用两次。** `registerModule` 保留以该名称最后创建的模块。

## 它不做什么

- 它不通过 URL 加载模块。请导入模块，或让 [`@tuvix.js/core`](/zh/packages/core) 通过 `entry` 加载它。
- 它不把微应用渲染为字符串。在服务端，请将 `react-dom/server` 的 `renderToString` 与 `TuvixReactApp` 一起使用，或使用框架自己的渲染器（[`@tuvix.js/vue/server`](/zh/packages/vue) 的 `renderVueToString`，以及 Svelte 和 Angular 的对应函数），并把结果作为 `ssrHtml` 传给 `TuvixIsland`。
- 它不把 `MountContext.bus` 或 `MountContext.name` 传给 `App`。请使用 `@tuvix.js/event-bus` 的 `getGlobalBus()`。
- 它不加载 island 的 CSS。请使用 [`@tuvix.js/vite`](/zh/packages/vite) 为服务端渲染的 island 输出样式表链接。
- 它不支持 React 17 或更早版本。

## 从 0.4 迁移

**`TuvixReactApp` 的服务端 HTML 带有 Suspense 标记。** 包裹元素现在会在应用外围包含 `<!--$-->…<!--/$-->`。请同时升级服务端和客户端的 `@tuvix.js/react`，否则水合会因不匹配而失败。

**首次渲染抛出错误时 `mount` 会 reject。** 如果你 await 了 `mount` 并期望它 resolve，请捕获错误：

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4：不会执行到这里。0.5：渲染错误；容器为空。
  container.textContent = 'This section failed to load.';
}
```

**对未知容器调用 `unmount` 不做任何事。** 在 0.4 中它会清空容器。如果你依赖这个行为，请自己调用 `container.replaceChildren()`。

**配置对象。** 本页的早期版本展示的是 `createReactMicroApp(App)`。这个函数接收一个配置对象：`createReactMicroApp({ name: 'dashboard', App })`。

更多示例请参阅 [React 指南](/zh/guide/react)。
