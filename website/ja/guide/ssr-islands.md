# SSRアイランド

アイランドとは、サーバーがReactページ内でHTMLにレンダリングし、ブラウザがそれぞれのフレームワークでハイドレートするマイクロアプリです。`@tuvix.js/react`の`TuvixIsland`を使うと、1つのReactホストにVue、Svelte、Angular、Reactのアイランドを載せられます。ユーザーはJavaScriptが実行される前にスタイル適用済みのコンテンツを目にし、各アイランドはそのフレームワークがロードされた時点でインタラクティブになります。

## 必要なもの

| 要素 | パッケージ | 実行場所 |
| --- | --- | --- |
| サーバーレンダリングを行うReactホストページ | あなたのアプリ（`react-dom/server`、TanStack Startなど） | サーバー + クライアント |
| `TuvixIsland`、`TuvixReactApp` | `@tuvix.js/react` | サーバー + クライアント |
| アイランドモジュール：`createSsrVueMicroApp`、`createSsrSvelteMicroApp`、`createSsrAngularMicroApp`、`createSsrReactMicroApp` | アダプター | クライアント |
| `renderVueToString`、`renderSvelteToString`、`renderAngularToString` | `@tuvix.js/<adapter>/server` | サーバーのみ |
| `getAssets`、`renderAssetTags` | `@tuvix.js/vite` | サーバーのみ |

オーケストレーターは関与しません。`TuvixIsland`がアイランドモジュールの`mount`、`update`、`unmount`を自ら呼び出します。

## リクエストの流れ

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Viteを設定する

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

TypeScriptが`virtual:tuvix/assets`を認識できるように、`compilerOptions.types`に`"@tuvix.js/vite/client"`を追加します。

## 2. アイランドモジュールを作成する

各アイランドは、アダプターの`Ssr`版で作成したモジュールをエクスポートします。これらのファイルはブラウザで実行されるため、サーバー用レンダラーをimportしてはいけません。

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. サーバーでアイランドのHTMLをレンダリングする

サーバー用レンダラーは、サーバーコードだけがimportするモジュールに置きます。

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

`render*ToString`関数はサーバー専用です。ブラウザでは`''`を返します。ブラウザで決して実行されないコードから呼び出してください：サーバーエントリー、APIルート、あるいはTanStack Startの`createServerFn`のようなフレームワークのサーバー関数です。アイソモーフィックなルートローダーからは呼び出さないでください。そのローダーはクライアント側のナビゲーション時にブラウザでも実行されて`''`を受け取り、さらにローダーがimportしているため、バンドラーがVue、Svelte、Angularのサーバー用レンダラーをクライアントに含めてしまいます。

## 4. アイランドをページに配置する

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

サーバーとクライアントには同じpropsを渡してください。サーバーが`{ start: 3 }`でレンダリングし、クライアントが`{ start: 4 }`でマウントすると、フレームワークはハイドレーションの不一致を検出します。

## 5. アイランドのCSSをheadでリンクする

ViteはCSS Modules、Vueの`<style>`ブロック、SvelteのスタイルをJavaScriptから注入します。何も対策をしないと、サーバーのHTMLがそのJavaScriptより先にブラウザに届き、最初の描画はスタイルなし（FOUC）になります。`getAssets`はエントリーが必要とするスタイルシートのURLを返すので、サーバーはそれらを`<head>`でリンクできます。

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- モジュールのパスはViteのルートからの相対パスで渡します。本番ビルドでは、各パスはビルドの入力か、クライアントビルド内の`import()`の対象でなければなりません。それ以外はrejectされます。
- Rollupが2つの`import()`対象を1つのチャンクにまとめると、マニフェストはそのチャンクをモジュールパスではなくハッシュ付きの名前で記録するため、`getAssets`はそのパスに対してrejectします。サンプルでは`@angular/core`がページのチャンクに入るとこの問題が起き、`@angular/core`に専用のチャンクを割り当てる`manualChunks`で解決しています。
- `getAssets`は静的importをたどり、`import()`の対象はスキップします。遅延importされ、かつサーバーでレンダリングされるページやアイランドは、リストに独自のエントリーが必要です。
- devでは`?direct`付きのCSS URLを返し、Viteが独自の`<style>`を注入すると対応する`<link>`を無効化するため、HMRによる編集が反映されます。
- Angularアイランドはスタイルをインラインで持ちます：`renderAngularToString`はコンポーネントの`<style>`タグをマークアップの前に配置します。
- Svelte：`css: 'injected'`でコンパイルする（スタイルはアイランドのHTMLにインライン化されます）か、`emitCss`を維持して`getAssets`でリンクするかのどちらかにします。両方は使いません。

## 6. クライアントでハイドレートする

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

クライアントはアイランドのHTMLなしでレンダリングします。各`TuvixIsland`はハイドレーション中にページから自身のマークアップを読み取り、Reactはそれらのノードを保持し、アイランドモジュールがそれらをハイドレートします。

## HTMLが二重に送信されない理由

