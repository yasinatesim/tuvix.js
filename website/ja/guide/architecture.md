# アーキテクチャ

## 概要

Tuvix.jsは、小さくコンポーザブルなパッケージのモノレポとして構成されています。使用するものだけをインポートします。

```
@tuvix.js/core          ← Orchestrator、ライフサイクル、登録
@tuvix.js/router        ← URLベースのルーティング
@tuvix.js/event-bus     ← アプリ間パブ/サブ
@tuvix.js/loader        ← 動的バンドルローディング
@tuvix.js/sandbox       ← CSS + JS分離
@tuvix.js/react         ← Reactバインディング
@tuvix.js/vue           ← Vueバインディング
@tuvix.js/svelte        ← Svelteバインディング
@tuvix.js/angular       ← Angularバインディング
@tuvix.js/devtools      ← デバッグパネル
@tuvix.js/server        ← SSRコンポジション
@tuvix.js/module-federation  ← Webpack 5統合
create-tuvix-app        ← CLIスキャフォールディング
tuvix.js                ← アンブレラパッケージ（オールインワン）
```

## リクエストフロー

```
URL変更
    │
    ▼
@tuvix.js/router         ← パスをマイクロアプリ名にマッチング
    │
    ▼
@tuvix.js/core           ← Orchestratorがマウント/アンマウントを決定
    │
    ▼
@tuvix.js/loader         ← マイクロアプリバンドルを取得して実行
    │
    ▼
@tuvix.js/sandbox        ← アプリを分離されたスコープでラップ（オプション）
    │
    ▼
Micro App .mount()       ← アプリがコンテナ要素にレンダリング
```

## ライフサイクル

すべてのマイクロアプリは `MicroApp` インターフェースを実装する必要があります：

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Orchestratorは適切なタイミングでこれらのフックを呼び出します：

1. **`mount`** - アプリのルートがアクティブになった時に呼び出される
2. **`unmount`** - アプリのルートから離れた時に呼び出される
3. **`update`** - 完全な再マウントなしでpropsが変更された時に呼び出される

## 分離モデル

### CSS分離（Shadow DOM）

`sandbox.css = true` の場合、マイクロアプリのコンテナはShadow DOMホストになります。内部で定義されたスタイルは外部に漏れず、グローバルスタイルも内部に漏れません。

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### JS分離（Proxy Scope）

`sandbox.js = true` の場合、マイクロアプリのグローバルスコープは `Proxy` でラップされます。`window.localStorage`、`window.addEventListener` などへのアクセスはインターセプトされ、アンマウント時にクリーンアップされます。

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

Event Busは、すべてのマイクロアプリ間で共有される疎結合のパブ/サブチャネルです：

```ts
// パブリッシャー（任意のマイクロアプリ）
import { eventBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// サブスクライバー（別のマイクロアプリ）
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

イベントは型付き - TypeScriptがイベントペイロードの形状を強制します。
