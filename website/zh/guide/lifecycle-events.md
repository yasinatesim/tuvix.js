# 生命周期事件

适配器和 `defineMicroApp` 会在微应用挂载、卸载或失败时通知页面。你可以监听 DOM 事件、await `whenMounted(name)`，或者查询 `isMounted(name)`。用它们在 island 可交互后启动动画、隐藏骨架屏或上报错误，而不是轮询 DOM 或读取 `__vue_app__` 这类框架内部属性。

## 事件

| DOM 事件 | 派发时机 |
| --- | --- |
| `tuvix:mounted` | 应用完成渲染或水合，并且其框架的挂载回调已运行之后。 |
| `tuvix:unmounted` | 应用被销毁、其容器被清空之后。 |
| `tuvix:error` | 当 `mount` 或 `unmount` 抛出错误，或者 React 应用在挂载后渲染时抛出错误时。 |

每个事件都是在应用容器上派发的 `CustomEvent<LifecycleDetail>`。它会冒泡并且是 `composed` 的，因此 `document` 上的监听器也能收到它，即使它来自 shadow root 内部。当容器已不在 DOM 中时（React 在 island 的模块报告 `unmounted` 之前移除了它），事件改为在 `document` 上派发，`detail.container` 仍然指向该元素。

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // 应用名称
  container: document.body, // 应用渲染进去的元素
  hydrated: true, // 适配器接管了服务端标记时为 true
  error: undefined, // 抛出的值，仅用于 'error'
};
```

## 使用 onLifecycle 监听

```ts
import { onLifecycle } from 'tuvix.js';

const stopMounted = onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} is interactive (hydrated: ${hydrated})`);
});

const stopErrors = onLifecycle('error', ({ name, error }) => {
  console.error(`${name} failed`, error);
});

// 稍后
stopMounted();
stopErrors();
```

`onLifecycle(type, handler, target = document)` 返回一个用于移除监听器的函数。把容器作为 `target` 传入，就只监听一个区域。直接使用 `addEventListener('tuvix:mounted', ...)` 也可以。

## 使用 whenMounted 等待

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- 如果应用已经挂载，它会立即 resolve，因此你的代码和挂载的先后顺序无关紧要。
- 挂载失败时它不会 reject。请传入带超时的 `signal`，或者同时监听 `tuvix:error`。
- 当 signal 中止时，promise 会以 signal 的 reason reject。

## 使用 isMounted 检查

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## 替代框架嗅探

没有生命周期事件时，宿主只能猜测 island 何时就绪，例如轮询框架的私有属性：

```ts no-check
// 在 Svelte、Angular 以及任何重命名该属性的 Vue 版本上都会失效。
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

有了生命周期事件，一个监听器就能适用于所有适配器：

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## 谁派发这些事件

| 来源 | 派发 |
| --- | --- |
| `createReactMicroApp`、`createVueMicroApp`、`createSvelteMicroApp`、`createAngularMicroApp`（以及 `Ssr` 变体）| 全部三种 |
| `TuvixReactApp` | 全部三种 |
| `TuvixIsland` | 自身不派发；由它承载的模块派发 |
| `defineMicroApp` | 全部三种；设置 `ssr: true` 时，如果容器在 `mount` 之前已有标记，`hydrated` 为 `true` |
| 普通的 `{ mount, unmount }` 对象 | 不派发，除非你调用 `emitLifecycle` |
| 编排器 | 不派发；它改为在事件总线上发出 `tuvix:app:*` 事件 |

`defineMicroApp` 在你的 `mount` resolve 后派发 `tuvix:mounted`，在你的 `unmount` resolve 后派发 `tuvix:unmounted`，在两者之一抛出错误时派发 `tuvix:error`（然后重新抛出）。针对某个 `mount` 仍在运行的容器的 `unmount` 会等待它完成：

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'clock',
  ssr: true, // 服务端已把时间渲染进容器
  mount({ container }) {
    container.textContent = new Date().toISOString();
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

以普通对象编写的模块可以自己派发这些事件：

```ts
import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

export const clock: MicroAppModule = {
  mount({ container }) {
    container.textContent = new Date().toISOString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated: false });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
};
```

## 边界情况

- 一个模块可以挂载在多个容器中。只要其中任意一个仍处于挂载状态，`isMounted(name)` 就保持为 `true`，`whenMounted(name)` 会以仍处于挂载状态的最早容器 resolve。需要区分它们时，为每个放置位置使用不同的名称。
- 针对已脱离文档的容器的 `tuvix:unmounted` 事件只会到达 `document` 监听器一次。以容器为 `target` 的 `onLifecycle` 看不到它，因为事件不再经过该元素。
- 状态保存在 `window.__TUVIX_RUNTIME__` 上，因此分别打包的 `@tuvix.js/loader` 副本共享这份状态。
- 服务端没有 DOM，也没有事件。不要在服务端调用 `whenMounted`；它永远不会 resolve。

## 它不做什么

- 它不报告加载进度。编排器的 `onStatusChange` 涵盖 `bootstrapping`、`mounting` 等状态。
- 它不重试也不恢复。请使用编排器的 `fallback`，或 `TuvixIsland` 和 `TuvixReactApp` 上的 `fallback`。
