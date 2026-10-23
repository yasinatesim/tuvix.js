---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="イベントバス"
  description="マイクロアプリ間でメッセージをやり取りする同期型のpublish/subscribeバスです。ページごとに1つのグローバルバスを、バンドルされたパッケージのすべてのコピーで共有します。"
  icon="📡"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## 使いどころ

同じページ上のマイクロアプリは互いに情報を伝える必要があります。たとえば、カートアプリが`cart:updated`を通知し、ヘッダーが新しい件数を表示します。イベントバスを使うと、互いをインポートせずにイベント名でこれを実現できます。

`@tuvix.js/core`のオーケストレーターは`getGlobalBus()`を使い、マウントコンテキストの`bus`としてすべてのアプリに渡します。マイクロアプリ内では、その`bus`を使うか`getGlobalBus()`を呼び出してください。どちらも同じインスタンスを返します。テスト用や、1つのアプリ内にとどまるメッセージ用には、`createEventBus()`でプライベートなバスを作成します。

後から購読したものが読み取る必要がある状態（ストアやURLを使います）や、タブ間・iframe間のメッセージ（`BroadcastChannel`、`postMessage`を使います）には、別の手段を選んでください。

## クイックスタート

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

interface CartUpdated {
  itemCount: number;
  total: number;
}

const bus = getGlobalBus();

// header app
const stop = bus.on<CartUpdated>('cart:updated', ({ itemCount }) => {
  document.querySelector('#cart-count')!.textContent = String(itemCount);
});

// cart app
bus.emit<CartUpdated>('cart:updated', { itemCount: 3, total: 59.9 });

