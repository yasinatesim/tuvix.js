# @tuvix.js/loader

> スクリプトURLまたはローダー関数から名前でマイクロアプリのバンドルを読み込みます。リトライ、タイムアウト、共有モジュールレジストリ、ライフサイクルイベントを備えています。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。完全なドキュメント：[tuvix.js.org/packages/loader](https://tuvix.js.org/packages/loader)。

## インストール

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core`は`ModuleLoader`を自動で作成し、`createOrchestrator({ loader })`をそれに渡します。このパッケージをインポートするのは、マイクロアプリやアダプターを書くとき、別のアプリのマウントを待つとき、またはオーケストレーターなしでアプリを読み込むときです。

## クイックスタート

`https://cdn.example.com/dashboard/main.js`にビルドされるマイクロアプリ：

```ts
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

シェル：

```ts
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
  console.error(result.error);
}
```

`load()`がスローすることはありません。失敗した場合は、`status: 'error'`、`module: null`、最後のエラーでresolveします。

## エントリー

`Entry`は次のいずれかです：

- URL文字列。`{ scripts: [url] }`として読み取られます
- `EntryConfig`
- `() => import('./dashboard')`のようなローダー関数。タイムアウト時にabortされる`{ signal }`を受け取り、モジュール、`{ default: module }`、または`registerModule(name, module)`を呼び出した後であれば任意の値でresolveできます。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `scripts` | `string[]` | 必須 | スクリプトURL。1つずつ順に実行されます。 |
| `styles` | `string[]` | `[]` | スタイルシートURL。スクリプトと並列に読み込まれます。 |
| `type` | `'module' \| 'classic'` | URLごとに推論 | `.mjs`、`.mts`、`.ts`、`.tsx`、`.jsx`はモジュールとして、それ以外はclassicとして読み込まれます。Viteの`.js`出力には`'module'`を設定してください。 |
| `integrity` | `Record<string, string>` | なし | URLをキーとするSRIハッシュ。 |

## API

### `ModuleLoader`と`createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | 試行ごとのms。すべてのスクリプトとスタイルシートが対象です。`0`で無効になります。 |
| `retries` | `number` | `2` | 最初の失敗後の追加試行回数。 |
| `retryDelay` | `number` | `1000` | 試行間のms。 |
| `globals` | `Record<string, unknown>` | `{}` | URLエントリーの各試行の前に`window`に代入されます。 |

| メソッド | 動作 |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | 読み込み、`mount`/`unmount`を検証し、名前でキャッシュします。モジュールはまず`registerModule(name)`から、次に`mount`を持つ新しいUMDグローバルから解決します。キャッシュ済みの名前では`entry`を無視し、読み込み中の名前では同じPromiseを返します。 |
| `prefetch(entry)` | モジュールスクリプトには`<link rel="modulepreload">`、それ以外には`<link rel="prefetch">`を使います。ローダー関数はスキップします。 |
| `removeStyles(name)` | 他のキャッシュ済みアプリが使っていない限り、アプリのスタイルシートを削除します。次の`load(name)`で再追加されます。 |
| `unload(name)` | スタイルとscriptタグを削除し、キャッシュエントリーを破棄して、このローダーが解決したモジュールの登録を解除します。 |
| `clearCache()` | キャッシュ済みのすべてのアプリに`unload`を実行します。 |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | キャッシュを読み取ります。`getStatus`は`'idle'`、`'loading'`、`'loaded'`のいずれかを返します。 |

### `normalizeEntry`

