# ライフサイクルイベント

アダプターと`defineMicroApp`は、マイクロアプリがマウント、アンマウント、または失敗したときにページに通知します。DOMイベントをリッスンする、`whenMounted(name)`を待機する、`isMounted(name)`で確認する、のいずれかの方法を使えます。DOMをポーリングしたり、`__vue_app__`のようなフレームワークの内部を読み取ったりする代わりに、アイランドがインタラクティブになった時点でアニメーションを開始する、スケルトンを非表示にする、エラーを報告する、といった用途に使ってください。

## イベント

| DOMイベント | ディスパッチされるタイミング |
| --- | --- |
| `tuvix:mounted` | アプリがレンダリングまたはハイドレートされ、そのフレームワークのマウントコールバックが実行された後。 |
| `tuvix:unmounted` | アプリが破棄され、コンテナが空になった後。 |
| `tuvix:error` | `mount`または`unmount`がエラーをスローしたとき、またはReactアプリがマウント後のレンダリング中にエラーをスローしたとき。 |

各イベントは、アプリのコンテナ上でディスパッチされる`CustomEvent<LifecycleDetail>`です。バブリングし、`composed`であるため、Shadow Rootの内部からでも`document`上のリスナーが受け取ります。コンテナがDOMに存在しなくなった場合（モジュールが`unmounted`を通知する前にReactがアイランドを削除した場合）、イベントは代わりに`document`上でディスパッチされ、`detail.container`は引き続きその要素を指します。

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // the app name
  container: document.body, // the element the app rendered into
  hydrated: true, // true when the adapter adopted server markup
  error: undefined, // the thrown value, on 'error' only
};
```

## onLifecycleでリッスンする

```ts
import { onLifecycle } from 'tuvix.js';

const stopMounted = onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} is interactive (hydrated: ${hydrated})`);
});

const stopErrors = onLifecycle('error', ({ name, error }) => {
  console.error(`${name} failed`, error);
});

// later
stopMounted();
stopErrors();
```

`onLifecycle(type, handler, target = document)`は、リスナーを削除する関数を返します。1つの領域だけを対象にするには、`target`としてコンテナを渡します。通常の`addEventListener('tuvix:mounted', ...)`も使えます。

## whenMountedで待機する

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- アプリがすでにマウントされている場合は即座に解決するため、コードの実行とマウントの順序は問題になりません。
- マウントが失敗してもリジェクトしません。タイムアウト付きの`signal`を渡すか、`tuvix:error`もリッスンしてください。
- シグナルが中断されると、Promiseはシグナルの理由でリジェクトします。

## isMountedで確認する

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## フレームワークの検出を置き換える

ライフサイクルイベントがない場合、ホストはフレームワークのプライベートプロパティをポーリングするなどして、アイランドの準備ができたタイミングを推測する必要があります：

```ts no-check
// Breaks on Svelte, Angular and any Vue release that renames the property.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

ライフサイクルイベントを使えば、1つのリスナーですべてのアダプターに対応できます：

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## イベントをディスパッチするもの

| ソース | ディスパッチするイベント |
| --- | --- |
| `createReactMicroApp`、`createVueMicroApp`、`createSvelteMicroApp`、`createAngularMicroApp`（および`Ssr`バリアント） | 3つすべて |
| `TuvixReactApp` | 3つすべて |
| `TuvixIsland` | 自身はディスパッチしません。ホストするモジュールがディスパッチします |
| `defineMicroApp` | 3つすべて。`ssr: true`の場合、`mount`の前にコンテナがマークアップを保持していれば`hydrated`は`true`です |
| 通常の`{ mount, unmount }`オブジェクト | なし（`emitLifecycle`を呼び出さない限り） |
| オーケストレーター | なし。代わりにイベントバス上で`tuvix:app:*`イベントを発行します |

`defineMicroApp`は、`mount`が解決した後に`tuvix:mounted`を、`unmount`が解決した後に`tuvix:unmounted`をディスパッチし、どちらかがエラーをスローしたときは`tuvix:error`をディスパッチしてから再スローします。`mount`がまだ実行中のコンテナに対する`unmount`は、その完了を待ちます：

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'clock',
  ssr: true, // the server rendered the time into the container
  mount({ container }) {
    container.textContent = new Date().toISOString();
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

通常のオブジェクトとして書かれたモジュールは、イベントを自分でディスパッチできます：

```ts
import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

export const clock: MicroAppModule = {
  mount({ container }) {
    container.textContent = new Date().toISOString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated: false });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
};
```

## エッジケース

- 1つのモジュールを複数のコンテナにマウントできます。`isMounted(name)`はいずれかがマウントされている間`true`のままで、`whenMounted(name)`はまだマウントされているうち最も早いコンテナで解決します。それらを区別する必要がある場合は、配置ごとに別の名前を付けてください。
- 切り離されたコンテナの`tuvix:unmounted`イベントは、`document`のリスナーに1回届きます。`target`にコンテナを指定した`onLifecycle`は、イベントがその要素を通過しなくなるため、これを受け取りません。
- 状態は`window.__TUVIX_RUNTIME__`に保持されるため、別々にバンドルされた`@tuvix.js/loader`のコピー間で共有されます。
- サーバー上にはDOMもイベントもありません。サーバーで`whenMounted`を呼び出さないでください。解決されることはありません。

## できないこと

- 読み込みの進捗は通知しません。`bootstrapping`、`mounting`などはオーケストレーターの`onStatusChange`で扱います。
- 再試行や復旧は行いません。オーケストレーターの`fallback`、または`TuvixIsland`と`TuvixReactApp`の`fallback`を使ってください。
