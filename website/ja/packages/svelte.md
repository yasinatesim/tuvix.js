---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Svelteバインディング"
  description="Svelte 3、4、5のコンポーネントをTuvix.jsのマイクロアプリに変換します。コンテナごとに1つのインスタンス、propsのその場での更新、サーバーのマークアップのハイドレーション、CSS付きのサーバーレンダリングを提供します。"
  icon="🔥"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

ピア範囲はSvelte 3、4、5をカバーします。このパッケージには2つのエントリーポイントがあります。ブラウザ用の`@tuvix.js/svelte`と、サーバーレンダリング用の`@tuvix.js/svelte/server`です。

## 使用する場面

SvelteコンポーネントをTuvix.jsのマイクロアプリとして動かす場合にこのパッケージを使います。オーケストレーターはルートに応じてそれをコンテナにマウントし、propsを渡し、更新し、ルートが変わるとアンマウントします。アイランドにも対応します。サーバーでコンポーネントをレンダリングしてHTMLをページに入れ、クライアントがそれをハイドレートします。

Svelteがページ全体を担う場合（SvelteKit）には不要です。その場合はSvelte自身がマウントを行い、やり取りするオーケストレーターは存在しません。

## クイックスタート

propsを持つSvelte 5コンポーネント：

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

マイクロアプリのエントリーでこれをラップします。`SvelteMap`を渡すと、propsの更新時にコンポーネントがその場で再レンダリングされます。

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

シェルはアプリを登録し、オーケストレーターを起動します。

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: the component re-renders in place, no remount.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

クライアントバンドルは`svelte`をブラウザ用ビルドに解決する必要があります。`@sveltejs/vite-plugin-svelte`がこれを行います。セットアップが`browser`エクスポート条件を落とすと、Svelte 5の`mount()`は`lifecycle_function_unavailable`を投げ、`onMount`は実行されません。

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | アプリ名です。アダプターは`@tuvix.js/loader`の`registerModule`でこの名前にモジュールを登録します。 |
| `App` | `unknown` | 必須 | ルートコンポーネントです。コンパイル済みのSvelte 5コンポーネント（関数）またはSvelte 3/4のコンポーネントクラスです。 |
| `bootstrap` | `() => void \| Promise<void>` | なし | 一度だけ実行するセットアップです。モジュールの`bootstrap()`はこれをawaitします。 |
| `ssr` | `boolean` | `false` | コンテナが要素または空白以外のテキストを含む場合、サーバーのマークアップをハイドレートします。それ以外は新規にレンダリングします。 |
| `SvelteMap` | `svelte/reactivity`の`SvelteMap`クラス | なし | Svelte 5専用です。指定すると`update()`はその場で再レンダリングします。指定しないと、Svelte 5の`update()`はコンポーネントを再マウントします。Svelte 3/4では無視されます。 |

最初のマウント時に、アダプターは`svelte`をインポートし、`mount`エクスポートの有無を確認します。結果はページ単位でキャッシュされます。

- **Svelte 5**（`mount`がある）：`mount()`でレンダリングし、`hydrate()`でハイドレートし、`unmount()`で破棄します。`update()`の動作は`SvelteMap`によって変わります。
  - `SvelteMap`がある場合、コンポーネントは`SvelteMap`に裏付けられたpropsオブジェクトを受け取ります。`update()`はそのマップに新しい値を書き込むため、変更されたpropを読むテンプレート部分だけが再レンダリングされ、コンポーネントはDOMノードと状態を保持します。これは`$props()`コンポーネントと、Svelte 5でコンパイルされたレガシーな`export let`コンポーネントの両方で動作します。
  - ない場合、`update()`はインスタンスをアンマウントし、コンテナを空にして、新しいpropsで新しいインスタンスをマウントし、`hydrated: false`を付けて再び`tuvix:mounted`をディスパッチします。DOMノード、フォーカス、コンポーネントの状態は失われます。
- **Svelte 3/4**（`mount`がない）：`new App({ target, props, hydrate })`、`$set()`、`$destroy()`を使います。

返されるモジュールはコンテナ単位で動作します。コンテナごとに独自のインスタンスを持つため、1つのモジュールを3つのコンテナに同時にレンダリングできます。

- `mount({ container, props })`はコンテナを空にし（ハイドレートする場合を除く）、レンダリングし、`onMount`コールバックとエフェクトを実行してから、コンテナ上で`hydrated: true | false`を付けて`tuvix:mounted`をディスパッチします。失敗すると`tuvix:error`をディスパッチし、元のエラーでrejectします。
- `update({ props, container? })`は`container`内のインスタンスを更新します。`container`を省略するとすべてのインスタンスを更新します。各更新はprops全体を置き換えます。新しいpropsにないキーは、Svelte 5ではコンポーネントのデフォルト値に戻り、Svelte 3/4では`undefined`になります。
- `unmount({ container })`はインスタンスを破棄し、コンテナを空にして`tuvix:unmounted`をディスパッチします。

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// Updates the sidebar instance only.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

