# Svelteで使う

`@tuvix.js/svelte`はSvelteコンポーネントをマイクロアプリに変換します。Svelte 5とSvelte 3/4をサポートし、サーバーのマークアップをハイドレートし、サーバーでコンポーネントをHTMLにレンダリングします。

## インストール

```bash
pnpm add @tuvix.js/svelte svelte
```

## コンポーネントをマイクロアプリにする

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

最初のマウント時に、アダプターは`svelte`をインポートし、どのAPIを持っているかを確認します。

| Svelte | マウント | ハイドレート | 更新 | アンマウント |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | `SvelteMap`があればその場で更新、なければ再マウント | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

バンドラーは`svelte`をブラウザー向けビルドに解決する必要があります。サーバー向けビルドが選ばれると、Svelte 5の`mount()`が`lifecycle_function_unavailable`を投げるか、`onMount`のコールバックが実行されません。[トラブルシューティング](/ja/guide/troubleshooting)を参照してください。

コンテナごとに専用のコンポーネントインスタンスが作成されます。`mount`は、`onMount`のコールバックとエフェクトが実行された後に`tuvix:mounted`をディスパッチします。`ssr`を指定しない場合、`mount`はレンダリングの前にコンテナを空にします。このモジュールがマウントしたことのないコンテナ、またはマウントに失敗したコンテナに対する`unmount`は何もしません。

## プロパティ

runesを使うSvelte 5の場合：

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4、またはレガシーモードのSvelte 5の場合：

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 5では、設定に`svelte/reactivity`の`SvelteMap`を渡します。するとアダプターは`SvelteMap`を裏に持つpropsオブジェクトをコンポーネントに渡し、`update({ props })`は新しい値をそこに書き込みます。変更されたプロパティを読み取る部分だけが再レンダリングされ、DOMノードとコンポーネントの状態は維持されます。これは`$props()`でも`export let`でも動作します。`SvelteMap`がない場合、Svelte 5の`update()`はインスタンスをアンマウントし、新しいプロパティで新しいインスタンスをマウントして再び`tuvix:mounted`をディスパッチするため、ローカルの状態はリセットされます。`svelte/reactivity`モジュールはSvelte 3/4には存在せず、それらのビルドが失敗するため、アダプター自身はこれをインポートしません。

Svelte 3/4では、`update`は`$set`を呼び出し、`SvelteMap`を無視します。

各更新はプロパティのセット全体を置き換えます。新しいプロパティにないキーは、Svelte 5ではプロパティのデフォルト値に戻り、Svelte 3/4では`undefined`になります。オーケストレーターは常にマージ後のプロパティを送るため、これが問題になるのは自分で`update`を呼び出す場合だけです。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## サーバーレンダリングとハイドレーション

```ts
// server-only module
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooter(): Promise<string> {
  return renderSvelteToString(Footer, { year: 2026 }, { render });
}
```

```ts
// client
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

- `renderSvelteToString(App, props?, { render? })`は、コンポーネントの`<style>`タグに続けてマークアップを返します。サーバーのコードから呼び出します。ブラウザーでは`''`を返します。
- サーバーバンドルにSvelteが含まれる場合（Nitro、Vinxi、`noExternal`のVite SSRビルド）は、`svelte/server`の`render`を渡します。渡さないと、アダプターは実行時に`svelte/server`をインポートします。これにより2つ目のSvelteのコピーが読み込まれることがあり、Svelteのサーバーレンダラーはコピーをまたぐと失敗します。
- `<svelte:head>`の出力が必要な場合、`renderSvelte(App, props?, { render? })`は`{ html, head, css }`を返します。`head`は自分でドキュメントの`<head>`に配置します。アイランドに`<title>`や`<meta>`を含めてはいけません。
- `createSsrSvelteMicroApp`は、コンテナが要素または空白以外のテキストを持つ場合にハイドレートし、それ以外では新規にレンダリングします。Svelte 3/4のコンポーネントは`hydratable: true`でコンパイルする必要があります。

### 初回描画時のCSS

次のいずれかを選びます。

- **HTML内のCSS。** `compilerOptions: { css: 'injected' }`でコンパイルします。するとSvelte 5はコンポーネントのCSSをサーバーの出力に含め、`renderSvelteToString`はそれをアイランド内の`<style>`タグとして含めます。
- **ファイルとしてのCSS。** デフォルトの`emitCss: true`のままにし、`@tuvix.js/vite`でアイランドのスタイルシートを`<head>`にリンクします。[SSRアイランド](/ja/guide/ssr-islands)を参照してください。

`css: 'injected'`ではスタイルシートのファイルが存在しないため、`@tuvix.js/vite`はリンクするものを見つけられません。2つを組み合わせないでください。

## イベントバス

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let count = $state(0);
  const off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });
  onDestroy(off);
</script>

<span class="badge">{count}</span>
```

## アダプターが行わないこと

- `.svelte`ファイルはコンパイルしません。それは`@sveltejs/vite-plugin-svelte`が行います。
- 渡すのはプロパティだけです。スロット、スニペット、コンポーネントイベントはホストから渡されません。
- バンドラーがどのSvelteビルドを選んだかは確認しません。

## API

| エクスポート | 用途 |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Svelteマイクロアプリのモジュール |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | `ssr: true`を設定した同等のもの |
| `@tuvix.js/svelte/server`の`renderSvelteToString(App, props?, options?)` | スタイル + マークアップ |
| `@tuvix.js/svelte/server`の`renderSvelte(App, props?, options?)` | `{ html, head, css }` |
