---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Viteアイランドアセット"
  description="アイランドが必要とするスタイルシートとJSチャンクをサーバーレンダラーに伝えるViteプラグインです。サーバーレンダリングされたheadがそれらをリンクするため、アイランドは最初の描画時からスタイル適用済みになります。"
  icon="⚡"
  npm="true"
/>

## インストール

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

このプラグインにはVite 6または7が必要です（peer range `^6.0.0 || ^7.0.0`）。テストスイートはVite 6で実行されます。

## 使いどころ

アイランド（React、Vue、Svelte、Angular、または素のDOM）をサーバーレンダリングすると、そのマークアップはJavaScriptより先にブラウザに届きます。ViteはCSS Modules、Vue SFCの`<style>`ブロック、SvelteのスタイルをそのJavaScript経由で配信するため、ブラウザはバンドルが実行されるまでアイランドをスタイルなしで描画します。`@tuvix.js/vite`を使うと、サーバーは「`src/islands/footer/index.ts`が必要とするスタイルシートはどれか」を問い合わせ、それらの`<link>`タグを`<head>`に出力します。

アイランドをクライアントでのみレンダリングする場合や、すべてのアイランドをすでにカバーするグローバルスタイルシートを1つリンクしている場合は、使う必要はありません。

## クイックスタート

クライアントビルドとSSRビルドに使うViteの設定にプラグインを追加します。

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

サーバーエントリーでアセットを要求し、`<head>`に出力します。

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

先にクライアントをビルドし、次にサーバーをビルドします。SSRビルドはクライアントのマニフェストを読み取ります。

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

3つのViteプラグインを返します。

