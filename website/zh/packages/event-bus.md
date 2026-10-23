---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="事件总线"
  description="用于微应用之间传递消息的同步发布/订阅总线。每个页面一个全局总线，由该包的所有打包副本共享。"
  icon="📡"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## 何时使用

同一页面上的微应用需要互相通知：购物车应用发布 `cart:updated`，页头显示新的数量。事件总线让它们通过事件名完成这件事，而无需互相导入。

`@tuvix.js/core` 的编排器使用 `getGlobalBus()`，并在挂载上下文中把它作为 `bus` 交给每个应用。在微应用内部，使用这个 `bus` 或调用 `getGlobalBus()`；两者返回同一个实例。在测试中，或者对于只在一个应用内部传递的消息，用 `createEventBus()` 创建私有总线。

对于晚到的订阅者必须能读取的状态（使用 store 或 URL），以及标签页或 iframe 之间的消息（`BroadcastChannel`、`postMessage`），请选择其他方案。

## 快速开始

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

interface CartUpdated {
  itemCount: number;
  total: number;
}

const bus = getGlobalBus();

// 页头应用
const stop = bus.on<CartUpdated>('cart:updated', ({ itemCount }) => {
  document.querySelector('#cart-count')!.textContent = String(itemCount);
});

// 购物车应用
bus.emit<CartUpdated>('cart:updated', { itemCount: 3, total: 59.9 });

// 页头应用，卸载时
stop();
```

由编排器挂载的微应用会在挂载上下文中收到总线：

```ts
import { registerModule } from '@tuvix.js/loader';

let stop: (() => void) | undefined;

registerModule('header', {
  mount({ container, bus }) {
    stop = bus?.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
      container.textContent = `Cart: ${itemCount}`;
    });
  },
  unmount({ container }) {
    stop?.();
    container.replaceChildren();
  },
});
```

## API

### `EventBus`

```ts no-check
class EventBus implements IEventBus {
  constructor(options?: EventBusOptions);
}
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | 每个事件的监听器数量阈值：达到该数量后再添加一个时，`on` 会输出一次 `console.warn`，在总线的整个生命周期内每个事件名只警告一次。无论如何监听器都会被添加。`0` 关闭该警告。该警告不受 `debug` 影响。 |
| `debug` | `boolean` | `false` | 通过 `logger` 记录每次订阅、取消订阅和发布。 |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | 接收调试消息，每条都以 `[Tuvix EventBus]` 为前缀。`maxListeners` 警告不经过它。 |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

把 `handler` 订阅到 `event`，并返回一个取消订阅的函数。`T` 为载荷指定类型；总线不在运行时检查它。

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

与 `on` 类似，但会在处理函数首次调用之前将其移除。要在事件触发前取消，调用返回的函数。`off(event, handler)` 找不到它，因为总线保存的是一个包装函数。

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
const cancel = bus.once('app:ready', () => console.log('ready'));
cancel();
```

#### `emit(event, data?)`

```ts no-check
emit<T = unknown>(event: string, data?: T): void;
```

按订阅顺序调用 `event` 的每个处理函数，然后调用每个 `onAny` 处理函数，全部在 `emit` 返回之前完成。抛出错误的处理函数会通过 `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` 记录，其余处理函数照常运行。

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

移除一个处理函数。未知的事件和处理函数会被忽略。

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

传入 `event` 时，移除该事件的所有处理函数。不传时，移除所有事件的所有处理函数以及所有 `onAny` 处理函数。

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

订阅所有事件。处理函数接收 `(eventName, data)`。用于日志记录和开发者工具。

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const stopLogging = getGlobalBus().onAny((event, data) => {
  console.debug('[bus]', event, data);
});
```

#### `offAny(handler)`

```ts no-check
offAny<T = unknown>(handler: WildcardHandler<T>): void;
```

移除一个 `onAny` 处理函数。

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

检查订阅情况。`onAny` 处理函数不计入，`eventNames()` 只列出至少有一个处理函数的事件。

#### `destroy()`

```ts no-check
destroy(): void;
```

移除所有处理函数，并把总线标记为已销毁。之后，`on`、`once`、`emit` 和 `onAny` 会抛出 `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.`。编排器在 `destroy()` 中会销毁私有总线（由 `eventBus` 选项创建的总线），并保留全局总线。

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

