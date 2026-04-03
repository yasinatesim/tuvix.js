# ルーティング

`@tuvix.js/router` は URL ベースのマイクロアプリ起動を提供します。URL がルートに一致すると、対応するマイクロアプリがマウントされます。URL が変更されると、アプリがアンマウントされます。

## セットアップ

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // または 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## ルートマッチング

ルートは順番にマッチングされます。最初の一致が優先されます。

| パターン | マッチ対象 | パラメータ |
|---------|-----------|-----------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

ルートパラメータは `props.params` としてマイクロアプリに渡されます：

```ts
// マイクロアプリ内
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // id でユーザーを取得
}
```

## ナビゲーションガード

ガード関数でルートを保護します：

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // ナビゲーションをブロック
      }
      return true;
    },
  },
],
```

## プログラム的ナビゲーション

```ts
// パスに移動
router.navigate('/dashboard');

// クエリパラメータ付きで移動
router.navigate('/search?q=tuvix');

// 現在の履歴エントリを置換（戻るボタンなし）
router.replace('/dashboard');

// 戻る / 進む
router.go(-1);
```

## ハッシュモード

サーバーサイドの URL リライティングがない環境（例：SPA フォールバックなしの静的ホスティング）ではハッシュモードを使用します：

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URL: /#/, /#/about
```

## アクティブルート

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```
