# 沙箱隔离

`@tuvix.js/sandbox` 提供两个工具。`CssSandbox` 把应用放进 shadow root，使它的 CSS 与页面的 CSS 互不影响。`JsSandbox` 让代码在一个代理 `window` 上运行，使它对全局变量的写入落在代理上。编排器对注册时带 `sandbox: true` 的应用使用 `CssSandbox`；它从不使用 `JsSandbox`。

## 按应用隔离 CSS

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'widget',
  entry: {
    scripts: ['https://cdn.example.com/widget/main.js'],
    styles: ['https://cdn.example.com/widget/main.css'],
    type: 'module',
  },
  container: '#widget',
  activeWhen: '/',
  sandbox: true, // 等同于 { css: true }
});
```

对这个应用，编排器会：

1. 给 `#widget` 附加一个 open 模式的 shadow root（或复用之前挂载时创建的那个）；
2. 在其中创建 `<div data-tuvix-sandbox-root>`，并把该元素作为 `container` 传给 `mount`；
3. 把入口的 `styles` 以 `<link>` 标签添加到 shadow root 内，而不是 `document.head`，并在调用 `mount` 前最多等待 `loader.timeout` 让它们加载完成。

页面 CSS 不再作用于应用，应用的 CSS 也不再作用于页面。`color`、`font-family` 等可继承属性仍会从宿主元素传进来；要阻止这一点，在应用的 CSS 中对 `:host` 设置它们。

当应用带有全局选择器（`button { ... }`、CSS reset）或页面的 CSS 破坏了应用时使用它。

### 边界情况

- 框架在运行时注入的样式会进入 `document.head`，位于 shadow root 之外。Vite 的 CSS 注入、CSS-in-JS 库和 Angular 的组件样式都是这样。请输出一个 CSS 文件并列在 `entry.styles` 中，或者自己把 CSS 添加到 shadow root。
- 渲染到 `document.body` 的 portal、模态框和 toast 会离开 shadow root，失去应用的样式。
- 在应用内部调用 `document.querySelector` 找不到 shadow root 中的元素。请改为从 `container` 查询。
- 加载函数形式的入口不列出 `styles`，所以你的打包工具会把它们的 CSS 注入到 `document.head`，而 shadow root 会把这些 CSS 挡在外面。请用 `{ scripts, styles, type }` 形式的入口注册沙箱化的应用。

## 手动使用 CssSandbox

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const css = new CssSandbox();
const shadow = css.wrap(container); // 把现有子节点移入 shadow root

const adopted = css.adoptStyles(shadow, {
  urls: ['/widget/main.css'],
  cssText: ':host { display: block; font-family: system-ui; }',
});
await adopted.ready; // 每个 <link> 触发 load 或 error 后 resolve

const button = document.createElement('button');
button.textContent = 'Buy';
shadow.append(button);

// 之后
adopted.remove();
css.unwrap(container);
```

| 方法 | 作用 |
| --- | --- |
| `wrap(container)` | 附加一个 open 模式的 shadow root，或复用已有的 open shadow root，并把容器的子节点移入其中。 |
| `adoptStyles(shadow, { urls, cssText })` | 在 shadow root 开头插入 `<link>` 和 `<style>` 元素。跳过已在该处采用过的 URL。返回 `{ elements, ready, remove }`。 |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | 追加或移除一个 `<style>`。 |
| `unwrap(container)` | 把非样式节点移回 light DOM，并留下一个 `<slot>` 使它们得以渲染。把 `<style>` 和样式表 `<link>` 节点（包括 `addStyle` 和 `adoptStyles` 添加的）移出 DOM；下次对该容器调用 `wrap` 时会按原顺序放回。 |

当元素无法承载 shadow root（例如 `<input>`）或已有 closed 模式的 shadow root 时，`wrap` 会抛出异常。`ready` 从不 reject。jsdom 从不在 link 上触发 `load`，所以不要在 jsdom 测试中 await `ready`。在容器处于 unwrap 状态时调用 `removeStyle` 或 `adopted.remove()`，该样式表在下次 `wrap` 时不会再回来。

## JsSandbox

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['dataLayer'], /* strict */ true);

js.execScript('window.dataLayer = []'); // 允许，存储在代理上
console.log('dataLayer' in window); // false，除非页面定义了它

try {
  js.execScript('counter = 1'); // 对不允许的全局变量进行裸赋值
} catch (error) {
  console.log(error instanceof TypeError); // true：strict 模式阻止了这次写入
}

const loose = new JsSandbox(); // 非 strict
loose.execScript('var version = 2; build = 7;');
console.log(Reflect.get(loose.proxyWindow, 'version'), 'version' in window); // 2 false

js.reset(); // 清除所有已存储的全局变量
```

- 通过代理进行的写入和 `Object.defineProperty` 会进入沙箱上的一个存储。读取时先查这个存储，再查真实的 `window`。
- 设置 `strict: true` 时，对内置允许列表和 `allowedGlobals` 之外的全局变量进行赋值、顶层 `var` 声明或 `Object.defineProperty`，会抛出 `TypeError`，且不存储任何内容。
- `execScript(code)` 在 `with (scope)` 中运行 `code`，`window`、`self`、`globalThis` 和 `this` 都绑定到代理。裸赋值（`x = 1`）、顶层 `var x` 和 `window.x = 1` 都落在代理上；`let` 和 `const` 只在脚本内部有效。
- 在 `execScript` 中，读取未声明的标识符会返回 `undefined` 而不是抛出 `ReferenceError`，`"use strict"` 指令也不起作用，因为 `with` 需要非严格模式。它使用 `new Function`，所以你的内容安全策略（Content Security Policy）需要允许 `unsafe-eval`。
- `activate()` 和 `deactivate()` 设置 `active` 标志。两种状态下代理都会存储写入。

`JsSandbox` 只覆盖通过 `proxyWindow` 访问全局变量的代码。用 `<script>` 标签加载的脚本、打包的模块、定时器和事件监听器都使用真实的 `window`。把它当作防止你运行的代码片段意外写入全局变量的保护措施，而不是安全边界。

## 组合沙箱

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + 重置 JS 存储
```

`css` 为 `false` 时，`activate` 返回 `null`，此时不附加任何东西。

## 在微应用内部使用

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

export default defineMicroApp({
  name: 'widget',
  mount({ container }) {
    const shadow = css.wrap(container);
    css.addStyle(shadow, 'p { color: rebeccapurple; }');
    const text = document.createElement('p');
    text.textContent = 'Isolated';
    shadow.append(text);
  },
  unmount({ container }) {
    container.shadowRoot?.replaceChildren();
    css.unwrap(container);
  },
});
```

当编排器负责挂载应用时，优先在 `register` 上使用 `sandbox: true`；它做同样的工作，并在多次重新挂载之间复用 shadow root。

## 何时不使用沙箱

- 应用使用 portal 渲染到 `document.body`，并且需要在那里应用它的样式。
- 页面的设计系统需要为应用提供样式。
- 你需要真正的 JavaScript 隔离。请使用 `<iframe>`。
