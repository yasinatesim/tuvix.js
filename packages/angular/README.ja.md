# @tuvix.js/angular

> Tuvix.jsマイクロフロントエンドフレームワーク向けのAngular 15+バインディング

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。

## インストール

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

JITコンポーネントには`@angular/compiler`を追加してください。`renderAngularToString`（Angular 16+）を使う場合は、サーバー側に`@angular/platform-server`と`@angular/compiler`を追加してください。

## クイックスタート

```ts
import { Component, Input } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

アダプターは`@tuvix.js/loader`の`registerModule`でモジュールを登録します。オーケストレーターからのpropsはコンポーネントのinputになります。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | アプリ名。`registerModule`で登録されます |
| `component` | `Type<C>` | 必須 | ルートコンポーネント |
| `module` | `Type<unknown>` | なし | `component`を宣言するNgModule。そのプロバイダーは`importProvidersFrom`で追加されます |
| `providers` | `AngularProviders` | `[]` | `provideHttpClient()`などの環境プロバイダー |
| `selector` | `string` | コンポーネントセレクターの要素部分、なければ`'div'` | ホスト要素のタグ名 |
| `zone` | `boolean` | `false` | zone.jsを使います。エントリーで最初に`zone.js`をimportする必要があります |
| `ssr` | `boolean` | `false` | `renderAngularToString`のマークアップを引き継ぎます |
| `bootstrap` | `() => void \| Promise<void>` | なし | 一度だけ実行するセットアップ |

- マウントのたびに`createApplication`を呼び出し、コンテナ内の専用のホスト要素にコンポーネントをブートストラップします。そのため、2つのAngularアプリ（または同じアプリの2つのコピー）が1つの`app-root`で衝突することはありません。
- propsは最初の変更検知の前に`ComponentRef.setInput`で設定されるため、`ngOnInit`から参照できます。inputではないキーはスキップされます。
- `update({ props, container? })`は新しいinputを設定し、1つのコンテナまたはすべてのマウントに対して`appRef.tick()`を実行します。新しいpropsにないinputは`undefined`にリセットされます。
- JITコンポーネント（`ɵcmp`を持たないもの）では、`@angular/platform-browser`の前に`@angular/compiler`が読み込まれます。これが効果を持つのは、`@angular/core`以外のAngularパッケージを最初に読み込むコードがアダプターである場合だけです。コンポーネントファイルが`@angular/common`（`NgIf`、`AsyncPipe`、`CommonModule`）、`@angular/forms`、`@angular/router`、またはその他のAngularライブラリをimportしている場合、それらのパッケージはアダプターの実行前に評価され、「JIT compilation failed」で失敗します。クライアントエントリーの先頭行に`import '@angular/compiler'`を置くか、AOTでビルドしてください。
- `unmount`はアプリケーションを破棄し、コンテナを空にして`tuvix:unmounted`をディスパッチします。`mount`がまだ読み込み中に呼ばれた場合は、マウントをキャンセルします。

### `createSsrAngularMicroApp(config)`

`createAngularMicroApp({ ...config, ssr: true })`と同じです。コンテナがサーバーマークアップを含む場合、Angularはサーバーのホスト要素にレンダリングし、アダプターはインライン化されたサーバーの`<style>`タグを削除します。`tuvix:mounted`は`hydrated: true`を報告します。

これはサーバーのDOMの上に再レンダリングします。Angularの非破壊ハイドレーション（`provideClientHydration`）には`<body>`直下のハイドレーションマーカーコメントが必要ですが、別のページ内にあるアイランドはこれを用意できないため、アダプターは追加しません。

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `@tuvix.js/angular/server`の`renderAngularToString(component, options?)`

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | サーバーレンダリング用のプロバイダー |
| `appId` | `string` | `'ng'` | Angularの`APP_ID` |
| `document` | `string` | ホスト要素を持つ空のドキュメント | レンダリング先のドキュメント |
| `selector` | `string` | コンポーネントセレクターの要素部分、なければ`'app-root'` | デフォルトのドキュメントのホストタグ |
| `props` | `Record<string, unknown>` | `{}` | コンポーネントのinputの値。最初の変更検知の前に設定されます |

コンポーネントの`<style>`タグに続けてbodyのマークアップを返します。zonelessで実行され、`Promise`をパッチせず、コンポーネントが開始したHTTPリクエストを待ちません。サーバー関数から呼び出してください。ブラウザでは`''`を返します。

`props`はクライアントのpropsと同じように動作します。キーはinput名（またはエイリアス）で、inputではないキーはスキップされ、`ngOnInit`から値を参照できます。サーバーレンダリングと`mount`に同じオブジェクトを渡すと、両側で同じマークアップがレンダリングされます。

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// クライアント: aboutApp.mount({ container, props })
```

### 型

`AngularMicroAppConfig<C>`、`AngularSsrMicroAppConfig<C>`、`AngularSsrOptions`、`AngularProviders`（すべて`@tuvix.js/angular`から）。

## 変更検知

アダプターはzone.jsをimportしません。`zone: true`を指定しない場合、Angular 20+では`provideZonelessChangeDetection()`、18-19では`provideExperimentalZonelessChangeDetection()`を追加し、15-17では`NgZone`を`ɵNoopNgZone`に置き換えます。

- Angular 18+：イベントリスナー、シグナル、`markForCheck()`、`AsyncPipe`が変更検知をスケジュールします。タイマーや`fetch`コールバック内で通常のフィールドを変更しても変更検知はスケジュールされません。シグナルか`markForCheck()`を使ってください。
- Angular 15-17：DOMイベントは変更検知をトリガーしません。stateを変更した後に`ChangeDetectorRef.detectChanges()`を呼び出すか、`zone: true`を渡してください。

## エッジケース

- zone.jsが読み込まれていない状態で`zone: true`を指定すると、マウントはrejectし、`tuvix:error`をディスパッチします。
- このモジュールが一度もマウントしていないコンテナに対する`unmount`は何もしません。
- Angular 16では、サーバーレンダリング中に`@angular/platform-server`がDominoのDOMクラス（`Event`、`Node`など）をNodeのグローバルオブジェクトにコピーします。これはアダプターではなくAngularの動作です。
- 属性セレクターのコンポーネントでは、サーバー上で対応するホスト要素を持つ`document`が必要です。

## 対象外の機能

- zone.jsの読み込み、`provideClientHydration()`の追加、サーバーのDOMノードやフォームのstateの保持は行いません。
- `window.__TUVIX_ANGULAR_PROPS__`には書き込みません。inputを宣言してください。

完全なドキュメント：[tuvix.js.org/packages/angular](https://tuvix.js.org/packages/angular)

## ライセンス

MIT
