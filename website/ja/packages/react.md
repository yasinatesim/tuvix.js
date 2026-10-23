---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="Reactバインディング"
  description="ReactコンポーネントをTuvix.jsのマイクロアプリに変換し、任意のマイクロアプリ（Vue、Svelte、Angular、React、バニラ）をサーバーレンダリングとハイドレーション付きでReactツリー内にホストします。"
  icon="⚛️"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

このパッケージにはReact 18以降が必要です（`react`と`react-dom`のピア範囲は`>=18.0.0`）。`@tuvix.js/loader`と`@tuvix.js/event-bus`に依存します。

## 使用する場面

このパッケージは2つの方向をカバーします。

- **マイクロアプリとしてのReact。** `createReactMicroApp`と`createSsrReactMicroApp`は、Reactコンポーネントをオーケストレーターとローダーが想定する`{ bootstrap, mount, unmount, update }`モジュールでラップします。Reactアプリが、Tuvixのシェルが読み込むマイクロアプリの1つである場合に使います。
- **ホストとしてのReact。** `TuvixIsland`は任意のマイクロアプリモジュールをReactページ内にマウントし、再レンダリングをまたいでそのDOMを維持します。`TuvixReactApp`はReactマイクロアプリをホストのツリー内にインラインでレンダリングします。シェルがTanStack Start、Next.js、RemixなどのReact SSRフレームワークである場合に使います。

シェルがReactを使わないプレーンなHTMLであれば、必要なのは最初の2つと[`@tuvix.js/core`](/ja/packages/core)だけです。Vue、Svelte、Angularのマイクロアプリでは、[`@tuvix.js/vue`](/ja/packages/vue)、[`@tuvix.js/svelte`](/ja/packages/svelte)、[`@tuvix.js/angular`](/ja/packages/angular)でモジュールを作成します。`TuvixIsland`はそのいずれもホストできます。

## クイックスタート

マイクロアプリのモジュールを作成します。

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

シェルに登録します。オーケストレーターはルートが一致すると`mount`を呼び出し、propsを変更すると`update`を呼び出します。

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// Re-renders <Dashboard userId="u_43" />; component state survives.
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | `@tuvix.js/loader`の`registerModule`を通じてモジュールを登録する名前です。ライフサイクルイベントはこの名前を持ちます。 |
| `App` | `ComponentType<P>` | 必須 | ルートコンポーネントです。マウント時のpropsを自身のpropsとして受け取るため、`{ page: 'privacy' \| 'terms' }`のような必須propsを持つコンポーネントも型チェックを通ります。 |
| `bootstrap` | `() => void \| Promise<void>` | なし | 一度だけ実行するセットアップです。モジュールの`bootstrap()`はこれをawaitします。 |
| `ssr` | `boolean` | `false` | コンテナが要素または空白以外のテキストを含む場合、`hydrateRoot`でサーバーのマークアップをハイドレートします。空白またはコメントのみのコンテナには`createRoot`で新規にレンダリングします。 |

返されるモジュールは4つのメソッドを持ちます。

- `mount({ container, props })`はそのコンテナ用にReactルートを1つ作成します。Reactが最初のレンダリングをコミットした後に解決し、コンテナ上で`hydrated: true`または`false`を付けて`tuvix:mounted`をディスパッチします。最初のレンダリングで`App`がサスペンドした場合、`mount`はコンテンツがコミットされるまで待ちます。
- `update({ props, container })`はそのコンテナ内で`App`を`props`付きで再レンダリングします。`container`を省略すると、モジュールがマウントしたすべてのコンテナを再レンダリングします。ツリーの形が変わらないため、Reactはコンポーネントの状態を保持します。
- `unmount({ container })`はルートをアンマウントし、`replaceChildren()`でコンテナを空にして`tuvix:unmounted`をディスパッチします。
- `bootstrap()`は`config.bootstrap`を実行します。

コンテナごとに独自のルートを持つため、1つのモジュールを複数の場所へ同時にマウントできます。

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

モジュールは`mount`の中で`react-dom/client`を遅延インポートします。サーバーバンドルは、クライアントレンダラーを取り込まずにモジュールをインポートできます（たとえば`App`を`TuvixReactApp`と共有するため）。

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

`createReactMicroApp({ ...config, ssr: true })`と同じです。オプションは上の表と同じく`name`、`App`、`bootstrap`です。

