# 迁移到 0.5

0.5 修复了一些会改变可观察行为的 bug，其中部分修复会破坏 0.4 的代码。本页按包列出每一项破坏性变更，并给出需要修改的代码。请把所有 `tuvix.js` 和 `@tuvix.js/*` 包一起升级到 `^0.5.0`；不支持在同一页面上混用 0.4 和 0.5 的适配器。

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

0.5 之前用 `create-tuvix-app` 创建的项目依赖 `^0.1.0`，这个范围永远不会解析到 0.4 或 0.5。请手动修改这些版本范围。

## Core

### 编排器使用全局总线

0.4 给每个编排器一个私有总线，与 `getGlobalBus()` 分开。在 0.5 中，除非你传入 `eventBus` 选项，编排器的总线就是 `getGlobalBus()`，并且 `destroy()` 不会销毁全局总线。

```ts no-check
// 0.4：两个总线；监听 getGlobalBus() 的应用收不到编排器事件
const orchestrator = createOrchestrator();
orchestrator.getEventBus() === getGlobalBus(); // false
```

```ts
// 0.5
import { createOrchestrator, getGlobalBus } from 'tuvix.js';

const shared = createOrchestrator();
console.log(shared.getEventBus() === getGlobalBus()); // true

const isolated = createOrchestrator({ eventBus: {} }); // 私有总线，与 0.4 相同
console.log(isolated.getEventBus() === getGlobalBus()); // false
```

如果你曾把编排器的总线挂到 `window` 上让应用找到它，现在可以去掉这段代码，改用挂载上下文中的 `bus` 或 `getGlobalBus()`。

### 路由变化不再影响手动挂载的应用

在 0.4 中，既没有 `activeWhen` 也没有路由器路由的应用，以及 `mountWhenVisible` 应用，会在下一次路由变化时被卸载。在 0.5 中，协调（reconcile）只处理由 `activeWhen` 或路由控制的应用。如果你依赖一次导航来移除手动挂载的应用，请自己卸载它：

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true 在 shadow root 中渲染

在 0.4 中，`register` 上的 `sandbox` 不起任何作用。在 0.5 中，`sandbox: true` 会把应用挂载到一个 shadow root 中，并在其中加载入口的 `styles`。页面 CSS 不再作用于该应用，应用的入口样式也不再作用于页面。请从依赖页面样式的应用中移除 `sandbox: true`。参见[沙箱隔离](/zh/guide/sandbox)。

### prefetch: 'hover'

0.4 会在页面任意位置的第一次鼠标移动时预取所有应用。0.5 会在指针进入、或焦点落到某个同源链接上，且该链接的路径会激活某个应用时，预取这个应用。如果要一开始就获取所有应用，请使用 `'idle'` 或 `'immediate'`。

### OrchestratorConfig.shared 已移除

编排器从未读取 `shared`。删除它，并使用 `@tuvix.js/module-federation` 或 import maps 共享依赖。

### activeWhen 模式

`activeWhen` 字符串现在使用 `matchPath`。查询字符串或 hash 不再导致应用被卸载，`:param` 段可以正常使用，`.` 和 `(` 等字符按字面匹配。

```ts no-check
// 0.4：`.` 是正则通配符，会匹配 '/v1x0'
activeWhen: '/v1.0/*'
// 0.4：查询字符串会破坏匹配，所以人们改写成函数
activeWhen: (path) => path.split('?')[0].startsWith('/dashboard')
```

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*', // 在 /dashboard?tab=1 上同样激活
});
```

## Router

### '/' 路由与 RouteConfig.exact

路由路径在所有地方都匹配完整路径。`'/'` 路由现在只在 `/` 上激活；在 0.4 中，`getActiveApps()` 把它当作匹配所有路径，而 `match()` 把它当作精确匹配。`RouteConfig.exact` 已移除，因为它从未改变任何行为。

```ts no-check
// 0.4
routes: [{ path: '/', app: 'shell-nav' }, { path: '/settings', app: 'settings', exact: true }]
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({
  routes: [
    { path: '/*', app: 'shell-nav' }, // 所有路径
    { path: '/settings', app: 'settings' }, // 仅 /settings
  ],
});
void router;
```

`register` 上的 `activeWhen: '/'` 仍然匹配所有路径，因为 `activeWhen` 字符串使用前缀匹配。

### push 和 replace 会加上 base

```ts no-check
// 0.4，base: '/app'
router.push('/app/settings'); // 你必须自己加上 base
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({ base: '/app', routes: [] });
await router.push('/settings'); // URL: /app/settings
```

在 0.5 中传入 `/app/settings` 会写入 `/app/app/settings`。取消前进/后退导航的守卫也会带着 base 恢复 URL。

### 其他路由器变更

- `base` 只在路径段边界处去除。使用 `base: '/app'` 时，`/application` 保持为 `/application`。
- `pathToRegex()` 返回缓存的 `RegExp`，不要修改它。它的第二个参数 `exact` 已移除。
- 模式中的正则字符按字面匹配。模式中间的 `*` 匹配一个路径段。
- `matchRoute()` 和 `isPathActive()` 会忽略路径中的 `#hash`。

