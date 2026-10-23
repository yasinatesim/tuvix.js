# @tuvix.js/vite

> アイランドのCSSとmodulepreloadリンクを、サーバーレンダリングされた`<head>`に配置するViteプラグイン

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。完全なドキュメント：[tuvix.js.org/packages/vite](https://tuvix.js.org/packages/vite)。

マイクロアプリのアイランドをサーバーレンダリングすると、そのマークアップはJavaScriptより先にブラウザに届きます。ViteはアイランドのCSS（CSS Modules、Vue SFCの`<style>`、Svelteのスタイル）をそのJavaScriptの中に含めて配信するため、最初の描画ではスタイルのないマークアップが表示されます。このプラグインは各アイランドに必要なスタイルシートをサーバーに伝えるため、それらを`<head>`でリンクできます。

Viteでアイランドをサーバーレンダリングする場合に使ってください。アイランドをクライアントでのみレンダリングする場合は不要です。

## インストール

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Vite 6または7が必要です。テストスイートはVite 6で実行しています。

## クイックスタート

クライアントビルドとSSRビルドで使うVite設定にプラグインを追加します。

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

仮想モジュールの型を`tsconfig.json`に追加します。

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

サーバーエントリーでアセットを取得し、`<head>`に出力します。

```ts
// src/entry-server.ts
/// <reference types="@tuvix.js/vite/client" />
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { renderFooter } from './islands/footer/render';

export async function render(): Promise<string> {
  const assets = await getAssets(['src/islands/footer/index.ts']);
  return `<!doctype html>
<html>
  <head>${renderAssetTags(assets)}</head>
  <body><footer data-tuvix-app="footer">${await renderFooter()}</footer></body>
</html>`;
}
```

先にクライアントをビルドし、次にサーバーをビルドします。

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

3つのプラグインを返します：`tuvix:assets`（`virtual:tuvix/assets`を提供）、`tuvix:client-build-info`（ビルド時のみ。クライアントビルドで`.vite/tuvix-client.json`を書き出します）、`tuvix:dev-css-handoff`（開発サーバーのみ）。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | クライアントビルドの出力ディレクトリ。Viteのrootからの相対パス、または絶対パス。SSRビルドは`<clientOutDir>/.vite/manifest.json`、次に`<clientOutDir>/manifest.json`を読み込みます。 |
| `base` | `string` | Viteの`base` | ブラウザがクライアントアセットを読み込む公開ベース。クライアントがサーバーバンドルとは異なるベースから配信される場合に設定します。 |

TanStack Startやvinxiでは、プラグインにクライアントルーターの出力先とベースを指定します。

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

`virtual:tuvix/assets`から提供されます。アイランドのエントリーモジュールを、`'src/islands/footer/index.ts'`のようにViteのrootからの相対パスで渡します。先頭の`./`や`/`は無視されます。複数のエントリーを渡すと、`getAssets`はリストをエントリー順にマージし、重複を取り除きます。サーバー専用です。

### `renderAssetTags(assets: TuvixAssets): string`

`virtual:tuvix/assets`から提供されます。`css`に対する`<link rel="stylesheet">`タグ、続いて`modulepreload`に対する`<link rel="modulepreload" crossorigin>`タグを返します。属性値をエスケープし、サーバーとブラウザの両方で動作します。

`<head>`がReactコンポーネントの場合は、リストを自分でレンダリングします。

```tsx
import type { TuvixAssets } from '@tuvix.js/vite';

export function IslandAssets({ assets }: { assets: TuvixAssets }) {
  return (
    <>
      {assets.css.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {assets.modulepreload.map((href) => (
        <link key={href} rel="modulepreload" crossOrigin="" href={href} />
      ))}
    </>
  );
}
```

### 型

| 型 | 意味 |
| --- | --- |
| `TuvixViteOptions` | `tuvix()`のオプション。 |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`。`css`はカスケード順で、`modulepreload`は開発時には空です。 |

## 本番ビルド

- `build.manifest`を自分で設定していない限り、プラグインはクライアントビルドで`build.manifest`を有効にします。
- SSRビルドではクライアントマニフェストを読み込み、各エントリーと動的エントリーからそのURLへのマップをインライン化します。
- クライアントビルドはマニフェストの隣に`.vite/tuvix-client.json`も書き出します。これは各エントリーと`import()`の対象を、Rollupがそれを配置したチャンクに対応付けます。Rollupは2つの動的エントリーを1つのチャンクにまとめることがあります。たとえば、ページと、アダプターが`import()`で読み込むフレームワークランタイムです。その場合、Viteのマニフェストはそのチャンクを`_Page-<hash>.js`というキーで記録し、どちらのソースも列挙しないため、プラグインは`tuvix-client.json`を使ってチャンクを見つけます。このファイルがない場合（`tuvix()`なしでビルドしたクライアント）は、マニフェストに専用のキーを持つモジュールだけが解決されます。
- `build.cssCodeSplit: false`の場合、ViteはすべてのCSSを、どのマニフェストチャンクにも列挙されない1つの`style-<hash>.css`に書き出します。`getAssets`はすべてのエントリーに対してこのファイルを返します。
- 各エントリーについて、エントリーチャンクと、それが静的にimportするすべてのチャンクを、そのCSSとともに収集します。importされたチャンクのCSSはエントリー自身のCSSより前に来ます。これはViteが読み込む順序です。
- `import()`の対象はスキップします。Viteはそれらのチャンクとそれらに対応するCSSを、importが実行されたときにのみ読み込むためです。遅延モジュールをサーバーでレンダリングする場合は、そのパスも`getAssets`に渡してください。
- URLは`base`で始まります。後でブラウザがアイランドのチャンクを読み込むとき、Viteのプリロードヘルパーは既存の`<link>`を見つけ、2つ目を追加しません。

## 開発サーバー

- `getAssets`は、開発サーバーのクライアントモジュールグラフを各エントリーから静的importに沿ってたどり、`/src/islands/footer/footer.module.css?direct`のようなURLを返します。Viteは`?direct`リクエストにプレーンなCSSで応答します。
- アイランドが仮想モジュール経由で到達するCSSも動作します。`\0virtual:theme.css`のような仮想スタイルシートは`/@id/__x00__virtual:theme.css?direct`として返されるため、それを提供するプラグインはクエリ付きのidを読み込める必要があります。
- アイランドのJavaScriptが実行されると、ViteはCSSモジュールごとに独自の`<style>`を挿入します。プラグインはそこで、対応するサーバーレンダリング済みの`<link>`を`link.sheet.disabled`で無効にするため、古いルールのコピーがHMRでの編集を上書きすることはありません。`<link>`要素はDOMに残り、ハイドレートされたReactの`<head>`には変化が見えません。
- CSSを編集すると、プラグインは`?direct`のスタイルシートをHMR更新から除外します。Viteはページを再読み込みせず、`<link>`も差し替えずに自身の`<style>`を更新します。CSS Modulesの編集ではハッシュ付きのクラス名が変わるため、アイランド自身のHMR（React Fast Refresh、Vue）で再レンダリングする必要があります。ページがまだJavaScriptを読み込んでいないアイランドは、再読み込みするまでサーバーのスタイルシートを使い続けます。
- 開発時の`modulepreload`は常に空です。

## エッジケース

- ビルドの入力でもクライアントビルドの`import()`対象でもないパスに対して、`getAssets`はrejectします。アイランドを`build.rollupOptions.input`に追加するか、クライアントコードから`import()`で読み込んでください。
- クライアントマニフェストがない場合、SSRビルドは`[tuvix] No client manifest in <dir>`で失敗します。
- 開発時の`getAssets`には、同じNodeプロセス内の開発サーバー（`ssrLoadModule`またはViteのデフォルトのモジュールランナー）が必要です。SSRコードが別のプロセスやワーカーランタイムで実行される場合、または開発サーバーが閉じた後はrejectします。`server.restart()`をまたいでも動作し続けます。
- クライアントバンドルは自身のマニフェストを知ることができないため、`virtual:tuvix/assets`のブラウザビルドはrejectする`getAssets`をexportします。
- 開発時、ウォーカーは`/node_modules/`配下のモジュールには降りていかないため、パッケージが自身のJavaScriptからimportするCSSは収集されません。
- `'./'`のような相対的な`base`は相対URLを生成し、ネストしたルートで壊れます。絶対的なベースを使ってください。
- Svelte：`vite-plugin-svelte`のデフォルトの`emitCss: true`を維持してください。`compilerOptions.css: 'injected'`ではスタイルがJavaScript内に含まれ、プラグインはリンクするスタイルシートを見つけられません。

## 対象外の機能

- HTMLへのタグの書き込みは行いません。配置場所はあなたが決めます。
- `import()`のチェーンはたどりません。
- カスタムのマニフェストファイル名（`build.manifest: 'name.json'`）はサポートしません。`true`を使ってください。
- アイランドのレンダリングやハイドレートは行いません。`@tuvix.js/react`（`TuvixIsland`）、`@tuvix.js/vue`、`@tuvix.js/svelte`などのアダプターを使ってください。

## ライセンス

MIT
