---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="ローダー"
  description="スクリプトURLまたはローダー関数からマイクロアプリのバンドルを名前で読み込みます。リトライ、タイムアウト、共有モジュールレジストリ、ライフサイクルイベントを備えています。"
  icon="📦"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## 使いどころ

`@tuvix.js/loader`は、エントリー（スクリプトURL、スクリプトとスタイルのリスト、または`() => import('./app')`）を、`mount`と`unmount`を持つマイクロアプリモジュールに変換します。`<script>`タグと`<link>`タグを追加し、失敗した試行をリトライし、タイムアウト後に諦め、結果をアプリ名でキャッシュします。

`@tuvix.js/core`は`ModuleLoader`を自動で作成し、`createOrchestrator`の`loader`オプションをそれに渡します。そのため、ほとんどのシェルはこのパッケージをimportしません。次の場合にimportします。

- `registerModule`で自身を公開する、または`emitLifecycle`で`tuvix:mounted`を通知するマイクロアプリやアダプターを書く
- 別のアプリがいつマウントされたかを知る必要がある（`whenMounted`、`onLifecycle`）
- オーケストレーターなしでマイクロアプリを読み込む（たとえば独自のルーターから）
- 単一のスクリプトまたはスタイルシートを重複排除しながら読み込む（`loadScript`、`loadStyle`）

バンドラーがビルド時にアプリをimportでき、別のオリジンからコードを読み込むことがない場合は、通常の`import()`で十分です。

## クイックスタート

マイクロアプリは名前を付けてモジュールを公開します。このファイルは`https://cdn.example.com/dashboard/main.js`にビルドされます。

```ts
// dashboard/src/main.ts
import { registerModule } from '@tuvix.js/loader';

registerModule('dashboard', {
  mount({ container, props }) {
    container.innerHTML = `<h2>Dashboard for user ${String(props?.userId)}</h2>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

シェルは名前でそれを読み込み、マウントします。

```ts
// shell/src/main.ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 15000, retries: 1 });
const container = document.getElementById('dashboard')!;

const result = await loader.load('dashboard', {
  scripts: ['https://cdn.example.com/dashboard/main.js'],
  styles: ['https://cdn.example.com/dashboard/main.css'],
  type: 'module',
});

if (result.module) {
  await result.module.mount({ container, props: { userId: 42 } });
} else {
  container.textContent = 'The dashboard is unavailable.';
  console.error(result.error);
}
```

`load()`はスローしません。失敗した読み込みは、`status: 'error'`、`module: null`、最後のエラーとともに返ります。

## エントリーの形式 {#entry-forms}

`Entry`は、アプリのコードがどこにあるかをローダーに伝えます。3つの形式があります。

**URL文字列。** ローダーは`'https://cdn.example.com/app.js'`を`{ scripts: ['https://cdn.example.com/app.js'] }`として扱います。

**`EntryConfig`オブジェクト：**

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `scripts` | `string[]` | 必須 | スクリプトURL。ローダーはこの順序で1つずつ実行します。空の配列の場合は何も読み込まず、レジストリからモジュールを解決します。 |
| `styles` | `string[]` | `[]` | スタイルシートURL。スクリプトと並列で読み込まれます。読み込みは両方を待ちます。 |
| `type` | `'module' \| 'classic'` | URLごとに推定 | `scripts`内のすべてのURLのスクリプトタイプ。指定しない場合、`.mjs`、`.mts`、`.ts`、`.tsx`、`.jsx`で終わるURLは`type="module"`として読み込まれ、それ以外のURLはクラシックスクリプトとして読み込まれます。`.js`で終わるViteやRollupのES出力には`'module'`を設定してください。 |
| `integrity` | `Record<string, string>` | なし | URLをキーとするサブリソース完全性（SRI）のハッシュ。ローダーはこれを`<script>`、`<link>`、プリフェッチのタグに書き込みます。 |

**ローダー関数（`EntryLoader`）。** ローダーはこの関数を`{ signal }`とともに呼び出し、次の3種類の結果を受け付けます。この順序で確認します。

