# 架构

## 概述

Tuvix.js 被构建为一个由小型、可组合包组成的 monorepo。你只需导入你使用的部分。

```
@tuvix.js/core          ← Orchestrator、生命周期、注册
@tuvix.js/router        ← 基于 URL 的路由
@tuvix.js/event-bus     ← 应用间发布/订阅
@tuvix.js/loader        ← 动态包加载
@tuvix.js/sandbox       ← CSS + JS 隔离
@tuvix.js/react         ← React 绑定
@tuvix.js/vue           ← Vue 绑定
@tuvix.js/svelte        ← Svelte 绑定
@tuvix.js/angular       ← Angular 绑定
@tuvix.js/devtools      ← 调试面板
@tuvix.js/server        ← SSR 组合
@tuvix.js/module-federation  ← Webpack 5 集成
create-tuvix-app        ← CLI 脚手架
tuvix.js                ← 统一包（全部合一）
```

## 请求流程

```
URL 变更
    │
    ▼
@tuvix.js/router         ← 将路径匹配到微应用名称
    │
    ▼
@tuvix.js/core           ← Orchestrator 决定挂载/卸载
    │
    ▼
@tuvix.js/loader         ← 获取并执行微应用包
    │
    ▼
@tuvix.js/sandbox        ← 在隔离作用域中包装应用（可选）
    │
    ▼
Micro App .mount()       ← 应用渲染到其容器元素
```

## 生命周期

每个微应用必须实现 `MicroApp` 接口：

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Orchestrator 在适当的时候调用这些钩子：

1. **`mount`** - 当应用的路由激活时调用
2. **`unmount`** - 当导航离开应用的路由时调用
3. **`update`** - 当 props 改变而无需完全重新挂载时调用

## 隔离模型

### CSS 隔离（Shadow DOM）

当 `sandbox.css = true` 时，微应用容器成为 Shadow DOM 宿主。内部定义的样式不会泄漏到外部，全局样式也不会渗入内部。

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### JS 隔离（Proxy Scope）

当 `sandbox.js = true` 时，微应用的全局作用域被包装在 `Proxy` 中。对 `window.localStorage`、`window.addEventListener` 等的访问会被拦截，并在卸载时清理。

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

Event Bus 是所有微应用共享的解耦发布/订阅通道：

```ts
// 发布者（任意微应用）
import { getGlobalBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// 订阅者（另一个微应用）
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

事件是类型化的 - TypeScript 会强制执行事件载荷的形状。
