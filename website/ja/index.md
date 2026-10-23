---
layout: home

# Every visible string on the home page comes from this frontmatter, so a
# locale only needs a translated copy of this file. Field reference:
# website/.vitepress/theme/components/home/model.ts

# The Orbit sections replace the markdown body on this page, so the body
# stays empty. Keep the flag: without it OrbitHome renders an empty, bordered
# content block above the footer.
markdownContent: false

hero:
  name: Tuvix.js
  badge: TypeScriptマイクロフロントエンド · MIT
  title: たくさんのアプリを。
  accent: ひとつの体験に。
  tagline: Tuvix.jsは、React、Vue、Svelte、Angular、vanilla JSのマイクロアプリを1つのホストページにマウントします。ルーティング、イベントバス、サンドボックス、サーバーレンダリングは個別のパッケージとして提供され、必要になったときに追加できます。
  image:
    src: /logo.svg
    alt: Tuvix.jsロゴ
  actions:
    - theme: brand
      text: はじめに
      link: /ja/guide/getting-started
    - theme: alt
      text: Playgroundを試す
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: コマンドをコピー
    copiedLabel: コピーしました

showcase:
  file: src/orchestrator.ts
  copyLabel: コピー
  copiedLabel: コピーしました
  shellTitle: ホストシェル
  routeLabel: URL
  mountedLabel: マウント済み
  busLabel: 共有イベントバス

featuresSection:
  title: Tuvix.jsに含まれるもの
  lead: 8つの構成要素があります。統合パッケージtuvix.jsをインストールすると中核の5つが手に入り、シェルの成長に合わせて個別のパッケージを追加できます。

features:
  - icon: layers
    title: フレームワーク非依存
    details: React、Vue、Svelte、Angular、vanilla JSのマイクロアプリを1つのシェルで並べて実行できます。
    link: /ja/guide/micro-apps
    linkText: マイクロアプリガイド
  - icon: box
    title: サードパーティのランタイム依存なし
    details: 各パッケージは他の@tuvix.jsパッケージにのみ依存します。インストールするのはimportするものだけです。
    link: /ja/packages/
    linkText: すべてのパッケージ
  - icon: route
    title: 組み込みルーティング
    details: ルーターはURLの変化に応じて、historyモードまたはhashモードでアプリをマウント・アンマウントします。
    link: /ja/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: イベントバス
    details: アプリはグローバルを共有せずに、型付きイベントをpublish・subscribeします。
    link: /ja/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: CSSとJSのサンドボックス
    details: Shadow DOMは各アプリのスタイルをそのコンテナ内に閉じ込めます。JsSandboxは、破棄できるProxy windowに対してスクリプトを実行します。
    link: /ja/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: 動的ロード
    details: ローダーはアプリのバンドルをオンデマンドで取得し、キャッシュし、失敗したロードを再試行します。
    link: /ja/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: ページ内パネルに、登録済みのアプリ、アクティブなルート、イベントバスの通信が一覧表示されます。
    link: /ja/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: サーバーレンダリング
    details: マイクロアプリをサーバーでレンダリングし、そのHTMLを文字列またはストリームとしてシェルのテンプレートに組み込みます。
    link: /ja/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  eyebrow: アダプター
  title: フレームワークを選ぶ
  lead: 各アダプターは、コンポーネントをオーケストレーターがマウント、更新、アンマウントできるマイクロアプリに変換します。
  copyLabel: インストールコマンドをコピー
  copiedLabel: コピーしました
  items:
    - name: React
      details: createReactMicroAppがコンポーネントをラップします。useTuvixPropsとuseTuvixBusでpropsとイベントを読み取ります。
      install: npm i @tuvix.js/react
      link: /ja/guide/react
    - name: Vue
      details: createVueMicroAppはVue 3アプリをマウントし、propsとイベントバス用のコンポーザブルを提供します。
      install: npm i @tuvix.js/vue
      link: /ja/guide/vue
    - name: Svelte
      details: createSvelteMicroAppはSvelte 3、4、5のコンポーネントをマウントします。
      install: npm i @tuvix.js/svelte
      link: /ja/guide/svelte
    - name: Angular
      details: createAngularMicroAppはAngular 15以降のコンポーネントをコンテナにブートストラップします。
      install: npm i @tuvix.js/angular
      link: /ja/guide/angular
    - name: Vanilla JS
      mark: JS
      color: vanilla
      details: defineMicroAppは素のJavaScriptにmount、unmount、updateのフックを提供します。
      install: npm i @tuvix.js/core
      link: /ja/guide/micro-apps