`createSvelteMicroApp({ ...config, ssr: true })`と同じです。サーバーが`renderSvelteToString`または`renderSvelte`でレンダリングしたアイランドに対して、クライアントで使います。

- **Svelte 5**：`hydrate(App, { target, props })`。ハイドレーションは`svelte/server`が書き込むコメントマーカー（`<!--[-->`）を読むため、マークアップは`svelte/server`から得たものである必要があります。
- **Svelte 3/4**：`new App({ target, props, hydrate: true })`。コンポーネントは`hydratable: true`でコンパイルします。

ハイドレーションはサーバーのDOMノードを保持し、それにイベントハンドラーを付けます。空白またはコメントのみのコンテナには新規にレンダリングします。

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | なし | `svelte/server`の`render`です。省略すると、アダプターは実行時に`svelte/server`をインポートします。 |

サーバーでコンポーネントをレンダリングし、その`<style>`タグとそれに続くマークアップを返します。この文字列をアイランドのコンテナ内に入れ、`createSsrSvelteMicroApp`でマウントします。文字列には`<svelte:head>`の内容は含まれません。それが必要な場合は`renderSvelte`を使います。

この関数は実行時にSvelteのバージョンを判定します。`render`を渡した場合は常にSvelte 5の経路を取り、`render(App, { props })`を呼び出します。渡さない場合、アダプターは`svelte`をインポートし、そのモジュールが`mount`をエクスポートしていれば`svelte/server`を読み込んでSvelte 5でレンダリングします。そうでなければ`App.render(props)`（`generate: 'ssr'`でコンパイルされたSvelte 3/4）を呼び出し、`css.code`を`<style>`タグで囲みます。`dev: true`でコンパイルされたSvelte 5コンポーネント（serveモードのvite-plugin-svelte）は例外を投げる`App.render`スタブを持つため、アダプターは`App.render`の有無で判定することはありません。

ブラウザでも実行されるコードからではなく、サーバー関数から呼び出します。ブラウザでは`''`を返します。

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

`renderSvelteToString`と同じ引数とオプションを取り、各部分を個別に返します。

| フィールド | 説明 |
| --- | --- |
| `html` | コンポーネントのマークアップです。Svelte 5の出力にはハイドレーション用のコメントが含まれます。 |
| `head` | コンポーネントの`<style>`タグを除いた`<svelte:head>`の内容です。ドキュメントの`<head>`に入れます。 |
| `css` | `<style>`タグとしてのコンポーネントCSSです。コンパイラーが何も出力しなかった場合は`''`です。 |

ブラウザでは3つのフィールドすべてが`''`になります。

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### 型

| 型 | エントリー | 説明 |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | `createSvelteMicroApp`のオプションです。 |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`：オーケストレーターがコンポーネントに渡すpropsです。 |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`。 |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | `svelte/server`のSvelte 5 `render`の型です。 |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `renderSvelte`が返す`{ html, head, css }`です。 |

## サーバーレンダリング

アイランドは3つのステップを経ます。サーバーでレンダリングし、HTMLをコンテナ内に入れて送り、クライアントでハイドレートします。

1. サーバー関数で`renderSvelteToString`（または`renderSvelte`）を呼び出し、結果をコンテナ要素に入れます。
2. `createSsrSvelteMicroApp({ name, App })`をエクスポートするクライアントエントリーを読み込みます。
3. オーケストレーターが同じコンテナにアプリをマウントします。アダプターはマークアップを検出してハイドレートします。

**CSS。** Svelte 5がコンポーネントCSSをレンダリング出力に含めるのは、`css: 'injected'`でコンパイルした場合だけです。デフォルトの`css: 'external'`では、バンドラーがCSSをファイルに書き出し、文字列には`<style>`タグが含まれません。Viteでは次のようにします。

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

`css: 'external'`のままにする場合は、生成されたスタイルシートをページのheadからリンクします。[`@tuvix.js/vite`](/ja/packages/vite)は、アイランドのエントリーが必要とするスタイルシートをサーバーに伝えます。

**Svelteのコピーは1つにします。** サーバーバンドルがSvelteを含む場合（Nitro、Vinxi、`noExternal`を使ったVite SSRビルド）は、`svelte/server`の`render`を渡します。これにより、コンポーネントとレンダラーが1つのSvelteのコピーを共有します。このオプションがないと、アダプターは実行時に`svelte/server`をインポートし、`node_modules`から2つ目のコピーを読み込む可能性があります。Svelteのサーバーレンダラーは`instanceof`チェックを使うため、コンポーネントとレンダラーが別のコピーから来ていると失敗します。

## エッジケース

