---
layout: home

# Every visible string on the home page comes from this frontmatter, so a
# locale only needs a translated copy of this file. Field reference:
# website/.vitepress/theme/components/home/model.ts

# The Orbit sections replace the markdown body on this page, so the body
# stays empty. Keep the flag: without it OrbitHome renders an empty, bordered
# content block above the footer.
markdownContent: false

hero:
  name: Tuvix.js
  title: 多个应用。
  accent: 统一体验。
  tagline: Tuvix.js 把 React、Vue、Svelte、Angular 和原生 JS 微应用挂载到同一个宿主页面。路由、事件总线、沙箱和服务端渲染都是独立的包，需要时再添加。
  image:
    src: /logo.svg
    alt: Tuvix.js 标志
  actions:
    - theme: brand
      text: 快速上手
      link: /zh/guide/getting-started
    - theme: alt
      text: 试用 Playground
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: 复制命令
    copiedLabel: 已复制

showcase:
  file: src/orchestrator.ts
  copyLabel: 复制
  copiedLabel: 已复制
  shellTitle: 宿主 shell
  routeLabel: URL
  mountedLabel: 已挂载
  busLabel: 共享事件总线

featuresSection:
  title: Tuvix.js 包含什么
  lead: 八个构建模块。安装 tuvix.js 聚合包即可获得其中五个核心模块，也可以随着 shell 的增长逐个添加单独的包。

features:
  - icon: layers
    title: 框架无关
    details: 在同一个 shell 中并排运行 React、Vue、Svelte、Angular 和原生 JS 微应用。
    link: /zh/guide/micro-apps
    linkText: 微应用指南
  - icon: box
    title: 没有第三方运行时依赖
    details: 每个包只依赖其他 @tuvix.js 包。你只需安装自己导入的包。
    link: /zh/packages/
    linkText: 所有包
  - icon: route
    title: 内置路由
    details: 路由器随 URL 变化挂载和卸载应用，支持 history 和 hash 模式。
    link: /zh/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: 事件总线
    details: 应用之间发布和订阅带类型的事件，无需共享全局变量。
    link: /zh/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: CSS 与 JS 沙箱
    details: Shadow DOM 把每个应用的样式限制在它的容器内。JsSandbox 让脚本在一个可随时丢弃的 Proxy window 上运行。
    link: /zh/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: 动态加载
    details: 加载器按需获取应用 bundle，缓存它们，并重试失败的加载。
    link: /zh/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: 页面内面板列出已注册的应用、当前路由和事件总线的消息流。
    link: /zh/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: 服务端渲染
    details: 在服务端渲染微应用，并把它们的 HTML 拼接进 shell 模板，可输出字符串或流。
    link: /zh/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  title: 选择你的框架
  lead: 每个适配器把一个组件变成微应用，编排器可以挂载、更新和卸载它。
  copyLabel: 复制安装命令
  copiedLabel: 已复制
  items:
    - name: React
      icon: react
      details: createReactMicroApp 包装一个组件。useTuvixProps 和 useTuvixBus 读取 props 和事件。
      install: npm i @tuvix.js/react
      link: /zh/guide/react
    - name: Vue
      icon: vue
      details: createVueMicroApp 挂载一个 Vue 3 应用，并提供读取 props 和事件总线的 composable。
      install: npm i @tuvix.js/vue
      link: /zh/guide/vue
    - name: Svelte
      icon: svelte
      details: createSvelteMicroApp 挂载 Svelte 3、4 和 5 组件。
      install: npm i @tuvix.js/svelte
      link: /zh/guide/svelte
    - name: Angular
      icon: angular
      details: createAngularMicroApp 把 Angular 15+ 组件初始化到它的容器中。
      install: npm i @tuvix.js/angular
      link: /zh/guide/angular
    - name: Vanilla JS
      icon: javascript
      details: defineMicroApp 为原生 JavaScript 提供 mount、unmount 和 update 钩子。
      install: npm i @tuvix.js/core
      link: /zh/guide/micro-apps

packages:
  title: 15 个包，各自独立发版
  lead: 从聚合包开始。想要更小的安装体积时，再换成单独的包。
  items:
    - name: tuvix.js
      details: 聚合包，包含 core、router、event bus、loader 和 sandbox。
      link: /zh/packages/tuvix
    - name: '@tuvix.js/core'
      details: 编排器。注册微应用并运行它们的生命周期。
      link: /zh/packages/core
    - name: '@tuvix.js/router'
      details: 按 URL 激活微应用，支持 history 和 hash 模式。
      link: /zh/packages/router
    - name: '@tuvix.js/event-bus'
      details: 微应用之间带类型的发布/订阅。
      link: /zh/packages/event-bus
    - name: '@tuvix.js/loader'
      details: 按需加载应用 bundle，支持缓存和重试。
      link: /zh/packages/loader
    - name: '@tuvix.js/sandbox'
      details: 通过 Shadow DOM 隔离 CSS，通过 Proxy 隔离 JS。
      link: /zh/packages/sandbox
    - name: '@tuvix.js/server'
      details: 宿主页面的服务端组合与流式输出。
      link: /zh/packages/server
    - name: '@tuvix.js/module-federation'
      details: 从 Webpack Module Federation remote 加载微应用。
      link: /zh/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: 页面内调试面板，查看应用、路由和事件。
      link: /zh/packages/devtools
    - name: '@tuvix.js/react'
      details: React 适配器、hooks 和服务端渲染辅助函数。
      link: /zh/packages/react
    - name: '@tuvix.js/vue'
      details: Vue 3 适配器、composable 和服务端渲染辅助函数。
      link: /zh/packages/vue
    - name: '@tuvix.js/svelte'
      details: 支持服务端渲染的 Svelte 适配器。
      link: /zh/packages/svelte
    - name: '@tuvix.js/angular'
      details: 支持服务端渲染的 Angular 适配器。
      link: /zh/packages/angular
    - name: '@tuvix.js/vite'
      details: Vite 插件，把 island 的 CSS 和 modulepreload 链接写入 SSR 的 head，让服务端渲染的微应用在首次绘制时就带有样式。
      link: /zh/packages/vite
    - name: create-tuvix-app
      details: 通过命令行搭建新的宿主和微应用项目。
      link: /zh/packages/create-tuvix-app

footer:
  tagline: 面向 React、Vue、Svelte、Angular 和原生 JS 的微前端编排器。
  columns:
    - title: 文档
      links:
        - text: 快速上手
          link: /zh/guide/getting-started
        - text: 架构
          link: /zh/guide/architecture
        - text: 配置
          link: /zh/guide/configuration
        - text: Playground
          link: /playground
    - title: 包
      links:
        - text: Core
          link: /zh/packages/core
        - text: Router
          link: /zh/packages/router
        - text: 事件总线
          link: /zh/packages/event-bus
        - text: 所有包
          link: /zh/packages/
    - title: 项目
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: 版本发布
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: 贡献
          link: /zh/contributing
  copyright: MIT 许可证 · © 2026 Yasin ATEŞ
---
