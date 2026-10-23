# マイクロアプリ

マイクロアプリは、`mount`関数と`unmount`関数を持つモジュールです。シェルはコンテナ要素とプロパティを渡して`mount`を呼び出し、アプリはその要素内にレンダリングします。アプリがページから離れるべきときにシェルが`unmount`を呼び出し、アプリはレンダリングしたものを削除します。

## モジュールの形状

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  bootstrap: async () => {},
  mount: async ({ container, props, name, bus }) => {
    container.textContent = `${name ?? 'app'} mounted`;
    void props;
    void bus;
  },
  update: async ({ props, container }) => {
    if (container) container.dataset.props = JSON.stringify(props);
  },
  unmount: async ({ container }) => {
    container.replaceChildren();
  },
};
```

| フック | 必須 | 呼び出されるタイミング |
| --- | --- | --- |
| `bootstrap()` | いいえ | 最初の読み込み後、最初の`mount`の前に1回。 |
| `mount({ container, props, name, bus })` | はい | アプリがアクティブになるたび。 |
| `update({ props, container })` | いいえ | アプリがマウントされている間にシェルが`updateAppProps`を呼び出したとき。 |
| `unmount({ container })` | はい | アプリが非アクティブになるたび。 |

各フックはPromiseを返すことができます。オーケストレーターは次のステップに進む前にそれを待ちます。

## 手書きで作成する

`defineMicroApp`はフックを検証し、モジュールを`name`で登録し、コンテナ上で`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`をディスパッチして、モジュールを返します：

```ts
import { defineMicroApp } from '@tuvix.js/core';

let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'notifications',

  mount({ container, props, bus }) {
    const list = document.createElement('ul');
    container.replaceChildren(list);
    off = bus?.on<{ text: string }>('notify', ({ text }) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    container.dataset.user = String(props?.user ?? '');
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.replaceChildren();
  },
});
```

マウントコンテキストの`bus`を使ってください。これはオーケストレーターのバスで、シェルが`eventBus`オプションを渡していない限り`getGlobalBus()`です。

## アダプターを使う

アダプターはコンポーネントからモジュールを構築し、本来なら自分で書く必要がある細かい処理を引き受けます：

- コンテナごとに1つのフレームワークインスタンスを保持するため、1つのモジュールを複数の場所にマウントできます。
- `update`は再マウントせずに新しいプロパティで再レンダリングします。
- `mount`の読み込み中に届いた`unmount`は、完了を待ってから空のコンテナを残します。
- コンテナ上で`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`イベントを発生させます。
- `ssr: true`を渡すと、サーバーレンダリングされたマークアップをハイドレートします。

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## モジュールをローダーに公開する

オーケストレーターは、アプリの`entry`を通じてモジュールを取得します：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

// Bundled with the shell, code-split by your bundler.
orchestrator.register({
  name: 'cart',
  entry: () => import('./apps/cart'),
  container: '#cart',
  activeWhen: '/shop/*',
});

// Deployed on its own. The script registers itself by name.
orchestrator.register({
  name: 'notifications',
  entry: { scripts: ['https://cdn.example.com/notifications/main.js'], type: 'module' },
  container: '#notifications',
  activeWhen: '/',
});
```

URLのエントリーの場合、モジュールは`registerModule(name, module)`を呼び出す（アダプターと`defineMicroApp`は呼び出します）か、`mount`関数を持つUMDグローバルを公開する必要があります。ローダー関数は、モジュールまたは`{ default: module }`に解決されるだけで十分です。

## プロパティを渡す

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

await orchestrator.updateAppProps('profile', { theme: 'light' });
// The app now has { userId: '42', theme: 'light' }.
```

- プロパティはシャローマージされます。キーを削除するには、`undefined`を設定します。
- アプリがマウント済みで`update`を持つ場合、オーケストレーターはそれを呼び出し、完了後に解決します。`update`がリジェクトされると、アプリは`error`ステータスになり、`onError`が呼び出されます。
- アプリがマウントされていない場合、または`update`を持たない場合、オーケストレーターは次回のマウントのためにマージ後のプロパティを保存します。アプリを再マウントすることはありません。

## 1つのモジュールを複数の場所にマウントする

アダプターはコンテナごとに別々のインスタンスを保持します。`TuvixIsland`や独自のコードから、同じモジュールで2つのコンテナに対して`mount`を呼び出せます：

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Price from './Price.vue';

const price = createVueMicroApp({ name: 'price', App: Price });

const first = document.querySelector<HTMLElement>('#price-1');
const second = document.querySelector<HTMLElement>('#price-2');
if (first && second) {
  await price.mount({ container: first, props: { sku: 'a' } });
  await price.mount({ container: second, props: { sku: 'b' } });
  await price.update?.({ props: { sku: 'c' }, container: second }); // only #price-2
}
```

`container`を指定しない場合、`update`はそのモジュールのすべてのマウントを更新します。オーケストレーターは常に`container`を渡します。

## ビルドとデプロイ

各アプリをESモジュールバンドルとしてビルドして`type: 'module'`で登録するか、IIFE/UMDバンドルとしてビルドしてそのURLをクラシックスクリプトとして登録します。Viteの場合：

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Leave dependencies bundled unless the shell provides them.
  },
});
```

フレームワークのコピーに注意してください。それぞれがReactをバンドルする2つのマイクロアプリは、Reactを2回配信します。各アプリが独自のルートをレンダリングするため、ページは問題なく動作します。1つのコピーを共有するには、import maps、Module Federation（`@tuvix.js/module-federation`）を使うか、ローダー関数のエントリーを通じてシェルにアプリをバンドルさせます。

## マイクロアプリがしてはいけないこと

- コンテナの外に書き込むこと。Tuvix.jsはこれを止めず、そのコンテナに次に入るアプリはそれを想定していません。
- `unmount`の後にリスナー、タイマー、サブスクリプションを残すこと。
- `bootstrap`が複数回実行されることを前提にすること。`bootstrap`は読み込まれたモジュールごとに1回だけ実行されます。
