# 0.5への移行

0.5では、観測可能な挙動を変えていたバグを修正しているため、一部の修正は0.4のコードを壊します。このページでは、すべての破壊的変更をパッケージごとに、変更すべきコードとともに一覧にしています。`tuvix.js`と`@tuvix.js/*`のすべてのパッケージを同時に`^0.5.0`へアップグレードしてください。1つのページで0.4と0.5のアダプターを混在させることはサポートされていません。

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

0.5より前に`create-tuvix-app`で作成したプロジェクトは`^0.1.0`に依存しており、この範囲が0.4や0.5に解決されることはありません。これらの範囲は手動で編集してください。

## Core

### オーケストレーターはグローバルバスを使う

0.4では、各オーケストレーターが`getGlobalBus()`とは別のプライベートなバスを持っていました。0.5では、`eventBus`オプションを渡さない限りオーケストレーターのバスは`getGlobalBus()`になり、`destroy()`はグローバルバスを破棄しません。

```ts no-check
// 0.4: two buses; apps listening on getGlobalBus() missed orchestrator events
const orchestrator = createOrchestrator();
orchestrator.getEventBus() === getGlobalBus(); // false
```

```ts
// 0.5
import { createOrchestrator, getGlobalBus } from 'tuvix.js';

const shared = createOrchestrator();
console.log(shared.getEventBus() === getGlobalBus()); // true

const isolated = createOrchestrator({ eventBus: {} }); // private bus, as in 0.4
console.log(isolated.getEventBus() === getGlobalBus()); // false
```

アプリから見つけられるようにオーケストレーターのバスを`window`に公開していた場合は、それを削除し、マウントコンテキストの`bus`または`getGlobalBus()`を使えます。

### ルート変更は手動のアプリに影響しない

0.4では、`activeWhen`もルーターのルートも持たないアプリと、`mountWhenVisible`のアプリが、次のルート変更時にアンマウントされていました。0.5では、reconcileは`activeWhen`またはルートが制御するアプリにのみ作用します。手動でマウントしたアプリをナビゲーションで取り除くことに依存していた場合は、自分でアンマウントしてください。

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: trueはshadow rootにレンダリングする

0.4では、`register`の`sandbox`は何もしていませんでした。0.5では、`sandbox: true`はアプリをshadow root内にマウントし、エントリーの`styles`をそこにロードします。ページのCSSはアプリに届かなくなり、アプリのエントリーのスタイルもページに届かなくなります。ページのスタイルに依存しているアプリからは`sandbox: true`を削除してください。[サンドボックス](/ja/guide/sandbox)を参照してください。

### prefetch: 'hover'

0.4では、ページ上のどこかで最初にマウスが動いた時点ですべてのアプリをプリフェッチしていました。0.5では、アプリを有効化するパスを持つ同一オリジンのリンクにポインターが入ったとき、またはフォーカスが当たったときに、そのアプリをプリフェッチします。すべてのアプリを最初に取得するには`'idle'`または`'immediate'`を使います。

### OrchestratorConfig.sharedは削除された

オーケストレーターは`shared`を一度も読み取っていませんでした。削除し、依存関係の共有には`@tuvix.js/module-federation`またはimport mapsを使ってください。

### activeWhenのパターン

`activeWhen`の文字列は`matchPath`を使うようになりました。クエリ文字列やハッシュでアプリがアンマウントされることはなくなり、`:param`セグメントが機能し、`.`や`(`などの文字はリテラルとしてマッチします。

```ts no-check
// 0.4: `.` was a regex wildcard and matched '/v1x0'
activeWhen: '/v1.0/*'
// 0.4: query strings broke matching, so people wrote functions
activeWhen: (path) => path.split('?')[0].startsWith('/dashboard')
```

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*', // also active on /dashboard?tab=1
});
```

## Router

### '/'ルートとRouteConfig.exact

ルートのパスは、どこでもパス全体にマッチします。`'/'`ルートは`/`でのみ有効になるようになりました。0.4では、`getActiveApps()`はこれをすべてのパスとして扱い、`match()`は完全一致として扱っていました。`RouteConfig.exact`は何も変えていなかったため削除されました。

```ts no-check
// 0.4
routes: [{ path: '/', app: 'shell-nav' }, { path: '/settings', app: 'settings', exact: true }]
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({
  routes: [
    { path: '/*', app: 'shell-nav' }, // every path
    { path: '/settings', app: 'settings' }, // /settings only
  ],
});
void router;
```

`register`の`activeWhen: '/'`は引き続きすべてのパスにマッチします。`activeWhen`の文字列はプレフィックスマッチを使うためです。

### pushとreplaceはbaseを付加する

```ts no-check
// 0.4 with base: '/app'
router.push('/app/settings'); // you had to add the base yourself
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({ base: '/app', routes: [] });
await router.push('/settings'); // URL: /app/settings
```

0.5で`/app/settings`を渡すと`/app/app/settings`が書き込まれます。戻る・進むのナビゲーションをキャンセルするガードも、baseを含めてURLを復元します。

### ルーターのその他の変更

- `base`はセグメントの境界でのみ取り除かれます。`base: '/app'`の場合、`/application`は`/application`のままです。
- `pathToRegex()`はキャッシュされた`RegExp`を返します。変更しないでください。2番目の引数`exact`は削除されました。
- パターン内の正規表現の文字はリテラルとしてマッチします。パターンの途中にある`*`は1つのセグメントにマッチします。
- `matchRoute()`と`isPathActive()`はパス内の`#hash`を無視します。

