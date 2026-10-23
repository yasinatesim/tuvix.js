# アーキテクチャ

Tuvix.jsは小さなパッケージに分かれています。`@tuvix.js/core`のオーケストレーターがそれらを結び付けます。他のパッケージはどれも単独でも動作します。

## パッケージとその役割

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## ナビゲーションからマウントまで

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

フェーズ1はフェーズ2の開始前に完了するため、`#app`を共有する2つのアプリが同時にその中に存在することはありません。リコンサイルの実行中に新しいパスが届いた場合、オーケストレーターは現在のステップを完了してから最新のパスでリコンサイルします。A → B → Aと素早く続けてナビゲートすると、マウントされたまま残るのはAだけです。

## モジュールの契約

手書きのものもアダプターが生成したものも、すべてのマイクロアプリは次の形状（`@tuvix.js/loader`の`MicroAppModule`）を持ちます：

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // once, before the first mount
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap`は読み込まれたモジュールごとに1回実行されます。
- `mount`は、コンテナ、現在のプロパティ、アプリ名、オーケストレーターのイベントバスを受け取ります。
- `update`は、シェルが`updateAppProps`を呼び出したときにマージ後のプロパティを受け取ります。`container`は、複数の場所にマウントされたモジュールに、どのマウントを更新するかを伝えます。
- `unmount`は、`mount`が作成したものをすべて削除する必要があります。

## ローダーがモジュールを見つける方法

1. **ローダー関数のエントリー**（`() => import('./app')`）：ローダーは解決されたモジュールを使い、それがなければその`default`エクスポートを、それもなければアプリ名で登録されたモジュールを使います。
2. **URLのエントリー**：ローダーは`<script>`タグと`<link>`タグを追加して読み込みを待ち、`registerModule(name, module)`が登録するレジストリからモジュールを読み取ります。アダプターと`defineMicroApp`が`registerModule`を代わりに呼び出します。
3. **UMDフォールバック**：何も登録されていない場合、ローダーは`mount`関数を持つ新しい`window`グローバルを選びます。複数現れた場合は、名前がアプリ名と一致するものを選び、なければ失敗します。

レジストリとライフサイクルの状態は`window.__TUVIX_RUNTIME__`に保持されます。そのため、別々にバンドルされ、それぞれが`@tuvix.js/loader`の独自のコピーを持つマイクロアプリでも、1つのレジストリを参照します。

エントリーで`type: 'module'`が設定されている場合、またはURLが`.mjs`、`.mts`、`.ts`、`.tsx`、`.jsx`で終わる場合、スクリプトは`type="module"`として読み込まれます。その他のURLはクラシックスクリプトとして読み込まれます。

## 共有ランタイム状態

| 状態 | 保持場所 | 理由 |
| --- | --- | --- |
| モジュールレジストリ | `window.__TUVIX_RUNTIME__`（`window.__TUVIX_MODULES__`も） | ローダーがどのバンドルからでもアプリを見つけられるようにするため |
| マウント済みアプリと待機者 | `window.__TUVIX_RUNTIME__` | `whenMounted`がバンドルをまたいで動作するようにするため |
| グローバルイベントバス | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()`がページごとに1つのバスを返すようにするため |

`window`のないサーバー上では、これらはそれぞれモジュールスコープになります。

## 分離モデル

- **CSS**：`register`で`sandbox: true`を指定すると、アプリをShadow Root内にレンダリングし、エントリーの`styles`をそこに読み込みます。[サンドボックス](/ja/guide/sandbox)を参照してください。
- **JavaScript**：デフォルトでは分離されません。すべてのアプリが`window`、`document`、グローバルを共有します。`JsSandbox`は、そのプロキシを通じて実行したコードのみを分離します。

## 次に読むページ

- [ライフサイクルフック](/ja/guide/lifecycle)：契約の詳細。
- [ライフサイクルイベント](/ja/guide/lifecycle-events)：アプリがページに表示されたタイミングを知る。
- [ルーティング](/ja/guide/routing)：パターンのルール。
