# はじめに

このページでは、ホームページとダッシュボードという2つのマイクロアプリを持つシェルを構築します。アプリを登録し、ルーターにマウントさせ、マウント済みのアプリに新しいプロパティを渡します。

## インストール

統合パッケージをインストールします。オーケストレーター、ルーター、ローダー、イベントバス、サンドボックスが含まれています：

```bash
pnpm add tuvix.js
```

マイクロアプリで使用するフレームワークごとにアダプターを追加します：

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## プロジェクトのスキャフォールディング

`create-tuvix-app`は、0.5のパッケージに依存するシェルまたはマイクロアプリのプロジェクトを生成します：

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

テンプレート：`shell`、`react-app`、`vue-app`、`svelte-app`、`angular-app`、`vanilla-app`。代わりにリポジトリのサンプルをコピーするには、`--example <name>`を渡します。

## シェルを構築する

シェルはページのレイアウトを管理し、どのアプリをどこに配置するかを決定します。コンテナ要素を用意します：

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

次に、オーケストレーターを作成し、アプリを登録して起動します：

```ts
// src/main.ts
import { createOrchestrator, interceptLinks, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  // '/' alone would match every path; `end: true` makes it exact.
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
});

// Turn <a href> clicks into router navigations instead of page loads.
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

何が起こるか：

1. `start()`は現在のパスを読み取り、`activeWhen`が一致するすべてのアプリをマウントします。
2. `<a href="/dashboard">`をクリックすると`navigateTo('/dashboard')`が呼び出されます。ルーターがURLをプッシュし、オーケストレーターが`home`をアンマウントしてから`dashboard`をマウントします。
3. `dashboard`の最初のマウントでスクリプトとスタイルシートが読み込まれます。以降のマウントでは読み込み済みのモジュールを再利用します。

ルーターが単独でクリックをインターセプトすることはありません。`interceptLinks`がない場合、リンクをクリックするとページが再読み込みされ、オーケストレーターは新しいページ読み込み時に適切なアプリをマウントします。

## マイクロアプリを作成する

マイクロアプリは`mount`と`unmount`を持つオブジェクトです。`defineMicroApp`は形状を検証し、モジュールをその名前で登録するため、スクリプトの実行後にローダーがモジュールを見つけられます：

```ts
// apps/home.ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Welcome, ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },

  update({ props, container }) {
    const title = container?.querySelector('h1');
    if (title) title.textContent = `Welcome, ${String(props.user ?? 'Guest')}`;
  },

  unmount({ container }) {
    container.replaceChildren();
  },
});
```

`defineMicroApp`に渡す`name`は、シェルで登録する名前と一致している必要があります。ローダーはその名前でモジュールを検索します。

## フレームワークアダプターを使う

アダプターはルートコンポーネントから同じモジュールを作成します。モジュールを登録し、コンテナごとに1つのフレームワークインスタンスを保持し、ライフサイクルイベントをディスパッチします。

```tsx
// dashboard/src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Dashboard for {user}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

```ts
// settings/src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Settings from './Settings.vue';

export default createVueMicroApp({ name: 'settings', App: Settings });
```

フレームワーク別ページ：[React](/ja/guide/react)、[Vue](/ja/guide/vue)、[Svelte](/ja/guide/svelte)、[Angular](/ja/guide/angular)。

各マイクロアプリをESモジュールバンドルとしてビルドし、アップロードします。Viteのライブラリビルドが使えます：

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

ViteのES出力は`.js`で終わるため、エントリーで`type: 'module'`を指定しない限り、ローダーはクラシックスクリプトとして扱います。上記のように、シェルのエントリーに`type: 'module'`を残しておいてください。

## 実行時にプロパティを更新する

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps`は新しいプロパティを登録済みのプロパティにマージします。アプリがマウント済みで`update`を持つ場合、オーケストレーターはマージ後のプロパティでそれを呼び出し、アプリはその場で再レンダリングされます。アプリがマウントされていない場合、オーケストレーターは次回のマウントのためにプロパティを保存します。

## シェルが行わないこと

- レイアウトはレンダリングしません。コンテナはシェル自身のHTMLが保持します。
- アプリ間でフレームワークインスタンスを共有しません。2つのReactアプリには2つのReactルートが作成されます。
- JavaScriptをサンドボックス化しません。すべてのアプリはページの`window`で実行されます。

## 次のステップ

- [アーキテクチャ](/ja/guide/architecture)：ナビゲーションから`mount`までの流れ。
- [ルーティング](/ja/guide/routing)：`activeWhen`のパターン、組み込みのルーター、ガード。
- [外部ルーター](/ja/guide/external-router)：TanStack RouterやReact Routerに追従する。
- [SSRアイランド](/ja/guide/ssr-islands)：Reactページ内でマイクロアプリをサーバーレンダリングする。
