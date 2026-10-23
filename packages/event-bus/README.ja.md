# @tuvix.js/event-bus

> マイクロアプリ間のメッセージのための同期的なpublish/subscribeバスです。ページごとに1つのグローバルバスを持ちます。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。完全なドキュメント：[tuvix.js.org/packages/event-bus](https://tuvix.js.org/packages/event-bus)。

## インストール

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## クイックスタート

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

`@tuvix.js/core`のオーケストレーターは（`eventBus`オプションを渡さない限り）`getGlobalBus()`を使い、マウントコンテキストの`bus`としてすべてのアプリに渡します。

## API

### `EventBus`と`createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | イベントごとのリスナー数のしきい値。この数に達した状態でさらに追加すると、`debug`の有無にかかわらず、`on`がイベント名ごとに1回`console.warn`を出力します。リスナーは追加されます。`0`は警告なしを意味します。 |
| `debug` | `boolean` | `false` | subscribe、unsubscribe、emitの呼び出しをログに出力します。 |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | デバッグ出力を受け取ります。 |

| メソッド | 動作 |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | 購読し、解除関数を返します。 |
| `once<T>(event, handler): Unsubscribe` | 最初の呼び出しの前にハンドラーを削除します。キャンセルは`off`ではなく、返された関数で行ってください。 |
| `emit<T>(event, data?)` | 戻る前に、そのイベントのハンドラーを順に呼び出し、次に`onAny`ハンドラーを呼び出します。スローしたハンドラーは`console.error`でログに出力され、残りのハンドラーは引き続き実行されます。 |
| `off(event, handler)` | ハンドラーを1つ削除します。 |
| `offAll(event?)` | イベントのハンドラーを削除します。引数がなければ`onAny`のものを含むすべてのハンドラーを削除します。 |
| `onAny(handler): Unsubscribe` | ハンドラーはすべてのイベントについて`(eventName, data)`を受け取ります。 |
| `offAny(handler)` | `onAny`ハンドラーを削除します。 |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | 購読を確認します。`onAny`ハンドラーは数えられません。 |
| `destroy()` | すべてのハンドラーを削除します。以降の`on`、`once`、`emit`、`onAny`の呼び出しはスローします。 |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

`window.__TUVIX_GLOBAL_BUS__`に保存されたページの共有バスを返すため、このパッケージの独自のコピーをバンドルしたマイクロアプリも同じインスタンスを取得します。`options`はバスを作成する呼び出しでのみ適用されます。`window`がない環境では、バスはモジュールレベルのシングルトンです。

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

グローバルバスを破棄します。次の`getGlobalBus()`が新しいバスを作成します。古い参照は使用時にスローします。テスト向けです。

### 型

`EventHandler<T>`（`(data: T) => void`）、`WildcardHandler<T>`（`(eventName: string, data: T) => void`）、`Unsubscribe`（`() => void`）、`EventBusOptions`、`IEventBus`。

## エッジケース

- `emit`はハンドラーリストのコピーに対して動作します。emitの最中に追加されたハンドラーは、次のemitから実行されます。
- 1つのイベントに同じ関数を2回購読しても、保存されるのは1回だけです。
- `emit`は非同期ハンドラーをawaitしません。それらのrejectionは処理されません。
- 空または空白のみのイベント名は`[Tuvix EventBus] Event name must be a non-empty string.`をスローします。
- このパッケージの0.4をバンドルしたマイクロアプリは、独自のバスを持ち続けます。

## 行わないこと

- イベントマップによる型付けはありません。ペイロードの型は`on<T>` / `emit<T>`として渡してください。
- 遅れて購読した側へのリプレイ、`user:*`パターン、タブやiframeをまたぐメッセージはありません。

## ライセンス

MIT
