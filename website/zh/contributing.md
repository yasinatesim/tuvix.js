# 为 Tuvix.js 做贡献

感谢你有兴趣为本项目做贡献！无论是修复 Bug、添加新功能、改进文档还是翻译，我们欢迎所有贡献。

## 贡献方式

- **Bug 报告** - [创建 Issue](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **功能请求** - [发起讨论](https://github.com/yasinatesim/tuvix.js/discussions)
- **代码** - 修复 Bug、添加功能、改进测试
- **文档** - 修正错别字、添加示例、提升清晰度
- **翻译** - 添加或改进其他语言的文档

## 开始使用

### 1. Fork 和 Clone

```bash
git clone https://github.com/YOUR_USERNAME/tuvix.js.git
cd tuvix.js
```

### 2. 安装依赖

我们使用 [pnpm](https://pnpm.io) 和 [Node.js ≥ 18](https://nodejs.org)。

```bash
pnpm install
```

### 3. 构建所有包

```bash
pnpm build
```

### 4. 运行测试

```bash
pnpm test
```

### 5. 启动文档开发服务器

```bash
cd website
pnpm install
pnpm dev
```

在浏览器中打开 `http://localhost:5173` 预览文档。

## 项目结构

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core
│   ├── router/         @tuvix.js/router
│   ├── event-bus/      @tuvix.js/event-bus
│   ├── loader/         @tuvix.js/loader
│   ├── sandbox/        @tuvix.js/sandbox
│   ├── react/          @tuvix.js/react
│   ├── vue/            @tuvix.js/vue
│   ├── svelte/         @tuvix.js/svelte
│   ├── angular/        @tuvix.js/angular
│   ├── devtools/       @tuvix.js/devtools
│   ├── server/         @tuvix.js/server
│   ├── module-federation/
│   ├── create-tuvix-app/
│   └── tuvix/          tuvix.js umbrella
└── website/
    ├── .vitepress/     VitePress 配置和主题
    ├── guide/          英文文档
    ├── packages/       包 API 文档
    ├── tr/             土耳其语翻译
    ├── es/             西班牙语翻译
    └── ...             其他语言
```

## 代码风格

- **TypeScript** - 严格模式，所有代码必须有类型注解
- **Prettier** - 运行 `pnpm format` 来格式化
- **无运行时依赖** - 包必须零运行时依赖
- **命名导出** - 避免默认导出
- **错误信息** - 以 `[Tuvix ...]` 为前缀

## 提交信息

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Pull Request 流程

1. 从 `master` 创建分支：
   ```bash
   git checkout -b feat/my-feature
   ```

2. 进行更改并添加测试

3. 运行完整的测试套件：
   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. 如果你的更改影响了已发布的包，请添加 changeset：
   ```bash
   pnpm changeset
   ```

5. 推送并针对 `master` 创建 PR

6. 维护者将审查你的 PR。请在 7 天内回复反馈。

## 添加翻译

所有文档都是 `website/` 目录下的 Markdown 文件。每种语言都有自己的目录：

```
website/
├── index.md              ← 英文（根目录）
├── guide/                ← 英文指南
├── tr/                   ← 土耳其语
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← 西班牙语
└── ...
```

### 添加或改进翻译的步骤

1. 将英文文件从 `website/guide/` 复制到 `website/<lang>/guide/`
2. 翻译 Markdown 内容（保持代码块为英文）
3. 更新 `website/.vitepress/config/<lang>.ts` 中的侧边栏配置
4. 运行 `cd website && pnpm dev` 进行预览

::: tip 翻译提示
- 保持所有代码示例为英文
- 翻译界面标签、描述和说明文字
- 在有标准翻译的地方使用本地术语
:::

## 支持的语言

| 语言 | 代码 | 状态 |
|------|------|------|
| 英语 | `en` | 完成（参考） |
| 土耳其语 | `tr` | 进行中 |
| 西班牙语 | `es` | 进行中 |
| 德语 | `de` | 进行中 |
| 法语 | `fr` | 进行中 |
| 日语 | `ja` | 进行中 |
| 中文 | `zh` | 进行中 |
| 意大利语 | `it` | 进行中 |
| 葡萄牙语 | `pt` | 进行中 |
| 印地语 | `hi` | 进行中 |

如果你想为这些语言做贡献，请查看[开放的翻译 Issue](https://github.com/yasinatesim/tuvix.js/labels/translation) 或创建一个新的。

## 行为准则

本项目遵循 [Contributor Covenant](https://www.contributor-covenant.org/)。请保持尊重和建设性。

## 许可证

通过贡献，你同意你的贡献将在 MIT 许可证下进行许可。
