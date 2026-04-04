# Event Bus

`@tuvix.js/event-bus` 提供类型化的发布/订阅通道用于跨应用通信 - 无需共享全局变量，微应用之间无耦合。

## 导入

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';
```

## 基本用法

```ts
// 发布事件
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// 订阅事件
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// 完成后取消订阅（在 unmount 中很重要！）
unsubscribe();
```

## 类型化事件

使用 TypeScript 定义事件映射以获得完整的类型安全：

```ts
// events.d.ts（共享类型）
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

现在 TypeScript 会验证事件名称和载荷：

```ts
// ✅ 正确
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ 正确
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ TypeScript 错误 - 错误的载荷
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

只订阅一次事件 - 处理程序在第一次调用后自动移除：

```ts
eventBus.once('user:login', (payload) => {
  // 调用一次，然后移除
  initUserSession(payload.userId);
});
```

## 微应用中的清理

始终在 `unmount` 中取消订阅以防止内存泄漏：

```ts
export const app: MicroApp = {
  _subscriptions: [] as (() => void)[],

  async mount(container, props) {
    this._subscriptions.push(
      eventBus.on('theme:changed', ({ theme }) => applyTheme(theme))
    );
  },

  async unmount(container) {
    this._subscriptions.forEach((unsub) => unsub());
    this._subscriptions = [];
    container.innerHTML = '';
  },
};
```

## 创建自定义 Bus

如果你需要一个隔离的事件通道（例如用于测试）：

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## API 参考

| 方法 | 签名 | 描述 |
|------|------|------|
| `emit` | `emit(event, payload)` | 发布事件 |
| `on` | `on(event, handler) → unsub` | 订阅，返回取消订阅函数 |
| `once` | `once(event, handler)` | 订阅一次，自动移除 |
| `off` | `off(event, handler)` | 移除特定处理程序 |
| `clear` | `clear(event?)` | 移除所有处理程序（可选择特定事件） |