## Loader

### 削除されたオプション

`LoaderOptions.fetch`と`EntryConfig.html`は削除されました。ローダーはこれらを一度も読み取っていませんでした。設定から削除してください。

```ts no-check
// 0.4
new ModuleLoader({ fetch: myFetch });
orchestrator.register({ name: 'x', entry: { scripts: ['/x.js'], html: '<div></div>' }, container: '#x' });
```

```ts
// 0.5
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({ timeout: 10000 });
void loader;
```

### モジュールスクリプトはURLごとに1回だけ実行される

`unload(name)`の後、`type: 'module'`のスクリプトで自身を登録したアプリは、同じURLから再びロードされません。ブラウザはモジュールスクリプトをURLごとに1回しか実行しないためです。アンロードと再ロードを行うアプリには、ローダー関数のエントリーを使ってください。

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

キャッシュ済みモジュールに対する`load()`は、`0`ではなく実際の`duration`を報告するようになりました。

## Module Federation

`federatedEntry`と`createFederatedEntry`は、`{ scripts: [remoteEntry.js] }`ではなくローダー関数を返します。0.4のエントリーはコンテナスクリプトをロードした後、"no exports found"で失敗していました。

```ts no-check
// 0.4
orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }),
  container: '#main',
});
```

```ts
// 0.5
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader, federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry(
    { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
    './App', // exposed module path
  ),
  container: '#main',
  activeWhen: '/dashboard/*',
});

const remotes = createFederatedLoader({
  remotes: [{ name: 'settings', url: 'https://cdn.example.com/settings/remoteEntry.js' }],
  shareScope: {}, // replaces 0.4 `shared`
});

orchestrator.register({
  name: 'settings',
  entry: remotes.createFederatedEntry('settings', './App'),
  container: '#main',
  activeWhen: '/settings/*',
});
```

- `FederatedLoaderConfig.shared`は`shareScope`に置き換えられました。0.4は`shared`を一度も読み取っていませんでした。
- `loadRemoteContainer`は`any`ではなく`FederatedContainer`を返します。

## React

- `TuvixReactApp`のサーバーHTMLには、Suspenseのコメントマーカー（`<!--$-->...<!--/$-->`）が含まれるようになりました。両側で`@tuvix.js/react` 0.5を使ってレンダリングとハイドレーションを行ってください。
- 最初のレンダリングが例外を投げると、`mount`はrejectします。0.4では、エラーはReactのルートのエラーハンドラーに届き、`mount`はresolveしていました。現在は、オーケストレーターがアプリの`fallback`を表示し、`onError`を呼び出します。
- モジュールがマウントしていないコンテナに対する`unmount`は何もしません。0.4ではコンテナを空にしていました。

## Vue

`update()`は`app.config.globalProperties.$tuvixProps`に書き込まなくなりました。propsはリアクティブになりました。

```vue
<!-- 0.4 -->
<template>{{ $tuvixProps.theme }}</template>
```

```vue
<!-- 0.5 -->
<script setup lang="ts">
defineProps<{ theme?: string }>();
</script>

<template>{{ theme }}</template>
```

子孫コンポーネントは`inject('tuvixProps')`を使えます。これは同じリアクティブオブジェクトを返します。

- `VueSsrMicroAppConfig`は`ssr`を受け付けなくなりました。`createSsrVueMicroApp`がこれを設定します。
- モジュールがマウントしていないコンテナに対する`unmount`は何もしません。

## Svelte

- `ssr`なしの場合、`createSvelteMicroApp`はレンダリング前にコンテナを空にします。0.4では、Svelte 3/4のコンポーネントを既存のマークアップの後ろに追加していました。サーバーのマークアップを維持してハイドレートするには`createSsrSvelteMicroApp`を使ってください。
- モジュールがマウントしていないコンテナ、またはマウントに失敗したコンテナに対する`unmount`は何もしません。0.4ではコンテナを空にしていました。4つのアダプターすべてがこの挙動になりました。
- `renderSvelteToString`は、`svelte/server`のロードに失敗したときに`App.render`へフォールバックしなくなりました。`render`を渡した場合はSvelte 5を使います。それ以外の場合は、`svelte`が`mount`をエクスポートしていればSvelte 5の経路を使い、`App.render`はSvelte 3/4の場合にのみ呼び出します。Svelte 5のimportエラーやレンダリングエラーはそのまま呼び出し側に届きます。