- 同じモジュールのインスタンスをすでに保持しているコンテナへの`mount`は、まず古いインスタンスをアンマウントします。
- `mount`がまだ`svelte`を読み込んでいる間に呼ばれた`unmount`は、マウントの完了を待ってからインスタンスを破棄します。孤立したコンポーネントは残りません。
- このモジュールがマウントしていない、またはマウントに失敗したコンテナに対する`unmount`は何もしません。コンテナの子要素は保持され、イベントも発生しません。
- マウントの保留中に呼ばれた`update`は、その完了を待ってからpropsを適用します。失敗したマウントに対する更新は何もしません。
- Svelte 3/4では、新しいpropsにないpropは`undefined`になります。`export let name = 'x'`のデフォルト値には戻りません。Svelte 5では`SvelteMap`の有無にかかわらずデフォルト値が適用されます。
- アダプター自身は`svelte/reactivity`をインポートしません。Svelte 3/4にはこのモジュールがなく、それを参照するSvelte 3/4アプリはバンドラーがビルドに失敗するため、インポートはSvelte 5のエントリー側に置きます。
- Svelte 5の再マウント（`SvelteMap`なし）は再び`tuvix:mounted`をディスパッチしますが、その間に`tuvix:unmounted`はディスパッチしません。新しいレンダリングが例外を投げた場合、`update()`はそのエラーでrejectし、古いインスタンスはすでに破棄されています。
- `ssr`なしの場合、`mount`はレンダリング前にコンテナを空にするため、読み込み中のプレースホルダーは消えます。
- `ssr`ありの場合、アダプターはコンテナに要素または空白以外のテキストがあるときにハイドレートします。コメントと空白だけの場合は新規にレンダリングします。
- アダプターはSvelteのバージョンをページごとに一度だけ判定します。`import('svelte')`が失敗した場合は、次のマウントで再試行します。
- サーバーでのSvelte 5のインポートエラーやレンダリングエラーは、rejectされたPromiseとして返ります。アダプターは`App.render`にフォールバックしません。
- Svelte 5の`render`はPromiseを返す場合があります（非同期サーバーレンダリング）。両方のサーバー関数がこれをawaitします。

## 対象外の機能

- `.svelte`ファイルはコンパイルしません。それはバンドラーが`@sveltejs/vite-plugin-svelte`または`svelte/compiler`で行います。
- バンドラーが選んだSvelteのビルドは確認しません。`svelte`をサーバー用ビルドに解決するクライアントバンドルは、マウント時に失敗します。
- 渡すのはpropsだけです。スロット、スニペット、コンポーネントイベントにはホストからの経路がありません。アプリ間の通信には[`@tuvix.js/event-bus`](/ja/packages/event-bus)を使います。
- `<svelte:head>`の内容をドキュメントに書き込みません。`renderSvelte`がそれを返すので、サーバーが`<head>`に入れます。
- `css: 'external'`でコンパイルされたCSSはリンクしません。[`@tuvix.js/vite`](/ja/packages/vite)を参照してください。
- サーバーでデータを待ちません。先にデータを読み込み、propsとして渡します。

## 0.4からの移行

- **Svelte 5が動作します。** 0.4のアダプターはすべてのコンポーネントで`new App()`を呼び出していたため、Svelte 5コンポーネントは失敗し、`createSsrSvelteMicroApp`はハイドレートせずに2つ目のコピーをレンダリングしていました。マウントにコードの変更は不要です。propsをその場で更新するには、設定に`svelte/reactivity`の`SvelteMap`を渡します。渡さない場合、Svelte 5の各更新はコンポーネントを再マウントします。
- **マウント時にコンテナが空になります。** `ssr`なしの場合、Svelte 3/4は以前、コンテナにすでにあるマークアップの後ろにコンポーネントを追加していました。現在はアダプターが先にコンテナを空にします。コンポーネントの隣にマークアップが残ることに依存していた場合は、それをコンテナの外に移します。
- **サーバーでの暗黙のフォールバックはありません。** `renderSvelteToString`は以前、`svelte/server`の読み込みに失敗すると`App.render`にフォールバックしていました。現在は`render`を渡した場合または`svelte`が`mount`をエクスポートしている場合にSvelte 5の経路を取り、`App.render`はSvelte 3/4でのみ呼び出し、Svelte 5のインポートエラーやレンダリングエラーではrejectします。ViteのdevモードSSRにおけるSvelte 5の開発ビルドは、`App.render`スタブを持っていてもSvelte 5の経路を取ります。
- **未知のコンテナに対する`unmount`は何もしません。** モジュールがマウントしていないコンテナに対する`unmount({ container })`は、以前はそのコンテナを空にしていました。現在はReact、Vue、Angularのアダプターと同様に、コンテナに手を加えません。
- **`render`を渡します。** サーバーバンドルがSvelteを含む場合は、第3引数として`svelte/server`の`{ render }`を追加します。

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

完全なアプリについては[Svelteガイド](/ja/guide/svelte)を参照してください。
