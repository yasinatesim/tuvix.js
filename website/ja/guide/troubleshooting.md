# トラブルシューティング

各項目は、目に見える症状から始まり、原因と修正方法が続きます。

## Svelte：onMountが実行されない、またはmount()がlifecycle_function_unavailableを投げる

**症状。** Svelteアイランドはレンダリングされるものの`onMount`のコールバックが一度も実行されない、またはSvelte 5の`mount()`が`lifecycle_function_unavailable`を投げます。

**原因。** `svelte`は、同じimportの下にブラウザ用ランタイムとサーバー用ランタイムを持っています。クライアントバンドルがサーバー用のものを選んでいます。一部のSSR構成（Vinxi、カスタムのVite environment、jsdom上のVitest）は、`browser` export conditionなしでクライアントを解決するため、Viteの依存関係オプティマイザーがサーバー用ランタイムを事前バンドルします。ブラウザのdevtoolsでは、クライアント用ファイルの代わりに`svelte/src/index-server.js`（Svelte 5）または`svelte/src/runtime/ssr.js`（Svelte 4）が表示されます。

**修正。** クライアントのresolve conditionsに`browser`を戻し、最適化済みの依存関係を再ビルドするように`--force`付きでViteを再起動します。

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

jsdomを使うVitestでは、conditionを追加し、ViteがSvelteを解決するようにインライン化します。

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

`svelte`を`optimizeDeps`から除外しないでください。除外するとesbuildが"The entry point "svelte" cannot be marked as external"で失敗します。

## Vue：.vueファイルで~エイリアスが失敗する

**症状。** 本番ビルドが`Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."`で失敗します。一方で、同じimportは`.ts`ファイルでは動作し、`.vue`ファイルでも`~/`からの`import type`は動作します。

**原因。** `vite-tsconfig-paths`は、tsconfigの`include`に含まれるファイルにのみエイリアスを適用します。`**/*.ts`と`**/*.tsx`をincludeするtsconfigでは、`.vue`ファイルが対象外になります。型のみのimportは解決前に消去されるため、失敗しません。

**修正。** そのtsconfigに`.vue`ファイルを含めます。

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

または、Vite自体でエイリアスを宣言します。

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

エディター拡張機能にはVue - Official（Volar）を使ってください。Veturは`<script setup>`のマクロや`moduleResolution: "Bundler"`を理解しません。

## Angular 15-17：クリックしてもビューが更新されない

**症状。** Angularアイランドはレンダリングされますが、ボタンのハンドラーがフィールドを変更してもテンプレートが更新されません。

**原因。** アダプターはAngularをzone.jsなしで実行します。Angular 18以降はzonelessモードで自ら変更検知をスケジュールしますが、15-17ではアダプターが`NgZone`を何もしないzoneに置き換えるため、DOMイベントの後に変更検知を実行するものがありません。

**修正。** 変更の後に`detectChanges()`を呼び出します。

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

または、クライアントエントリーの先頭で`zone.js`をimportし、`createAngularMicroApp`に`zone: true`を渡します。zone.jsはサーバーに含めないでください。グローバルの`Promise`にパッチを当て、サーバー側の`fetch`を壊します。

## 日付によるハイドレーションの不一致

**症状。** Reactがエラー#418を報告する（またはVueやSvelteがハイドレーションの不一致をログに出す）のが、一部のユーザーだけ、または深夜0時付近だけです。差分には、`21 Mart 2026`と`22 Mart 2026`のように1日ずれた日付が表示されます。

**原因。** サーバーは自身のタイムゾーン（通常はUTC）で日付をフォーマットし、ブラウザはユーザーのタイムゾーンでフォーマットします。`timeZone`を指定しない`new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })`は、両側で異なるテキストを生成します。

**修正。** サーバーがレンダリングする日付をフォーマットするすべての箇所で、`timeZone`を明示的に渡します。

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 22 Mart 2026 on server and client
```

同じことが、`toLocaleString`、相対時間（「3時間前」）、レンダリング中に`Date.now()`を使うものすべてに当てはまります。

## あるリクエストのデータが別のリクエストに表示される

**症状。** サーバーレンダリングされたアイランドが古いデータや別のユーザーのリクエストのデータを表示し、その後クライアントが異なる内容で再レンダリングします。

**原因。** 複数のマイクロアプリがimportする`export const queryClient = new QueryClient()`のようなモジュールレベルのキャッシュは、サーバープロセスが存続する間ずっと存在します。すべてのリクエストが同じインスタンスを読み書きします。

**修正。** サーバーではリクエストごとにキャッシュを作成し、アイランドが必要とするものをpropsとして渡します。モジュールレベルのクライアントを1つだけ持つのは、ブラウザのコードに限ってください。

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

[リクエストごとの状態](/ja/guide/ssr-islands#per-request-state)を参照してください。

## アンロード後にモジュールスクリプトのアプリがロードされない

**症状。** `orchestrator.unregister(name)`または`loader.unload(name)`の後、同じアプリを再び登録してマウントすると、`Module "<name>" loaded but no exports found`で失敗します。

**原因。** ブラウザはモジュールスクリプトをURLごとに1回しか実行しません。同じURLに対する2つ目の`<script type="module" src="...">`は何もしないため、アプリが`registerModule`を再び呼び出すことはありません。

**修正。** バンドラーのモジュールキャッシュにモジュールを保持するローダー関数のエントリーを使うか、URLを変更します（たとえばバージョンのクエリ文字列を付けます）。

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## "loaded but no exports found"

**症状。** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**原因と修正**（確認する順に）：

1. バンドルが登録する名前が、登録した名前と異なります。`createReactMicroApp({ name: 'Dashboard' })`と`register({ name: 'dashboard' })`は一致しません。同じ文字列を使ってください。
2. ES moduleのバンドルがクラシックスクリプトとしてロードされています。ViteのES出力は`.js`で終わります。エントリーに`type: 'module'`を追加してください。
3. バンドルはモジュールをエクスポートしていますが、登録していません。アダプターか`defineMicroApp`を使うか、自分で`registerModule(name, module)`を呼び出してください。

## コンテナが見つからない

**症状。** `[Tuvix] Container "#app" not found in DOM.`

**原因。** オーケストレーターは、アプリをマウントする時点でコンテナを検索します。外部ルーターのルートコンポーネントが、まだそれをレンダリングしていない可能性があります。

**修正。** コンテナをナビゲーションより前に存在するレイアウトに置くか、ルートコンポーネント内で`TuvixIsland`を使ってそのアプリをホストします。[外部ルーター](/ja/guide/external-router#containers-rendered-by-routes)を参照してください。

## 最初の描画でスタイルが適用されない

**症状。** JavaScriptが無効な場合、または低速な接続で一瞬だけ、サーバーレンダリングされたアイランドがCSSなしで表示されます。

**原因。** ViteはCSS Modules、Vueの`<style>`、SvelteのスタイルをJavaScriptから注入します。サーバーのHTMLはそれらを1つもリンクしていません。

**修正。** Viteの設定に`@tuvix.js/vite`の`tuvix()`を追加し、`renderAssetTags(await getAssets([...]))`を`<head>`に出力します。[SSRアイランド](/ja/guide/ssr-islands)を参照してください。
