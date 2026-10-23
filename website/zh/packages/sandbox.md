---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="沙箱"
  description="在可复用的 Shadow DOM 根中隔离 CSS，把样式表采纳进该根，并提供一个 Proxy window，让脚本全局变量不写到真实的 window 上。"
  icon="🔒"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## 何时使用

当微应用的 CSS 和页面的 CSS 必须互不影响时，使用 `CssSandbox`。它把应用的 DOM 移入容器上的一个 open shadow root，让应用的选择器留在内部，页面的选择器留在外部。用 `sandbox: true` 注册应用时，`@tuvix.js/core` 中的编排器会替你完成这一步。不通过编排器挂载应用时，自己调用这个包。

当你运行第三方脚本文本，并希望它写入的全局变量不落到真实的 `window` 上时，使用 `JsSandbox`。你通过 `execScript` 运行代码，它会通过一个 Proxy 解析 `window`、`this` 和自由标识符。编排器不会应用它。

如果需要对不可信代码做严格隔离，请选择别的方案。带 `sandbox` 属性的 `<iframe>` 会给代码独立的全局对象和源；这个包不会。

## 快速开始

通过编排器（仅 CSS）：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'cart',
  entry: { scripts: ['/apps/cart/main.js'], styles: ['/apps/cart/style.css'] },
  container: '#cart',
  activeWhen: '/cart/*',
  sandbox: true,
});

await orchestrator.start();
```

编排器把 `#cart` 包裹进一个 shadow root，把应用渲染到其中的 `<div data-tuvix-sandbox-root="cart">`，并把 `style.css` 加载到 shadow root 而不是 `<head>`。挂载会等待这些样式表加载，最长等待加载器的 `timeout`（默认 10000 ms）。应用再次挂载时，编排器会复用这个 shadow root。

手动使用：

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container);
const target = shadowRoot ?? container;

const adopted = sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });
await adopted.ready;
target.append(Object.assign(document.createElement('p'), { textContent: 'Cart' }));

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox`

```ts
import type { ISandbox, SandboxOptions } from '@tuvix.js/sandbox';

declare function createSandbox(options?: SandboxOptions): ISandbox;
```

返回 `new Sandbox(options)`。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` 把容器包裹进 shadow root。设为 `false` 时，`activate` 返回 `null`，不附加任何内容。 |
| `js` | `boolean` | `true` | `activate`/`deactivate` 切换 `sandbox.js.active`。无论如何，`sandbox.js.proxyWindow` 上的代理都会让写入不落到真实的 `window` 上。 |
| `allowedGlobals` | `string[]` | `[]` | strict 模式下允许沙箱代码赋值的额外全局名称。对它们的写入仍落在代理上。 |
| `strict` | `boolean` | `false` | 沙箱代码赋值或定义内置允许列表和 `allowedGlobals` 之外的全局变量时，抛出 `TypeError`。 |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

`createSandbox` 背后的类。它实现了 `ISandbox`：

| 成员 | 签名 | 行为 |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | 它使用的 `CssSandbox` 实例。 |
| `js` | `readonly IJsSandbox` | 它使用的 `JsSandbox` 实例。 |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css` 开启时调用 `css.wrap(container)`，然后在 `js` 开启时调用 `js.activate()`。返回 shadow root 或 `null`。 |
| `deactivate` | `(container: HTMLElement) => void` | 先调用 `js.deactivate()`，再调用 `css.unwrap(container)`。 |
| `destroy` | `(container: HTMLElement) => void` | 先调用 `deactivate(container)`，再调用 `js.reset()`，后者清除所有已存储的全局变量。 |

### `CssSandbox`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const container = document.querySelector<HTMLElement>('#widget')!;

const shadowRoot = cssSandbox.wrap(container);
const style = cssSandbox.addStyle(shadowRoot, ':host { display: block; } p { color: teal; }');
cssSandbox.unwrap(container); // the <style> leaves the DOM and waits for the next wrap
cssSandbox.removeStyle(shadowRoot, style); // removed for good: the next wrap does not restore it
```

| 方法 | 签名 | 行为 |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | 把容器的子节点移入一个 open shadow root 并返回它。 |
| `unwrap` | `(container: HTMLElement) => void` | 把子节点移回 light DOM，把 shadow root 的样式表暂存起来，并在 shadow root 中留下一个 `<slot>`。 |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | 在 shadow root 末尾追加一个包含 `css` 的 `<style>`。 |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | 移除 `styleEl`。如果宿主元素处于 unwrap 状态，还会把 `styleEl` 从暂存列表中删除，让下一次 `wrap` 不再恢复它。 |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | 在 shadow root 开头插入 `<link>` 和 `<style>` 元素。 |

#### `wrap` 与重新挂载

DOM 元素一旦附加了 shadow root 就无法再移除。`wrap` 这样处理：

