# Vueで使う

`@tuvix.js/vue`はVue 3のルートコンポーネントをマイクロアプリに変換し、サーバーレンダリングされたマークアップをハイドレートし、サーバーでコンポーネントをHTMLにレンダリングします。

## インストール

```bash
pnpm add @tuvix.js/vue vue
# for renderVueToString on the server
pnpm add @vue/server-renderer
```

## コンポーネントをマイクロアプリにする

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| オプション | 型 | 説明 |
| --- | --- | --- |
| `name` | `string` | 必須。登録したアプリ名と一致する必要があります。 |
| `App` | `Component` | 必須。ルートコンポーネント。 |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | マウントのたびに`app.use(plugin, ...options)`でインストールされます。 |
| `bootstrap` | `() => void \| Promise<void>` | 最初のマウントの前に1回実行されます。 |
| `ssr` | `boolean` | サーバーのマークアップをハイドレートします。`createSsrVueMicroApp`はこれを設定します。 |

コンテナごとに専用のVueアプリが作成されるため、マウントのたびに各プラグインの`install`が再度実行されます。`createPinia()`のようなプラグインのインスタンスは、そのモジュールのすべてのマウントで共有されます。マウントごとに専用のストアが必要な場合は、プラグイン関数の中でインスタンスを作成します。

すでにこのアプリを持つコンテナにマウントすると、まず古いインスタンスをアンマウントします。`unmount`はアプリを破棄し、コンテナを空にして`tuvix:unmounted`をディスパッチします。

## プロパティ

アダプターはプロパティをルートコンポーネントに渡し、さらに任意の子孫コンポーネント向けに`'tuvixProps'`（`TUVIX_PROPS_KEY`）としてprovideします。

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })`は`shallowReactive`オブジェクト内のプロパティを置き換え、Vueの次のtickを待ちます。ルートコンポーネントは新しい値で再レンダリングされ、ローカルの状態は維持されます。新しいプロパティにないキーは削除されます。`container`を指定しない場合、`update`はモジュールのすべてのマウントを更新します。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## サーバーレンダリングとハイドレーション

サーバーでは`renderVueToString`でレンダリングし、クライアントでは`createSsrVueMicroApp`でハイドレートします。

```ts
// server-only module
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports holds <Teleport> output
}
```

```ts
// client
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)`は、クライアントと同じルートで`App`をラップします。そのため、サーバーでも`inject('tuvixProps')`が動作し、ハイドレーションが一致します。
- サーバーのコード（サーバー関数、APIルート、またはサーバーエントリー）からのみ呼び出します。ブラウザーでは`''`を返します。アイソモーフィックなルートローダーはブラウザーでも実行されるため、その場合バンドラーはVueのサーバーレンダラーをクライアントに配布してしまいます。
- `ssr: true`でコンテナにサーバーのマークアップがある場合、アダプターは`createSSRApp`を呼び出し、サーバーのDOMノードを維持します。空のコンテナは`createApp`で新規にレンダリングされます。
- HTMLにはCSSが含まれません。ViteはSFCの`<style>`ブロックをJavaScriptから注入し、それはハイドレーションの開始後になります。`@tuvix.js/vite`で`<head>`にスタイルシートをリンクします。[SSRアイランド](/ja/guide/ssr-islands)を参照してください。

Reactホスト内では、`TuvixIsland`でモジュールをマウントします。

## コンポーザブル

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

`onMounted`で購読し、`onUnmounted`で購読を解除し、早期にクリーンアップするための関数を返します。

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')`は、`updateEvent`で発行された各ペイロードをマージする`ShallowRef`を返します。Tuvix.jsにこのイベントを発行する処理はありません。アダプターを使う場合、`updateAppProps`で渡したプロパティはすでにコンポーネントを再レンダリングするため、これが必要になることはほとんどありません。

## エッジケース

- `~/utils`のようなパスエイリアスは、`.vue`ファイル内でも解決できる必要があります。エイリアスが`vite-tsconfig-paths`から来ている場合は、そのtsconfigの`include`に`**/*.vue`を含めるか、Viteの設定で`resolve.alias`を設定します。[トラブルシューティング](/ja/guide/troubleshooting)を参照してください。
- マウント中のsetup、render、ライフサイクルフックのエラーは、本番ビルドでも`mount`をrejectし、`tuvix:error`をディスパッチします。プラグイン自身の`app.config.errorHandler`も引き続き実行されます。
- このモジュールがマウントしたことのないコンテナに対する`unmount`は何もしません。

## API

| エクスポート | 用途 |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Vueマイクロアプリのモジュール |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | `ssr: true`を設定した同等のもの |
| `TUVIX_PROPS_KEY` | リアクティブなプロパティのインジェクションキー（`'tuvixProps'`） |
| `useTuvixBus(bus, event, handler)` | コンポーネントに紐づいたイベントバスの購読 |
| `useTuvixProps(initial, bus?, event?)` | バスのイベントからマージされる`ShallowRef` |
| `@tuvix.js/vue/server`の`renderVueToString(App, props?, plugins?, ssrContext?)` | サーバーHTML |