1. `mount`関数を持つモジュール
2. `default`エクスポートがそのようなモジュールであるオブジェクト（ESモジュールの名前空間）
3. 使用できるものがない場合。このときローダーは、importが`registerModule(name, ...)`で登録したモジュールを探します

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

バンドラーは`./dashboard`を独自のチャンクにコード分割し、初回のマウント時に取得します。[`@tuvix.js/module-federation`](/ja/packages/module-federation)がフェデレーションされたリモートをオーケストレーターに組み込む方法も、ローダー関数です。

`signal`は試行がタイムアウトすると中断されます。途中で`fetch`するものすべてに渡してください。

```ts
import type { EntryLoader } from '@tuvix.js/loader';

const entry: EntryLoader = async ({ signal }) => {
  const response = await fetch('/api/manifest/dashboard.json', { signal });
  const { url } = (await response.json()) as { url: string };
  return import(/* @vite-ignore */ url);
};
```

## API

### `ModuleLoader`

```ts no-check
class ModuleLoader {
  constructor(options?: LoaderOptions);
  load(name: string, entry: Entry): Promise<LoadResult>;
  prefetch(entry: Entry): void;
  removeStyles(name: string): void;
  unload(name: string): void;
  clearCache(): void;
  isLoaded(name: string): boolean;
  getModule(name: string): MicroAppModule | null;
  getStatus(name: string): LoadStatus;
  getCachedNames(): string[];
}
```

各`ModuleLoader`は、解決済みモジュールの独自のキャッシュをアプリ名ごとに保持します。`<script>`タグと`<link>`タグはページ全体で共通です。同じURLを読み込む2つのローダーは1つのタグを共有します。

`LoaderOptions`：

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | 1回の試行の制限時間（ミリ秒）。エントリーのすべてのスクリプトとスタイルシートが対象です。`0`で無効になります。 |
| `retries` | `number` | `2` | 最初の試行が失敗した後の追加の試行回数。`2`は最大3回の試行を意味します。 |
| `retryDelay` | `number` | `1000` | 試行間の待機時間（ミリ秒）。 |
| `globals` | `Record<string, unknown>` | `{}` | URLエントリーの各試行の前にローダーが`window`に代入するプロパティ。`window.React`や設定オブジェクトを前提とするUMDバンドル向けです。ローダー関数のエントリーでは無視されます。 |

#### `load(name, entry)`

`LoadResult`に解決されます。

| フィールド | 型 | 意味 |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | 読み込みの結果。 |
| `module` | `MicroAppModule \| null` | 解決されたモジュール。エラー時は`null`です。 |
| `error` | `Error \| null` | 最後の試行のエラー。 |
| `duration` | `number` | 呼び出しから結果までのミリ秒。`performance.now()`で計測します。 |

URLエントリーの場合、1回の試行は次のように進みます。

1. `options.globals`を`window`に代入する
2. スクリプトを順番に追加し（それぞれ前のスクリプトを待ちます）、スタイルシートを並列で追加する
3. レジストリからモジュールを読み取る（`getRegisteredModule(name)`）
4. UMDグローバルにフォールバックする：この読み込み中に現れた、`mount`関数を持つ`window`のプロパティ

その後ローダーは、モジュールが`mount`関数と`unmount`関数を持つことを確認し、`name`でキャッシュします。同じ名前での以降の呼び出しは、キャッシュされたモジュールを返し、`entry`を無視します。最初の呼び出しがまだ読み込み中のときの2回目の呼び出しは、同じPromiseを返します。異なる名前の読み込みは並列で実行されます。

#### `prefetch(entry)`

エントリーのファイルを実行せずにダウンロードするようブラウザに依頼します。モジュールスクリプトには`<link rel="modulepreload">`、クラシックスクリプトとスタイルシートには`<link rel="prefetch">`が使われます。ローダー関数のエントリーはスキップされます。関数を呼び出すとモジュールが実行されてしまうためです。オーケストレーターは`prefetch`設定に応じてこれを呼び出します。

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

