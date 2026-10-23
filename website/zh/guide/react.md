# 搭配 React 使用

`@tuvix.js/react` 负责三件事。`createReactMicroApp` 把一个 React 组件变成任何 shell 都能挂载的微应用。`TuvixReactApp` 在 React 宿主页面中渲染 React 微应用，并支持服务端渲染。`TuvixIsland` 在 React 页面中承载 Vue、Svelte、Angular、React 或手写的微应用。

需要 React 18 或 19。

## 安装

```bash
pnpm add @tuvix.js/react react react-dom
```

## 把组件变成微应用

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile ${theme}`}>User {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

这个模块：

- 以 `name` 注册自身，因此 URL 入口能找到它；
- 每个容器创建一个 React root，因此一个模块可以挂载到多个位置；
- 在 React 提交首次渲染后 resolve `mount`，然后在容器上派发 `tuvix:mounted`；
- 把 shell 的 props 作为 `App` 的 props 传入。`App` 可以声明必填 props；适配器不在运行时检查它们。

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 必填。必须与注册的应用名一致。 |
| `App` | `ComponentType<P>` | 必填。根组件。 |
| `bootstrap` | `() => void \| Promise<void>` | 在首次挂载前运行一次。 |
| `ssr` | `boolean` | 容器中有服务端标记时进行水合。`createSsrReactMicroApp` 会设置它。 |

## Props 与更新

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` 用合并后的 props 重新渲染该容器对应的 root。组件状态会保留。不传 `container` 时，它重新渲染该模块的所有 root。对这个模块已经渲染过的容器调用 `mount`，会重新渲染它，而不是再创建一个 root。

## 错误

适配器用一个错误边界包裹 `App`：

- 首次渲染时抛出异常会让 `mount` reject，清空容器并派发 `tuvix:error`。随后编排器显示该应用的 `fallback` HTML。
- 之后抛出异常会让应用变为空白并派发 `tuvix:error`。页面的其余部分继续运行。

## 服务端渲染的 React 应用

当宿主页面是 React 并在服务端渲染（TanStack Start、Next.js、Remix 或你自己的 `renderToString`）时，用 `TuvixReactApp` 内联渲染微应用：

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

- 它在 `App` 外面渲染 `<div data-tuvix-app="legal">`，因此 HTML 来自宿主自己的服务端渲染。
- 除 `name`、`App` 和 `fallback` 外，所有 prop 都传给 `App`。
- `App` 位于它自己的 `<Suspense fallback>` 中。如果它在服务端抛出异常，React 只为这个应用发送回退内容（fallback），并在客户端重试该应用。
- 在客户端，错误边界显示 `fallback` 并派发 `tuvix:error`。
- 首次提交后，如果水合了服务端 HTML，它派发带 `hydrated: true` 的 `tuvix:mounted`；离开组件树时派发 `tuvix:unmounted`。

当需要由一个独立的 bundle 水合这段标记时（例如由 `@tuvix.js/server` 组合的页面），用 `createSsrReactMicroApp` 导出同一个组件。它渲染相同的 Suspense 树，因此水合结果一致：

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

设置 `ssr: true` 时，只包含空白或注释的容器会重新渲染，而不是水合。

## 用 TuvixIsland 承载其他微应用

`TuvixIsland` 在 React 树中挂载任意微应用模块：

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });

export function Footer({ newsletterHtml }: { newsletterHtml?: string }) {
  return (
    <TuvixIsland
      name="newsletter"
      app={newsletter}
      props={{ list: 'weekly' }}
      ssrHtml={newsletterHtml}
      fallback={<p>Subscribe at example.com/newsletter</p>}
    />
  );
}
```

| Prop | 说明 |
| --- | --- |
| `name` | 写入 `data-tuvix-app` 并传给 `mount`。 |
| `app` | 要挂载的模块。 |
| `props` | 每次渲染时做浅比较。发生变化时调用 `app.update`；模块没有 `update` 时先卸载再挂载。 |
| `ssrHtml` | 该 island 的服务端 HTML。只在服务端需要。 |
| `fallback` | `mount` 或 `update` reject 时代替 island 渲染。 |
| `as`, `className` | 包裹元素的标签（默认 `div`）和 class。 |

首次渲染后，React 不会再改写 island 的内部 HTML，因此父组件重新渲染时，模块挂上去的 DOM 和监听器都会保留。`name` 或 `app` 变化会重新挂载；移除 island 会调用 `app.unmount`。挂载、更新和卸载依次执行，因此在 `mount` 期间到来的卸载会等待它完成。

`TuvixIsland` 不按 URL 加载模块。请导入模块，或者让编排器管理 URL 入口。完整的服务端配置见 [SSR Islands](/zh/guide/ssr-islands)。

## Hooks

### useTuvixBus

在挂载时订阅，在卸载时取消订阅。它通过 ref 读取最新的 `handler`，因此内联的处理函数不会在每次渲染时重新订阅：

```tsx
import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/react';

const bus = getGlobalBus();

export function CartBadge() {
  const [count, setCount] = useState(0);
  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => setCount(itemCount));
  return <span className="badge">{count}</span>;
}
```

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` 返回一个状态，它会合并 `updateEvent` 上发布的每个 payload。Tuvix.js 中没有任何代码发布这个事件；当你想通过总线而不是 `updateAppProps` 推送 props 时，自己发布它。

```tsx
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixProps } from '@tuvix.js/react';

const bus = getGlobalBus();

export function Theme() {
  const props = useTuvixProps({ theme: 'light' }, bus);
  return <p>Theme: {props.theme}</p>;
}

bus.emit('tuvix:props:update', { theme: 'dark' });
```

## 适配器不做什么

- 它不在微应用之间共享同一个 React root。每个应用、每个容器都有自己的 root。
- 它不对 React 去重。两个分别打包的 React 微应用会带上两份 React。
- 它不渲染宿主页面的 `<head>`。标题和 meta 标签由宿主负责。

## API

| 导出 | 用途 |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | React 微应用模块 |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | 同上，但设置 `ssr: true` |
| `TuvixReactApp` | 在 React 宿主中内联渲染 React 微应用，支持 SSR |
| `TuvixIsland` | 在 React 树中承载任意微应用模块，支持 SSR |
| `useTuvixBus(bus, event, handler)` | 与组件绑定的事件总线订阅 |
| `useTuvixProps(initial, bus?, event?)` | 从总线事件合并而来的 props |
