# 微应用

微应用是一个带有 `mount` 和 `unmount` 函数的模块。shell 用一个容器元素和 props 调用 `mount`，应用渲染到该元素中。当应用应该离开页面时，shell 调用 `unmount`，应用移除它渲染的内容。

## 模块结构

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  bootstrap: async () => {},
  mount: async ({ container, props, name, bus }) => {
    container.textContent = `${name ?? 'app'} mounted`;
    void props;
    void bus;
  },
  update: async ({ props, container }) => {
    if (container) container.dataset.props = JSON.stringify(props);
  },
  unmount: async ({ container }) => {
    container.replaceChildren();
  },
};
```

| 钩子 | 必需 | 调用时机 |
| --- | --- | --- |
| `bootstrap()` | 否 | 首次加载后、首次 `mount` 前调用一次。 |
| `mount({ container, props, name, bus })` | 是 | 每次应用变为活动状态时。 |
| `update({ props, container })` | 否 | 应用已挂载期间 shell 调用 `updateAppProps` 时。 |
| `unmount({ container })` | 是 | 每次应用变为非活动状态时。 |

每个钩子都可以返回一个 promise。编排器会等待它完成后再执行下一步。

## 手动编写

`defineMicroApp` 会校验钩子，以 `name` 注册模块，在容器上派发 `tuvix:mounted`、`tuvix:unmounted` 和 `tuvix:error`，并返回该模块：

```ts
import { defineMicroApp } from '@tuvix.js/core';

let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'notifications',

  mount({ container, props, bus }) {
    const list = document.createElement('ul');
    container.replaceChildren(list);
    off = bus?.on<{ text: string }>('notify', ({ text }) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    container.dataset.user = String(props?.user ?? '');
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.replaceChildren();
  },
});
```

使用挂载上下文中的 `bus`。它是编排器的总线，除非 shell 传入了 `eventBus` 选项，否则就是 `getGlobalBus()`。

## 使用适配器

适配器从组件构建模块，并处理那些原本需要你自己编写的细节：

- 每个容器一个框架实例，因此一个模块可以挂载在多个位置；
- `update` 使用新的 props 重新渲染，无需重新挂载；
- 在 `mount` 仍在加载时到达的 `unmount` 会等待，并留下一个空容器；
- 在容器上派发 `tuvix:mounted`、`tuvix:unmounted` 和 `tuvix:error` 事件；
- 传入 `ssr: true` 时对服务端渲染的标记进行水合。

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## 将模块暴露给加载器

编排器通过应用的 `entry` 获取模块：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

// 与 shell 一起打包，由打包工具进行代码分割。
orchestrator.register({
  name: 'cart',
  entry: () => import('./apps/cart'),
  container: '#cart',
  activeWhen: '/shop/*',
});

// 单独部署。脚本按名称注册自身。
orchestrator.register({
  name: 'notifications',
  entry: { scripts: ['https://cdn.example.com/notifications/main.js'], type: 'module' },
  container: '#notifications',
  activeWhen: '/',
});
```

对于 URL 入口，模块必须调用 `registerModule(name, module)`（适配器和 `defineMicroApp` 会这样做），或者暴露一个带有 `mount` 函数的 UMD 全局变量。加载函数只需要 resolve 为该模块或 `{ default: module }`。

## 传递 props

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

await orchestrator.updateAppProps('profile', { theme: 'light' });
// 现在应用的 props 为 { userId: '42', theme: 'light' }。
```

- props 采用浅合并。要移除某个 key，把它设为 `undefined`。
- 当应用已挂载并且有 `update` 时，编排器会调用它，并在它完成后 resolve。`update` reject 时，应用进入 `error` 状态，并调用 `onError`。
- 当应用未挂载或没有 `update` 时，编排器会保存合并后的 props，留给下一次挂载使用。它不会重新挂载应用。

## 在多个位置挂载同一个模块

适配器为每个容器保留一个独立实例。`TuvixIsland` 和你自己的代码可以用同一个模块在两个容器上调用 `mount`：

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Price from './Price.vue';

const price = createVueMicroApp({ name: 'price', App: Price });

const first = document.querySelector<HTMLElement>('#price-1');
const second = document.querySelector<HTMLElement>('#price-2');
if (first && second) {
  await price.mount({ container: first, props: { sku: 'a' } });
  await price.mount({ container: second, props: { sku: 'b' } });
  await price.update?.({ props: { sku: 'c' }, container: second }); // 只更新 #price-2
}
```

不传 `container` 时，`update` 会更新该模块的所有挂载。编排器总是会传入 `container`。

## 构建与部署

将每个应用构建为 ES 模块 bundle 并以 `type: 'module'` 注册，或者构建为 IIFE/UMD bundle 并将其 URL 注册为经典脚本。使用 Vite：

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // 除非 shell 提供这些依赖，否则保持它们打包在内。
  },
});
```

注意框架副本：两个各自打包 React 的微应用会发送两份 React。页面仍然可以工作，因为每个应用渲染自己的 root。要共享同一份副本，可以使用 import map、Module Federation（`@tuvix.js/module-federation`），或者让 shell 通过加载函数入口打包这些应用。

## 微应用不能做的事

- 在容器之外写入内容。Tuvix.js 不会阻止它，但该容器中的下一个应用不会预料到这种情况。
- 在 `unmount` 之后遗留监听器、定时器或订阅。
- 依赖 `bootstrap` 运行多次。它对每个已加载的模块只运行一次。