読み込み済みアプリのスタイルシートを削除し、アンマウント中はそのCSSが適用されないようにします。スタイルを削除していない別のキャッシュ済みアプリが同じURLを持つ場合、そのスタイルシートは残ります。次の`load(name)`はスタイルシートを再び追加し、解決する前にそれらを待ちます。オーケストレーターはアンマウントのたびに`removeStyles`を呼び出します。

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
const container = document.getElementById('cart')!;
const { module } = await loader.load('cart', { scripts: ['/cart.js'], styles: ['/cart.css'] });

await module?.mount({ container });
await module?.unmount({ container });
loader.removeStyles('cart');
```

#### `unload(name)`

アプリを破棄します。スタイルシートとscriptタグを削除し、キャッシュから外し、登録されているモジュールがこのローダーが解決したものであれば共有レジストリから登録解除します。次の`load(name)`はエントリーを再び取得して実行します。オーケストレーターは`unregister(name)`からこれを呼び出します。

#### `clearCache()`

キャッシュされたすべてのアプリに対して`unload`を呼び出します。オーケストレーターは`destroy()`からこれを呼び出します。

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

キャッシュを読み取ります。`getStatus`は、読み込みの実行中は`'loading'`、モジュールがキャッシュされると`'loaded'`、それ以外は`'idle'`を返します。読み込みに失敗した場合、ステータスは`'idle'`のままです。

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

`new ModuleLoader(options)`と同じです。上の表の`LoaderOptions`を受け取ります。

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

オーケストレーターにこれらのオプションを設定するには、`loader`として渡します。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

URLを`{ scripts: [url] }`に変換し、`EntryConfig`はそのまま返します。ローダー関数は受け付けません。先に`typeof entry === 'function'`を確認してください。

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | 拡張子から推定 | スクリプトタイプ。`EntryConfig.type`と同じルールです。 |
| `integrity` | `string` | なし | `integrity`属性用のSRIハッシュ。 |
| `signal` | `AbortSignal` | なし | 中断されると待機をやめます。Promiseはsignalの理由でrejectされます。 |

`<script crossorigin="anonymous">`を`document.head`に追加し、その`load`イベントで解決します。同じURLに対する同時呼び出しは1つのタグを共有し、すでに読み込まれたURLに対する呼び出しはすぐに解決します。読み込みに失敗するとタグを削除し、`[Tuvix Loader] Failed to load script: <url>`でrejectするため、次の呼び出しは新しいタグで始まります。中断された呼び出しは、他の呼び出し元がまだそのタグを待っていない場合にのみタグを削除します。`loadScript`には独自のタイムアウトがありません。`signal`を渡してください。

2番目の引数に文字列を渡すと、0.4と同様にintegrityハッシュとして読み取られます。

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | 指定したミリ秒が経過すると、`[Tuvix Loader] Style load timed out: <url>`で読み込みを失敗させます。`0`で無効になります。 |
| `integrity` | `string` | なし | `integrity`属性用のSRIハッシュ。 |
| `signal` | `AbortSignal` | なし | 中断されると待機をやめます。 |

`<link rel="stylesheet" crossorigin="anonymous">`を`document.head`に追加します。共有、失敗、中断のルールは`loadScript`と同じです。2番目の引数に数値を渡すと、0.4と同様にタイムアウトとして読み取られます。

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

`loadScript`が`url`のために追加したタグと、`src`属性が`url`と等しいすべての`<script>`を削除します。そのURLでまだ進行中の読み込みは`[Tuvix Loader] Removed before load: <url>`でrejectされます。次の`loadScript(url)`は新しいタグを追加します。スクリプトがすでに実行したコードはメモリに残ります。

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

`<link rel="stylesheet">`タグに対する`removeScript`と同じです。

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `.css`のURLは`'style'`、それ以外は`'script'` | リソースの種類。 |
| `type` | `'module' \| 'classic'` | 拡張子から推定 | モジュールスクリプトには`rel="modulepreload"`が使われます。 |
| `integrity` | `string` | なし | リンク用のSRIハッシュ。 |

URLとページごとに`<link>`を1つ追加します。`loadScript`または`loadStyle`がすでに扱っているURLや、以前にプリフェッチされたURLはスキップされます。

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

アプリのスクリプトが実行された後にローダーが見つけられるよう、モジュールを名前で公開します。同じ名前で2回目に呼び出すと、最初のモジュールが置き換えられます。React、Vue、Svelte、Angularのアダプターとcoreの`defineMicroApp`は、これを自動で呼び出します。モジュールを手書きする場合は自分で呼び出してください。

レジストリとマウント済みアプリの状態は`window.__TUVIX_RUNTIME__`に保持され、モジュールマップは`window.__TUVIX_MODULES__`からもアクセスできます。それぞれが`@tuvix.js/loader`の独自のコピーをバンドルしたマイクロアプリも、同じレジストリを読み書きします。`window`のないサーバーでは、状態はモジュール内に保持されます。

アダプターの規約に従う手書きのマイクロアプリ：

```ts
import { emitLifecycle, hasServerMarkup, registerModule } from '@tuvix.js/loader';

