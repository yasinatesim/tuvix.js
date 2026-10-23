# @tuvix.js/react

> ReactコンポーネントをTuvix.jsのマイクロアプリに変換し、任意のマイクロアプリをSSRハイドレーション付きでReactツリー内にホストします。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。

## インストール

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

React 18以降が必要です。

## クイックスタート

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

このモジュールは`@tuvix.js/loader`の`registerModule`を通じて`'dashboard'`という名前で自身を登録するため、スクリプトの読み込み後にオーケストレーターがこれを見つけます。オーケストレーターには`() => import('./dashboard')`のような`entry`、`container`、`props`を渡します。

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | レジストリ名です。ライフサイクルイベントはこの名前を持ちます。 |
| `App` | `ComponentType<P>` | 必須 | ルートコンポーネントです。マウント時のpropsを受け取り、必須propsも型チェックを通ります。 |
| `bootstrap` | `() => void \| Promise<void>` | なし | 一度だけ実行するセットアップです。 |
| `ssr` | `boolean` | `false` | コンテナがサーバーのマークアップ（要素または空白以外のテキスト）を含む場合、`hydrateRoot`でハイドレートします。 |

- コンテナごとに独自のReactルートを持つため、1つのモジュールを複数の場所にマウントできます。
- `mount({ container, props })`は最初のコミットの後に解決し、`hydrated`を付けて`tuvix:mounted`をディスパッチします。
- `update({ props, container })`は1つのコンテナを再レンダリングします。`container`を省略するとすべてのコンテナを再レンダリングします。コンポーネントの状態は保持されます。
- `unmount({ container })`はルートをアンマウントし、コンテナを空にして`tuvix:unmounted`をディスパッチします。
- `react-dom/client`は`mount`の中で遅延読み込みされるため、サーバーバンドルからこのモジュールをインポートできます。

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })`と同じです。オプションは`name`、`App`、`bootstrap`です。`TuvixReactApp`と同じツリーをレンダリングするため、`TuvixReactApp`のマークアップを不一致なくハイドレートします。

### `TuvixIsland`

任意のマイクロアプリモジュール（Vue、Svelte、Angular、React、または手書きの`{ mount, unmount, update? }`）をReactツリー内にホストします。

| プロパティ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | `data-tuvix-app`に書き込まれ、`mount`に渡されます。 |
| `app` | `MicroAppModule` | 必須 | マウントするモジュールです。 |
| `props` | `Record<string, unknown>` | `{}` | 浅く比較されます。変化があると`app.update({ props, container })`を呼び出し、モジュールに`update`がない場合は再マウントします。 |
| `ssrHtml` | `string` | なし | アイランドのサーバーレンダリング済みHTMLです。サーバー側でのみ渡します。 |
| `fallback` | `ReactNode` | `null` | `mount`または`update`がrejectしたときにレンダリングされます。 |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | ラッパーのタグです。 |
| `className` | `string` | なし | ラッパーのクラスです。 |

手書きの`<div dangerouslySetInnerHTML={{ __html }} />`ブリッジは、親の次の再レンダリングでマイクロアプリのDOMとリスナーを失います。Reactは新しい`{ __html }`オブジェクトのたびに`innerHTML`を再代入するためです。`TuvixIsland`はこのオブジェクトを一度だけ作成します。ハイドレーション中は`data-tuvix-island`属性（`useId`から生成）で自身の要素を見つけ、ページからHTMLを読み戻すため、クライアントでは`ssrHtml`は不要です。`name`または`app`が新しくなると再マウントし、削除時には`app.unmount`を呼び出します。呼び出しは順に実行されるため、アンマウントは保留中のマウントを待ちます。

```tsx
// Layout.tsx, rendered on the server with footerHtml and on the client without it
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

Reactマイクロアプリを、ホストのツリー内の`<div data-tuvix-app={name}>`の中にインラインでレンダリングします。