Svelte 5のコンポーネントは0.5で動作します。0.4では`createSvelteMicroApp`がこれらで失敗していました。Svelte 5の`update()`はコンポーネントを再マウントします。ただし、設定で`svelte/reactivity`の`SvelteMap`を渡すと、propsをその場で更新します。

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### 新しい設定の形

```ts no-check
// 0.4
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AppComponent, // required
  module: AppModule, // only when AppComponent is declared in an NgModule
});
```

`platform`と`compilerOptions`は削除されました。エントリーから`import '@angular/compiler'`を削除してください。アダプターがJITコンポーネント用にコンパイラーをロードします。

### デフォルトでzoneless

`zone: true`を渡さない限り、アプリはzone.jsなしで実行されます。Angular 15-17では、DOMイベントが変更検知をトリガーしなくなります。ハンドラー内で`ChangeDetectorRef.detectChanges()`を呼び出すか、エントリーで`zone.js`をimportして`zone: true`を渡してください。Angular 18以降はzone.jsなしで変更検知をスケジュールします。[Angular](/ja/guide/angular)を参照してください。

### propsはinputになった

`update()`は`window.__TUVIX_ANGULAR_PROPS__`に書き込まなくなりました。代わりに`@Input()`プロパティを宣言してください。アダプターが`setInput`でそれらを設定します。

```ts no-check
// 0.4
ngOnInit() {
  this.userId = (window as any).__TUVIX_ANGULAR_PROPS__?.admin?.userId;
}
```

```ts
// 0.5
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-admin', standalone: true, template: '{{ userId }}' })
export class AdminComponent {
  @Input() userId = '';
}
```

### Angularのその他の変更

- `createSsrAngularMicroApp`は`provideClientHydration()`を追加しなくなりました。サーバーのホスト要素に再レンダリングします。
- モジュールがマウントしていないコンテナに対する`unmount`は何もしません。

## Sandbox

- `Sandbox({ css: false }).activate(container)`は`null`を返し、shadow rootをアタッチしません。`ISandbox.activate`は`ShadowRoot | null`を返します。`addStyle`を呼び出す前に`null`かどうかを確認してください。
- `JsSandbox`のstrictモードは、ブロックされた書き込みに対して`TypeError`を投げます。0.4では警告をログに出したうえで値を保存していました。コードが書き込むグローバルは`allowedGlobals`に追加してください。

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Server

- `createServerRenderer().render()`は、パスにマッチしたアプリが1つ以上あり、かつすべてのフラグメントの取得に失敗した場合に`statusCode: 502`を返します。マッチしたアプリがない場合や、1つでもフラグメントの取得に成功した場合は、引き続き200を返します。`createMiddleware`はそのステータスを送信します。ストリーミングレンダラーは常に200を送信します。
- `createMiddleware`と`createStreamingMiddleware`は、レンダリングが例外を投げると`next()`ではなく`next(error)`を呼び出します。これにより、Expressはリクエストをエラーハンドラーにルーティングします。

## 知っておくべき非破壊的な修正

- `require('@tuvix.js/core')`やその他のCommonJSエントリーポイントが動作します。0.4では、5つのパッケージが`require`をビルドで生成されないファイルに向けていました。
- `getGlobalBus()`はインスタンスを`window`に保持するため、別々にバンドルされたマイクロアプリが1つのバスを共有します。
- アダプターと`defineMicroApp`は`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`をディスパッチします。[ライフサイクルイベント](/ja/guide/lifecycle-events)を参照してください。
- 例外を投げた`bootstrap()`は、次のマウント時に再実行されます。0.4では、それ以降スキップされていました。
- `start()`の後の`register()`は、現在のパスがアプリを有効化する場合はすぐにアプリをマウントし、`mountWhenVisible`のアプリの監視を開始します。
- すべてのライフサイクルの失敗は、バス上で`{ name, error, phase }`とともに`tuvix:app:error`を発行します。0.4では、ロードとマウントの失敗時にのみ発行していました。
- `maxListeners`は、`debug`の有無にかかわらず、イベントごとに1回`console.warn`で警告します。
- `orchestrator.connectRouter()`は`setTimeout` + `reconcile()`による橋渡しを置き換えます。[外部ルーター](/ja/guide/external-router)を参照してください。
