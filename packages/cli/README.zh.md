# create-tuvix-app

> 为 Tuvix.js shell 或 React、Vue、Svelte、Angular、vanilla 微应用创建 Vite 项目脚手架

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。

## 用法

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create 只转发 -- 之后的参数
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

CLI 会询问你没有提供的每个值（项目名、模板、TypeScript），把文件写入 `./<project-name>`，然后安装依赖。

## 快速开始

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## 选项

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `project-name` | 位置参数 | 询问 | 文件夹名和 `package.json` 名称 |
| `--template`, `-t` | `string` | 询问 | `shell`、`react-app`、`vue-app`、`svelte-app`、`angular-app` 或 `vanilla-app` |
| `--typescript` / `--no-typescript` | 标志 | 询问（预选 `Yes`） | TypeScript 文件加 `tsconfig.json`，或 JavaScript。`angular-app` 始终是 TypeScript。 |
| `--example`, `-e` | `string` | 无 | 从 GitHub 仓库（`master`）下载 `examples/<name>`。跳过询问和安装。 |
| `--help`, `-h` | 标志 | `false` | 打印用法 |
| `--version`, `-v` | 标志 | `false` | 打印 `create-tuvix-app v<version>`，版本号读取自 CLI 的 `package.json` |

## 模板

每个项目都会得到 `index.html`、`src/main.<ext>`，以及一个 `package.json`，其中包含 `dev`/`build`/`preview` Vite 脚本、`tuvix.js@^0.5.0` 和 `vite@^6.0.0`（TS 模式下还有 `typescript@^5.7.0`）。

| 模板 | 生成内容 | 额外依赖 |
| --- | --- | --- |
| `shell` | 带 history 路由器（`/dashboard/*`、`/settings/*`）的 `createOrchestrator`，以及一个指向占位 CDN URL 的已注册 `dashboard` 应用 | 无 |
| `react-app` | `createReactMicroApp({ name, App })`、`App.tsx`，以及带 `@vitejs/plugin-react` 的 `vite.config.ts` | `react`、`react-dom` `^19`、`@tuvix.js/react`、`@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`、通过 `inject(TUVIX_PROPS_KEY)` 读取 props 的 `App.vue`、带 `@vitejs/plugin-vue` 的 `vite.config.ts`，TS 模式下还有声明 `*.vue` 模块的 `src/vite-env.d.ts` | `vue@^3.5`、`@tuvix.js/vue`、`@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `createSvelteMicroApp({ name, App, SvelteMap })`，其中 `SvelteMap` 来自 `svelte/reactivity`，因此 `update()` 会原地重新渲染。读取 `$props()` 的 Svelte 5 `App.svelte`、`vite.config.ts`、使用 `vitePreprocess()` 的 `svelte.config.js`，TS 模式下还有 `src/vite-env.d.ts` 和一个 `check` 脚本 | `svelte@^5`、`@tuvix.js/svelte`、`@sveltejs/vite-plugin-svelte@^5`、`svelte-check@^4`（TS 模式） |
| `angular-app` | `createSsrAngularMicroApp({ name, component })`，带一个独立的 `AppComponent`，zoneless Angular 20。`src/main.ts` 最先导入 `@angular/compiler`，让 JIT 组件可以编译。 | `@angular/{common,compiler,core,platform-browser}@^20`、`rxjs`、`tslib`、`@tuvix.js/angular` |
| `vanilla-app` | `defineMicroApp`，其 `mount`/`unmount` 写入 `innerHTML` | 无 |

## 包管理器和安装

CLI 在 Bun 上运行时选择 `bun`，然后检查 `npm_execpath` 中的 `pnpm`/`yarn`，再检查 `npm_config_user_agent` 中的 `pnpm`/`yarn`/`bun/`，最后回退到 `npm`。使用模板创建后，它会运行 `<pm> install` 并隐藏输出。安装失败时，它会打印 `Install failed. Run manually:` 和相应命令，退出码仍为 0。

## 边界情况

- 目标文件夹已存在时失败，提示 `Directory "<name>" already exists.`（退出码 1）。
- 解析到当前目录之外的名称（例如 `../app`）会失败。
- 未知的 `--template` 会失败，并列出可用模板。
- 项目名按原样使用，不检查 npm 命名规则。
- 示例依赖 `workspace:*`。安装前请把它们替换为 `^0.5.0`。
- 示例不存在时会留下一个空文件夹；重试前请删除它。

## 它不做什么

- 微应用模板导出一个模块但从不挂载它，因此在 shell 加载它之前，`pnpm run dev` 只显示一个空的 `#app`。
- 没有库模式构建配置、git init、linter、测试或 monorepo 配置。
- 没有 `--no-install` 或包管理器参数，也没有编程式 API。

完整文档：[tuvix.js.org/zh/packages/create-tuvix-app](https://tuvix.js.org/zh/packages/create-tuvix-app)

## 许可证

MIT