registerModule('clock', {
  mount({ container }) {
    const hydrated = hasServerMarkup(container);
    if (!hydrated) container.textContent = new Date().toLocaleTimeString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
});
```

### `unregisterModule`

```ts no-check
function unregisterModule(name: string): void;
```

レジストリからモジュールを削除します。`ModuleLoader.unload`は、自身が解決したモジュールに対してこれを呼び出します。

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

登録されたモジュール、または`undefined`を返します。

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

ライフサイクルの変化を記録し、`tuvix:mounted`、`tuvix:unmounted`、または`tuvix:error`という名前の`CustomEvent`をディスパッチします。イベントはバブリングし、`composed`であるため、`document`上のリスナーはShadow Root内のコンテナからのイベントも受け取れます。`detail.container`がDOM内にある場合、イベントはコンテナで発火し、`document`へ一度だけバブリングします。コンテナが切り離されている（`isConnected`が`false`）場合、たとえばアダプターが`unmounted`を通知する前にReactがアイランドを削除した場合は、イベントは`document`自体で発火します。切り離された要素上のイベントは`document`に届かないためです。どちらの場合も、`detail.container`はその要素を指したままです。`event.detail`は`LifecycleDetail`です。

| フィールド | 型 | 意味 |
| --- | --- | --- |
| `name` | `string` | マイクロアプリ名。 |
| `container` | `HTMLElement` | アプリが描画された要素。 |
| `hydrated` | `boolean` | アダプターが新規に描画せず、サーバーレンダリングされたマークアップを引き継いだ場合は`true`。 |
| `error` | `unknown` | スローされた値。`error`イベントで設定されます。 |

`mounted`は、`detail.name`に対してコンテナをマウント済みとして記録し、保留中の`whenMounted(name)`のPromiseを解決します。`unmounted`はそのコンテナを記録から削除します。`error`はイベントをディスパッチするだけです。React、Vue、Svelte、Angularのアダプターとcoreの`defineMicroApp`は、マウントとアンマウントの完了後、およびどちらかがスローしたときにこれを呼び出します。

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

`name`のコンテナが少なくとも1つマウントされている間は`true`です。ランタイムはマウント済みのコンテナをアプリごとに追跡します。そのため、1つのモジュールが2つのコンテナにマウントされ、そのうち1つをアンマウントした場合、2つ目がアンマウントされるまで`isMounted(name)`は`true`のままです。

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

最初のマウントの`LifecycleDetail`で解決します。アプリがすでにマウントされている場合は、まだマウントされている最も古いコンテナのdetailですぐに解決します。待機をやめるには`signal`を中断します。その場合、Promiseはsignalの理由でrejectされます。

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

`target`（デフォルトは`document`）で`tuvix:<type>`をリッスンし、リスナーを削除する関数を返します。デフォルトのtargetでは、接続されたコンテナでも切り離されたコンテナでも、ハンドラーはイベントごとに一度実行されます。コンテナ要素上のリスナーは、そのコンテナが切り離されている間にディスパッチされたイベントを受け取りません。

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

このパッケージを使わない場合は、DOMイベントをリッスンします。

```ts
import type { LifecycleEvent } from '@tuvix.js/loader';

document.addEventListener('tuvix:mounted', (event) => {
  const { name, hydrated } = (event as LifecycleEvent).detail;
  console.log(name, hydrated);
});
```

### `hasServerMarkup`

```ts no-check
function hasServerMarkup(container: Element): boolean;
```

要素が子要素、または空白以外のテキストを持つテキストノードを持つ場合は`true`です。コメントと空白は対象外です。アダプターはこれを使って、ハイドレーションと新規描画のどちらを行うかを選びます。

### 型

マイクロアプリモジュールが実装するインターフェース：

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: (context: MountContext) => void | Promise<void>;
  unmount: (context: UnmountContext) => void | Promise<void>;
  update?: (context: UpdateContext) => void | Promise<void>;
  [key: string]: unknown;
}

interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
  /** App name the orchestrator registered this module under */
  name?: string;
  /** The orchestrator's event bus */
  bus?: MicroAppBus;
}

interface UnmountContext {
  container: HTMLElement;
}

interface UpdateContext {
  props: Record<string, unknown>;
  /** Container to update; without it, adapters update every mounted instance */
  container?: HTMLElement;
}

interface MicroAppBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  emit<T = unknown>(event: string, data?: T): void;
  off<T = unknown>(event: string, handler: (data: T) => void): void;
}
```

オーケストレーターは、マウントのたびに`name`と`bus`を渡します。`bus`はオーケストレーターの[`@tuvix.js/event-bus`](/ja/packages/event-bus)インスタンスです。`MicroAppBus`はそれを構造的に記述するため、ローダーはイベントバスのパッケージに依存しません。

| 型 | 意味 |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`。 |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`。[エントリーの形式](#entry-forms)を参照してください。 |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`。 |
| `EntryLoaderContext` | `{ signal: AbortSignal }`。 |
| `ScriptType` | `'module' \| 'classic'`。 |
| `MicroAppModule` | マイクロアプリがエクスポートするライフサイクルオブジェクト。 |
| `MountContext`, `UnmountContext`, `UpdateContext` | `mount`、`unmount`、`update`の引数。 |
| `MicroAppBus` | `{ on, once, emit, off }`。`IEventBus`はこれを満たします。 |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`。 |
| `LoadResult` | `{ status, module, error, duration }`。 |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`。 |
| `CacheEntry` | `{ module, loadedAt, entry }`。キャッシュされた1つのモジュールです。 |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`。ローダーはこれを読み取りません。 |
| `ResourceOptions` | `{ integrity?, signal? }`。`loadScript`と`loadStyle`で共通です。 |
| `LoadScriptOptions` | `ResourceOptions`に`type?`を加えたもの。 |
| `LoadStyleOptions` | `ResourceOptions`に`timeout?`を加えたもの。 |
| `PrefetchOptions` | `{ as?, type?, integrity? }`。 |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`。 |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`。 |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`。 |

## エッジケース

- **タイムアウト。** `timeout`は1回の試行全体を対象にします。発火すると、ローダーは試行の`signal`を中断し、他の読み込みが待っていないその試行のタグを削除し、`retryDelay`待ってから再試行します。エラーは`[Tuvix Loader] Loading "<name>" timed out after <timeout>ms`です。`signal`を無視するローダー関数はバックグラウンドで実行を続けます。ローダーはそれを待つのをやめます。
- **リトライ。** 失敗した`<script>`は次の試行の前に削除されるため、リトライでは新しいタグが1つ追加されます。最後の試行の後、`load()`は最後のエラーとともに解決します。
- **同じURLを複数のアプリで使う場合。** 同じベンダースクリプトを列挙する2つのエントリーは、1つのタグと1回のダウンロードを共有します。
- **キャッシュされたエントリー。** `load(name, otherEntry)`は`name`でキャッシュされたモジュールを返し、`otherEntry`を無視します。エントリーを切り替えるには、先に`unload(name)`を呼び出してください。
- **モジュールスクリプトはURLごとに一度だけ実行されます。** `unload(name)`の後、`type: 'module'`のスクリプトで`registerModule`を呼び出していたアプリは、同じURLからは再び読み込まれません。ブラウザはモジュールスクリプトを二度実行しないためです。読み込みは`no exports found`で失敗します。ローダー関数のエントリーか、新しいURL（コンテンツハッシュや`?v=2`）を使ってください。
- **`unload`は共有のscriptタグを削除します。** エントリーのすべてのスクリプトURLを削除します。別のアプリも列挙しているベンダースクリプトも含まれます。すでに実行されたコードは残ります。そのURLを列挙する以降の読み込みはタグを再び追加し、クラシックスクリプトは再実行されます。
- **CORS。** ローダーはすべてのタグに`crossorigin="anonymous"`を設定します。別のオリジンのスクリプトやスタイルシートには`Access-Control-Allow-Origin`ヘッダーが必要です。ない場合はブラウザがブロックし、読み込みは失敗します。
- **UMDグローバル。** 2つのUMDバンドルが同時に読み込まれると、ローダーは別の読み込みがすでに取得したグローバルをスキップし、残りを大文字と小文字や記号を無視してアプリ名と照合します（`my-app`は`MyApp`に一致します）。複数の候補が残った場合、読み込みは`several globals with mount() appeared while it loaded (<names>)`で失敗します。`registerModule`を使えば推測は不要です。
- **ライフサイクルの欠落。** `mount`または`unmount`のないモジュールは`[Tuvix Loader] Module "<name>" is missing required "unmount" function.`で失敗します。
- **何も見つからない場合。** スクリプトがモジュールを登録せず、UMDグローバルも定義しないURLエントリーは、`Module "<name>" loaded but no exports found`で失敗します。
- **複数のコンテナ。** ランタイムはマウント状態をコンテナごとに追跡します。2つのコンテナのうち1つをアンマウントしても`isMounted(name)`は`true`のままです。`whenMounted(name)`は、まだマウントされている最も古いコンテナを返します。
- **切り離されたコンテナ。** アダプターが`unmounted`または`error`を通知する前にホストフレームワークがコンテナを削除した場合、`emitLifecycle`はイベントを`document`にディスパッチします。すべてのイベントを受け取るには`document`でリッスンしてください（`onLifecycle`のデフォルト）。
- **`whenMounted`はエラーを無視します。** `tuvix:error`イベントでrejectされることはありません。`signal`を渡すか、`onLifecycle('error', ...)`でリッスンしてください。
- **サーバー。** ランタイム関数は`window`なしで動作します。`CustomEvent`が未定義の場合、`emitLifecycle`はDOMイベントをスキップします。`ModuleLoader`、`loadScript`、`loadStyle`、`prefetchResource`には`document`が必要です。

## 対象外の機能

- HTMLページを取得してスクリプトを抽出することはしません。スクリプトとスタイルのURLを列挙するか、ローダー関数を使ってください。
- JavaScriptを隔離しません。スクリプトはページのグローバルスコープで実行されます。CSSの隔離には、オーケストレーターの`sandbox`オプションまたは[`@tuvix.js/sandbox`](/ja/packages/sandbox)を使ってください。
- アプリをマウントしません。`module.mount`を呼び出すのは開発者またはオーケストレーターです。
- ページの読み込みをまたいでキャッシュを保持しません。それはブラウザのHTTPキャッシュが行います。
- `PrefetchStrategy`を読み取りません。`prefetch`を呼び出すタイミングは、オーケストレーターの`prefetch`設定が決めます。

## 0.4からの移行 {#migrating-from-0-4}

- `LoaderOptions.fetch`と`EntryConfig.html`は削除されました。ローダーはこれらを一度も読み取っていませんでした。設定から削除してください。
- `loadScript(url, integrity)`と`loadStyle(url, timeoutMs)`は引き続き動作します。オプション形式では`type`と`signal`が追加されます。

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- `.js`で終わるViteのES出力は、0.4ではクラシックスクリプトとして読み込まれ、最初の`import`文で失敗していました。エントリーに`type: 'module'`を設定してください。
- `type: 'module'`のエントリーは、`unload`の後に同じURLから再び読み込まれなくなりました。ローダー関数か新しいURLを使ってください。
- キャッシュされたモジュールに対する`load()`は、`0`ではなく実際の`duration`を報告します。
- このページの0.4版では、`loader.load(url)`、`result.app`、`onLoadStart`、`cache`、`loader.clear()`が示されていました。これらはいずれも存在しませんでした。`load(name, entry)`、`result.module`、`unload(name)`、`clearCache()`を使ってください。
