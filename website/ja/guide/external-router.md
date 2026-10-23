# 外部ルーター

シェルでTanStack Router、React Router、またはその他のルーターがすでにナビゲーションを担っている場合は、その役割をそのまま任せます。`orchestrator.connectRouter()`はオーケストレーターをそのルーターに追従させ、`interceptLinks()`はマイクロアプリ内の通常の`<a href>`のクリックをそのルーターに送ります。

## 使うべき場面

- シェルが独自のルーターを持つReactアプリで、一部のルートがマイクロアプリをホストしている。
- マイクロアプリが通常のリンク（Vue、Svelte、AngularまたはHTMLテンプレート）をレンダリングしていて、ページを再読み込みせずにナビゲーションさせたい。

シェルが独自のルーターを持たない場合は、代わりに組み込みのルーターを使います。[ルーティング](/ja/guide/routing)を参照してください。

## connectRouter

```ts
import { createOrchestrator, type RouterSource } from 'tuvix.js';

const source: RouterSource = {
  // Call `callback` after every navigation; return an unsubscribe function.
  subscribe(callback) {
    window.addEventListener('popstate', callback);
    return () => window.removeEventListener('popstate', callback);
  },
  // The path activeWhen patterns are matched against.
  getPath: () => window.location.pathname,
};

const orchestrator = createOrchestrator(); // no `router` option
const disconnect = orchestrator.connectRouter(source);
await orchestrator.start();

// later
disconnect();
```

- `start()`は`getPath()`の値に対して状態を同期（reconcile）します。その後は、`subscribe`のコールバックが呼ばれるたびに、新しい`getPath()`の値に対する同期がキューに入ります。
- すでに開始済みのオーケストレーターを接続すると、すぐに同期します。
- 同期は1つずつ実行され、次に実行されるのはキュー内の最新のパスだけです。そのため、ルーターイベントが連続して発生しても、確定したパスごとに1回の同期で済みます。
- `destroy()`は接続されているすべてのルーターを切断します。

## TanStack Router

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // your createRouter({ routeTree }) instance

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'blog',
  entry: () => import('./micro-apps/blog'),
  container: '#micro-app',
  activeWhen: '/blog/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

// Plain <a href> inside micro apps → TanStack history.
interceptLinks({ navigate: (path) => router.history.push(path) });

await orchestrator.start();
```

`onResolved`は、ルーターが新しいロケーションを解決した時点で発火します。`onLoad`と`setTimeout`の組み合わせの代わりにこれを使います。

## React Router

`createBrowserRouter`で作成したデータルーターの場合：

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // createBrowserRouter(routes)

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'account',
  entry: () => import('./micro-apps/account'),
  container: '#micro-app',
  activeWhen: '/account/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe(() => callback()),
  getPath: () => router.state.location.pathname,
});

interceptLinks({ navigate: (path) => router.navigate(path) });

await orchestrator.start();
```

`<BrowserRouter>`には購読できるルーターオブジェクトがありません。`useLocation()`を読み取るコンポーネントから橋渡しします。

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Orchestrator, RouterSource } from 'tuvix.js';

export function TuvixBridge({ orchestrator }: { orchestrator: Orchestrator }) {
  const location = useLocation();
  const listeners = useRef(new Set<() => void>());
  const path = useRef<string>(location.pathname);
  path.current = location.pathname;

  useEffect(() => {
    const source: RouterSource = {
      subscribe(callback) {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
      },
      getPath: () => path.current,
    };
    return orchestrator.connectRouter(source);
  }, [orchestrator]);

  useEffect(() => {
    for (const callback of listeners.current) callback();
  }, [location.pathname]);

  return null;
}
```

## マイクロアプリ内の通常のリンク

ルーター自身の`<Link>`コンポーネントは、すでにクライアントサイドでナビゲーションします。マイクロアプリが通常の`<a href>`としてレンダリングするリンクはそうではなく、`interceptLinks`がなければページを再読み込みします。`interceptLinks`は修飾キー付きのクリック、別オリジン、`target="_blank"`、`download`、`rel="external"`、`data-tuvix-reload`、現在のパス上のハッシュのみのリンクをスキップし、それ以外では`navigate`を呼び出します。`prefetch`を追加すると、ホバーやフォーカスの時点で次のルートを事前に準備できます。TanStack Routerの場合：

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

シェルがアンマウントされるときに`stop()`を呼び出します。

## ベースパス

ルーターのbasenameが`/app`などの場合：

- `activeWhen`のパターンは、`getPath()`が返す文字列そのものに対して照合します。ルーターが`/app`付きのパスを返す場合は`'/app/blog/*'`と書くか、`getPath`でベースを取り除きます。
- `interceptLinks({ base: '/app', ... })`は`/app`の外にあるリンクを無視し、`navigate`を呼び出す前に`/app`を取り除きます。ルーターの`navigate`がbasename相対のパスを期待する場合（React Routerの`router.navigate`）に使います。`navigate`がURLのフルパスを受け取る場合（TanStackの`router.history.push`）は`base`を指定しません。

## ルートがレンダリングするコンテナ {#containers-rendered-by-routes}

オーケストレーターはマウント時に`container`を検索します。ルートコンポーネントがコンテナ要素をレンダリングする場合、ルーターのコールバックが発火した時点ではまだDOMに存在しないことがあり、マウントは`Container "#micro-app" not found in DOM`で失敗します。回避策は2つあります。

- マイクロアプリのすべてのルートが共有するレイアウトにコンテナを置き、ナビゲーションの前に存在するようにする。
- ルートコンポーネント自体から`TuvixIsland`（`@tuvix.js/react`）でマイクロアプリをレンダリングし、そのアプリにはオーケストレーターを使わない。

## connectRouterが行わないこと

- ナビゲーションは行いません。ナビゲーションはルーターが担います。
- ルートパラメーターは読み取りません。`updateAppProps`でプロパティとして渡すか、アプリ内で読み取ります。
- リンクのクリックは処理しません。そのためには`interceptLinks`を呼び出します。