- `tuvix:assets`は`virtual:tuvix/assets`を提供します。
- `tuvix:client-build-info`（ビルド時のみ）は、クライアントのマニフェストの隣に`.vite/tuvix-client.json`を書き込みます。[本番ビルド](#production-builds)を参照してください。
- `tuvix:dev-css-handoff`（devサーバーのみ）は、スタイルの適用をサーバーレンダリングされた`<link>`からVite自身の`<style>`タグへ引き継ぎます。

返された配列は、上のように`plugins`に入れてください。Viteはネストしたプラグイン配列をフラットにします。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | クライアントビルドの出力ディレクトリ。Viteのルートからの相対パスまたは絶対パスです。SSRビルドは`<clientOutDir>/.vite/manifest.json`を読み取り、なければ`<clientOutDir>/manifest.json`にフォールバックします。 |
| `base` | `string` | 仮想モジュールをロードするビルドまたはdevサーバーのVite `base` | ブラウザがクライアントのアセットをロードする公開base。vinxiの`/_build`のように、クライアントがサーバーバンドルとは異なるbaseで配信される場合に設定します。 |

TanStack Startとvinxiは、クライアントルーターのビルドを`/_build`配下の別フォルダーに書き込みます。

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

`virtual:tuvix/assets`からエクスポートされます。

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

アイランドのエントリーモジュールを、`'src/islands/footer/index.ts'`のようにViteのルートからの相対パスで渡します。先頭の`./`や`/`は無視されます。複数のエントリーを渡すと、エントリーの順にリストをマージし、重複を取り除きます。

devサーバーは各モジュールのimportを読み取る前にそのモジュールを変換する必要があるため、`getAssets`はPromiseを返します。サーバーコードからのみ呼び出してください。

### `renderAssetTags(assets)`

`virtual:tuvix/assets`からエクスポートされます。

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

`assets.css`のURLごとに`<link rel="stylesheet">`タグを1つ、続いて`assets.modulepreload`のURLごとに`<link rel="modulepreload" crossorigin>`タグを1つ返します。`href`の値はHTMLエスケープされます。サーバーでもブラウザでも動作します。

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

| 型 | エクスポート元 | 意味 |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | `tuvix()`のオプション：`clientOutDir?`、`base?`。 |
| `TuvixAssets` | `@tuvix.js/vite`、`virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`。`css`はカスケード順です。devでは`modulepreload`は空です。 |
| `@tuvix.js/vite/client` | 型エントリー | `virtual:tuvix/assets`モジュールを宣言します。`compilerOptions.types`に追加するか、`/// <reference types="@tuvix.js/vite/client" />`で参照してください。 |

## 本番ビルド {#production-builds}

- クライアントビルドでは、自分で`build.manifest`を設定していない限り、プラグインが`build.manifest`を有効にします。
- クライアントビルドは、マニフェストの隣に`{ modules, sharedCss }`という形の`.vite/tuvix-client.json`も書き込みます。`modules`は、各エントリーと`import()`の対象（Viteのルートからの相対パス）を、Rollupがそれを入れたチャンクに対応付けます。`sharedCss`には、`build.cssCodeSplit: false`のビルドの単一スタイルシートが記載されます。
- SSRビルドでは、クライアントのマニフェストと`tuvix-client.json`を読み取り、エントリー（`isEntry`）または動的エントリー（`isDynamicEntry`）であるマニフェストのすべてのキーからそのURLへのマップをインライン化します。
- Rollupは、2つの動的エントリーを1つのチャンクにまとめることがあります。たとえば、ページと、アダプターが`import()`でロードするフレームワークのランタイムです。するとViteのマニフェストはそのチャンクを`_Page-<hash>.js`というキーで記録し、どちらのソースも記載しません。プラグインは`tuvix-client.json`の`modules`を通じてそのチャンクを見つけます。
- `build.cssCodeSplit: false`の場合、ViteはすべてのCSSを、どのマニフェストのチャンクにも記載されない1つの`style-<hash>.css`に書き込みます。`getAssets`は、すべてのエントリーについて、エントリー自身のCSSより前にそのファイルを返します。
- `tuvix-client.json`がない場合（`tuvix()`なしでビルドしたクライアント）、解決されるのは独自のマニフェストキーを持つモジュールだけです。どのチャンクにも記載されない`style.css`のマニフェストアセットは、引き続き`cssCodeSplit: false`の単一スタイルシートとして扱われます。
- 各エントリーについて、エントリーチャンクと、それが静的にimportするすべてのチャンク（推移的に）、およびそれらのCSSを収集します。importされたチャンクのCSSは、エントリー自身のCSSより前に来ます。これはViteがロードする順序です。
- `modulepreload`には、エントリーチャンクとその静的importが記載されます。URLは`base + file`です。
- Viteは`import()`の対象のチャンクとそのCSSを、importが実行されたときにのみロードするため、マップはそれらをスキップします。遅延モジュールがサーバーでレンダリングされる場合は、そのパスを別のエントリーとして`getAssets`に渡してください。
- 後でブラウザがアイランドのチャンクをロードするとき、Viteのpreloadヘルパーはサーバーが出力した`<link>`を見つけ、2つ目を追加しません。

## devサーバー

- `getAssets`は、devサーバーのクライアントモジュールグラフを各エントリーから静的importに沿ってimport順にたどります。`/src/islands/footer/footer.module.css?direct`のようなURLを返します。Viteは`?direct`のリクエストに素のCSSで応答します。Vueのブロックは`/src/App.vue?direct&vue&type=style&index=0&...&lang.css`として返ります。
- アイランドが仮想モジュール経由で到達するCSSも収集されます。`\0virtual:theme.css`のような仮想スタイルシートは`/@id/__x00__virtual:theme.css?direct`として返るため、それを提供するプラグインはクエリ付きのidをロードできなければなりません。
- アイランドのJavaScriptが実行されると、ViteはCSSモジュールごとに独自の`<style>`を注入します。すると`tuvix:dev-css-handoff`プラグインが、同じhrefを持つサーバーレンダリングされた`<link>`に`link.sheet.disabled = true`を設定するため、古いルールのコピーがHMRによる編集を上書きすることはありません。`<link>`要素はDOMに残るため、ハイドレートされたReactの`<head>`からは変化が見えません。
- CSSを編集すると、`tuvix:dev-css-handoff`は`?direct`のスタイルシートをHMRの更新から除外します。するとViteは、ページをリロードせず、`<link>`を差し替えることもなく、自身の`<style>`を更新します。制限が2つあります。
  - CSS Modulesの編集はハッシュ付きのクラス名を変えるため、アイランド自身のHMR（React Fast Refresh、Vue）が再レンダリングする必要があります。
  - ページがまだJavaScriptをロードしていないアイランドは、リロードするまでサーバーのスタイルシートを使い続けます。
- devでは`modulepreload`は常に空です。
- `getAssets`は同じNodeプロセス内のdevサーバーとやり取りします。`ssrLoadModule`とViteのデフォルトのmodule runnerで動作し、`server.restart()`をまたいでも動作し続けます。

## エッジケース

- ビルドの入力でもクライアントビルドの`import()`の対象でもないエントリーは、`[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>`でrejectされます。アイランドを`build.rollupOptions.input`に追加するか、クライアントコードから`import()`でロードしてください。
- クライアントのマニフェストがないと、SSRビルドは`[tuvix] No client manifest in <dir>`で失敗します。先にクライアントをビルドするか、`clientOutDir`を修正してください。
- devでは、SSRのコードが別のプロセスやワーカーランタイムで実行される場合、またはdevサーバーが閉じた後、`getAssets`は`found no running Vite dev server with the tuvix() plugin in this process`でrejectされます。
- `virtual:tuvix/assets`のブラウザ向けビルドでは、`getAssets`は`runs during server rendering only`でrejectされます。クライアントバンドルは自身のマニフェストを知ることができません。
- devでは、走査は`/node_modules/`配下のモジュールには入りません。自分のコードがパッケージからimportするスタイルシートは収集されますが、パッケージが自身のJavaScriptからimportするスタイルシートは収集されません。
- `'./'`のような相対的な`base`は相対URLを生成し、ネストしたルートで壊れます。絶対的なbaseを使ってください。
- Svelte：`vite-plugin-svelte`のデフォルトである`emitCss: true`を維持してください。`compilerOptions.css: 'injected'`ではスタイルがJavaScript内に置かれ、プラグインはリンクすべきスタイルシートを見つけられません。

## しないこと

- HTMLにタグを書き込みません。`renderAssetTags`の出力をどこに置くかはあなたが決めます。
- `import()`の連鎖はたどりません。サーバーでレンダリングされる遅延モジュールは、それぞれ独立したエントリーとして渡してください。
- カスタムのマニフェストファイル名（`build.manifest: 'name.json'`）はサポートしません。`true`を使ってください。
- アイランドのレンダリングやハイドレーションは行いません。[`@tuvix.js/react`](/ja/packages/react)（`TuvixIsland`）、[`@tuvix.js/vue`](/ja/packages/vue)、[`@tuvix.js/svelte`](/ja/packages/svelte)などのアダプターと組み合わせてください。