packages:
  eyebrow: パッケージ
  title: 15のパッケージ、それぞれ独自のバージョン
  lead: まずは統合パッケージから始めましょう。インストールを小さくしたいときは個別のパッケージに切り替えます。
  items:
    - name: tuvix.js
      details: core、router、event bus、loader、sandboxを含む統合パッケージです。
      link: /ja/packages/tuvix
    - name: '@tuvix.js/core'
      details: オーケストレーターです。マイクロアプリを登録し、そのライフサイクルを実行します。
      link: /ja/packages/core
    - name: '@tuvix.js/router'
      details: historyモードまたはhashモードで、URLに応じてマイクロアプリを有効化します。
      link: /ja/packages/router
    - name: '@tuvix.js/event-bus'
      details: マイクロアプリ間の型付きpublish/subscribeです。
      link: /ja/packages/event-bus
    - name: '@tuvix.js/loader'
      details: キャッシュと再試行付きで、アプリのバンドルをオンデマンドでロードします。
      link: /ja/packages/loader
    - name: '@tuvix.js/sandbox'
      details: Shadow DOMによるCSS分離と、ProxyによるJS分離を提供します。
      link: /ja/packages/sandbox
    - name: '@tuvix.js/server'
      details: ホストページのためのサーバーサイドでの合成とストリーミングを提供します。
      link: /ja/packages/server
    - name: '@tuvix.js/module-federation'
      details: Webpack Module Federationのリモートからマイクロアプリをロードします。
      link: /ja/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: アプリ、ルート、イベントのためのページ内デバッグパネルです。
      link: /ja/packages/devtools
    - name: '@tuvix.js/react'
      details: Reactアダプター、フック、サーバーレンダリング用ヘルパーです。
      link: /ja/packages/react
    - name: '@tuvix.js/vue'
      details: Vue 3アダプター、コンポーザブル、サーバーレンダリング用ヘルパーです。
      link: /ja/packages/vue
    - name: '@tuvix.js/svelte'
      details: サーバーレンダリングに対応したSvelteアダプターです。
      link: /ja/packages/svelte
    - name: '@tuvix.js/angular'
      details: サーバーレンダリングに対応したAngularアダプターです。
      link: /ja/packages/angular
    - name: '@tuvix.js/vite'
      details: アイランドのCSSとmodulepreloadリンクをSSRのheadに挿入するViteプラグインです。これにより、サーバーレンダリングされたマイクロアプリが最初の描画時からスタイル適用済みになります。
      link: /ja/packages/vite
    - name: create-tuvix-app
      details: コマンドラインから新しいホストとマイクロアプリのプロジェクトを生成します。
      link: /ja/packages/create-tuvix-app

footer:
  tagline: React、Vue、Svelte、Angular、vanilla JSのためのマイクロフロントエンドオーケストレーター。
  columns:
    - title: ドキュメント
      links:
        - text: はじめに
          link: /ja/guide/getting-started
        - text: アーキテクチャ
          link: /ja/guide/architecture
        - text: 設定
          link: /ja/guide/configuration
        - text: Playground
          link: /playground
    - title: パッケージ
      links:
        - text: Core
          link: /ja/packages/core
        - text: Router
          link: /ja/packages/router
        - text: イベントバス
          link: /ja/packages/event-bus
        - text: すべてのパッケージ
          link: /ja/packages/
    - title: プロジェクト
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: リリース
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: コントリビュート
          link: /ja/contributing
  copyright: MIT License · © 2026 Yasin ATEŞ
---