同じコンポーネントについてサーバーがレンダリングしたHTMLがコンテナにすでにある場合に、クライアントで使います。レンダリングするツリーは`TuvixReactApp`がレンダリングするもの（エラーバウンダリと`<Suspense>`）と一致するため、`TuvixReactApp`のマークアップを不一致なくハイドレートします。

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland`

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| プロパティ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | マイクロアプリ名です。アイランドはこれを`data-tuvix-app`に書き込み、`app.mount`に渡します。 |
| `app` | `MicroAppModule` | 必須 | マウントするモジュールです。`createVueMicroApp`、`createSvelteMicroApp`、`createAngularMicroApp`、`createReactMicroApp`、それぞれの`createSsr*`版の戻り値、または手書きの`{ mount, unmount, update? }`オブジェクトです。 |
| `props` | `Record<string, unknown>` | `{}` | モジュールに渡すpropsです。アイランドはレンダリングのたびにこれを浅く比較します。 |
| `ssrHtml` | `string` | なし | アイランドのサーバーレンダリング済みHTMLです（たとえば`renderVueToString`の結果）。サーバー側でのみ渡します。 |
| `fallback` | `ReactNode` | `null` | `mount`または`update`がrejectしたとき、アイランドの代わりにレンダリングされます。 |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | ラッパー要素のタグです。 |
| `className` | `string` | なし | ラッパー要素のクラス名です。 |

`TuvixIsland`は、React以外のマイクロアプリ（または別バンドルのReactマイクロアプリ）をReactページ内にホストします。<span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span>をレンダリングする手書きのブリッジは、親の最初の再レンダリングで壊れます。Reactは新しい`{ __html }`オブジェクトを見て`innerHTML`を再代入し、マイクロアプリが付けたDOMとリスナーを破棄するためです。`TuvixIsland`はこれを回避します。

- **サーバーレンダリング。** `ssrHtml`を内部HTMLとして持つ`<div data-tuvix-app={name} data-tuvix-island={id}>`をレンダリングします。`id`はReactの`useId`から得るため、サーバーとクライアントで同じ値になります。
- **ハイドレーション。** クライアントでの最初のレンダリングで、`data-tuvix-island`を使ってページ内の自身の要素を見つけ、内部HTMLをDOMから読み戻します。`ssrHtml`をクライアントへ再送する必要はなく、クライアントのレンダリング結果はサーバーのものと一致します。
- **安定したDOM。** アイランドは`{ __html }`オブジェクトを`useState`で一度だけ作成します。以降のレンダリングは同じオブジェクトを再利用するため、Reactがアイランドの子要素を書き換えることはありません。親が再レンダリングしても、マイクロアプリのノードとリスナーは保持されます。
- **マウント。** 最初のコミットの後、アイランドは`app.mount({ container, props, name })`を呼び出します。`ssr: true`で作成したモジュール（`createSsrVueMicroApp`など）はここでサーバーのDOMを引き継ぎます。SSRなしのモジュールはコンテナに新規にレンダリングします。
- **props。** `props`が浅い比較で変化した場合（キーが異なる、または`Object.is`で一致しない値がある）、アイランドは`app.update({ props, container })`を呼び出します。`update`を持たないモジュールには、`unmount`、コンテナを空にする処理、新たな`mount`が順に行われます。同じ値を持つインラインのオブジェクトリテラルでは更新は発生しません。
- **同一性。** `name`または`app`が新しくなると、古いモジュールをアンマウントして新しいモジュールをマウントします。
- **削除。** アイランドがツリーから外れると、`app.unmount({ container })`を呼び出してコンテナを空にします。
- **順序。** マウント、更新、アンマウントの呼び出しは1つずつ順に実行されます。`mount`の保留中に届いたアンマウントは、その完了を待ちます。
- **エラー。** `mount`または`update`がrejectすると、アイランドはラッパーの代わりに`fallback`をレンダリングします。`tuvix:error`はアダプター自身がディスパッチし、アイランドはイベントを追加しません。後で`name`または`app`が変わると再試行します。

ReactレイアウトにVueのフッターを入れた、サーバーとクライアントの完全なセットアップです。

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// No footerHtml here: the island reads the footer HTML from the page.
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

サーバーのHTMLはJavaScriptより先にブラウザへ届くため、フッターのスタイルシートを`<head>`に出力しておけば、フッターは最初の描画からスタイル付きで表示されます。[`@tuvix.js/vite`](/ja/packages/vite)がその`<link>`タグを提供します。

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| プロパティ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | マイクロアプリ名で、`data-tuvix-app`に書き込まれます。`createSsrReactMicroApp`に渡す`name`と一致させます。 |
| `App` | `ComponentType<P>` | 必須 | レンダリングするコンポーネントです。 |
| `fallback` | `ReactNode` | `null` | `App`がサスペンドしている間と、例外を投げた後に表示されます。 |
| その他のプロパティ | `P` | `P`で必須のもの | `App`に渡されます。 |

`TuvixReactApp`はReactマイクロアプリをホストのReactツリーの一部としてインラインでレンダリングするため、そのHTMLはSSRフレームワークがレンダリングします。`<div data-tuvix-app={name}>`を出力し、`App`をエラーバウンダリと`<Suspense fallback>`でラップします。

- **サーバーのエラーは局所化されます。** サーバーレンダリング中に`App`内で例外が発生すると、Reactはこのアプリについてのみ`fallback`をレンダリングします。ページの残りはレンダリングされ、Reactはクライアントで`App`を再試行します。
- **クライアントのエラーは局所化されます。** エラーバウンダリがクライアントでのレンダリングエラーを捕捉し、`fallback`を表示してラッパー上で`tuvix:error`をディスパッチします。
- **ライフサイクルイベント。** 最初のコミットの後に`tuvix:mounted`をディスパッチします。ラッパーがサーバーのHTMLから来た場合、`hydrated`は`true`です。コンポーネントがツリーから外れると、Reactがラッパーを切り離す前に`tuvix:unmounted`をディスパッチするため、`document`上のリスナーもこれを受け取ります。表示済みの`<Suspense>`バウンダリが再びサスペンドした場合、アプリは`unmounted`を報告し、コンテンツが戻ると`mounted`を報告します。

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

Vue、Svelte、Angular、バニラのマイクロアプリをホストするには`TuvixIsland`を使います。

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

エフェクト内で`bus`の`event`に`handler`を購読し、アンマウント時に購読を解除します。フックは最新の`handler`をrefに保持するため、最新の状態を読むハンドラーでもレンダリングのたびに再購読することはありません。`bus`または`event`が新しくなると再購読します。購読はクライアントにのみ存在します。サーバーレンダリング中はエフェクトが実行されないためです。

アダプターはオーケストレーターのバスを`App`に渡しません。`eventBus`オプションを指定しない限り、オーケストレーターは`getGlobalBus()`を使うので、バスはそこから取得します。

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| 引数 | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `initialProps` | `T` | 必須 | 初期値です。フックは最初のレンダリングでこれを読み、以降の変更は無視します。 |
| `bus` | `IEventBus` | なし | リッスンするバスです。省略すると、フックは`initialProps`をそのまま返します。 |
| `updateEvent` | `string` | `'tuvix:props:update'` | このイベントのペイロードを、フックが現在のpropsにマージします（`{ ...prev, ...payload }`）。 |

オーケストレーターもアダプターも`tuvix:props:update`を発行しません。自分で発行します。`createReactMicroApp`で作成したモジュールでは、オーケストレーターからのpropsにこのフックは不要です。`update({ props })`が新しいpropsで`App`を再レンダリングします。

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### 型

| 型 | 説明 |
| --- | --- |
| `ReactMicroAppConfig<P>` | `createReactMicroApp`の設定：`name`、`App`、`bootstrap?`、`ssr?`。 |
| `TuvixIslandProps` | `TuvixIsland`のプロパティ：`name`、`app`、`props?`、`ssrHtml?`、`fallback?`、`as?`、`className?`。 |
| `TuvixReactAppProps<P>` | `TuvixReactApp`のプロパティ：`name`、`App`、`fallback?`、および`App`のprops。 |

## エッジケース

- **最初のレンダリングで例外が発生した場合。** `mount`はそのエラーでrejectし、ルートをアンマウントしてコンテナを空にし、`tuvix:error`をディスパッチします。0.4では`mount`は解決し、エラーはReactのルートエラーハンドラーに届いていました。
- **後のレンダリングで例外が発生した場合。** エラーバウンダリがアプリを空にし、`tuvix:error`をディスパッチします。ホストページは動作を続けます。アプリはアンマウントして再度マウントするまで空のままで、`update`では元に戻りません。
- **マウント中のアンマウント。** `mount`がまだ`react-dom/client`を読み込んでいるか最初のコミットを待っている間に届いた`unmount`は、その完了を待ち、コンテナを空にして、`mounted`イベントはディスパッチしません。
- **同じコンテナへの2回のマウント。** モジュールがすでに保持しているコンテナへの2回目の`mount`は、古いルートをアンマウントして`tuvix:unmounted`をディスパッチし、新しいpropsで新規にレンダリングして`tuvix:mounted`をディスパッチします。コンポーネントの状態はリセットされます。Vue、Svelte、Angularのアダプターも同じ動作です。状態を保持するには`update`を呼び出します。
- **未知のコンテナ。** モジュールがマウントしていないコンテナに対する`unmount`と`update`は何もしません。
- **propsは置き換えられます。** モジュールの`update`は、渡したpropsのみで`App`をレンダリングします。`orchestrator.updateAppProps`は`update`を呼び出す前に、新しいpropsを登録済みのpropsにマージします。
- **`ssr: true`で空白のみのコンテナ。** `hasServerMarkup`が空白テキストとコメントを無視するため、モジュールは新規にレンダリングします。
- **Reactによるアイランドの削除。** モジュールが`tuvix:unmounted`を報告する前に、Reactがアイランドの要素を切り離します。そのため`emitLifecycle`は、切り離された要素の代わりに`document`上でイベントをディスパッチします。`document`のリスナー（または`@tuvix.js/loader`の`onLifecycle`）は引き続きこのイベントを受け取り、`detail.container`は削除された要素を指します。コンテナ自体や祖先要素のリスナーは受け取りません。`isMounted(name)`は、アプリが他のいずれかのコンテナにマウントされている間は`true`のままで、最後のコンテナがアンマウントされると`false`になります。
- **開発環境の`<StrictMode>`下のアイランド。** Reactはマウントのエフェクト、そのクリーンアップ、再度のエフェクトを順に実行します。アイランドはモジュールの呼び出しをキューに入れ、クリーンアップがすでに実行された最初の実行をスキップするため、モジュールは一度だけマウントされてサーバーのDOMを引き継ぎます。
- **マウント失敗後の新しいアプリ。** `mount`がrejectすると、アイランドはサーバーのHTMLを破棄します。その後に別の`app`または`name`を渡すと、新しいモジュールは失敗したアプリのマークアップを引き継がず、空の要素にマウントします。
- **アイランドの`ssrHtml`の変更。** アイランドは最初のレンダリングでのみ`ssrHtml`を読みます。新しいコンテンツは`props`で渡します。
- **同じ名前を2回使う場合。** `registerModule`は、その名前で最後に作成されたモジュールを保持します。

## 対象外の機能

- URLからモジュールを読み込みません。モジュールをインポートするか、[`@tuvix.js/core`](/ja/packages/core)に`entry`経由で読み込ませます。
- マイクロアプリを文字列にレンダリングしません。サーバーでは`react-dom/server`の`renderToString`を`TuvixReactApp`と組み合わせて使うか、各フレームワーク自身のレンダラー（[`@tuvix.js/vue/server`](/ja/packages/vue)の`renderVueToString`、またはSvelteとAngularの同等の関数）を使い、その結果を`ssrHtml`として`TuvixIsland`に渡します。
- `MountContext.bus`や`MountContext.name`を`App`に渡しません。`@tuvix.js/event-bus`の`getGlobalBus()`を使います。
- アイランドのCSSを読み込みません。サーバーレンダリングされたアイランドのスタイルシートリンクを出力するには[`@tuvix.js/vite`](/ja/packages/vite)を使います。
- React 17以前はサポートしません。

## 0.4からの移行

**`TuvixReactApp`のサーバーHTMLにSuspenseマーカーが含まれます。** ラッパーはアプリの周囲に`<!--$-->…<!--/$-->`を含むようになりました。サーバーとクライアントの`@tuvix.js/react`を同時にアップグレードしないと、ハイドレーションが不一致で失敗します。

**最初のレンダリングで例外が発生すると`mount`はrejectします。** `mount`をawaitして解決を前提にしていた場合は、エラーを捕捉します。

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4: never reached. 0.5: the render error; the container is empty.
  container.textContent = 'This section failed to load.';
}
```

**未知のコンテナに対する`unmount`は何もしません。** 0.4ではコンテナを空にしていました。その動作に依存していた場合は、`container.replaceChildren()`を自分で呼び出します。

**設定オブジェクト。** このページの以前の版では`createReactMicroApp(App)`と示していました。この関数は設定オブジェクトを受け取ります：`createReactMicroApp({ name: 'dashboard', App })`。

その他の解説は[Reactガイド](/ja/guide/react)を参照してください。
