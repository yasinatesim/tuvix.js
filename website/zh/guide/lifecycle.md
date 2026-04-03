# 生命周期钩子

## 概述

Tuvix.js 中的每个微应用都遵循可预测的生命周期。Orchestrator 在适当的时候调用生命周期钩子。

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

当微应用的路由激活时（或手动激活时）调用。

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**参数：**
- `container` - 用于渲染的根 DOM 元素
- `props` - 来自 shell 的可选键值对 props

**示例：**
```ts
async mount(container, props) {
  // 设置你的应用
  const root = document.createElement('div');
  container.appendChild(root);

  // 将框架渲染到 root
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

当导航离开微应用的路由时（或手动停用时）调用。

```ts
async unmount(container: HTMLElement): Promise<void>
```

这是你应该**清理**的地方 - 取消事件订阅、销毁框架实例、移除 DOM 节点。

**示例：**
```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
始终在 `unmount` 中清理。未销毁框架实例导致的内存泄漏是微前端应用中最常见的 bug。
:::

## update

当 shell 向已挂载的微应用传递新 props 时调用。**可选。**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

如果未实现，orchestrator 将调用 `unmount` → `mount` 来更新 props。

**示例：**
```ts
async update(container, props) {
  // 无需完全重新挂载即可高效更新
  this._root?.render(<App {...props} />);
}
```

## Orchestrator 级别的钩子

Shell 也可以全局监听生命周期事件：

```ts
const orchestrator = createOrchestrator({
  container: '#app',

  onBeforeMount(app) {
    console.log(`Mounting: ${app.name}`);
  },

  onAfterMount(app) {
    console.log(`Mounted: ${app.name}`);
    analytics.track('micro_app_mounted', { app: app.name });
  },

  onError(error, app) {
    console.error(`Error in ${app.name}:`, error);
    // 显示后备 UI
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```
