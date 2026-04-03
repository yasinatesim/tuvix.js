# 設定

## Orchestratorオプション

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * ルートコンテナのセレクターまたは要素。
   * マイクロアプリはこの要素内にマウントされます。
   * @default '#app'
   */
  container: '#app',

  /**
   * マイクロアプリがマウントされる前に呼び出されます。
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * マイクロアプリがマウントされた後に呼び出されます。
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * マイクロアプリがmount/unmount中にエラーをスローした時に呼び出されます。
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## マイクロアプリの登録

```ts
orchestrator.register('my-app', {
  /**
   * マイクロアプリのJavaScriptバンドルURL。
   * 文字列または文字列を返すlazy関数が使えます。
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * オプション：マウント時にマイクロアプリに渡す追加props。
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * CSSとJSの分離のためのサンドボックスオプション。
   */
  sandbox: {
    css: true,   // Shadow DOMスタイル分離
    js: false,   // JS Proxyスコープ分離
  },

  /**
   * この特定のアプリのコンテナセレクターを上書きします。
   * Orchestratorレベルのコンテナにフォールバックします。
   */
  container: '#dashboard-container',
});
```

## Routerオプション

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history'はHistory APIを使用します（デフォルト）。
   * 'hash'はURLハッシュを使用します（#/パス）。
   */
  mode: 'history',

  /**
   * ルート定義。
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * ガード関数 - falseを返すとナビゲーションをブロックします。
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## サンドボックスオプション

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * Shadow DOM CSS分離を有効にします。
   */
  css: true,

  /**
   * JS Proxyスコープ分離を有効にします。
   * windowへのアクセスをインターセプトし、アンマウント時にクリーンアップします。
   */
  js: true,
});
```

## 環境変数

Tuvix.jsには必須の環境変数はありません。すべての設定はコードで行います。

本番環境では、バンドラーのdefine/replaceプラグインを使用してランタイム値を注入してください：

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
