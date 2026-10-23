# @tuvix.js/vue

> 把 Vue 3 组件变成 Tuvix.js 微应用，支持响应式 props、每个容器一个 Vue 应用以及 SSR 水合。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。

## 安装

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

如果需要服务端渲染，还要安装可选的 peer 依赖 `@vue/server-renderer`。

## 快速开始

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

该模块通过 `@tuvix.js/loader` 的 `registerModule` 以 `'settings'` 为名注册自己，因此脚本加载后编排器就能找到它。`App` 以组件 props 的形式接收编排器传入的 props；请用 `defineProps` 声明它们。

## API

### `createVueMicroApp(config)`

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 注册表中的名称；生命周期事件会携带它。 |
| `App` | `Component` | 必填 | 根 Vue 组件。 |
| `plugins` | `VuePluginEntry[]` | 无 | 插件，或传给 `app.use(plugin, ...options)` 的 `[plugin, ...options]` 元组。 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 一次性初始化。 |
| `ssr` | `boolean` | `false` | 当容器中有元素或非空白文本时，用 `createSSRApp` 水合服务端标记。 |

- 每个容器都有自己的 Vue 应用和 props，所以一个模块可以挂载到多个位置。每次挂载都会重新安装插件。
- `mount({ container, props })` 派发带有 `hydrated` 的 `tuvix:mounted`。
- `update({ props, container })` 替换 `shallowReactive` props 对象中的键（缺少的键会被移除），并在 `nextTick` 之后 resolve。不传 `container` 时更新所有挂载。组件状态会保留。
- `unmount({ container })` 卸载应用、清空容器并派发 `tuvix:unmounted`。

### `createSsrVueMicroApp(config)`

即 `createVueMicroApp({ ...config, ssr: true })`。选项：`name`、`App`、`plugins`、`bootstrap`。Vue 会接管 `renderVueToString` 生成的标记；空容器则正常渲染。

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

来自 `@tuvix.js/vue/server`。返回 `App` 渲染出的 HTML，使用与客户端相同的根包裹组件，所以水合能够匹配，并且 `inject('tuvixProps')` 在服务端也能使用。Vue 会把 `teleports` 和 `modules` 写入 `ssrContext`。

仅限服务端：请在服务端函数中调用它，不要在同构的路由 loader 中调用。在浏览器中它返回 `''`，而导入它的 loader 会把 Vue 服务端渲染器发送到客户端。

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'`。在组件树中的任意组件里，`inject(TUVIX_PROPS_KEY)` 都会返回 `update` 写入的那个响应式 props 对象。

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

在 `onMounted` 中订阅，在 `onUnmounted` 中取消订阅，并返回一个可提前取消订阅的函数。传入 `@tuvix.js/event-bus` 的 `getGlobalBus()`；适配器不会把编排器的事件总线交给 `App`。

### `useTuvixProps(initialProps, bus?, updateEvent?)`

返回一个 `ShallowRef<T>`，并把 `bus` 上每次 `updateEvent`（默认为 `'tuvix:props:update'`）的载荷合并进去。Tuvix 中没有任何代码会发出这个事件；需要你自己发出。编排器的 props 请使用 `defineProps` 或 `inject(TUVIX_PROPS_KEY)`。

### 类型

来自 `@tuvix.js/vue` 的 `VueMicroAppConfig`、`VueSsrMicroAppConfig`、`VuePluginEntry`；来自 `@tuvix.js/vue/server` 的 `VueSsrContext`。

## 边界情况

- 在 `mount` 期间发生的 setup、渲染和钩子错误，在开发和生产构建中都会 reject；适配器会卸载失败的应用并派发 `tuvix:error`。插件的 `app.config.errorHandler` 仍会运行。
- 对模块已经持有的容器调用 `mount` 会先卸载旧应用。
- 对模块从未挂载过的容器调用 `unmount` 不做任何事。
- 根组件没有声明的 props 会作为属性透传到它的根元素上。
- 设置 `ssr: true` 时，只包含空白或注释的容器会重新渲染。

## 它不做什么

- 支持 Vue 2。
- 按 URL 加载模块。请使用 `@tuvix.js/core` 或 `@tuvix.js/loader`。
- 在服务端收集 CSS 或流式输出 HTML。样式表链接请使用 `@tuvix.js/vite`。

## 0.5 中的破坏性变更

- `update()` 不再写入 `app.config.globalProperties.$tuvixProps`。请使用 `defineProps` 或 `inject('tuvixProps')`。
- 对模块从未挂载过的容器调用 `unmount()` 不做任何事；以前它会清空容器。
- `VueSsrMicroAppConfig` 不再接受 `ssr`。

完整文档：[tuvix.js.org/zh/packages/vue](https://tuvix.js.org/zh/packages/vue)

## 许可证

MIT
