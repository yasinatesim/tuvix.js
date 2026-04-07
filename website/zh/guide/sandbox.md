# 沙箱

`@tuvix.js/sandbox` 提供 CSS 和 JavaScript 隔离，防止微应用之间或与 shell 之间的干扰。

## CSS 隔离（Shadow DOM）

当 CSS 沙箱启用时，微应用的容器升级为 Shadow DOM 宿主。内部定义的样式仅限于该 shadow root - 不会泄漏到 shell 或其他微应用。

### 按应用启用

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### 工作原理

```
Shell DOM
├── #app (orchestrator 容器)
│   ├── Shadow Root (my-app)  ← 样式限定在此
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
Shadow DOM CSS 隔离在所有现代浏览器中完全支持。对于旧版浏览器支持，请仅考虑 `js` 隔离模式。
:::

## JS 隔离（Proxy Scope）

当 JS 沙箱启用时，微应用的全局作用域被包装在 `Proxy` 中。对 `window.*`、事件监听器、定时器和超时的访问会被拦截，并在 `unmount` 时自动清理。

### 按应用启用

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### 什么被拦截

| 访问 | 是否拦截？ | 卸载时是否清理？ |
|------|----------|----------------|
| `window.someGlobal = x` | ✅ | ✅ |
| `addEventListener(...)` | ✅ | ✅ |
| `setTimeout(...)` | ✅ | ✅ |
| `setInterval(...)` | ✅ | ✅ |
| `localStorage` | ✅ | 可选 |
| `sessionStorage` | ✅ | 可选 |

## 同时使用两者

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,   // Shadow DOM 隔离
    js: true,    // Proxy 作用域隔离
  },
});
```

## 自定义沙箱

你也可以直接使用 `@tuvix.js/sandbox`：

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// 激活隔离
const shadowRoot = sandbox.activate(rootElement);

// ... 应用在隔离中运行 ...

// 完成后停用
sandbox.deactivate(rootElement);
```
