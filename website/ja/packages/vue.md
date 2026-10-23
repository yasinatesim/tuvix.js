---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Vueバインディング"
  description="Vue 3コンポーネントを、リアクティブなprops、コンテナごとに1つのVueアプリ、SSRハイドレーションを備えたTuvix.jsのマイクロアプリに変換します。サーバーではrenderVueToStringでレンダリングします。"
  icon="💚"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

サーバーレンダリングを行う場合は、オプションのピア依存であるVueのサーバーレンダラーもインストールします。

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

このパッケージにはVue 3が必要です（ピア範囲は`>=3.0.0`）。`@tuvix.js/loader`と`@tuvix.js/event-bus`に依存します。

## 使用する場面

Tuvixのシェル内のマイクロアプリの1つがVue 3アプリである場合に`@tuvix.js/vue`を使います。`createVueMicroApp`はルートコンポーネントを、オーケストレーターとローダーが呼び出す`{ bootstrap, mount, unmount, update }`モジュールでラップします。オーケストレーターはそれをコンテナにマウントし、`updateAppProps`で新しいpropsを渡し、ルート変更時にアンマウントします。

SEOのため、またはJavaScriptの実行前に空白の領域ができるのを避けるために、Vueアプリを最初のHTMLレスポンスに含める必要がある場合は、サーバーレンダリングを追加します。サーバー関数内で`@tuvix.js/vue/server`の`renderVueToString`を使ってHTMLをレンダリングし、それをコンテナに入れ、`createSsrVueMicroApp`でハイドレートします。ReactのホストページではそのHTMLを[`TuvixIsland`](/ja/packages/react#tuvixisland)に渡します。

ページ全体が1つのVueアプリであれば、このパッケージは不要です。Vue自身の`createApp`またはNuxtを使います。

## クイックスタート

ルートコンポーネントは、シェルが渡すpropsを宣言します。

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

それをモジュールでラップします。

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

シェルに登録します。

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'settings',
  entry: () => import('./micro-apps/settings'),
  container: '#app',
  activeWhen: '/settings/*',
  props: { userId: 'u_42', theme: 'light' },
});

await orchestrator.start();

// Re-renders App with theme="dark"; local component state survives.
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | `@tuvix.js/loader`の`registerModule`を通じてモジュールを登録する名前です。ライフサイクルイベントはこの名前を持ちます。 |
| `App` | `Component` | 必須 | ルートのVueコンポーネントです。 |
| `plugins` | `VuePluginEntry[]` | なし | 各Vueアプリにインストールするプラグインです。各エントリーはプラグイン、または`app.use(plugin, ...options)`に渡される`[plugin, ...options]`タプルです。 |
| `bootstrap` | `() => void \| Promise<void>` | なし | 一度だけ実行するセットアップです。モジュールの`bootstrap()`はこれをawaitします。 |
| `ssr` | `boolean` | `false` | コンテナが要素または空白以外のテキストを含む場合、`createSSRApp`でサーバーのマークアップをハイドレートします。空のコンテナには`createApp`でレンダリングします。 |

返されるモジュール：

- `mount({ container, props })`はそのコンテナ用にVueアプリを作成し、プラグインをインストールしてマウントします。Vueがサーバーのマークアップを引き継いだ場合は`hydrated: true`を付けて、コンテナ上で`tuvix:mounted`をディスパッチします。
- `update({ props, container })`はそのコンテナのリアクティブなpropsオブジェクトに`props`を書き込み、Vueが再レンダリングをフラッシュした後（`nextTick`）に解決します。新しいpropsにないキーは削除されます。`container`を省略すると、モジュールがマウントしたすべてのコンテナを更新します。
- `unmount({ container })`はVueアプリをアンマウントし、`replaceChildren()`でコンテナを空にして`tuvix:unmounted`をディスパッチします。
- `bootstrap()`は`config.bootstrap`を実行します。

コンテナごとに独自のVueアプリと独自のpropsを持つため、1つのモジュールを複数の場所へ同時にマウントできます。

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### コンポーネントでpropsを読む

アダプターはpropsを`shallowReactive`オブジェクトに保持し、それらをコンポーネントのpropsとして渡すルートラッパーを通して`App`をレンダリングします。ラッパー自体はDOMをレンダリングしません。propsは次の2つの方法で読み取ります。

- ルートコンポーネントでの**`defineProps`**。`update`は新しい値でルートコンポーネントを再レンダリングします。
- ツリー内の任意のコンポーネントでの**`inject('tuvixProps')`**（または`inject(TUVIX_PROPS_KEY)`）。同じリアクティブオブジェクトが得られるため、それを読む`computed`は`update`の後に更新されます。propsを下へ受け渡す代わりに、深い子コンポーネントで使います。

