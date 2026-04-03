# Event Bus

`@tuvix.js/event-bus` は、共有グローバルやマイクロアプリ間の結合なしに、アプリ間通信のための型付きパブリッシュ/サブスクライブチャネルを提供します。

## インポート

```ts
import { eventBus } from '@tuvix.js/event-bus';
```

## 基本的な使い方

```ts
// イベントを発行
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// イベントをサブスクライブ
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// 完了したらサブスクライブ解除（unmount で重要！）
unsubscribe();
```

## 型付きイベント

完全な型安全性のために TypeScript でイベントマップを定義します：

```ts
// events.d.ts（共有型）
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

これで TypeScript がイベント名とペイロードを検証します：

```ts
// ✅ 正しい
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ 正しい
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ TypeScript エラー - 不正なペイロード
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

イベントを一度だけサブスクライブ - ハンドラーは最初の呼び出し後に自動的に削除されます：

```ts
eventBus.once('user:login', (payload) => {
  // 一度呼ばれ、その後削除
  initUserSession(payload.userId);
});
```

## マイクロアプリでのクリーンアップ

メモリリークを防ぐため、`unmount` で必ずサブスクライブを解除してください：

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

## カスタム Bus の作成

分離されたイベントチャネルが必要な場合（例：テスト用）：

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## API リファレンス

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `emit` | `emit(event, payload)` | イベントを発行 |
| `on` | `on(event, handler) → unsub` | サブスクライブ、解除関数を返す |
| `once` | `once(event, handler)` | 一度だけサブスクライブ、自動削除 |
| `off` | `off(event, handler)` | 特定のハンドラーを削除 |
| `clear` | `clear(event?)` | すべてのハンドラーを削除（オプションで特定イベント） |