返回类型为 `IEventBus` 的 `new EventBus(options)`。接受上表中的选项。

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
bus.on<string>('hello', (name) => console.log(`Hello, ${name}!`));
bus.emit('hello', 'World');
```

### `getGlobalBus`

```ts no-check
function getGlobalBus(options?: EventBusOptions): IEventBus;
```

返回页面的共享总线，并在第一次调用时创建它。总线保存在 `window.__TUVIX_GLOBAL_BUS__` 上，因此自带一份 `@tuvix.js/event-bus` 副本的微应用与 shell 得到的是同一个实例。`options` 只在创建总线的那次调用中生效。在服务端，没有 `window` 时，总线是模块级单例。

除非你向 `createOrchestrator` 传入 `eventBus` 选项，否则编排器使用这个总线，因此 `orchestrator.getEventBus() === getGlobalBus()`。

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

销毁全局总线并清除 `window.__TUVIX_GLOBAL_BUS__`。下一次 `getGlobalBus()` 会创建新的总线。之后，仍持有旧实例的代码（包括编排器）在 `emit` 时会抛出错误。在测试之间调用它。

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### 类型

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| 类型 | 含义 |
| --- | --- |
| `EventHandler<T>` | 单个事件的处理函数。 |
| `WildcardHandler<T>` | `onAny` 的处理函数，接收事件名和数据。 |
| `Unsubscribe` | 由 `on`、`once` 和 `onAny` 返回的函数。 |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`。 |
| `IEventBus` | `EventBus` 实现的接口：包含上面列出的所有方法。它满足 `@tuvix.js/loader` 的 `MicroAppBus`。 |

## 边界情况

- **每次发布使用快照。** `emit` 会先复制处理函数列表。发布期间添加的处理函数从下一次发布开始运行；发布期间移除的处理函数在本次发布中仍会运行。
- **同一函数订阅两次。** 把同一个函数两次订阅到同一事件只会保存一次，一次 `off` 即可移除它。
- **异步处理函数。** `emit` 不会等待返回的 promise。被 reject 的 promise 会逃出总线的 `try`/`catch`，表现为未处理的 rejection。
- **无效输入。** 对于 `''` 或只含空白的事件名，`on`、`once` 和 `emit` 会抛出 `[Tuvix EventBus] Event name must be a non-empty string.`。处理函数不是函数时，`on` 和 `onAny` 会抛出 `[Tuvix EventBus] Handler must be a function.`。`once` 会先包装处理函数，因此非函数值可以通过，并在第一次 `emit` 时失败，由总线记录该错误。
- **`destroy()` 之后。** `off`、`offAll`、`offAny`、`hasListeners`、`listenerCount` 和 `eventNames` 仍可使用，并报告一个空总线。
- **混用版本。** 自带 `@tuvix.js/event-bus` 0.4 的微应用会保留自己的模块级总线，看不到共享总线。
- **监听器上限。** 设置 `maxListeners: 20` 时，为同一事件添加第 21 个处理函数会输出 `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.`。总线在其生命周期内对每个事件名只警告一次，因此移除处理函数后再添加不会再次警告。
- **Iframe。** 每个 window 都有自己的 `__TUVIX_GLOBAL_BUS__`。

## 它不做什么

- 它不按事件名推断类型。没有事件映射，也没有可供扩展的 `TuvixEvents` 接口；通过 `on<T>` 和 `emit<T>` 传入载荷类型。
- 它不重放事件。在 `emit` 之后订阅的处理函数会错过该事件。
- 它不匹配 `user:*` 这样的模式。`onAny` 会接收所有事件。
- 它不向其他标签页、窗口或 iframe 发送消息。

## 从 0.4 迁移

- `getGlobalBus()` 现在把单例保存在 `window.__TUVIX_GLOBAL_BUS__` 上。在 0.4 中，该包的每个打包副本都会创建自己的「全局」总线，因此自带副本的微应用永远收不到 shell 的消息。现在从任何副本调用 `resetGlobalBus()` 都会为所有副本重置总线。
- 本页的 0.4 版本记录了 `clear(event?)`、`createEventBus<EventMap>()` 和 `TuvixEvents` 接口。它们都不存在。使用 `offAll(event?)` 以及每次调用时传入的泛型 `on<T>` / `emit<T>`。
