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

# with-react-router

`@tuvix.js/router` を活用した **URL ベースのマイクロアプリルーティング**をデモします。Dashboard、Profile、Settings の 3 つの独立した React マイクロアプリが特定のルートに登録され、ユーザーのナビゲーションに応じて自動的にマウント/アンマウントされます。

## 使用パッケージ

| パッケージ | 役割 |
|---|---|
| `@tuvix.js/core` | Shell Orchestrator（ルーターエンジンを内蔵） |
| `@tuvix.js/router` | History/Hash モードルーティング |
| `@tuvix.js/react` | `createReactMicroApp` ファクトリ |

## 構成

```
with-react-router/
├── index.html          ← アクティブリンクのハイライト付きナビバー
├── vite.config.ts
├── src/
│   ├── shell.ts        ← 3 つのルートを登録し、アクティブ nav クラスを同期
│   └── apps/
│       ├── dashboard/  ← /dashboard でアクティブ
│       ├── profile/    ← /profile でアクティブ
│       └── settings/   ← /settings でアクティブ
```

## はじめ方

### npx 経由（推奨）

```bash
npx create-tuvix-app@latest --example with-react-router my-app
cd my-app
npm install
npm run dev
```

### 手動クローン

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

[http://localhost:5173/dashboard](http://localhost:5173/dashboard) を開き、ナビリンクを使用してください。

## 主なコンセプト

- **ルートマッチング** - 各 `activeWhen` パターンは `window.location.pathname` と照合されます。グロブパターン（`/dashboard/*`）によりマイクロアプリが自身のサブルートを制御できます。
- **History モード** - `#` なしのクリーンな URL のために HTML5 History API を使用します。
- **バンドル重複なし** - 常にアクティブなマイクロアプリのコードのみが実行されます。
