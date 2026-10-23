# 事件总线

`@tuvix.js/event-bus` 是一个同步的发布/订阅通道。同一页面上的应用用它互相告知发生了什么（「购物车已更新」「用户已退出登录」），而无需导入彼此的代码。

## 选择总线

| 总线 | 获取方式 | 使用场景 |
| --- | --- | --- |
| 全局总线 | `getGlobalBus()` | 默认选择。页面上的每个应用，无论在哪个 bundle 中，都拿到同一个实例。 |
| 编排器总线 | `orchestrator.getEventBus()` 或挂载上下文中的 `bus` | 在微应用内部使用。除非 shell 传入了 `eventBus` 选项，否则它就是全局总线。 |
| 私有总线 | `createEventBus(options)` | 测试，或只有一个应用使用的通道。 |

`getGlobalBus()` 把实例保存在 `window.__TUVIX_GLOBAL_BUS__` 上。两个各自打包了 `@tuvix.js/event-bus` 的微应用仍然共享它。在服务端没有 `window`，每份模块副本各有自己的实例。

## 发布与订阅

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit` 在返回前调用每个处理函数。抛出异常的处理函数会通过 `console.error` 记录；其余处理函数照常运行。事件不会排队：在 `emit` 之后才订阅的订阅者收不到它。

## 类型化事件

`on`、`once` 和 `emit` 上的泛型为 payload 提供类型。需要项目级的事件映射时，对总线做一层封装：

```ts
import { getGlobalBus, type IEventBus } from '@tuvix.js/event-bus';

export interface AppEvents {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'cart:updated': { itemCount: number; total: number };
}

export function emit<E extends keyof AppEvents>(bus: IEventBus, event: E, payload: AppEvents[E]): void {
  bus.emit(event, payload);
}

export function on<E extends keyof AppEvents>(
  bus: IEventBus,
  event: E,
  handler: (payload: AppEvents[E]) => void,
): () => void {
  return bus.on<AppEvents[E]>(event, handler);
}

emit(getGlobalBus(), 'cart:updated', { itemCount: 3, total: 42 });
```

## 在微应用中使用总线

从挂载上下文中取得总线，并在 `unmount` 中取消订阅：

```ts
import { defineMicroApp } from '@tuvix.js/core';

const subscriptions: Array<() => void> = [];

export default defineMicroApp({
  name: 'header',

  mount({ container, bus }) {
    const badge = document.createElement('span');
    container.replaceChildren(badge);
    if (!bus) return;
    subscriptions.push(
      bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
        badge.textContent = String(itemCount);
      }),
      bus.on('user:logout', () => {
        badge.textContent = '';
      }),
    );
  },

  unmount({ container }) {
    for (const off of subscriptions.splice(0)) off();
    container.replaceChildren();
  },
});
```

React 和 Vue 组件可以使用 `useTuvixBus(bus, event, handler)`，它会在组件卸载时取消订阅。参见 [React](/zh/guide/react) 和 [Vue](/zh/guide/vue)。

## once 与通配符

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

对每个事件，`onAny` 处理函数都在具名处理函数之后运行，包括编排器的 `tuvix:app:*` 事件。

## 移除监听器

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // 一个处理函数
bus.offAll('ping'); // 'ping' 的所有处理函数
bus.offAll(); // 所有处理函数，包括通配符
```

只有在你掌控整个页面时，才在全局总线上调用 `offAll()`。它也会移除其他应用的监听器。

## 错误与已销毁的总线

- 事件名为空或处理函数不是函数时，`on`、`once`、`emit` 和 `onAny` 会抛出异常。
- 调用 `bus.destroy()` 后，所有订阅或发布的方法都会抛出异常。`resetGlobalBus()` 销毁全局总线；下一次调用 `getGlobalBus()` 会创建一个新的。
- `orchestrator.destroy()` 只销毁私有总线。

## 内省

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## 总线不做什么

- 它不持久化也不重放事件。请把当前状态作为 props 传入，或者让后加载的应用发出一个事件来请求状态，由状态的拥有者应答。
- 它不跨窗口、标签页或 iframe。这种情况请使用 `BroadcastChannel` 或 `postMessage`。
- 它不在运行时校验 payload。泛型只在编译时起作用。
