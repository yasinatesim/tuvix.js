# @tuvix.js/vue

> Vue 3コンポーネントを、リアクティブなprops、コンテナごとに1つのVueアプリ、SSRハイドレーションを備えたTuvix.jsのマイクロアプリに変換します。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。

## インストール

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

サーバーレンダリングを行う場合は、オプションのpeer依存である`@vue/server-renderer`もインストールしてください。

## クイックスタート

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

このモジュールは`@tuvix.js/loader`の`registerModule`を通じて`'settings'`という名前で自身を登録するため、スクリプトの読み込み後にオーケストレーターがこれを見つけます。`App`はオーケストレーターのpropsをコンポーネントのpropsとして受け取ります。`defineProps`で宣言してください。

## API

### `createVueMicroApp(config)`

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | レジストリ名。ライフサイクルイベントにはこの名前が含まれます。 |
| `App` | `Component` | 必須 | ルートのVueコンポーネント。 |
| `plugins` | `VuePluginEntry[]` | なし | プラグイン、または`app.use(plugin, ...options)`に渡される`[plugin, ...options]`タプル。 |
| `bootstrap` | `() => void \| Promise<void>` | なし | 一度だけ実行するセットアップ。 |
| `ssr` | `boolean` | `false` | コンテナが要素または空白以外のテキストを含む場合、`createSSRApp`でサーバーマークアップをハイドレートします。 |

- コンテナごとに専用のVueアプリとpropsが作られるため、1つのモジュールを複数の場所にマウントできます。マウントのたびにプラグインが再インストールされます。
- `mount({ container, props })`は`hydrated`付きで`tuvix:mounted`をディスパッチします。
- `update({ props, container })`は`shallowReactive`なpropsオブジェクトのキーを置き換え（存在しないキーは削除されます）、`nextTick`の後に解決します。`container`を省略するとすべてのマウントを更新します。コンポーネントのstateは保持されます。
- `unmount({ container })`はアプリをアンマウントし、コンテナを空にして`tuvix:unmounted`をディスパッチします。

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })`と同じです。オプションは`name`、`App`、`plugins`、`bootstrap`です。Vueは`renderVueToString`のマークアップを引き継ぎ、空のコンテナには通常のレンダリングを行います。

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

`@tuvix.js/vue/server`から提供されます。クライアントと同じルートラッパーで`App`をレンダリングしたHTMLを返すため、ハイドレーションが一致し、サーバー上でも`inject('tuvixProps')`が動作します。Vueは`teleports`と`modules`を`ssrContext`に書き込みます。

サーバー専用です。アイソモーフィックなルートローダーではなく、サーバー関数から呼び出してください。ブラウザでは`''`を返し、これをimportするローダーはVueのサーバーレンダラーをクライアントに含めてしまいます。

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'`です。ツリー内のどのコンポーネントでも、`inject(TUVIX_PROPS_KEY)`は`update`が書き込むリアクティブなpropsオブジェクトを返します。

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

`onMounted`で購読し、`onUnmounted`で購読を解除し、早期に購読を解除するための関数を返します。`@tuvix.js/event-bus`の`getGlobalBus()`を渡してください。アダプターはオーケストレーターのバスを`App`に渡しません。

### `useTuvixProps(initialProps, bus?, updateEvent?)`

`bus`上の`updateEvent`（デフォルトは`'tuvix:props:update'`）の各ペイロードをマージする`ShallowRef<T>`を返します。Tuvixはこのイベントを発行しないため、自分で発行します。オーケストレーターのpropsには`defineProps`または`inject(TUVIX_PROPS_KEY)`を使ってください。

### 型

`@tuvix.js/vue`の`VueMicroAppConfig`、`VueSsrMicroAppConfig`、`VuePluginEntry`。`@tuvix.js/vue/server`の`VueSsrContext`。

## エッジケース

- `mount`中のsetup、レンダリング、フックのエラーは、開発ビルドでも本番ビルドでもrejectします。アダプターは失敗したアプリをアンマウントし、`tuvix:error`をディスパッチします。プラグインの`app.config.errorHandler`も引き続き実行されます。
- モジュールがすでに保持しているコンテナに対する`mount`は、先に古いアプリをアンマウントします。
- モジュールが一度もマウントしていないコンテナに対する`unmount`は何もしません。
- ルートコンポーネントが宣言していないpropsは、ルート要素の属性としてフォールスルーします。
- `ssr: true`の場合、空白またはコメントだけを含むコンテナは新しくレンダリングされます。

## 対象外の機能

- Vue 2のサポート。
- URLによるモジュールの読み込み。`@tuvix.js/core`または`@tuvix.js/loader`を使ってください。
- サーバー上でのCSSの収集やHTMLのストリーミング。スタイルシートのリンクには`@tuvix.js/vite`を使ってください。

## 0.5の破壊的変更

- `update()`は`app.config.globalProperties.$tuvixProps`に書き込まなくなりました。`defineProps`または`inject('tuvixProps')`を使ってください。
- モジュールが一度もマウントしていないコンテナに対する`unmount()`は何もしません。以前はコンテナをクリアしていました。
- `VueSsrMicroAppConfig`は`ssr`を受け付けなくなりました。

完全なドキュメント：[tuvix.js.org/packages/vue](https://tuvix.js.org/packages/vue)

## ライセンス

MIT
