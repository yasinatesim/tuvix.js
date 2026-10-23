---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="为 Tuvix.js shell 或 React、Vue、Svelte、Angular、原生（vanilla）微应用生成 Vite 项目脚手架并安装依赖的 CLI。"
  icon="🚀"
  npm="true"
  github="cli"
/>

## 用法

包名以 `create-` 开头，因此每个包管理器的 `create` 命令都能找到它，`npx` 则运行它的 `create-tuvix-app` 可执行文件：

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create` 只转发 `--` 之后的参数。其他命令会直接透传参数：

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

这个可执行文件需要 Node.js。它会在当前目录下新建一个文件夹并写入文件。

## 何时使用

用它从零开始创建一个 Tuvix.js 组成部分：一个注册微应用的 shell（宿主应用），或者一个使用指定框架的微应用。每次运行都会创建一个 Vite 项目，其中包含版本为 `^0.5.0` 的 `tuvix.js` 和对应的 `@tuvix.js/*` 适配器。

如果你要把 Tuvix.js 加入一个已有的应用，请选择其他方式。用你的包管理器安装适配器，然后按照[指南](/zh/guide/getting-started)操作。如果你想阅读或复制一个可运行的多应用配置，请使用 `--example`（见[示例](#examples)）。

## 快速开始

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

CLI 会写入六个文件，在 `checkout/` 中运行 `pnpm install`，并打印下一步操作：

```text
checkout/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    └── main.tsx
```

`src/main.tsx` 导出 shell 要加载的微应用模块：

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

把 `my-react-app` 改成你的 shell 注册时使用的名称。CLI 不会把你的项目名填到这里。

## 选项

```text
create-tuvix-app [project-name] [options]
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `project-name` | 位置参数 | 提示输入 | 文件夹名称和 `package.json` 的名称。第一个不以 `-` 开头的参数设置它；后面出现的同类参数会替换它。 |
| `--template`, `-t` | `string` | 提示输入 | `shell`、`react-app`、`vue-app`、`svelte-app`、`angular-app`、`vanilla-app` 之一。 |
| `--typescript` | 标志 | 提示输入（默认选中 `Yes`） | 生成 TypeScript 文件和 `tsconfig.json`。 |
| `--no-typescript` | 标志 | 提示输入 | 生成 JavaScript 文件。`angular-app` 会忽略它。 |
| `--example`, `-e` | `string` | 无 | 从 GitHub 仓库的 `examples/` 下载一个文件夹，代替模板。跳过提示和安装步骤。 |
| `--help`, `-h` | 标志 | `false` | 打印用法并退出。 |
| `--version`, `-v` | 标志 | `false` | 打印 `create-tuvix-app v<version>` 并退出。CLI 从它自己的 `package.json` 读取版本号。 |

对于你没有提供的每个值，CLI 会通过交互式提示询问，顺序为：项目名称（占位文本为 `my-app`，不接受空输入）、模板、TypeScript。三者都传入时可以无提示运行：

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

CLI 会忽略它不认识的参数。

## 模板

每个模板都会写入 `index.html`、`package.json` 和 `src/main.<ext>`。生成的 `package.json` 为 `private`，带有 `"type": "module"`，版本为 `0.1.0`，并包含三个脚本：`dev`（`vite`）、`build`（`vite build`）和 `preview`（`vite preview`）。TypeScript 模式下的 `svelte-app` 会添加第四个脚本 `check`。每个 `package.json` 都列出 `tuvix.js@^0.5.0` 和 `vite@^6.0.0`，在 TypeScript 模式下还会列出 `typescript@^5.7.0`。

| 模板 | 除 `index.html` 和 `package.json` 外的文件 | 额外依赖 |
| --- | --- | --- |
| `shell` | `src/main.ts` | 无 |
| `react-app` | `src/main.tsx`、`src/App.tsx`、`vite.config.ts` | `react`、`react-dom` `^19.0.0`、`@tuvix.js/react`、`@vitejs/plugin-react@^4.3.0`；TS 模式下还有 `@types/react`、`@types/react-dom` |
| `vue-app` | `src/main.ts`、`src/App.vue`、`vite.config.ts`；TS 模式下还有 `src/vite-env.d.ts` | `vue@^3.5.0`、`@tuvix.js/vue`、`@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`、`src/App.svelte`、`vite.config.ts`、`svelte.config.js`；TS 模式下还有 `src/vite-env.d.ts` | `svelte@^5.0.0`、`@tuvix.js/svelte`、`@sveltejs/vite-plugin-svelte@^5.0.0`；TS 模式下还有 `svelte-check@^4.0.0` |
| `angular-app` | `src/main.ts`、`src/app/app.component.ts`、`vite.config.ts` | `@angular/common`、`@angular/compiler`、`@angular/core`、`@angular/platform-browser` `^20.0.0`、`rxjs@^7.8.0`、`tslib@^2.6.0`、`@tuvix.js/angular`、`typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | 无 |

TypeScript 模式会添加 `tsconfig.json`（`ES2020`、`ESNext` 模块、`bundler` 解析、`strict`）。对于 `react-app`、`vue-app` 和 `svelte-app`，它会把 `src` 旁边的 `vite.config.ts` 也包含进来。JavaScript 模式使用 `.js` 和 `.jsx`，不写入 `tsconfig.json`；`vite.config.ts` 仍然是 TypeScript，Vite 在两种模式下都能加载它。所有 `@tuvix.js/*` 包的版本都是 `^0.5.0`。

### `shell`

一个带 history 路由器的编排器。`index.html` 包含一个 `#header`、一个带有指向 `/dashboard` 和 `/settings` 链接的 `<nav>`，以及一个 `<main id="main">`。`src/main.ts`：

```ts [src/main.ts]
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
```

把 `entry` 的 URL 替换为你的 dashboard 应用构建后的入口，并自己注册 `settings`。模板只注册了 `dashboard`。

### `react-app`

来自 `@tuvix.js/react` 的 `createReactMicroApp({ name: 'my-react-app', App })`。`App` 渲染一个标题，并以 JSON 形式显示它收到的 props。`vite.config.ts` 添加了 `@vitejs/plugin-react`，它用自动运行时（automatic runtime）编译 JSX，因此在 JavaScript 模式下 `App.jsx` 不需要导入 `React`。TS 模式的 `tsconfig.json` 设置了 `"jsx": "react-jsx"`。

### `vue-app`

来自 `@tuvix.js/vue` 的 `createVueMicroApp({ name: 'my-vue-app', App })`，`vite.config.ts` 添加了 `@vitejs/plugin-vue`。`App.vue` 是一个 `<script setup>` 组件，它用 `inject` 读取 shell 传入的 props：

```vue [src/App.vue]
<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
</script>
```

在 TS 模式下，`src/vite-env.d.ts` 引用 `vite/client` 并声明 `*.vue` 模块，因此 `tsc` 能接受 `App` 的导入。

### `svelte-app`

一个 Svelte 5 微应用。`src/main.ts` 传入来自 `svelte/reactivity` 的 `SvelteMap`，因此 `update({ props })` 会就地重新渲染，而不是重新挂载：

```ts [src/main.ts]
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
```

`App.svelte` 用 `$props()` 读取它的 `name` prop。`vite.config.ts` 添加了 Svelte 插件，`svelte.config.js` 设置了 `preprocess: vitePreprocess()`，让 `<script lang="ts">` 能够编译。在 TS 模式下，`src/vite-env.d.ts` 引用 `svelte` 和 `vite/client` 类型，`package.json` 会得到一个 `check` 脚本（`svelte-check --tsconfig ./tsconfig.json`）。

### `angular-app`

不带 zone.js 的 Angular 20。这个模板始终使用 TypeScript，即使传入 `--no-typescript` 也是如此；如果你在提示中选择了 JavaScript，它会打印 `Angular requires TypeScript. Switching to TypeScript automatically.`。

```ts [src/main.ts]
// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
```

`AppComponent` 是一个带内联模板的独立组件。容器为空时，`createSsrAngularMicroApp` 会全新渲染它；容器中有来自 `renderAngularToString` 的 HTML 时，它会在这些标记之上渲染。适配器以 zoneless 方式运行。Vite 不对 Angular 做 AOT 编译，因此组件在浏览器中编译：请让 `import '@angular/compiler'` 保持为 `src/main.ts` 的第一行，并把编译器保留为运行时依赖。`tsconfig.json` 的目标为 `ES2022`，开启 `experimentalDecorators`，关闭 `useDefineForClassFields`；`vite.config.ts` 把 esbuild 的 target 设为 `es2022`。

### `vanilla-app`

来自 `tuvix.js` 的 `defineMicroApp`，其中 `mount` 向 `container.innerHTML` 写入一个标题，`unmount` 清空它。

## 示例 {#examples}

`--example <name>` 会下载 `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master`，并把 `examples/<name>/` 解压到你的项目文件夹。提示、`--template`、`--typescript` 和安装步骤都会被跳过。CLI 会打印 `<pm> install` 和 `<pm> run dev` 作为下一步操作。

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

没有项目名称时，文件夹名为 `my-app`。名称只能包含字母、数字和连字符。`examples/` 中有以下文件夹：

| 示例 | 展示内容 |
| --- | --- |
| `with-react` | shell 中的 React 微应用 |
| `with-vue` | shell 中的 Vue 微应用 |
| `with-svelte` | shell 中的 Svelte 微应用 |
| `with-angular` | shell 中的 Angular 微应用 |
| `with-vanilla` | 不使用框架的微应用 |
| `with-multiple-frameworks` | 同一页面上的 React 和 Vue 微应用 |
| `with-react-router` | 配合 React 应用使用 `@tuvix.js/router` |
| `with-react-event-bus` | 应用之间通过 `@tuvix.js/event-bus` 通信 |
| `with-react-sandbox` | 用 `@tuvix.js/sandbox` 实现 CSS 隔离 |
| `with-react-devtools` | [`@tuvix.js/devtools`](/zh/packages/devtools) 浮层 |
| `with-module-federation-react` | 配合 React remote 使用 `@tuvix.js/module-federation` |
| `with-ssr-react` | 用 `@tuvix.js/server` 组合 React 片段 |
| `with-ssr-vanilla` | 用 `@tuvix.js/server` 组合纯 HTML 片段 |
| `with-ssr-islands` | 用 [`@tuvix.js/vite`](/zh/packages/vite) 实现多个框架的服务端渲染 island |

这些示例位于 monorepo 中，因此它们的 `package.json` 依赖 `workspace:*`。在运行安装命令之前，把每个 `workspace:*` 和 `workspace:^` 替换为 `^0.5.0`，否则包管理器会因不支持的协议报错并停止。

## 包管理器检测

CLI 根据你启动它的方式，选择安装步骤使用的包管理器和打印出的命令。它按以下顺序检查：

1. 设置了 `process.versions.bun`：使用 `bun`。
2. `npm_execpath` 包含 `pnpm` 或 `yarn`：使用对应的包管理器。
3. `npm_config_user_agent` 以 `pnpm`、`yarn` 或 `bun/` 开头：使用对应的包管理器。
4. 其他情况：使用 `npm`。

`pnpm create tuvix-app` 和 `pnpm dlx create-tuvix-app` 用 pnpm 安装，`yarn create` 用 yarn，`npx` 和 `npm create` 用 npm。没有参数可以覆盖这个选择。

## 安装步骤

模板运行完成后，CLI 会在新文件夹中运行 `<pm> install`，并显示一个加载指示器（`Installing dependencies with <pm>`）。它会隐藏包管理器的输出。

- 退出码为 0：加载指示器以 `Dependencies installed` 结束，CLI 打印 `cd <name>` 和 `<pm> run dev`。
- 退出码非 0，或找不到可执行文件：加载指示器以 `Install failed. Run manually:` 结束，后面跟着 `cd <absolute path>` 和 `<pm> install`。项目文件会保留，CLI 仍以退出码 0 退出。

`--example` 运行从不执行安装。

## 边界情况

- 文件夹已存在时，运行会以 `Directory "<name>" already exists.` 和退出码 1 停止。CLI 从不向已有文件夹写入，也不与之合并。
- 如果名称解析后的路径不以当前目录开头，例如 `../app`，运行会以 `Project directory must be within the current working directory.` 停止。
- 未知的 `--template` 值会在提示结束后以 `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app` 失败。
- `--template` 或 `--example` 作为最后一个参数且没有值时，视为未提供：你会看到模板提示，或者进行一次普通的模板运行。
- CLI 会把你写的项目名称原样用作文件夹名和 `package.json` 的 `name`。它不检查 npm 命名规则，因此 `My App` 会得到一个无效的包名。
- 取消提示（Ctrl+C）会打印 `Operation cancelled.` 并以退出码 0 退出。
- 如果示例名称在 `master` 上不存在，会留下一个空文件夹，并以 `Example "<name>" was not found or failed to extract.` 失败。重试之前请删除该文件夹。
- CLI 为了一个示例会下载整个仓库的 tarball。网络较慢时 `--example` 也会较慢。

## 它不做什么

- 微应用模板不会自行挂载。`src/main` 导出模块，`index.html` 中没有任何代码调用 `mount`，因此在 shell 加载该入口之前，`pnpm run dev` 只显示一个空的 `#app`。
- 没有 library 模式的 Vite 配置。`vite build` 产出带哈希文件名的普通应用构建，由你选择 shell 加载的入口。
- 没有 monorepo、workspace 或多应用配置。每个应用运行一次 CLI，或者从 `--example` 开始。
- 不执行 git init，不配置 linter、测试运行器或 CSS。
- 没有 `--no-install` 参数，也没有指定包管理器的参数。
- 没有编程式 API。导入这个包会直接运行 CLI。
