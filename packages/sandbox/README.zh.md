# @tuvix.js/sandbox

> 在重新挂载后仍然有效的 Shadow DOM CSS 隔离、样式表接管，以及用于脚本全局变量的 Proxy window

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。完整文档：[tuvix.js.org/zh/packages/sandbox](https://tuvix.js.org/zh/packages/sandbox)。

`CssSandbox` 把微应用的 DOM 移到一个 open shadow root 中，让它的 CSS 和页面的 CSS 互不影响。当你用 `sandbox: true` 注册应用时，`@tuvix.js/core` 中的编排器会使用它。`JsSandbox` 让通过它运行的代码中的 `window.x = ...` 写入不落到真实的 `window` 上。它是一个 Proxy，不是安全边界；不受信任的代码请使用 `<iframe sandbox>`。

## 安装

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## 快速开始

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container); // ShadowRoot, or null with css: false
sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox(options?)` 和 `Sandbox`

`createSandbox(options)` 返回 `new Sandbox(options)`，类型为 `ISandbox`。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` 把容器包进一个 shadow root。`false`：`activate` 返回 `null`，不挂载任何东西。 |
| `js` | `boolean` | `true` | `activate`/`deactivate` 切换 `js.active`。无论哪种情况，proxy 都会让写入不落到 `window` 上。 |
| `allowedGlobals` | `string[]` | `[]` | 严格模式下允许沙箱代码赋值的名称（仍然存储在 proxy 上）。 |
| `strict` | `boolean` | `false` | 对允许列表和 `allowedGlobals` 之外的全局变量进行写入或 `defineProperty` 时抛出 `TypeError`。 |

成员：`css`（`CssSandbox`）、`js`（`JsSandbox`）、`activate(container): ShadowRoot | null`、`deactivate(container)`、`destroy(container)`（先 deactivate，再清除已存储的全局变量）。

### `CssSandbox`

| 方法 | 行为 |
| --- | --- |
| `wrap(container)` | 把子节点移到一个 open shadow root 中。如果 `container.shadowRoot` 已存在（之前的 `wrap`、`unwrap` 或另一个实例），就复用它，移除 `unwrap` 留下的 slot，并按原顺序放回暂存的样式表。只有 `attachShadow` 失败时才抛错。 |
| `unwrap(container)` | 把子节点移回 light DOM，把 `<style>` 和 `<link rel="stylesheet">`（来自 `addStyle`、`adoptStyles` 或应用本身）从 DOM 中取出并保留到下次 `wrap`，同时留下一个 `<slot>` 让子节点继续渲染。对本实例没有 wrap 过的容器不做任何事。 |
| `addStyle(shadowRoot, css)` | 追加一个 `<style>` 并返回它。 |
| `removeStyle(shadowRoot, styleEl)` | 移除 `styleEl`。如果在 unwrap 状态下移除，下次 `wrap` 不会恢复它。 |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | 在 shadow root 开头、之前接管的样式之后，先插入 `<link>`，再插入 `<style>`。跳过已经接管的 URL，包括暂存的链接。返回 `{ elements, ready, remove }`。 |

每个链接触发 `load` 或 `error` 后，`ready` 就会 resolve，它从不 reject。jsdom 不会触发这两个事件，所以在 jsdom 测试中不要 await 它。`remove()` 只移除本次调用创建的元素；如果在 unwrap 状态下移除，下次 `wrap` 时它们不会回来。

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`。

| 成员 | 行为 |
| --- | --- |
| `proxyWindow` | 包装 `window` 的 Proxy。读取时先查沙箱存储，再查真实的 `window`（函数只绑定一次）。`window`、`self`、`globalThis`，以及不在 iframe 中时的 `top`/`parent`/`frames` 都返回 proxy。写入和 `Object.defineProperty` 进入存储；不带 `value` 的描述符会保留已存储的值。访问器描述符和不可配置的描述符会抛出 `TypeError`。 |
| `execScript(code)` | 在 `with (scope)` 中以非严格模式脚本运行 `code`。`window`、`self`、`globalThis` 和顶层 `this` 都是 proxy，自由标识符也通过它解析。`eval("...")` 在该作用域内仍然是直接 eval。 |
| `activate()`、`deactivate()`、`active` | 一个标志位。它不改变 proxy 的行为。 |
| `reset()` | 清除已存储的全局变量，把 `active` 设为 `false`。 |

对于允许列表之外的名称，无论是赋值、顶层 `var x = 1` 还是 `defineProperty`，严格模式都会抛出 `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.`，并且不存储任何内容，与是否激活无关。

### 类型

`SandboxOptions`、`ISandbox`、`ICssSandbox`、`IJsSandbox`、`AdoptStylesOptions`、`AdoptedStyles`。

## 边界情况

- 在 `execScript` 中，`x = 1`、`var x = 1`、`window.x = 1`、`window.window.x = 1`、`top.x = 1`，以及 `eval("...")` 中的同样语句，都把 `x` 存到 proxy 上，从不写到真实的 `window`。`let`/`const` 保持为局部变量。
- 在 `execScript` 中读取未声明的标识符会返回 `undefined`，不会抛错；`code` 中的 `"use strict"` 不起作用。
- 在 `f()` 这样的普通函数调用中，`this` 是真实的全局对象，这是非严格模式 JavaScript 的定义。在那里 `this.x = 1` 会写到真实的 `window`；请改写为 `window.x = 1`。
- `execScript` 使用 `new Function`；你的 CSP 需要 `'unsafe-eval'`。
- `JsSandbox`、`Sandbox` 和 `createSandbox()` 在构造函数中读取 `window`，在服务端会抛错。
- 容器处于 wrap 状态时添加的 light DOM 子节点不会渲染。请追加到 shadow root 中。

## 它不做什么

- 它不修改定时器、事件监听器、`document` 或 `<script>` 标签，也不清理应用留下的东西。
- 它不会给代码提供独立的源或全局对象。
- 它不阻止继承的样式（`color`、字体、自定义属性）进入 shadow root。

## 从 0.4 迁移

- `Sandbox({ css: false }).activate()` 返回 `null`，不挂载 shadow root。`ISandbox.activate` 返回 `ShadowRoot | null`。
- `strict: true` 在写入被阻止时抛错，不再只是警告。
- `execScript` 在 `with` 块中运行代码：不支持严格模式代码，读取未声明的变量返回 `undefined`，裸写的 `x = 1` 留在 proxy 上。
- `unwrap` 会把样式表保留到下次 `wrap`，不再删除它们。

## 许可证

MIT
