# イベントバス

`@tuvix.js/event-bus`は同期的なpublish/subscribeチャネルです。同じページ上のアプリは、互いのコードをインポートせずに、何が起きたか（「カートが更新された」「ユーザーがログアウトした」）を伝え合うためにこれを使います。

## バスを選ぶ

| バス | 取得方法 | 使う場面 |
| --- | --- | --- |
| グローバルバス | `getGlobalBus()` | デフォルト。ページ上のすべてのアプリが、どのバンドルからでも同じインスタンスを取得します。 |
| オーケストレーターのバス | `orchestrator.getEventBus()`またはマウントコンテキストの`bus` | マイクロアプリの内部。シェルが`eventBus`オプションを渡していない限り、グローバルバスと同じです。 |
| プライベートバス | `createEventBus(options)` | テスト、または1つのアプリだけが使うチャネル。 |

`getGlobalBus()`はインスタンスを`window.__TUVIX_GLOBAL_BUS__`に保持します。それぞれが`@tuvix.js/event-bus`をバンドルしている2つのマイクロアプリでも、同じインスタンスを共有します。`window`のないサーバー上では、モジュールのコピーごとに別のインスタンスを持ちます。

## イベントの発行と購読

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit`は、戻る前にすべてのハンドラーを呼び出します。例外を投げたハンドラーは`console.error`でログに出力され、残りのハンドラーは引き続き実行されます。キューには何も入りません。`emit`の後に購読したハンドラーは、そのイベントを受け取りません。

## 型付きイベント

`on`、`once`、`emit`のジェネリクスでペイロードに型を付けます。プロジェクト全体で使うイベントマップには、バスをラップします。

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

## マイクロアプリでバスを使う

マウントコンテキストからバスを受け取り、`unmount`で購読を解除します。

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

ReactとVueのコンポーネントでは`useTuvixBus(bus, event, handler)`を使えます。これはコンポーネントがアンマウントされるときに購読を解除します。[Reactで使う](/ja/guide/react)と[Vueで使う](/ja/guide/vue)を参照してください。

## onceとワイルドカード

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

`onAny`のハンドラーは、オーケストレーターの`tuvix:app:*`イベントを含むすべてのイベントについて、名前付きハンドラーの後に実行されます。

## リスナーを削除する

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // one handler
bus.offAll('ping'); // every handler for 'ping'
bus.offAll(); // every handler, wildcards included
```

グローバルバスで`offAll()`を呼び出すのは、ページ全体を管理している場合だけにします。他のアプリのリスナーも削除されます。

## エラーと破棄されたバス

- `on`、`once`、`emit`、`onAny`は、イベント名が空の場合やハンドラーが関数でない場合に例外を投げます。
- `bus.destroy()`の後は、購読や発行を行うすべてのメソッドが例外を投げます。`resetGlobalBus()`はグローバルバスを破棄し、次の`getGlobalBus()`の呼び出しで新しいバスが作成されます。
- `orchestrator.destroy()`が破棄するのはプライベートバスだけです。

## イントロスペクション

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## バスが行わないこと

- イベントの永続化や再送は行いません。現在の状態はプロパティとして渡すか、後から読み込まれたアプリに、所有者が応答するイベントで問い合わせさせます。
- ウィンドウ、タブ、iframeをまたぎません。その用途には`BroadcastChannel`または`postMessage`を使います。
- 実行時にペイロードを検証しません。ジェネリクスはコンパイル時のみ有効です。