1. 如果这个 `CssSandbox` 实例已经 wrap 了该容器且尚未 unwrap，`wrap` 返回同一个 shadow root，不移动任何节点。
2. 如果容器已有一个 open `shadowRoot`（来自之前的 `wrap`、`unwrap` 或另一个 `CssSandbox` 实例），`wrap` 会移除 `unwrap` 留下的 `<slot>`，放回 `unwrap` 暂存的样式表（放在开头，保持原有顺序），并复用这个 root。
3. 否则调用 `container.attachShadow({ mode: 'open' })`。

随后它把所有 light DOM 子节点移入 shadow root。`wrap` 只在 `attachShadow` 失败时抛出异常，例如元素无法承载 shadow root（`<img>`、`<input>`），或已经有一个 closed root：`[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`。

#### `unwrap` 与 slot

`unwrap` 把 shadow root 的子节点移回容器。它把 `<style>` 和 `<link rel="stylesheet">` 节点从 DOM 中取出，无论它们来自 `addStyle`、`adoptStyles` 还是应用本身，这样应用的 CSS 不再生效，也不会影响到页面。它把这些节点和 shadow root 保存在一起。shadow root 本身保留，并包含一个 `<slot data-tuvix-sandbox-slot>`，浏览器通过它渲染恢复的子节点。对于不是由这个实例 wrap 的容器，`unwrap` 什么也不做。

之后对该宿主元素的下一次 `wrap`，无论来自这个还是其他 `CssSandbox` 实例，都会移除 slot，按顺序放回暂存的样式表，并把子节点移回。重新挂载后你不需要再次采纳样式。在宿主元素处于 unwrap 状态时调用 `removeStyle(shadowRoot, el)` 或 `adopted.remove()`，会永久移除这些样式表。

#### `adoptStyles`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const shadowRoot = cssSandbox.wrap(document.querySelector<HTMLElement>('#cart')!);

const adopted = cssSandbox.adoptStyles(shadowRoot, {
  urls: ['/apps/cart/style.css', '/shared/tokens.css'],
  cssText: ':host { display: block; }',
});

await adopted.ready; // every <link> fired load or error
console.log(adopted.elements.length); // 3

adopted.remove();
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | 每个 URL 按顺序生成一个 `<link rel="stylesheet" data-tuvix-style>`。 |
| `cssText` | `string \| readonly string[]` | 无 | 每个字符串生成一个 `<style data-tuvix-style>`，放在 link 之后。 |

行为：

- 这些元素放在 shadow root 开头、之前采纳的样式之后，因此应用内容和 `addStyle` 的样式在层叠顺序中排在后面。
- 已采纳到这个 shadow root 的 URL 会被跳过，也不会出现在 `elements` 中。这包括 `unwrap` 暂存的 link。如果已有的 link 由更早的调用创建，`ready` 仍会等待它。
- 每个 link 触发 `load` 或 `error` 后，`ready` 就会解析。它从不拒绝，所以返回 404 的样式表不会阻塞你。jsdom 不会触发这两个事件，所以不要在 jsdom 测试中 await `ready`。
- `remove()` 只移除本次调用插入的元素，包括已暂存的元素，因此下一次 `wrap` 不会恢复它们。

### `JsSandbox`

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const jsSandbox = new JsSandbox(['analyticsQueue'], true);
jsSandbox.activate();

jsSandbox.execScript('window.analyticsQueue = []'); // allowed, stored on the proxy
console.log('analyticsQueue' in window); // false
console.log(Reflect.get(jsSandbox.proxyWindow, 'analyticsQueue')); // []

try {
  jsSandbox.execScript('window.tracker = {}');
} catch (error) {
  console.log(error instanceof TypeError); // true
}

