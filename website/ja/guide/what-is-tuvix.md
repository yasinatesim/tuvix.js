# Tuvix.jsとは？

Tuvix.jsは、ブラウザ向けのマイクロフロントエンドツールキットです。ホストページ（シェル）がマイクロアプリを登録すると、Tuvix.jsは各アプリのコードを読み込み、コンテナにマウントし、プロパティを渡し、URLやコードの指示に応じてアンマウントします。各マイクロアプリはReact、Vue、Svelte、Angularのいずれか、またはフレームワークなしで作成でき、各チームはそれぞれのスケジュールでアプリをビルドしてデプロイできます。

## できること

- **マイクロアプリをオーケストレーションします。** `createOrchestrator()`はアプリのレジストリを保持します。アプリごとに現在のパスからマウントすべきかどうかを判断し、リコンサイルを一度に1つずつ実行するため、コンテナを共有する2つのアプリが重なることはありません。
- **コードを必要なときに読み込みます。** アプリの`entry`には、スクリプトURL、スクリプトとスタイルシートのリスト、または`() => import('./dashboard')`のような関数を指定できます。ローダーは失敗した読み込みを再試行し、遅い読み込みを中断します。
- **URLでルーティングします。** `activeWhen: '/dashboard/*'`は、`/dashboard`とその配下のすべてのパスでアプリをマウントします。組み込みのルーターを使うことも、`connectRouter()`でTanStack RouterやReact Routerに追従することもできます。
- **フレームワークに適応します。** `createReactMicroApp`、`createVueMicroApp`、`createSvelteMicroApp`、`createAngularMicroApp`は、ルートコンポーネントを`mount`、`update`、`unmount`を持つモジュールに変換します。
- **Reactページ内でアイランドをホストします。** `TuvixIsland`は、サーバーレンダリングされたReactツリー内にVue、Svelte、Angular、Reactのマイクロアプリをマウントし、サーバーHTMLを二重に送信することなくハイドレートします。[SSRアイランド](/ja/guide/ssr-islands)を参照してください。
- **ライフサイクルを通知します。** アダプターと`defineMicroApp`は`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`のDOMイベントをディスパッチし、`whenMounted(name)`はアプリがページに表示されると解決します。[ライフサイクルイベント](/ja/guide/lifecycle-events)を参照してください。
- **アプリ同士をつなぎます。** 各アプリが`@tuvix.js/event-bus`の独自のコピーをバンドルしている場合でも、ページ上のすべてのアプリは`getGlobalBus()`を通じて1つのイベントバスを共有します。
- **必要に応じてCSSを分離します。** `sandbox: true`はアプリをShadow Root内にレンダリングするため、ページのCSSとアプリのCSSが分離されたままになります。

## 使うべき場面

複数のチームが1つのページの各部分を提供し、それぞれ個別にデプロイする必要がある場合や、レガシーアプリを別のフレームワークで書き直したアプリと並行して動かし続けたい場合に、Tuvix.jsを使ってください。サーバーレンダリングを行うReactサイト内にVueやSvelteのウィジェットを組み込みたい単一チームにも適しています。

## 使うべきでない場面

- 1つのチーム、1つのフレームワーク、1つのデプロイ：通常のシングルページアプリのほうがシンプルです。
- アプリ間に厳密なセキュリティ分離が必要な場合。Tuvix.jsはすべてのアプリを同じJavaScriptレルムで実行します。`@tuvix.js/sandbox`の`JsSandbox`はプロキシ経由で行われたグローバルへの書き込みを隠しますが、アプリが`window`にアクセスすることは防げません。信頼できないコードには`<iframe>`を使ってください。
- すべてのアプリで状態を共有する単一のバンドルが必要な場合。マイクロアプリは設計上、イベントとプロパティを通じて通信します。

## パッケージ

| パッケージ | 用途 |
| --- | --- |
| `tuvix.js` | core、router、event bus、loader、sandboxを1回のインストールで導入 |
| `@tuvix.js/core` | `createOrchestrator`、`defineMicroApp` |
| `@tuvix.js/router` | `createRouter`、`matchPath`、`interceptLinks` |
| `@tuvix.js/loader` | エントリーの読み込みとライフサイクルランタイム（`whenMounted`、`onLifecycle`） |
| `@tuvix.js/event-bus` | `createEventBus`、`getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`、`JsSandbox` |
| `@tuvix.js/react`、`vue`、`svelte`、`angular` | フレームワークアダプター、`TuvixIsland`（React） |
| `@tuvix.js/vite` | サーバーレンダリングされる`<head>`向けのアイランドのスタイルシートリンク |
| `@tuvix.js/server` | HTMLフラグメントのサーバーサイドでの合成 |
| `@tuvix.js/module-federation` | webpack Module Federationのリモートから読み込むエントリー |
| `@tuvix.js/devtools` | ページ内デバッグパネル |
| `create-tuvix-app` | プロジェクトのスキャフォールディング |

## 主要な概念

| 用語 | 意味 |
| --- | --- |
| シェル | オーケストレーターを作成し、レイアウトを管理するホストページ |
| マイクロアプリ | `mount`と`unmount`（およびオプションの`bootstrap`、`update`）を持つモジュール |
| エントリー | ローダーがマイクロアプリを取得する場所：URL、`{ scripts, styles }`、またはローダー関数 |
| コンテナ | マイクロアプリのレンダリング先となる要素 |
| アイランド | ホストがサーバーレンダリングし、クライアントがその場でハイドレートするマイクロアプリ |
| イベントバス | ページ上のすべてのアプリが共有するpub/subチャネル |

## 次のステップ

- [はじめに](/ja/guide/getting-started)では、シェルと2つのマイクロアプリを構築します。
- [アーキテクチャ](/ja/guide/architecture)では、ナビゲーションがどのようにマウントにつながるかを説明します。
- 0.4から移行する場合は、[0.5への移行](/ja/guide/migration-0-5)をお読みください。