## Loader

### 已移除的选项

`LoaderOptions.fetch` 和 `EntryConfig.html` 已移除。加载器从未读取它们，请从配置中删除。

```ts no-check
// 0.4
new ModuleLoader({ fetch: myFetch });
orchestrator.register({ name: 'x', entry: { scripts: ['/x.js'], html: '<div></div>' }, container: '#x' });
```

```ts
// 0.5
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({ timeout: 10000 });
void loader;
```

### 模块脚本对每个 URL 只运行一次

在 `unload(name)` 之后，通过 `type: 'module'` 脚本自行注册的应用无法从同一个 URL 再次加载，因为浏览器对每个 URL 只运行一次模块脚本。对于需要卸载后重新加载的应用，请使用加载器函数形式的入口：

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

对已缓存模块调用 `load()` 时，现在会报告真实的 `duration`，而不是 `0`。

## Module Federation

`federatedEntry` 和 `createFederatedEntry` 返回一个加载器函数，而不是 `{ scripts: [remoteEntry.js] }`。0.4 的入口会加载容器脚本，然后以 "no exports found" 失败。

```ts no-check
// 0.4
orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }),
  container: '#main',
});
```

```ts
// 0.5
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader, federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry(
    { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
    './App', // 暴露的模块路径
  ),
  container: '#main',
  activeWhen: '/dashboard/*',
});

const remotes = createFederatedLoader({
  remotes: [{ name: 'settings', url: 'https://cdn.example.com/settings/remoteEntry.js' }],
  shareScope: {}, // 替代 0.4 的 `shared`
});

orchestrator.register({
  name: 'settings',
  entry: remotes.createFederatedEntry('settings', './App'),
  container: '#main',
  activeWhen: '/settings/*',
});
```

- `FederatedLoaderConfig.shared` 被 `shareScope` 取代。0.4 从未读取 `shared`。
- `loadRemoteContainer` 返回 `FederatedContainer`，而不是 `any`。

## React

- `TuvixReactApp` 的服务端 HTML 现在包含 Suspense 注释标记（`<!--$-->...<!--/$-->`）。请在两端都使用 `@tuvix.js/react` 0.5 进行渲染和水合。
- 首次渲染抛出错误时，`mount` 会 reject。在 0.4 中，错误会传到 React 根节点的错误处理器，而 `mount` 正常 resolve。编排器现在会显示应用的 `fallback` 并调用 `onError`。
- 对模块从未挂载过的容器调用 `unmount` 不做任何事。0.4 会清空它。

## Vue

`update()` 不再写入 `app.config.globalProperties.$tuvixProps`。props 现在是响应式的：

```vue
<!-- 0.4 -->
<template>{{ $tuvixProps.theme }}</template>
```

```vue
<!-- 0.5 -->
<script setup lang="ts">
defineProps<{ theme?: string }>();
</script>

<template>{{ theme }}</template>
```

后代组件可以使用 `inject('tuvixProps')`，它返回同一个响应式对象。

- `VueSsrMicroAppConfig` 不再接受 `ssr`。`createSsrVueMicroApp` 会设置它。
- 对模块从未挂载过的容器调用 `unmount` 不做任何事。

## Svelte

