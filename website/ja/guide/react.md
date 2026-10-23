# Reactで使う

`@tuvix.js/react`には3つの役割があります。`createReactMicroApp`はReactコンポーネントを、どのシェルからでもマウントできるマイクロアプリに変換します。`TuvixReactApp`はReactのホストページ内でReactのマイクロアプリをサーバーレンダリング付きでレンダリングします。`TuvixIsland`はVue、Svelte、Angular、React、または手書きのマイクロアプリをReactのページ内でホストします。

React 18または19が必要です。

## インストール

```bash
pnpm add @tuvix.js/react react react-dom
```

## コンポーネントをマイクロアプリにする

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile ${theme}`}>User {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

このモジュールは次のように動作します。

- `name`で自身を登録するため、URLエントリーから見つけられます。
- コンテナごとに1つのReactルートを作成するため、1つのモジュールを複数の場所にマウントできます。
- Reactが最初のレンダリングをコミットした後に`mount`を解決し、コンテナで`tuvix:mounted`をディスパッチします。
- シェルのプロパティを`App`のpropsとして渡します。`App`は必須のpropsを宣言できますが、アダプターは実行時にそれを検査しません。

| オプション | 型 | 説明 |
| --- | --- | --- |
| `name` | `string` | 必須。登録したアプリ名と一致する必要があります。 |
| `App` | `ComponentType<P>` | 必須。ルートコンポーネント。 |
| `bootstrap` | `() => void \| Promise<void>` | 最初のマウントの前に1回実行されます。 |
| `ssr` | `boolean` | コンテナにサーバーのマークアップがある場合にハイドレートします。`createSsrReactMicroApp`はこれを設定します。 |

## プロパティと更新

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })`は、そのコンテナのルートをマージ後のプロパティで再レンダリングします。コンポーネントの状態は維持されます。`container`を指定しない場合は、モジュールのすべてのルートを再レンダリングします。このモジュールがすでにレンダリングしたコンテナに対して`mount`を呼び出すと、2つ目のルートを作成せずに再レンダリングします。

## エラー

アダプターは`App`をエラーバウンダリーでラップします。

- 最初のレンダリング中に例外が発生すると、`mount`をrejectし、コンテナを空にして`tuvix:error`をディスパッチします。その後、オーケストレーターはアプリの`fallback`のHTMLを表示します。
- それ以降に例外が発生すると、アプリを空白にして`tuvix:error`をディスパッチします。ページの残りの部分は動作し続けます。

## サーバーレンダリングされるReactアプリ

ホストページがReactで、サーバーでレンダリングされる場合（TanStack Start、Next.js、Remix、または独自の`renderToString`）は、`TuvixReactApp`でマイクロアプリをインラインでレンダリングします。

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

- `App`を囲む`<div data-tuvix-app="legal">`をレンダリングするため、HTMLはホスト自身のサーバーレンダリングから出力されます。
- `name`、`App`、`fallback`以外のすべてのプロパティは`App`に渡されます。
- `App`は専用の`<Suspense fallback>`の中に置かれます。サーバーで例外が発生した場合、Reactはこのアプリについてのみフォールバックを送信し、クライアントでアプリを再試行します。
- クライアントでは、エラーバウンダリーが`fallback`を表示し、`tuvix:error`をディスパッチします。
- 最初のコミットの後、サーバーのHTMLをハイドレートした場合は`hydrated: true`付きで`tuvix:mounted`をディスパッチし、ツリーから外れるときに`tuvix:unmounted`をディスパッチします。

別のバンドルがそのマークアップをハイドレートする必要がある場合（例：`@tuvix.js/server`が組み立てたページ）は、同じコンポーネントを`createSsrReactMicroApp`でエクスポートします。同じSuspenseツリーをレンダリングするため、ハイドレーションが一致します。

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

`ssr: true`の場合、空白文字やコメントしか含まないコンテナは、ハイドレーションではなく新規にレンダリングされます。

## TuvixIslandで他のマイクロアプリをホストする

`TuvixIsland`は任意のマイクロアプリモジュールをReactツリー内にマウントします。

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });

export function Footer({ newsletterHtml }: { newsletterHtml?: string }) {
  return (
    <TuvixIsland
      name="newsletter"
      app={newsletter}
      props={{ list: 'weekly' }}
      ssrHtml={newsletterHtml}
      fallback={<p>Subscribe at example.com/newsletter</p>}
    />
  );
}
```

| プロパティ | 説明 |
| --- | --- |
| `name` | `data-tuvix-app`に書き込まれ、`mount`に渡されます。 |
| `app` | マウントするモジュール。 |
| `props` | レンダリングごとに浅く比較されます。変更があると`app.update`を呼び出します。モジュールに`update`がない場合はアンマウントしてからマウントします。 |
| `ssrHtml` | アイランドのサーバーHTML。サーバーでのみ必要です。 |
| `fallback` | `mount`または`update`がrejectした場合に、アイランドの代わりにレンダリングされます。 |
| `as`、`className` | ラッパーのタグ（デフォルトは`div`）とクラス。 |

Reactは最初のレンダリングの後、アイランドの内部HTMLを書き換えません。そのため親が再レンダリングされても、モジュールがアタッチしたDOMとリスナーは維持されます。`name`または`app`が変わると再マウントし、アイランドを削除すると`app.unmount`を呼び出します。マウント、更新、アンマウントは順番に実行されるため、`mount`の実行中に届いたアンマウントはその完了を待ちます。

`TuvixIsland`はURLからモジュールを読み込みません。モジュールをインポートするか、URLエントリーはオーケストレーターに管理させます。サーバーの完全なセットアップは[SSRアイランド](/ja/guide/ssr-islands)にあります。

## フック

### useTuvixBus

マウント時に購読し、アンマウント時に購読を解除します。最新の`handler`をrefを通じて読み取るため、インラインのハンドラーでもレンダリングごとに再購読しません。

```tsx
import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/react';

const bus = getGlobalBus();

export function CartBadge() {
  const [count, setCount] = useState(0);
  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => setCount(itemCount));
  return <span className="badge">{count}</span>;
}
```

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')`は、`updateEvent`で発行されたすべてのペイロードをマージする状態を返します。Tuvix.jsにこのイベントを発行する処理はありません。`updateAppProps`ではなくバス経由でプロパティを渡したい場合は、自分で発行します。

```tsx
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixProps } from '@tuvix.js/react';

const bus = getGlobalBus();

export function Theme() {
  const props = useTuvixProps({ theme: 'light' }, bus);
  return <p>Theme: {props.theme}</p>;
}

bus.emit('tuvix:props:update', { theme: 'dark' });
```

## アダプターが行わないこと

- マイクロアプリ間で1つのReactルートを共有しません。各アプリ、各コンテナがそれぞれ専用のルートを持ちます。
- Reactの重複を排除しません。別々にバンドルされた2つのReactマイクロアプリは、Reactのコピーを2つ配布します。
- ホストページの`<head>`はレンダリングしません。タイトルとmetaタグはホストが担います。

## API

| エクスポート | 用途 |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | Reactマイクロアプリのモジュール |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | `ssr: true`を設定した同等のもの |
| `TuvixReactApp` | Reactホスト内のインラインReactマイクロアプリ（SSR対応） |
| `TuvixIsland` | 任意のマイクロアプリモジュールをReactツリー内でホストする（SSR対応） |
| `useTuvixBus(bus, event, handler)` | コンポーネントに紐づいたイベントバスの購読 |
| `useTuvixProps(initial, bus?, event?)` | バスのイベントからマージされるプロパティ |
