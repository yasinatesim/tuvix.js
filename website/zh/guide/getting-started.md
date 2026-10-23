# 快速上手

本页构建一个包含两个微应用的 shell（宿主应用）：一个首页和一个仪表盘。你将注册这些应用，让路由器挂载它们，并向已挂载的应用推送新的 props。

## 安装

安装聚合包。它包含编排器、路由器、加载器、事件总线和沙箱：

```bash
pnpm add tuvix.js
```

为微应用使用的每个框架添加一个适配器：

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## 搭建项目脚手架

`create-tuvix-app` 会生成一个依赖 0.5 版本包的 shell 项目或微应用项目：

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

模板：`shell`、`react-app`、`vue-app`、`svelte-app`、`angular-app`、`vanilla-app`。传入 `--example <name>` 则会复制仓库中的某个示例。

## 构建 shell

shell 掌管页面布局，并决定哪个应用放在哪里。给它一个容器元素：

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

然后创建编排器，注册应用并启动它：

```ts
// src/main.ts
import { createOrchestrator, interceptLinks, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  // 单独的 '/' 会匹配所有路径；`end: true` 让它精确匹配。
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
});

// 把 <a href> 点击转换为路由器导航，而不是页面加载。
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

发生了什么：

1. `start()` 读取当前路径，并挂载所有 `activeWhen` 匹配的应用。
2. 点击 `<a href="/dashboard">` 会调用 `navigateTo('/dashboard')`。路由器推入 URL，编排器先卸载 `home`，再挂载 `dashboard`。
3. `dashboard` 首次挂载时会加载它的脚本和样式表。之后的挂载会复用已加载的模块。

路由器本身从不拦截点击。没有 `interceptLinks` 时，点击链接会重新加载页面，编排器会在新的页面加载中挂载正确的应用。

## 编写微应用

微应用是一个带有 `mount` 和 `unmount` 的对象。`defineMicroApp` 会检查其结构，并以其名称注册该模块，这样脚本运行后加载器就能找到它：

```ts
// apps/home.ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Welcome, ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },

  update({ props, container }) {
    const title = container?.querySelector('h1');
    if (title) title.textContent = `Welcome, ${String(props.user ?? 'Guest')}`;
  },

  unmount({ container }) {
    container.replaceChildren();
  },
});
```

传给 `defineMicroApp` 的 `name` 必须与你在 shell 中注册的名称相同。加载器按这个名称查找模块。

## 使用框架适配器

适配器从根组件创建同样的模块。它们会注册该模块，为每个容器保留一个框架实例，并派发生命周期事件。

```tsx
// dashboard/src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Dashboard for {user}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

```ts
// settings/src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Settings from './Settings.vue';

export default createVueMicroApp({ name: 'settings', App: Settings });
```

框架页面：[React](/zh/guide/react)、[Vue](/zh/guide/vue)、[Svelte](/zh/guide/svelte)、[Angular](/zh/guide/angular)。

将每个微应用构建为 ES 模块 bundle 并上传。Vite 库模式构建即可：

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

Vite 的 ES 输出以 `.js` 结尾，除非入口声明了 `type: 'module'`，否则加载器会把它当作经典脚本。如上所示，在 shell 的入口中保留 `type: 'module'`。

## 在运行时更新 props

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` 会把新的 props 合并到已注册的 props 中。如果应用已挂载并且有 `update`，编排器会用合并后的 props 调用它，应用原地重新渲染。如果应用未挂载，编排器会保存这些 props，留给下一次挂载使用。

## shell 不做什么

- 它不渲染你的布局。容器由 shell 自己的 HTML 提供。
- 它不在应用之间共享框架实例。两个 React 应用会得到两个 React root。
- 它不对 JavaScript 进行沙箱隔离。每个应用都运行在页面的 `window` 中。

## 下一步

- [架构](/zh/guide/architecture)：从导航到 `mount` 的路径。
- [路由](/zh/guide/routing)：`activeWhen` 模式、内置路由器、守卫。
- [外部路由器](/zh/guide/external-router)：跟随 TanStack Router 或 React Router。
- [SSR Islands](/zh/guide/ssr-islands)：在 React 页面中服务端渲染微应用。
