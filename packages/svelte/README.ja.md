# @tuvix.js/svelte

> Tuvix.jsマイクロフロントエンドフレームワーク向けのSvelte 3/4/5バインディング

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。

## インストール

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## クイックスタート

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

アダプターは`@tuvix.js/loader`の`registerModule`でモジュールを登録するため、オーケストレーターは名前でこれを見つけます。最初のマウント時に`svelte`をimportし、`mount`のexportがあるかを確認します。

- **Svelte 5**：`svelte`の`mount()` / `hydrate()` / `unmount()`。
- **Svelte 3/4**：`new App({ target, props })`、`$set()`、`$destroy()`。

バンドラーは`svelte`をクライアントビルドに解決する必要があります（`browser` export条件。`@sveltejs/vite-plugin-svelte`が設定します）。サーバービルドが選ばれると、Svelte 5の`mount()`は`lifecycle_function_unavailable`を投げます。

## API

### `createSvelteMicroApp(config)`

| オプション | 型 | デフォルト | 意味 |
| ----------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `name`      | `string`                      | 必須 | アプリ名。`registerModule`で登録されます |
| `App`       | `unknown`                     | 必須 | Svelte 5コンポーネント、またはSvelte 3/4のコンポーネントクラス |
| `bootstrap` | `() => void \| Promise<void>` | なし | 一度だけ実行するセットアップ |
| `ssr`       | `boolean`                     | `false`  | コンテナにサーバーマークアップがあればハイドレートします |
| `SvelteMap` | `SvelteMap`クラス | なし | Svelte 5のみ：`svelte/reactivity`の`SvelteMap`。`update()`が再マウントではなくその場で再レンダリングするようになります |

- コンテナごとに専用のインスタンスが作られるため、1つのモジュールを複数のコンテナにマウントできます。
- `mount`はコンテナをクリアし（ハイドレートする場合を除く）、レンダリングし、`onMount`コールバックとエフェクトの実行後に`tuvix:mounted`をディスパッチします。マウントに失敗すると`tuvix:error`をディスパッチしてrejectします。
- `unmount`はインスタンスを破棄し、コンテナを空にして`tuvix:unmounted`をディスパッチします。`mount`がまだ読み込み中に呼ばれた場合は、マウントの完了を待ってから破棄します。
- `update({ props, container? })`は1つのコンテナを更新し、`container`を省略するとすべてのインスタンスを更新します。Svelte 3/4は`$set()`を使います。Svelte 5はデフォルトで再マウントします。インスタンスをアンマウントし、新しいpropsで新しいインスタンスをマウントして、再び`tuvix:mounted`をディスパッチするため、DOMノードとコンポーネントのstateは失われます。その場で更新するには`SvelteMap`を渡します（`$props()`と`export let`の両方で動作します）。

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

アダプター自身は`svelte/reactivity`をimportしません。Svelte 3/4にはこのモジュールがなく、importするとSvelte 3/4アプリのビルドが壊れるためです。

ホストはオーケストレーターを通じて新しいpropsを送ります。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
});
await orchestrator.start();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

### `createSsrSvelteMicroApp(config)`

`createSvelteMicroApp({ ...config, ssr: true })`と同じです。コンテナが要素または空白以外のテキストを含む場合はハイドレートし、それ以外の場合は新しくレンダリングします。Svelte 5のハイドレーションには、`svelte/server`が書き出すコメントマーカーが必要です。Svelte 3/4のコンポーネントは`hydratable: true`でコンパイルしてください。

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `@tuvix.js/svelte/server`の`renderSvelteToString(App, props?, options?)`

| オプション | 型 | デフォルト | 意味 |
| -------- | -------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `render` | `SvelteServerRender` | なし | `svelte/server`の`render`。省略するとアダプターが実行時に`svelte/server`をimportします |

コンポーネントの`<style>`タグに続けてマークアップを返します。`render`を渡した場合は常にSvelte 5の`render`を使います。渡さない場合、アダプターは`svelte`をimportし、そのモジュールが`mount`をexportしていれば`svelte/server`を読み込み（Svelte 5）、そうでなければ`App.render(props)`を呼び出して（Svelte 3/4）`css.code`を`<style>`で囲みます。`dev: true`でコンパイルされたSvelte 5コンポーネント（serveモードのvite-plugin-svelte）は例外を投げる`App.render`を持つため、アダプターは`App.render`の有無で判定しません。サーバー関数から呼び出してください。ブラウザでは`''`を返します。

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const footerHtml = await renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);
```

### `@tuvix.js/svelte/server`の`renderSvelte(App, props?, options?)`

オプションは同じです。`{ html, head, css }`を返すため、`<svelte:head>`の内容をドキュメントのheadに配置できます。

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const { html, head, css } = await renderSvelte(
  Footer,
  { year: 2026 },
  { render }
);
```

### 型

`SvelteMicroAppConfig`、`SvelteProps`（`@tuvix.js/svelte`から）。`RenderSvelteOptions`、`SvelteServerRender`、`SvelteRenderResult`（`@tuvix.js/svelte/server`から）。

## エッジケース

- Svelte 5がサーバー出力にCSSを含めるのは、`css: 'injected'`でコンパイルした場合だけです（Vite：`svelte({ compilerOptions: { css: 'injected' } })`）。デフォルトの`css: 'external'`では、バンドラーがCSSをファイルに書き出します。
- サーバーバンドルにSvelteが含まれる場合（Nitro、Vinxi、`noExternal`なVite SSRビルド）は、`svelte/server`の`render`を渡してください。コンポーネントとレンダラーが別々のSvelteのコピーから来ていると、Svelteのサーバーレンダラーは失敗します。
- 更新のたびにprops全体が置き換えられます。新しいpropsにないキーは、Svelte 5では削除され（デフォルト値が適用されます）、Svelte 3/4では`undefined`に設定されます。
- マウント済みのコンテナに対する`mount`は、先に古いインスタンスをアンマウントします。モジュールが一度もマウントしていないコンテナに対する`unmount`は何もしません。コンテナの子要素はそのまま残り、イベントもディスパッチされません。
- サーバー上でのSvelte 5のimportエラーやレンダリングエラーはrejectします。`App.render`へのフォールバックはありません。

## 対象外の機能

- `.svelte`ファイルのコンパイルや、バンドラーがどのSvelteビルドを選んだかの確認は行いません。
- 渡すのはpropsだけです。ホストからのスロット、スニペット、コンポーネントイベントは渡しません。
- `<svelte:head>`の内容をドキュメントに書き込んだり、`css: 'external'`のスタイルシートをリンクしたりはしません。

完全なドキュメント：[tuvix.js.org/packages/svelte](https://tuvix.js.org/packages/svelte)

## ライセンス

MIT