```vue
<!-- src/micro-apps/settings/ThemeLabel.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

const tuvixProps = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
const theme = computed(() => String(tuvixProps.theme ?? 'light'));
</script>

<template>
  <span>Theme: {{ theme }}</span>
</template>
```

#### オプション付きのプラグイン

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import type { VuePluginEntry } from '@tuvix.js/vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';

const analytics = {
  install(app: VueApp, options: { siteId: string }) {
    app.provide('analyticsSiteId', options.siteId);
  },
};

const plugins: VuePluginEntry[] = [[analytics, { siteId: 'site-42' }]];

export default createVueMicroApp({ name: 'checkout', App, plugins });
```

コンテナごとに独自のVueアプリを持つため、マウントのたびにすべてのプラグインについて`app.use`が再度呼び出されます。`createPinia()`の結果のような状態を持つプラグインオブジェクトは、モジュールのすべてのコンテナで共有されます。

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

`createVueMicroApp({ ...config, ssr: true })`と同じです。オプションは上の表と同じく`name`、`App`、`plugins`、`bootstrap`です。

コンテナが`renderVueToString`のマークアップを含む場合、Vueは`createSSRApp`を通してそのDOMノードを引き継ぎ、リスナーを付けます。サーバーとクライアントは同じルートラッパーを使うため、コンポーネントツリーは一致します。サーバーがレンダリングに使ったのと同じpropsでマウントします。

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

`@tuvix.js/vue/server`サブパスからインポートします。

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| 引数 | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `App` | `Component` | 必須 | ルートコンポーネントです。`createSsrVueMicroApp`に渡すものと同じです。 |
| `props` | `Record<string, unknown>` | `{}` | `App`に渡すpropsです。SSR中も`inject('tuvixProps')`はこれを参照します。 |
| `plugins` | `VuePluginEntry[]` | なし | インストールするプラグインです。`createVueMicroApp`と同じタプル形式を使えます。 |
| `ssrContext` | `VueSsrContext` | `{}` | レンダリング中にVueが書き込むオブジェクトです。Promiseが解決した後に`teleports`と`modules`を読みます。 |

共有のルートラッパーでSSRアプリを作成し、プラグインをインストールして、`@vue/server-renderer`の`renderToString`が返すHTMLを返します。このパッケージをインストールしておいてください。`renderVueToString`は最初の呼び出し時にこれをインポートします。

`renderVueToString`はサーバー専用です。アイソモーフィックなルートローダーからではなく、サーバー関数（TanStack Startの`createServerFn`ハンドラー、APIルート、Expressハンドラー）から呼び出します。ローダーはクライアントでのナビゲーション中にブラウザでも実行され、そこではこの関数は`''`を返します。また、ローダーがVueのサーバーレンダラーをインポートするため、バンドラーはそれをクライアントにも含めてしまいます。

```ts
// src/server/contact.ts
import { createServerFn } from '@tanstack/react-start';
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from '../micro-apps/contact/App.vue';

export const renderContact = createServerFn().handler(async () => {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return { html, teleports: ssrContext.teleports ?? {} };
});
```

ページ内のコンテナ要素（`<div id="contact">…</div>`）に`html`を入れ、上のとおりクライアントで`createSsrVueMicroApp`をマウントします。`<Teleport>`のターゲットのHTMLは、返される文字列ではなく`ssrContext.teleports['#target']`に入ります。ターゲットがある場所に出力してください。

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

リアクティブなpropsオブジェクトのインジェクションキーです。`inject(TUVIX_PROPS_KEY)`と`inject('tuvixProps')`は、クライアントでも`renderVueToString`の実行中でも同じオブジェクトを返します。

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe;
```

`onMounted`で`event`に`handler`を購読し、`onUnmounted`で購読を解除します。返される関数を呼ぶと早期に購読を解除できます。`setup`中に呼び出します。サーバーレンダリング中は`onMounted`が実行されないため、購読はクライアントにのみ存在します。

アダプターはオーケストレーターのバスを`App`に渡しません。`eventBus`オプションを指定しない限り、オーケストレーターは`getGlobalBus()`を使います。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);

useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
  count.value = items.length;
});
</script>

<template>
  <span>{{ count }}</span>
