# Tuvix.js への貢献

貢献に興味を持っていただきありがとうございます！バグ修正、新機能、ドキュメントの改善、翻訳など、すべての貢献を歓迎します。

## 貢献の方法

- **バグレポート** - [Issue を作成](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **機能リクエスト** - [ディスカッションを開始](https://github.com/yasinatesim/tuvix.js/issues)
- **コード** - バグ修正、機能追加、テストの改善
- **ドキュメント** - 誤字の修正、例の追加、明確さの向上
- **翻訳** - 他の言語のドキュメントを追加または改善

## はじめに

### 1. Fork と Clone

```bash
git clone https://github.com/YOUR_USERNAME/tuvix.js.git
cd tuvix.js
```

### 2. 依存関係のインストール

[pnpm](https://pnpm.io) と [Node.js ≥ 18](https://nodejs.org) を使用しています。

```bash
pnpm install
```

### 3. すべてのパッケージをビルド

```bash
pnpm build
```

### 4. テストの実行

```bash
pnpm test
```

### 5. ドキュメント開発サーバーの起動

```bash
cd website
pnpm install
pnpm dev
```

ブラウザで `http://localhost:5173` を開いてドキュメントをプレビューしてください。

## プロジェクト構成

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core
│   ├── router/         @tuvix.js/router
│   ├── event-bus/      @tuvix.js/event-bus
│   ├── loader/         @tuvix.js/loader
│   ├── sandbox/        @tuvix.js/sandbox
│   ├── react/          @tuvix.js/react
│   ├── vue/            @tuvix.js/vue
│   ├── svelte/         @tuvix.js/svelte
│   ├── angular/        @tuvix.js/angular
│   ├── devtools/       @tuvix.js/devtools
│   ├── server/         @tuvix.js/server
│   ├── module-federation/
│   ├── create-tuvix-app/
│   └── tuvix/          tuvix.js umbrella
└── website/
    ├── .vitepress/     VitePress 設定とテーマ
    ├── guide/          英語ドキュメント
    ├── packages/       パッケージ API ドキュメント
    ├── tr/             トルコ語翻訳
    ├── es/             スペイン語翻訳
    └── ...             その他の言語
```

## コードスタイル

- **TypeScript** - strict モード、すべてのコードに型付けが必要
- **Prettier** - `pnpm format` を実行してフォーマット
- **ランタイム依存関係なし** - パッケージはランタイム依存関係ゼロであること
- **名前付きエクスポート** - デフォルトエクスポートを避ける
- **エラーメッセージ** - `[Tuvix ...]` をプレフィックスとして付ける

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に従います：

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## プルリクエストのプロセス

1. `master` からブランチを作成：
   ```bash
   git checkout -b feat/my-feature
   ```

2. 変更を行い、テストを追加

3. 完全なテストスイートを実行：
   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. 公開済みパッケージに影響する変更の場合、changeset を追加：
   ```bash
   pnpm changeset
   ```

5. プッシュして `master` に対して PR を作成

6. メンテナーが PR をレビューします。7 日以内にフィードバックに返信してください。

## 翻訳の追加

すべてのドキュメントは `website/` 配下の Markdown です。各言語には独自のディレクトリがあります：

```
website/
├── index.md              ← 英語（ルート）
├── guide/                ← 英語ガイド
├── tr/                   ← トルコ語
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← スペイン語
└── ...
```

### 翻訳を追加または改善する手順

1. `website/guide/` から `website/<lang>/guide/` に英語ファイルをコピー
2. Markdown コンテンツを翻訳（コードブロックは英語のまま）
3. `website/.vitepress/config/<lang>.ts` のサイドバー設定を更新
4. `cd website && pnpm dev` を実行してプレビュー

::: tip 翻訳のヒント
- すべてのコード例は英語のまま保持
- UI ラベル、説明、解説テキストを翻訳
- 標準的な翻訳が存在する場合はネイティブの用語を使用
:::

## サポートされている言語

| 言語 | コード | ステータス |
|------|--------|------------|
| 英語 | `en` | 完了（リファレンス） |
| トルコ語 | `tr` | 進行中 |
| スペイン語 | `es` | 進行中 |
| ドイツ語 | `de` | 進行中 |
| フランス語 | `fr` | 進行中 |
| 日本語 | `ja` | 進行中 |
| 中国語 | `zh` | 進行中 |
| イタリア語 | `it` | 進行中 |
| ポルトガル語 | `pt` | 進行中 |
| ヒンディー語 | `hi` | 進行中 |

これらの言語に貢献したい場合は、[オープンな翻訳 Issue](https://github.com/yasinatesim/tuvix.js/labels/translation) を確認するか、新しい Issue を作成してください。

## 行動規範

このプロジェクトは [Contributor Covenant](https://www.contributor-covenant.org/) に従います。敬意を持ち、建設的であってください。

## ライセンス

貢献することにより、あなたの貢献が MIT ライセンスの下でライセンスされることに同意したものとみなされます。
