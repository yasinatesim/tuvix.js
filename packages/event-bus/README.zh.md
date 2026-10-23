# @tuvix.js/event-bus

> 用于微应用之间传递消息的同步发布/订阅总线，每个页面一个全局总线。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。完整文档：[tuvix.js.org/zh/packages/event-bus](https://tuvix.js.org/zh/packages/event-bus)。

## 安装

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## 快速开始

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

`@tuvix.js/core` 的编排器使用 `getGlobalBus()`（除非你传入 `eventBus` 选项），并在挂载上下文中以 `bus` 的形式把它传给每个应用。

## API

### `EventBus` 和 `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | 每个事件的监听器数量达到该值后，再添加时 `on` 会打印一次 `console.warn`（每个事件名一次），无论是否开启 `debug`。监听器仍会被添加。`0` 表示不警告。 |
| `debug` | `boolean` | `false` | 记录订阅、取消订阅和 emit 调用。 |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | 接收调试输出。 |

| 方法 | 行为 |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | 订阅；返回一个移除函数。 |
| `once<T>(event, handler): Unsubscribe` | 在处理函数首次调用前将其移除。要取消它，请使用返回的函数，而不是 `off`。 |
| `emit<T>(event, data?)` | 在返回之前，按顺序调用该事件的处理函数，然后调用 `onAny` 处理函数。抛出错误的处理函数会通过 `console.error` 记录；其余处理函数照常运行。 |
| `off(event, handler)` | 移除一个处理函数。 |
| `offAll(event?)` | 移除某个事件的处理函数，或移除所有处理函数（包括 `onAny` 处理函数）。 |
| `onAny(handler): Unsubscribe` | 处理函数对每个事件接收 `(eventName, data)`。 |
| `offAny(handler)` | 移除一个 `onAny` 处理函数。 |
| `hasListeners(event)`、`listenerCount(event)`、`eventNames()` | 检查订阅情况；不计入 `onAny` 处理函数。 |
| `destroy()` | 移除所有处理函数。之后调用 `on`、`once`、`emit` 和 `onAny` 会抛出错误。 |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

返回页面共享的总线，它存放在 `window.__TUVIX_GLOBAL_BUS__` 上，因此自己打包了本包副本的微应用也会得到同一个实例。`options` 只在创建总线的那次调用中生效。没有 `window` 时，总线是模块级单例。

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

销毁全局总线；下一次 `getGlobalBus()` 会创建新的总线。旧的引用在使用时会抛出错误。用于测试。

### 类型

`EventHandler<T>`（`(data: T) => void`）、`WildcardHandler<T>`（`(eventName: string, data: T) => void`）、`Unsubscribe`（`() => void`）、`EventBusOptions`、`IEventBus`。

## 边界情况

- `emit` 在处理函数列表的副本上执行：emit 期间添加的处理函数从下一次 emit 开始运行。
- 同一个函数对同一事件订阅两次，只保存一次。
- `emit` 不会 await 异步处理函数；它们的 rejection 不会被处理。
- 空的或只有空白的事件名会抛出 `[Tuvix EventBus] Event name must be a non-empty string.`
- 打包了本包 0.4 版本的微应用会保留自己的总线。

## 它不做什么

- 没有事件映射类型；请通过 `on<T>` / `emit<T>` 传入 payload 类型。
- 不为后来的订阅者重放事件，不支持 `user:*` 模式，不跨标签页或 iframe 传递消息。

## 许可证

MIT
