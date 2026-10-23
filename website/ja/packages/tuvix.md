---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js（統合パッケージ）"
  description="1つのパッケージ、1つのimportパス。@tuvix.js/coreのオーケストレーターと、@tuvix.js/router、@tuvix.js/event-bus、@tuvix.js/loader、@tuvix.js/sandboxの公開APIを再エクスポートします。"
  icon="🎁"
  github="tuvix"
/>

## インストール

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

`tuvix.js`をインストールすると、`@tuvix.js/core`、`@tuvix.js/router`、`@tuvix.js/event-bus`、`@tuvix.js/loader`、`@tuvix.js/sandbox`がインストールされます。6つのパッケージはすべてES moduleとCommonJSのビルドを提供し、`"sideEffects": false`を宣言しています。

## 使いどころ

オーケストレーターをルーター、イベントバス、サンドボックスと組み合わせて使うシェルアプリケーションには、`tuvix.js`をインストールしてください。バージョン管理する依存関係とimportパスがそれぞれ1つになり、importしないエクスポートはバンドラーが取り除きます。

次の場合は、代わりにスコープ付きパッケージをインストールしてください。

- マイクロアプリがシェルとだけやり取りする場合。`@tuvix.js/event-bus`単体で`getGlobalBus()`を利用でき、オーケストレーターがその`node_modules`に入りません。
- 統合パッケージに含まれないエクスポートが必要な場合。たとえば`@tuvix.js/loader`の`registerModule`や`emitLifecycle`、`@tuvix.js/router`の`pathToRegex`です。[含まれないもの](#not-included)を参照してください。
- パッケージがTuvix.jsのどの部分に依存しているかを`package.json`で明示したい場合。

両方を混在させても安全です。統合パッケージは同じモジュールを再エクスポートするため、`tuvix.js`の`getGlobalBus`と`@tuvix.js/event-bus`の`getGlobalBus`は同じバスを返し、ライフサイクルヘルパーは`window`上の1つのレジストリを共有します。

## クイックスタート

`/about`で`about`をマウントし、リンクのクリックをルーターのナビゲーションに変換し、アプリのエラーをログに出すシェルです。

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

`https://cdn.example.com/about/main.js`にビルドされる`about`アプリです。

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

`<a href="/about?ref=nav">`をクリックすると`/about?ref=nav`がpushされ、オーケストレーターが`about`を`#main`にマウントします（クエリ文字列はマッチングに影響しません）。

## API

以下のエクスポートはすべて再エクスポートです。シグネチャ、オプション、エッジケースはリンク先のパッケージページに記載されています。

### `@tuvix.js/core`から

ドキュメント：[`@tuvix.js/core`](/ja/packages/core)。

| エクスポート | 種類 | 内容 |
| --- | --- | --- |
| `createOrchestrator` | 関数 | `Orchestrator`を作成します。 |
| `Orchestrator` | クラス | アプリを登録し、URLに合わせてreconcileし、ルーターに追従し（`connectRouter`）、propsを更新し、破棄します。 |
| `defineMicroApp` | 関数 | `{ name, bootstrap?, mount, unmount, update?, ssr? }`オブジェクトを検証し、ローダー向けに登録し、`tuvix:mounted` / `tuvix:unmounted` / `tuvix:error`を発行するようにします。 |
| `OrchestratorEvent` | enum | オーケストレーターがバスに発行するイベント名（`tuvix:app:mount`、`tuvix:app:error`など）。 |
| `OrchestratorConfig`、`MicroAppConfig`、`MicroAppDefinition` | 型 | `createOrchestrator`、`register`、`defineMicroApp`の引数。 |
| `AppStatus`、`AppSandboxOption`、`RouterSource`、`RegisteredApp` | 型 | アプリのステータスのunion、`sandbox`オプション、`connectRouter`の引数、アプリのレコードの形。 |
| `AppErrorEvent`、`AppErrorPhase` | 型 | `APP_ERROR`のペイロード`{ name, error, phase }`と、そのphaseのunion（`'load'`、`'bootstrap'`、`'mount'`、`'update'`、`'unmount'`）。 |

### `@tuvix.js/event-bus`から

ドキュメント：[`@tuvix.js/event-bus`](/ja/packages/event-bus)。

| エクスポート | 種類 | 内容 |
| --- | --- | --- |
| `EventBus` | クラス | `on`、`once`、`emit`、`off`、`onAny`を持つPub/Subバス。 |
| `createEventBus` | 関数 | 新しい独立した`EventBus`を作成します。 |
| `getGlobalBus` | 関数 | `window.__TUVIX_GLOBAL_BUS__`に保存されたページ全体のバスを返します。オーケストレーターはデフォルトでこれを使います。 |
| `resetGlobalBus` | 関数 | ページ全体のバスを破棄します。次の`getGlobalBus()`が新しいバスを作成します。 |
| `IEventBus`、`EventHandler`、`WildcardHandler`、`Unsubscribe`、`EventBusOptions` | 型 | バスのインターフェース、ハンドラーのシグネチャ、購読解除関数、コンストラクターのオプション。 |

### `@tuvix.js/router`から

ドキュメント：[`@tuvix.js/router`](/ja/packages/router)。

| エクスポート | 種類 | 内容 |
| --- | --- | --- |
| `Router` | クラス | パスをアプリ名に対応付けるhistoryまたはhashのルーター。 |
| `createRouter` | 関数 | `Router`を作成します。 |
| `matchPath` | 関数 | パスをパターンとマッチさせます（`:param`、`/*`に対応し、クエリとハッシュは無視）。`activeWhen`の文字列はこれを使います。 |
| `matchRoute` | 関数 | `RouteConfig[]`のうちパス全体にマッチする最初のルートを、`params`と`query`付きで返します。 |
| `normalizePath` | 関数 | 先頭にスラッシュを付け、末尾のスラッシュを取り除きます。 |
| `interceptLinks` | 関数 | 同一オリジンのリンクのクリックを`navigate(path)`の呼び出しに変換します。インテントに基づくプリフェッチもオプションで行えます。 |
| `resolveLink` | 関数 | イベントが発生したHTMLリンクについて`{ anchor, url, path }`を返します。ブラウザに処理を任せるべき場合は`null`を返します。 |
| `IRouter`、`RouterConfig`、`RouterMode`、`RouteConfig`、`MatchedRoute` | 型 | ルーターのインターフェース、オプション、ルートの形。 |
| `NavigationEvent`、`NavigationGuard`、`RouteChangeHandler` | 型 | ナビゲーションのペイロード、ガード、リスナーのシグネチャ。 |
| `PathMatch`、`MatchPathOptions`、`InterceptLinksOptions`、`ResolvedLink`、`ResolveLinkOptions` | 型 | `matchPath`の結果とオプション、`interceptLinks`のオプション、`resolveLink`の結果とオプション。 |

### `@tuvix.js/loader`から

ドキュメント：[`@tuvix.js/loader`](/ja/packages/loader)。

| エクスポート | 種類 | 内容 |
| --- | --- | --- |
| `ModuleLoader` | クラス | エントリー（URL、script/styleの設定、またはローダー関数）を、タイムアウト、再試行、キャッシュ付きでロードします。 |
| `createLoader` | 関数 | `ModuleLoader`を作成します。 |
| `whenMounted` | 関数 | アプリが`mounted`ライフサイクルイベントを発行したときにresolveします。 |
| `onLifecycle` | 関数 | `tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`のDOMイベントを監視します。 |
| `isMounted` | 関数 | ライフサイクルイベントに基づき、アプリのいずれかのコンテナがマウントされている間は`true`です。 |
| `Entry`、`EntryConfig`、`MicroAppModule`、`MountContext`、`UnmountContext`、`UpdateContext` | 型 | エントリーの形式と、マイクロアプリが実装するライフサイクルの契約。 |
| `LoaderOptions`、`LoadResult`、`LoadStatus`、`PrefetchStrategy` | 型 | ローダーのオプションと結果。 |
| `LifecycleType`、`LifecycleDetail`、`LifecycleEvent` | 型 | ライフサイクルイベントの名前、ペイロード、DOMイベントの型。 |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### `@tuvix.js/sandbox`から

ドキュメント：[`@tuvix.js/sandbox`](/ja/packages/sandbox)。

| エクスポート | 種類 | 内容 |
| --- | --- | --- |
| `CssSandbox` | クラス | コンテナをshadow rootに移し、その中でスタイルシートをロードします。オーケストレーターは`sandbox: true`のときにこれを使います。 |
| `JsSandbox` | クラス | スクリプトが書き込むグローバルを実際の`window`から隔離するProxyの`window`。 |
| `Sandbox` | クラス | `CssSandbox`と`JsSandbox`を1組の`activate` / `deactivate`の背後にまとめたもの。 |
| `createSandbox` | 関数 | `Sandbox`を作成します。 |
| `SandboxOptions`、`ISandbox`、`ICssSandbox`、`IJsSandbox` | 型 | サンドボックスのオプションとインターフェース。 |
| `AdoptStylesOptions`、`AdoptedStyles` | 型 | `CssSandbox.adoptStyles`の引数と戻り値。 |

### 含まれないもの {#not-included}

統合パッケージには以下が含まれません。それらを提供するパッケージをインストールしてください。

| 必要なもの | インストールするもの |
| --- | --- |
| `registerModule`、`unregisterModule`、`getRegisteredModule`、`emitLifecycle`、`hasServerMarkup`、`normalizeEntry`、`loadScript`、`loadStyle`、`removeScript`、`removeStyle`、`prefetchResource`、および型`EntryLoader`、`EntryLoaderContext`、`MicroAppBus`、`ScriptType`、`CacheEntry`、`ResourceOptions`、`LoadScriptOptions`、`LoadStyleOptions`、`PrefetchOptions` | [`@tuvix.js/loader`](/ja/packages/loader) |
| `pathToRegex`、`parseQuery`、`isPathActive` | [`@tuvix.js/router`](/ja/packages/router) |
| React、Vue、Svelte、Angularのマイクロアプリ | [`@tuvix.js/react`](/ja/packages/react)、[`@tuvix.js/vue`](/ja/packages/vue)、[`@tuvix.js/svelte`](/ja/packages/svelte)、[`@tuvix.js/angular`](/ja/packages/angular) |
| サーバーサイドでの合成 | [`@tuvix.js/server`](/ja/packages/server) |
| Module Federationのリモート | [`@tuvix.js/module-federation`](/ja/packages/module-federation) |
| Viteビルドでのアイランドのアセット | [`@tuvix.js/vite`](/ja/packages/vite) |
| DevToolsパネル | [`@tuvix.js/devtools`](/ja/packages/devtools) |
| プロジェクトのスキャフォールディング | [`create-tuvix-app`](/ja/packages/create-tuvix-app) |

## エッジケース

- `tuvix.js`のエントリーポイントは1つです。`tuvix.js/core`や`tuvix.js/router`のようなサブパスのimportは解決に失敗します。`tuvix.js`またはスコープ付きパッケージからimportしてください。
- 統合パッケージは依存関係を同じリリースに固定しています。`tuvix.js`と並べて別バージョンのスコープ付きパッケージをインストールすると、そのパッケージのコピーが2つできます。`getGlobalBus()`とライフサイクルのレジストリは引き続き`window`を通じて状態を共有しますが、`instanceof Orchestrator`や`instanceof EventBus`のチェックはコピー間で失敗します。
- `whenMounted`、`onLifecycle`、`isMounted`は`tuvix:*`のDOMイベントに反応します。`defineMicroApp`とフレームワークアダプターのモジュールはこれらを発行しますが、手書きのモジュールは`@tuvix.js/loader`の`emitLifecycle`を呼び出さない限り何も発行しません。ドキュメント外にあるコンテナのイベントは`document`でディスパッチされます。
- `resetGlobalBus()`は、実行中のオーケストレーターが保持しているバスを破棄します。オーケストレーターは破棄されたそのバスを保持し続けるため、そのイベントは次の`getGlobalBus()`の購読者に届かなくなります。テストの合間に、`orchestrator.destroy()`の後で呼び出してください。
- `@tuvix.js/core`と`@tuvix.js/router`の挙動の変更と破壊的変更は、そのままここにも当てはまります。[0.4からの移行](/ja/packages/core#migrating-from-0-4)を参照してください。

## しないこと

- 独自のコードは追加しません。すべてのエクスポートは5つのスコープ付きパッケージのいずれかから来ています。
- フレームワークアダプター、サーバーパッケージ、Module Federation、Vite、DevToolsは含まれません。
- パッケージごとのサブパスエントリーは提供しません。