</template>
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): ShallowRef<T>;
```

| 引数 | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `initialProps` | `T` | 必須 | 初期値で、一度だけコピーされます。 |
| `bus` | `IEventBus` | なし | リッスンするバスです。省略するとrefは`initialProps`のままです。 |
| `updateEvent` | `string` | `'tuvix:props:update'` | このイベントのペイロードを、コンポーザブルがrefにマージします（`{ ...prev, ...payload }`）。 |

オーケストレーターもアダプターも`tuvix:props:update`を発行しません。自分で発行します。オーケストレーターからのpropsには、バスなしで`update`に追従する`defineProps`または`inject(TUVIX_PROPS_KEY)`を使います。

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### 型

| 型 | エクスポート元 | 説明 |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | `createVueMicroApp`の設定：`name`、`App`、`plugins?`、`bootstrap?`、`ssr?`。 |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `ssr`を除いた`VueMicroAppConfig`で、`createSsrVueMicroApp`の設定です。 |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`：プラグイン、またはプラグインとその`app.use`オプションです。 |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`。`renderVueToString`の実行中にVueとそのプラグインが書き込みます。`@vitejs/plugin-vue`はレンダリングされたコンポーネントのモジュールを`modules`に記録します。 |

## エッジケース

- **マウント時のエラー。** `mount`中のsetup、レンダリング、ライフサイクルフックのエラーは、開発ビルドでも本番ビルドでもPromiseをrejectします。アダプターは失敗したアプリをアンマウントし、`tuvix:error`をディスパッチします。プラグイン自身の`app.config.errorHandler`も引き続きエラーを受け取ります。
- **同じコンテナへの2回のマウント。** モジュールがすでに保持しているコンテナへの2回目の`mount`は、まず古いアプリをアンマウントし（`tuvix:unmounted`をディスパッチしてコンテナを空にする）、新しいアプリをマウントします。`ssr: true`の場合、コンテナが空になっているため、この2回目のマウントは新規にレンダリングします。
- **未知のコンテナ。** モジュールがマウントしていないコンテナに対する`unmount`は何もしません。そのような`container`を指定した`update`は何も変更しません。
- **propsは置き換えられます。** モジュールの`update`はpropsを渡したオブジェクトに設定し、存在しないキーを削除します。`orchestrator.updateAppProps`は`update`を呼び出す前に、新しいpropsを登録済みのpropsにマージします。
- **宣言されていないprops。** ルートコンポーネントが`defineProps`で宣言していないpropsは属性として渡され、Vueが任意のコンポーネントで行うのと同様にルート要素へフォールスルーします。`lang`を宣言するか`inheritAttrs: false`を設定しない限り、`{ lang: 'en' }`はルート要素に`lang="en"`をレンダリングします。
- **`ssr: true`で空白のみのコンテナ。** `hasServerMarkup`が空白テキストとコメントを無視するため、アダプターは`createApp`でレンダリングします。Vueは空のコンテナのハイドレーションについて警告しません。
- **ブラウザでの`renderVueToString`。** `window`が存在する場合は`''`を返します。
- **アンマウント時のエラー。** `app.unmount()`が例外を投げた場合、アダプターはコンテナを空にし、`tuvix:error`をディスパッチして再スローします。
- **同じ名前を2回使う場合。** `registerModule`は、その名前で最後に作成されたモジュールを保持します。

## 対象外の機能

- Vue 2はサポートしません。
- URLからモジュールを読み込みません。モジュールをインポートするか、[`@tuvix.js/core`](/ja/packages/core)に`entry`経由で読み込ませます。
- `MountContext.bus`や`MountContext.name`をコンポーネントに渡しません。`@tuvix.js/event-bus`の`getGlobalBus()`を使います。
- `renderVueToString`はストリーミングせず、CSSも収集しません。サーバーレンダリングされたアイランドのスタイルシートリンクを出力するには[`@tuvix.js/vite`](/ja/packages/vite)を使います。
- テレポートされたHTMLを配置しません。`ssrContext.teleports`を読んで出力します。

## 0.4からの移行

**`$tuvixProps`は削除されました。** `update()`は`app.config.globalProperties.$tuvixProps`に書き込まなくなりました。propsは`defineProps`または`inject`で読みます。

```vue
<!-- Before (0.4) -->
<template>
  <span>{{ $tuvixProps.theme }}</span>
</template>
```

```vue
<!-- After (0.5) -->
<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<template>
  <span>{{ theme }}</span>
</template>
```

**未知のコンテナに対する`unmount`は何もしません。** 0.4ではコンテナを空にしていました。その動作に依存していた場合は、`container.replaceChildren()`を自分で呼び出します。

**`VueSsrMicroAppConfig`には`ssr`フィールドがありません。** `createSsrVueMicroApp`に渡す設定から`ssr`を削除します。

**設定オブジェクト。** このページの以前の版では`createVueMicroApp(App)`と示していました。この関数は設定オブジェクトを受け取ります：`createVueMicroApp({ name: 'settings', App })`。

その他の解説は[Vueガイド](/ja/guide/vue)を参照してください。