- 没有 `ssr` 时，`createSvelteMicroApp` 会在渲染前清空容器。0.4 会把 Svelte 3/4 组件追加到已有标记之后。如需保留并水合服务端标记，请使用 `createSsrSvelteMicroApp`。
- 对模块从未挂载过、或挂载失败的容器调用 `unmount` 不做任何事。0.4 会清空它。现在四个适配器都是这种行为。
- 当 `svelte/server` 加载失败时，`renderSvelteToString` 不再回退到 `App.render`。传入 `render` 时，它使用 Svelte 5；否则当 `svelte` 导出 `mount` 时走 Svelte 5 路径，只在 Svelte 3/4 时调用 `App.render`。Svelte 5 的导入或渲染错误会直接抛给你。

Svelte 5 组件在 0.5 中可以使用；在 0.4 中，`createSvelteMicroApp` 遇到它们会失败。Svelte 5 的 `update()` 会重新挂载组件，除非你在配置中传入 `svelte/reactivity` 的 `SvelteMap`，这样会原地更新 props：

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### 新的配置结构

```ts no-check
// 0.4
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AppComponent, // 必填
  module: AppModule, // 仅当 AppComponent 声明在 NgModule 中时
});
```

`platform` 和 `compilerOptions` 已移除。请从入口中删除 `import '@angular/compiler'`；适配器会为 JIT 组件加载编译器。

### 默认 zoneless

除非你传入 `zone: true`，应用都在没有 zone.js 的情况下运行。在 Angular 15-17 上，DOM 事件不再触发变更检测；请在处理函数中调用 `ChangeDetectorRef.detectChanges()`，或在入口中导入 `zone.js` 并传入 `zone: true`。Angular 18+ 不依赖 zone.js 也会调度变更检测。参见 [Angular](/zh/guide/angular)。

### props 即 inputs

`update()` 不再写入 `window.__TUVIX_ANGULAR_PROPS__`。请改为声明 `@Input()` 属性，适配器会用 `setInput` 设置它们。

```ts no-check
// 0.4
ngOnInit() {
  this.userId = (window as any).__TUVIX_ANGULAR_PROPS__?.admin?.userId;
}
```

```ts
// 0.5
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-admin', standalone: true, template: '{{ userId }}' })
export class AdminComponent {
  @Input() userId = '';
}
```

### 其他 Angular 变更

- `createSsrAngularMicroApp` 不再添加 `provideClientHydration()`。它会重新渲染到服务端的宿主元素中。
- 对模块从未挂载过的容器调用 `unmount` 不做任何事。

## Sandbox

- `Sandbox({ css: false }).activate(container)` 返回 `null`，并且不附加 shadow root。`ISandbox.activate` 返回 `ShadowRoot | null`；调用 `addStyle` 之前请先检查 `null`。
- `JsSandbox` 严格模式在写入被阻止时会抛出 `TypeError`。0.4 会输出警告，但仍然保存该值。请把你的代码会写入的全局变量加到 `allowedGlobals` 中。

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Server

- 当至少有一个应用匹配路径，且所有片段请求都失败时，`createServerRenderer().render()` 返回 `statusCode: 502`。没有应用匹配或至少一个片段成功时，它仍然返回 200。`createMiddleware` 会发送这个状态码。流式渲染器始终发送 200。
- 渲染抛出错误时，`createMiddleware` 和 `createStreamingMiddleware` 会调用 `next(error)` 而不是 `next()`，这样 Express 会把请求交给你的错误处理器。

## 值得了解的非破坏性修复

- `require('@tuvix.js/core')` 和其他 CommonJS 入口点可以正常使用。在 0.4 中，有五个包的 `require` 指向构建从未生成的文件。
- `getGlobalBus()` 把实例保存在 `window` 上，因此分别打包的微应用共享同一个总线。
- 适配器和 `defineMicroApp` 会派发 `tuvix:mounted`、`tuvix:unmounted` 和 `tuvix:error`。参见[生命周期事件](/zh/guide/lifecycle-events)。
- 抛出错误的 `bootstrap()` 会在下次挂载时再次运行。0.4 之后会一直跳过它。
- 在 `start()` 之后调用 `register()`，如果当前路径会激活该应用，会立即挂载它；对 `mountWhenVisible` 应用则开始观察。
- 每次生命周期失败都会在总线上发出 `tuvix:app:error`，载荷为 `{ name, error, phase }`。0.4 只在加载和挂载失败时发出。
- `maxListeners` 对每个事件只用 `console.warn` 警告一次，无论是否开启 `debug`。
- `orchestrator.connectRouter()` 取代了 `setTimeout` + `reconcile()` 的桥接写法。参见[外部路由器](/zh/guide/external-router)。