// header app, on unmount
stop();
```

オーケストレーターがマウントするマイクロアプリは、マウントコンテキストでバスを受け取ります。

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

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | イベントごとのリスナー数のしきい値。この数に達した状態でさらに1つ追加すると、`on`が`console.warn`を出力します。警告はバスの存続期間中、イベント名ごとに1回です。リスナーはどちらの場合も追加されます。`0`で警告を無効にします。この警告は`debug`の影響を受けません。 |
| `debug` | `boolean` | `false` | すべての購読、購読解除、emitを`logger`経由でログに出力します。 |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | デバッグメッセージを受け取ります。各メッセージには`[Tuvix EventBus]`が前置されます。`maxListeners`の警告はこれを経由しません。 |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

`handler`を`event`に購読させ、購読を解除する関数を返します。`T`はペイロードの型を指定しますが、バスは実行時にこれを検査しません。

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

`on`と同様ですが、最初の呼び出しの前にハンドラーを削除します。イベントが発生する前にキャンセルするには、返された関数を呼び出します。バスはラッパーを保存するため、`off(event, handler)`ではこのハンドラーは見つかりません。

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

`event`のすべてのハンドラーを購読順に呼び出し、続いてすべての`onAny`ハンドラーを呼び出します。これらはすべて`emit`が戻る前に実行されます。例外を投げたハンドラーは`console.error('[Tuvix EventBus] Error in handler for "<event>":', error)`でログに出力され、残りのハンドラーは引き続き実行されます。

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

ハンドラーを1つ削除します。未知のイベントやハンドラーは無視されます。

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

`event`を指定すると、そのイベントのすべてのハンドラーを削除します。指定しない場合は、すべてのイベントのすべてのハンドラーと、すべての`onAny`ハンドラーを削除します。

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

すべてのイベントを購読します。ハンドラーは`(eventName, data)`を受け取ります。ログ出力やdevtoolsに使います。

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

`onAny`ハンドラーを削除します。

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

購読状況を調べます。`onAny`ハンドラーは数に含まれず、`eventNames()`はハンドラーが1つ以上あるイベントのみを列挙します。

#### `destroy()`

```ts no-check
destroy(): void;
```

すべてのハンドラーを削除し、バスを破棄済みとしてマークします。その後、`on`、`once`、`emit`、`onAny`は`[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.`を投げます。オーケストレーターは`destroy()`でプライベートなバス（`eventBus`オプションから作成したもの）を破棄し、グローバルバスは残します。

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

`IEventBus`として型付けされた`new EventBus(options)`を返します。上の表のオプションを受け付けます。

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

ページの共有バスを返します。最初の呼び出しでバスを作成します。バスは`window.__TUVIX_GLOBAL_BUS__`に保持されるため、`@tuvix.js/event-bus`の独自のコピーをバンドルしたマイクロアプリもシェルと同じインスタンスを取得します。`options`はバスを作成する呼び出しでのみ適用されます。`window`のないサーバー上では、バスはモジュールレベルのシングルトンです。

`createOrchestrator`に`eventBus`オプションを渡さない限り、オーケストレーターはこのバスを使います。そのため`orchestrator.getEventBus() === getGlobalBus()`になります。

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

グローバルバスを破棄し、`window.__TUVIX_GLOBAL_BUS__`をクリアします。次の`getGlobalBus()`で新しいバスが作成されます。古いインスタンスを保持していたコード（オーケストレーターを含む）は、その後`emit`で例外を投げます。テストの合間に呼び出してください。

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### 型

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| 型 | 説明 |
| --- | --- |
| `EventHandler<T>` | 1つのイベントのハンドラー。 |
| `WildcardHandler<T>` | `onAny`のハンドラー。イベント名とデータを受け取ります。 |
| `Unsubscribe` | `on`、`once`、`onAny`が返す関数。 |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`。 |
| `IEventBus` | `EventBus`が実装するインターフェース。上に挙げたすべてのメソッドを持ちます。`@tuvix.js/loader`の`MicroAppBus`を満たします。 |

## エッジケース

- **emitごとのスナップショット。** `emit`は最初にハンドラーリストをコピーします。emit中に追加されたハンドラーは次のemitから実行され、emit中に削除されたハンドラーは現在のemitでは引き続き実行されます。
- **同じ関数を2回登録。** 1つの関数を同じイベントに2回購読させても保存されるのは1回で、1回の`off`で削除されます。
- **非同期ハンドラー。** `emit`は返されたPromiseを待ちません。rejectされたPromiseはバスの`try`/`catch`をすり抜け、未処理のrejectionとして現れます。
- **不正な入力。** `on`、`once`、`emit`は、`''`または空白文字のみのイベント名に対して`[Tuvix EventBus] Event name must be a non-empty string.`を投げます。`on`と`onAny`は、ハンドラーが関数でない場合に`[Tuvix EventBus] Handler must be a function.`を投げます。`once`は先にハンドラーをラップするため、関数でない値も受け付けてしまい、最初の`emit`で失敗します。そのエラーはバスがログに出力します。
- **`destroy()`の後。** `off`、`offAll`、`offAny`、`hasListeners`、`listenerCount`、`eventNames`は引き続き動作し、空のバスとして結果を返します。
- **バージョンの混在。** `@tuvix.js/event-bus` 0.4をバンドルしたマイクロアプリは独自のモジュールレベルのバスを保持し、共有バスを参照しません。
- **リスナーの上限。** `maxListeners: 20`の場合、1つのイベントに21個目のハンドラーを追加すると`[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.`が出力されます。バスは存続期間中、イベント名ごとに1回だけ警告するため、ハンドラーを削除して再度追加しても2回目の警告は出ません。
- **iframe。** 各windowはそれぞれ独自の`__TUVIX_GLOBAL_BUS__`を持ちます。

## 対象外のこと

- イベント名による型付けは行いません。イベントマップも、拡張用の`TuvixEvents`インターフェースもありません。ペイロードの型は`on<T>`と`emit<T>`で渡してください。
- イベントを再送しません。`emit`の後に購読したハンドラーはそのイベントを受け取りません。
- `user:*`のようなパターンには一致させません。`onAny`はすべてのイベントを受け取ります。
- 他のタブ、ウィンドウ、iframeにはメッセージを送りません。

## 0.4からの移行

- `getGlobalBus()`はシングルトンを`window.__TUVIX_GLOBAL_BUS__`に保持するようになりました。0.4では、バンドルされたパッケージのコピーごとに独自の「グローバル」バスが作成されていたため、独自のコピーを持つマイクロアプリにはシェルのイベントが届きませんでした。現在は、どのコピーから`resetGlobalBus()`を呼び出しても、すべてのコピーのバスがリセットされます。
- 0.4版のこのページには`clear(event?)`、`createEventBus<EventMap>()`、`TuvixEvents`インターフェースが記載されていました。これらはいずれも存在しませんでした。`offAll(event?)`と、呼び出しごとのジェネリクス`on<T>` / `emit<T>`を使ってください。