素朴なアイランドは、サーバーのHTMLを両側でpropとして渡します。するとReactは`dangerouslySetInnerHTML`をハイドレートするためにクライアントでもその文字列を必要とし、HTMLはドキュメント内で一度、ハイドレーションデータ内でもう一度送られます。さらに、親が新しい`{ __html }`オブジェクトで再レンダリングするたびにReactは`innerHTML`を再代入し、アイランドのフレームワークが付与したDOMとリスナーを消し去ります。

`TuvixIsland`はこの両方を回避します。

- サーバーでは、`ssrHtml`を`<div data-tuvix-app={name} data-tuvix-island={id}>`に書き込みます。
- ハイドレーション中は、`useId`ベースの`data-tuvix-island`属性でその要素を見つけ、`innerHTML`を一度だけ読み取ります。クライアントは`ssrHtml`を必要としません。
- `{ __html }`オブジェクトをstateに保持するため、以降のレンダリングではReactに同じオブジェクトが渡され、Reactがアイランドの子要素を書き換えることはありません。

フレームワークがローダーのデータをどう扱うかは別の問題です。TanStack StartやRemixのローダーからアイランドのHTMLを返すと、フレームワークはそのローダーの結果もページにシリアライズします。ステップ4のように、サーバーエントリーが値を設定するReactコンテキストなど、フレームワークがシリアライズしない手段でHTMLをアイランドに渡してください。

## リクエストごとの状態 {#per-request-state}

サーバーコードは1つのプロセスで多数のリクエストを処理します。モジュールスコープで作成したものは、それらすべてにまたがって存続します。

- TanStack Queryの`QueryClient`のようなデータキャッシュは、モジュールスコープではなくリクエストごとに作成してください。サーバー上のモジュールレベルのクライアントはリクエストやユーザー間でデータを混在させ、その古いエントリーがハイドレーションの不一致を引き起こします。
- アイランドが必要とするデータは、そのリクエスト自身のキャッシュからpropsとして渡します。アイランドモジュールはマウント時にクライアント側の状態を自ら作成します。
- 日付と数値は、`timeZone`とロケールを明示してフォーマットしてください。サーバーは通常UTCで動作し、ブラウザはユーザーのタイムゾーンで動作します。`timeZone`を指定しない`Intl.DateTimeFormat`は深夜0時付近で異なる日付をレンダリングし、ハイドレーションを壊します。

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## headとmetaタグはホストが担当する

アイランドはbody内の`<div>`にレンダリングされます。`<title>`、`<meta>`、`<link rel=canonical>`を出力してはいけません。これらはホスト側（フレームワークのhead API、またはHTMLテンプレート）で設定します。`<svelte:head>`を使うSvelteコンポーネントでは、`renderSvelteToString`の代わりに`renderSvelte`を呼び出し、その`head`出力を自分でドキュメントのheadに配置してください。

## エラー

- アイランドの`mount`または`update`がrejectされると、`TuvixIsland`は代わりに`fallback`をレンダリングします。アダプターはすでに`tuvix:error`をディスパッチしています。
- サーバー用レンダラーが例外を投げた場合の扱いはサーバーコードが決めます：例外をcatchして`ssrHtml`を渡さなければ、アイランドは空の状態で始まり、クライアントでレンダリングされます。
- `TuvixReactApp`はコンポーネントを`<Suspense>`でラップするため、サーバーでのレンダリングエラーはそのアプリだけを`fallback`に置き換え、Reactがクライアントで再試行します。

ページのコードから`onLifecycle('mounted', ...)`と`onLifecycle('error', ...)`でアイランドを監視できます。[ライフサイクルイベント](/ja/guide/lifecycle-events)を参照してください。

## サンプルプロジェクト

リポジトリの`examples/with-ssr-islands`は、これらすべてを組み合わせたものです：React 19ホストを持つExpress + Viteサーバー、Vue 3のカード、Svelte 5のカウンター、zonelessなAngular 20のお問い合わせフォーム（JIT。コンパイラは遅延チャンクとしてロードされます）、`TuvixReactApp`のニュースレター、そしてフォールバックを示すために意図的に失敗するアイランドが1つ含まれます。`src/server/render-islands.ts`にサーバー用レンダラーがあり、`src/entry-server.tsx`は`getAssets`でアセットをリンクし、`src/runtime/islands.ts`はライフサイクルイベントに反応します。Angularアイランドは、サーバーでは`props`オプションから`heading`入力を受け取り、クライアントでも同じオブジェクトを受け取ります。リポジトリのルートから`pnpm --filter with-ssr-islands dev`を実行するか（ポート5186）、`build`してから`start`を実行します（ポート5185。`PORT`で上書きできます）。サンプルのREADMEでは、各要素とPlaywrightのspecが実行するチェックを説明しています。

## アイランドがしないこと

- `TuvixIsland`はURLからモジュールをロードしません。アイランドモジュールをホストのバンドルにimportしてください。
- アイランド間で状態を共有しません。props、イベントバス、または独自のストアを使ってください。
- Angularアイランドは、サーバーのDOMを非破壊的にハイドレートするのではなく、その上に再レンダリングします。[Angular](/ja/guide/angular)を参照してください。
- ここにあるものはどれも、サーバーレンダリングのステップなしでは動作しません。クライアント専用のアイランドにする場合は、`ssrHtml`を省略し、`Ssr`ではないアダプターを使ってください。
