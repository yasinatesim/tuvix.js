# tuvix.js

> Tuvix.jsのオーケストレーター、ルーター、イベントバス、ローダー、サンドボックスをまとめた1つのパッケージです。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。

完全なドキュメント：[tuvix.js.org/packages/tuvix](https://tuvix.js.org/packages/tuvix)

## インストール

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

これにより`@tuvix.js/core`、`@tuvix.js/router`、`@tuvix.js/event-bus`、`@tuvix.js/loader`、`@tuvix.js/sandbox`がインストールされます。すべてのパッケージが`"sideEffects": false`を宣言しているため、インポートしないエクスポートはバンドラーが除去します。

## 使いどころ

オーケストレーターをルーター、バス、サンドボックスと組み合わせるシェルでは`tuvix.js`を使います。マイクロアプリが1つの機能だけを必要とする場合（たとえば`getGlobalBus()`のための`@tuvix.js/event-bus`）や、統合パッケージに含まれないエクスポートが必要な場合（下記参照）は、代わりにスコープ付きパッケージをインストールしてください。両方を1つのプロジェクトで併用できます。`getGlobalBus()`とライフサイクルレジストリは`window`を通じて状態を共有します。

## クイックスタート

```ts
import { createOrchestrator, defineMicroApp, interceptLinks } from 'tuvix.js';

// Normally this lives in the remote app's bundle.
defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});

const orchestrator = createOrchestrator({ router: { routes: [] } });
orchestrator.register({
  name: 'about',
  entry: { scripts: [] },
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

## API

すべてのエクスポートは再エクスポートです。

| ソース | ランタイムエクスポート | 型 |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

含まれないもの：`registerModule`、`emitLifecycle`、`hasServerMarkup`、スクリプトヘルパー、`EntryLoader` / `MicroAppBus`型（`@tuvix.js/loader`をインストールしてください）。`pathToRegex`、`parseQuery`、`isPathActive`（`@tuvix.js/router`をインストールしてください）。フレームワークアダプター、`@tuvix.js/server`、`@tuvix.js/module-federation`、`@tuvix.js/vite`、`@tuvix.js/devtools`。

## エッジケース

- エントリーポイントは1つです。`tuvix.js/core`などのサブパスは解決されません。
- 統合パッケージとは異なるバージョンのスコープ付きパッケージを使うと、コピーが2つになります。`window`上の共有状態は引き続き機能しますが、コピー間の`instanceof`チェックは失敗します。
- `whenMounted`、`onLifecycle`、`isMounted`は、`defineMicroApp`のモジュールとフレームワークアダプターが発行する`tuvix:*` DOMイベントを受け取ります。`isMounted(name)`は、アプリのいずれかのコンテナーがマウントされている間`true`のままです。
- `resetGlobalBus()`は、実行中のオーケストレーターが保持しているバスを破棄します。`destroy()`の後に呼び出してください。
- `@tuvix.js/core`と`@tuvix.js/router` 0.5.0の破壊的変更はこのパッケージにも適用されます。

## 行わないこと

- 独自のコードは追加しません。
- アダプター、サーバーレンダリング、Module Federation、Vite、DevToolsは含みません。

## ライセンス

MIT