jsSandbox.reset();
```

构造函数：`new JsSandbox(allowedGlobals: string[] = [], strict = false)`。

| 成员 | 签名 | 行为 |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | 真实 `window` 之上的 Proxy。 |
| `active` | `readonly boolean` | 由 `activate` 设置、由 `deactivate`/`reset` 清除的标志。 |
| `activate` | `() => void` | 把 `active` 设为 `true`。 |
| `deactivate` | `() => void` | 把 `active` 设为 `false`。已存储的全局变量保留。 |
| `execScript` | `(code: string) => unknown` | 通过 `new Function` 在 `with (scope)` 中以非严格模式（sloppy mode）脚本运行 `code`。`window`、`self`、`globalThis` 和顶层 `this` 都是代理，自由标识符通过它解析。`eval("...")` 在该作用域内仍是直接 eval。返回代码的返回值。 |
| `reset` | `() => void` | 清除所有已存储的全局变量，并把 `active` 设为 `false`。 |

代理的行为：

- 读取时先检查沙箱自己的存储，再回退到真实的 `window`。真实 window 上没有 `prototype` 的函数（`fetch`、`setTimeout`）返回时会绑定到真实的 `window`，每个函数只绑定一次，因此 `proxyWindow.fetch === proxyWindow.fetch`。
- `proxyWindow.window`、`.self`、`.globalThis` 返回代理本身；页面不在 iframe 中时，`.top`/`.parent`/`.frames` 也返回代理本身。在 iframe 中，`top` 和 `parent` 保持为真实对象。
- 赋值和 `Object.defineProperty` 把值存储在代理上。真实的 `window` 永远不变。不带 `value` 的描述符（`{ enumerable: false }`）会保留已存储的值。访问器描述符（`get`/`set`）和 `configurable: false` 会让 `Object.defineProperty` 抛出 `TypeError`。
- `delete proxyWindow.x` 删除已存储的值。对于真实 window 的属性，它返回 `false`，这在严格模式代码中会抛出 `TypeError`。
- `in` 同时检查存储和真实的 `window`。

strict 模式（`strict: true`）：对内置允许列表和 `allowedGlobals` 之外的名称进行赋值（`window.x = 1` 或裸的 `x = 1`）、顶层 `var x = 1` 或调用 `Object.defineProperty`，会抛出 `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.`，且不存储任何值。无论沙箱是否处于激活状态，都会执行这项检查。Symbol 键始终被视为禁止写入。内置允许列表涵盖标准全局变量，如 `console`、定时器、`Promise`、`Map`、`JSON`、`fetch`、`URL`、`navigator`、`document`、`location` 和 `history`。允许的写入，包括对这些名称的写入，都保留在代理上。

### 类型

| 类型 | 含义 |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`，即 `createSandbox` 的选项。 |
| `ISandbox` | `Sandbox` 实现的接口：`css`、`js`、`activate`、`deactivate`、`destroy`。 |
| `ICssSandbox` | `CssSandbox` 实现的接口。 |
| `IJsSandbox` | `JsSandbox` 实现的接口。 |
| `AdoptStylesOptions` | `adoptStyles` 的 `{ urls?, cssText? }`。 |
| `AdoptedStyles` | `adoptStyles` 返回的 `{ elements, ready, remove }`。 |

## 边界情况

- 在 `execScript` 中，`x = 1`、顶层 `var x = 1`、`window.x = 1`、`window.window.x = 1`、`top.x = 1`，以及 `eval("...")` 中的同样语句，都把 `x` 存储在代理上，从不存储在真实的 `window` 上。`let` 和 `const` 仍是脚本的局部变量。
- 在 `execScript` 中读取未声明的标识符会返回 `undefined`，而不是抛出 `ReferenceError`；`code` 中的 `"use strict"` 指令不起作用，因为 `with` 需要非严格模式。
- 在 `f()` 这样的普通函数调用中，`this` 是真实的全局对象，这是非严格模式 JavaScript 的定义。在这种函数中执行 `this.x = 1` 会写入真实的 `window`。在通过 `execScript` 运行的代码中，请写 `window.x = 1`。
- `execScript` 使用 `new Function`，因此不包含 `'unsafe-eval'` 的内容安全策略（CSP）会阻止它。
- 构造 `JsSandbox`、`Sandbox` 或调用 `createSandbox()` 会读取 `window`，因此在服务端会抛出 `ReferenceError`。`CssSandbox` 只在你调用它的方法时才需要 `document`。
- 两个 `CssSandbox` 实例可以共享同一个宿主元素。第二次 `wrap` 会复用第一个实例的 shadow root。
- 容器处于 wrap 状态时你添加的 light DOM 子节点留在 shadow root 之外，且没有 slot 渲染它们，所以不会显示。请改为追加到 shadow root 中。
- `Sandbox({ css: false }).activate()` 返回 `null`。请渲染到容器中。

## 它不做什么

- 它不会修补定时器、事件监听器、`document` 或 `<script>` 标签。不经过 `proxyWindow` 的代码会影响真实页面。
- 它不会清理应用遗留的 interval 或监听器。请在应用的 `unmount` 中清除它们。
- 它不会给代码独立的源或全局对象。对不可信代码请使用 `<iframe sandbox>`。
- 它不会分离 shadow root。DOM 没有提供这样的 API；`unwrap` 改为留下一个 slot。
- 它不会阻止继承。在宿主元素或其祖先上设置的 `color`、`font-family` 和 CSS 自定义属性仍会传入 shadow root。

## 从 0.4 迁移

- `Sandbox({ css: false }).activate(container)` 返回 `null`，且不附加 shadow root。在 0.4 中它会附加一个，并隐藏容器的子节点。`ISandbox.activate` 现在返回 `ShadowRoot | null`：

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` 在写入被阻止时抛出 `TypeError`。在 0.4 中它只记录警告并存储该值。请把脚本设置的名称添加到 `allowedGlobals`。
- `execScript` 在 `with` 块中运行代码。代码不能是严格模式代码，读取未声明的标识符会返回 `undefined` 而不是抛出异常，裸的 `x = 1` 现在落在代理上，而不是真实的 `window` 上。
- `unwrap` 保留 shadow root 的样式表，下一次 `wrap` 会恢复它们。在 0.4 中 `unwrap` 会删除它们。请删除在重新挂载后再次添加 `cssText` 或 `addStyle` 样式的代码，否则会出现重复。
- 0.4 文档称 `js: true` 会拦截 `addEventListener`、定时器和 `document.createElement`。它从未这样做过，0.5 也不会。
