<p align="center">
  <a href="./README.md">🇬🇧 English</a> ·
  <a href="./README.tr.md">🇹🇷 Türkçe</a> ·
  <a href="./README.es.md">🇪🇸 Español</a> ·
  <a href="./README.de.md">🇩🇪 Deutsch</a> ·
  <a href="./README.fr.md">🇫🇷 Français</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.zh.md">🇨🇳 中文</a> ·
  <a href="./README.it.md">🇮🇹 Italiano</a> ·
  <a href="./README.pt.md">🇧🇷 Português</a> ·
  <a href="./README.hi.md">🇮🇳 हिंदी</a>
</p>

# with-react

**React 18** と **Vite** で構築されたマイクロフロントエンドシェルの完全な例。Tuvix.js オーケストレーターが独立した React マイクロアプリをどのようにロード、マウント、アンマウントするかを示します。

## 使用パッケージ

| パッケージ | 役割 |
|---|---|
| `@tuvix.js/core` | シェルオーケストレーター |
| `@tuvix.js/react` | `createReactMicroApp` ファクトリ |
| `@tuvix.js/event-bus` | 共有イベントバス |

## はじめに

### npx を使用（推奨）

```bash
npx create-tuvix-app@latest --example with-react my-app
cd my-app
npm install
npm run dev
```

### 手動クローン

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

[http://localhost:5173/home](http://localhost:5173/home) を開きます。

## 主要コンセプト

- **`createReactMicroApp`** - React コンポーネントを `bootstrap`、`mount`、`unmount`、`update` フックを持つ Tuvix.js 互換モジュールにラップします。
- **Props の受け渡し** - シェルは `{ theme, user }` props を `home` アプリに渡します。
- **ライフサイクル** - 各アプリはルートがアクティブな場合にのみマウントされます。
