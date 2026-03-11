---
layout: home

hero:
  name: Tuvix.js
  text: マイクロフロントエンドフレームワーク
  tagline: LightweightでフレームワークAgnosticなOrchestrator。React、Vue、Svelte、Angular、Vanilla JSでスケーラブルかつ独立してデプロイ可能なフロントエンドアプリを構築しましょう。
  image:
    src: /logo.svg
    alt: Tuvix.js
  actions:
    - theme: brand
      text: はじめ方
      link: /ja/guide/getting-started
    - theme: alt
      text: GitHubで見る
      link: https://github.com/yasinatesim/tuvix.js
    - theme: alt
      text: パッケージ
      link: /ja/packages/

features:
  - icon: 🔧
    title: フレームワーク非依存
    details: React、Vue、Svelte、Angular、Vanilla JSのマイクロアプリを1つのシェルで混在させられます。
  - icon: 📦
    title: ランタイム依存ゼロ
    details: 全パッケージのランタイム依存関係はゼロ。Tree-shakeableでLightweightです。
  - icon: 🔀
    title: ビルトインルーティング
    details: URLベースのマイクロアプリ起動。ルート変更で自動マウント・アンマウント。
  - icon: 📡
    title: イベントバス
    details: 共有グローバルなしでマイクロアプリ間の型付きPub/Sub通信。
  - icon: 🔒
    title: CSS & JSサンドボックス
    details: Shadow DOMスタイル分離とJSプロキシスコープ分離。スタイル漏れを防止。
  - icon: ⚡
    title: 動的ロード
    details: キャッシュ・リトライ・エラーバウンダリ付きでオンデマンドにマイクロアプリを読み込み。
---

## クイックインストール

```bash
npm install tuvix.js
```

## 14パッケージ · 10言語 · MITライセンス

<PackagesOverview />