```ts no-check
normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

### `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`

```ts no-check
loadScript(url: string, options?: { type?, integrity?, signal? } | string): Promise<void>;
loadStyle(url: string, options?: { timeout?, integrity?, signal? } | number): Promise<void>;
removeScript(url: string): void;
removeStyle(url: string): void;
prefetchResource(url: string, options?: { as?, type?, integrity? }): void;
```

URLごとに1つのタグを作り、同時に呼び出した側で共有します。読み込みに失敗するとタグを削除し、`[Tuvix Loader] Failed to load script: <url>`でrejectします。abortされた呼び出しは、他に待っている呼び出し元がなければタグを削除します。`loadStyle`はデフォルトで`10000` ms後にタイムアウトします。すべてのタグに`crossorigin="anonymous"`が付きます。`loadScript`の第2引数が文字列ならintegrityハッシュ、`loadStyle`の第2引数が数値ならタイムアウトです（0.4の形式）。

### ランタイムレジストリとライフサイクル

状態は`window.__TUVIX_RUNTIME__`に保持されるため、独自のコピーをバンドルしたマイクロアプリ同士でも共有されます。`window`がない環境ではモジュール内に保持されます。

| エクスポート | 動作 |
| --- | --- |
| `registerModule(name, module)` | ローダー向けにモジュールを公開します。アダプターと`defineMicroApp`がこれを呼び出します。 |
| `unregisterModule(name)` | モジュールを削除します。 |
| `getRegisteredModule(name)` | モジュールまたは`undefined`を返します。 |
| `emitLifecycle(type, { name, container, hydrated, error? })` | バブリングかつcomposedな`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`の`CustomEvent`を`container`上で（コンテナーがデタッチされている場合は`document`上で）ディスパッチし、マウント済みのコンテナーを追跡します。アダプターと`defineMicroApp`がこれを呼び出します。 |
| `isMounted(name)` | アプリのいずれかのコンテナーがマウントされている間`true`です。 |
| `whenMounted(name, { signal? })` | 最初のマウントの`LifecycleDetail`でresolveします。すでにマウント済みのコンテナーがあれば、最も古いもので即座にresolveします。abort時は`signal.reason`でrejectします。 |
| `onLifecycle(type, handler, target = document)` | `tuvix:<type>`をリッスンし、解除関数を返します。 |
| `hasServerMarkup(el)` | 子要素または空白以外のテキストがあれば`true`です。 |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### 型

`Entry`、`EntryConfig`、`EntryLoader`、`EntryLoaderContext`、`ScriptType`、`MicroAppModule`、`MountContext`（`container`、`props?`、`name?`、`bus?`）、`UnmountContext`、`UpdateContext`（`props`、`container?`）、`MicroAppBus`（`on`、`once`、`emit`、`off`。`IEventBus`はこれを満たします）、`LoaderOptions`、`LoadResult`、`LoadStatus`、`CacheEntry`、`PrefetchStrategy`（ローダーは読み取りません）、`ResourceOptions`、`LoadScriptOptions`、`LoadStyleOptions`、`PrefetchOptions`、`LifecycleType`、`LifecycleDetail`、`LifecycleEvent`。

## エッジケース

- タイムアウトはその試行の`signal`をabortし、タグを削除して、`retryDelay`後にリトライします。`signal`を無視するローダー関数は実行を続けますが、ローダーは待つのをやめます。
- `unload(name)`の後、自身を登録した`type: 'module'`のスクリプトは、同じURLからは再実行されません。ローダー関数か新しいURLを使ってください。
- `unload`は、他のアプリが列挙しているベンダースクリプトも含め、エントリーのすべてのスクリプトURLを削除します。
- 2つのUMDバンドルを同時に読み込む場合：ローダーは新しいグローバルをアプリ名と照合し、区別できないときは候補の名前を示して失敗します。
- クロスオリジンのスクリプトとスタイルには`Access-Control-Allow-Origin`が必要です。
- マウント状態はコンテナーごとです。2つのコンテナーのうち1つをアンマウントしても、`isMounted(name)`は`true`のままです。`whenMounted`は`tuvix:error`ではrejectしません。
- デタッチされたコンテナーのライフサイクルイベントは、`detail.container`が設定されたまま`document`上で発火します。`document`（デフォルト）上の`onLifecycle`は、各イベントを1回ずつ受け取ります。

## 行わないこと

- HTMLページを取得してスクリプトを抽出することはしません。
- JavaScriptを分離しません。スクリプトはページのグローバルスコープで実行されます。
- アプリのマウントやルーティングは行いません。

## ライセンス

MIT