| プロパティ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | モジュールの`name`と一致させる必要があります。 |
| `App` | `ComponentType<P>` | 必須 | レンダリングするコンポーネントです。 |
| `fallback` | `ReactNode` | `null` | `App`がサスペンドしている間、または例外を投げた後に表示されます。 |
| その他のプロパティ | `P` | `P`で必須のもの | `App`に渡されます。 |

`App`はエラーバウンダリと`<Suspense fallback>`の中に置かれます。サーバーでのレンダリングエラーはこのアプリだけを`fallback`に置き換え、Reactはクライアントで再試行します。クライアントでのレンダリングエラーは`fallback`を表示し、`tuvix:error`をディスパッチします。`tuvix:mounted`（`hydrated`付き）と`tuvix:unmounted`をディスパッチします。

### `useTuvixBus(bus, event, handler)`

エフェクト内で購読し、アンマウント時に購読を解除します。最新の`handler`はrefに保持されるため、レンダリングのたびに再購読することはありません。`@tuvix.js/event-bus`の`getGlobalBus()`を渡します。アダプターはオーケストレーターのバスを`App`に渡しません。

### `useTuvixProps(initialProps, bus?, updateEvent?)`

`bus`上の`updateEvent`（デフォルトは`'tuvix:props:update'`）の各ペイロードをマージしたpropsを返します。Tuvixのどの部分もこのイベントを発行しないため、自分で発行します。`createReactMicroApp`のモジュールは、このフックなしで`update`を通じて新しいpropsを受け取ります。

### 型

`ReactMicroAppConfig<P>`、`TuvixIslandProps`、`TuvixReactAppProps<P>`。

## エッジケース

- 最初のレンダリングで例外が発生すると、`mount`はrejectし、コンテナを空にして`tuvix:error`をディスパッチします。後のレンダリングで例外が発生すると、再マウントするまでアプリは空になります。
- 保留中の`mount`の間に呼ばれた`unmount`は、その完了を待ってからコンテナを空のままにします。
- モジュールがすでに保持しているコンテナへの`mount`は、Vue、Svelte、Angularのアダプターと同様に、古いルートをアンマウントし（`tuvix:unmounted`をディスパッチ）、新しいpropsで新規にレンダリングします。
- 未知のコンテナに対する`unmount`と`update`は何もしません。
- Reactが`TuvixIsland`を削除すると、要素が切り離された後にモジュールが`tuvix:unmounted`を報告します。イベントは`document`に送られる（`detail.container`が設定される）ため、`document`のリスナーと`onLifecycle`はこれを受け取ります。コンテナやその祖先のリスナーは受け取りません。アプリのコンテナが1つもマウントされていない状態になると、`isMounted(name)`は`false`になります。
- 開発環境の`<StrictMode>`では、Reactはアイランドのマウントのエフェクトを2回実行しますが、アイランドは破棄される最初の実行をスキップします。モジュールは一度だけマウントされ、サーバーのマークアップを引き継ぎます。
- マウントが失敗した後に新しい`app`または`name`を渡すと、空の要素にマウントします。失敗したアプリのサーバーHTMLを受け取ることはありません。

## 対象外の機能

- URLからのモジュールの読み込み。`@tuvix.js/core`または`@tuvix.js/loader`を使います。
- 文字列へのレンダリング。`react-dom/server`を使うか、`ssrHtml`用に`renderVueToString`などを使います。
- アイランドのCSSの読み込み。`@tuvix.js/vite`を使います。

## 0.5の破壊的変更

- `TuvixReactApp`のサーバーHTMLにSuspenseのコメントマーカーが含まれるようになりました。サーバーとクライアントを同時にアップグレードします。
- 最初のレンダリングで例外が発生すると`mount`はrejectします。
- モジュールがマウントしていないコンテナに対する`unmount`は何もしません。

完全なドキュメント：[tuvix.js.org/packages/react](https://tuvix.js.org/packages/react)

## ライセンス

MIT
