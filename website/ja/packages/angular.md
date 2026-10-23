---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angularバインディング"
  description="Angular 15+のコンポーネントをTuvix.jsのマイクロアプリに変換します。デフォルトでzoneless、コンテナごとに1つのアプリケーション、propsはコンポーネントの入力として渡され、スタイル付きのサーバーレンダリングに対応します。"
  icon="🔺"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

コンポーネントがAOTコンパイルされていない（JIT）場合は`@angular/compiler`を追加します。サーバーで`renderAngularToString`を呼び出す場合は、サーバー側に`@angular/platform-server`と`@angular/compiler`を追加します。クライアントアダプターにはAngular 15以降、サーバーレンダラーにはAngular 16以降が必要です。

## 使いどころ

Angularコンポーネントを他のマイクロアプリと並ぶ1つのマイクロアプリとして動かす場合に、このパッケージを使います。オーケストレーターはルートに応じてコンポーネントをコンテナにマウントし、propsを渡し、更新し、離れるときにアンマウントします。マウントごとに専用のAngularアプリケーションと専用のホスト要素が作られるため、複数のAngularアプリや同じアプリの複数のコピーが1つのページに共存できます。アダプターはzone.jsを読み込まないため、Angularのアイランドが隣にあるReactやVueのアプリのために`Promise`や`addEventListener`をパッチすることはありません。

Angularがページ全体を所有する場合は、通常どおり`bootstrapApplication`でブートストラップしてください。その場合、アダプターを使う利点はありません。

## クイックスタート

入力を持つスタンドアロンコンポーネント：

```ts
// greeting.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

マイクロアプリのエントリーがこれをラップします：

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

シェルがアプリを登録し、オーケストレーターを起動します：

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'greeting',
  entry: () => import('./greeting-app'),
  container: '#greeting',
  activeWhen: '/hello',
  props: { name: 'Ada' },
});

await orchestrator.start();

// 後で：setInput('name', 'Grace') と1回の変更検知が実行されます。
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

アダプターは`#greeting`の中に`<app-greeting>`ホスト要素を作成し、更新後は「Hello Grace」と表示します。

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | アプリ名。アダプターは`@tuvix.js/loader`の`registerModule`で、この名前でモジュールを登録します。 |
| `component` | `Type<C>` | 必須 | ルートコンポーネント。スタンドアロンコンポーネントは単体で動作します。 |
| `module` | `Type<unknown>` | なし | `component`を宣言しているNgModule。アダプターは`importProvidersFrom`でそのプロバイダーを追加します。 |
| `providers` | `AngularProviders` | `[]` | アプリケーションの環境プロバイダー（`provideHttpClient()`など）。 |
| `selector` | `string` | コンポーネントセレクターの要素部分、なければ`'div'` | アダプターがコンテナ内に作成するホスト要素のタグ名。 |
| `zone` | `boolean` | `false` | zone.jsによる変更検知を使います。クライアントのエントリーで最初に`zone.js`をインポートする必要があります。 |
| `ssr` | `boolean` | `false` | `renderAngularToString`のマークアップを引き継ぎます。`createSsrAngularMicroApp`を参照してください。 |
| `bootstrap` | `() => void \| Promise<void>` | なし | 1回だけ実行するセットアップ。モジュールの`bootstrap()`がこれをawaitします。 |

各`mount({ container, props })`は次の処理を行います：

1. `component`または`module`にAOT定義（`ɵcmp` / `ɵmod`）がない場合は最初に`@angular/compiler`を読み込み、次に`@angular/core`と`@angular/platform-browser`を読み込みます。これが役立つのは、アダプターが`@angular/core`以外のAngularパッケージを最初に読み込むコードである場合だけです。コンポーネントのファイルが`@angular/common`（`NgIf`、`AsyncPipe`、`CommonModule`）、`@angular/forms`、`@angular/router`、またはその他のAngularライブラリをインポートしている場合、それらのパッケージはアダプターの実行前に評価され、「JIT compilation failed」で失敗します。クライアントのエントリーの1行目に`import '@angular/compiler'`を残すか、AOTでビルドしてください。
2. Angularのバージョンに応じた変更検知プロバイダー（[変更検知](#change-detection)を参照）、モジュールのプロバイダー、`providers`を指定して`createApplication({ providers })`を呼び出します。
3. ホスト要素（セレクター`'app-greeting'`なら`<app-greeting>`、`'[card]'`のような属性セレクターなら`<div>`）を作成してコンテナに配置し、そこにコンポーネントをブートストラップします。
4. 最初の変更検知の前に`ComponentRef.setInput`でpropsをコンポーネントの入力として設定するため、`ngOnInit`の時点で値が見えます。`ComponentFactoryResolver`がないAngularバージョンでは、ブートストラップ直後に入力を設定し、続けてtickを実行します。
5. コンテナで`tuvix:mounted`をディスパッチします。失敗した場合は`tuvix:error`をディスパッチし、元のエラーでrejectします。

`update({ props, container? })`は新しい値を`setInput`で書き込み、`appRef.tick()`を実行します。対象は指定した1つのコンテナで、`container`を省略するとすべてのマウントが対象になります。これはzonelessかどうかに関係なく、すべてのAngularバージョンで描画されます。

`unmount({ container })`はアプリケーションを破棄し、コンテナを空にして`tuvix:unmounted`をディスパッチします。

NgModuleで宣言されたコンポーネント：

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
import { AdminModule } from './admin/admin.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  module: AdminModule,
  providers: [provideHttpClient()],
});
```

### `createSsrAngularMicroApp`

```ts no-check
function createSsrAngularMicroApp<C>(config: AngularSsrMicroAppConfig<C>): MicroAppModule;
```

オプションは`ssr`を除いて`createAngularMicroApp`と同じで、`createAngularMicroApp({ ...config, ssr: true })`と同じように動作します。サーバーが`renderAngularToString`でレンダリングしたアイランドに対して、クライアント側で使います。

コンテナにサーバーのマークアップがある場合、ホスト要素がコンテナの直接の子で、期待するタグを持っていれば、アダプターはその要素を再利用します。Angularはその要素にレンダリングし、サーバーが出力した子要素を置き換えます。Angularがコンポーネントのスタイルを`<head>`に追加した後、アダプターはインライン化されたサーバーの`<style>`タグと、ホストの隣にあるその他の要素を削除します。`tuvix:mounted`は`hydrated: true`を報告します。空のコンテナでは通常のクライアントレンダリングが行われます。

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString`

```ts no-check
// import from '@tuvix.js/angular/server'
function renderAngularToString(component: unknown, options?: AngularSsrOptions): Promise<string>;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | 入力名（またはエイリアス）をキーとする入力値。クライアントのマウントと同じく、最初の変更検知の前に設定されます。入力ではないキーはスキップされます。 |
| `providers` | `AngularProviders` | `[]` | サーバーレンダリング用の環境プロバイダー。 |
| `appId` | `string` | `'ng'`（Angularのデフォルト） | Angularの`APP_ID`。Angularはこの値をstyleタグの`ng-app-id`属性に書き込みます。 |
| `document` | `string` | `<body>`にホスト要素を持つ空のドキュメント | レンダリング先のHTMLドキュメント。ホスト要素を含んでいる必要があります。 |
| `selector` | `string` | コンポーネントセレクターの要素部分、なければ`'app-root'` | デフォルトのドキュメントで使うホスト要素のタグ。Angularは一致した要素にブートストラップします。 |

`@angular/platform-server`の`renderApplication`でスタンドアロンコンポーネントをレンダリングし、1つのフラグメントを返します。フラグメントは、レンダリングされた`<head>`にあるコンポーネントの`<style>`タグと、それに続く`<body>`のinner HTMLで構成されます。このフラグメントを`createSsrAngularMicroApp`がマウントするコンテナに配置すると、アイランドは最初の描画からスタイルを持ちます。

`props`は、クライアントの`mount`と同じ方法で、最初の変更検知の前に`setInput`を通じてコンポーネントに渡されます。そのため、どちらの側でも`ngOnInit`から値が見えます。サーバーレンダリングとクライアントのマウントに同じオブジェクトを渡すと、両方が同じマークアップを生成します。

レンダリングはzonelessで実行され、グローバルの`Promise`をパッチしません。Nodeは`node_modules`からAngularパッケージをAngular linkerなしで読み込むため、常に最初に`@angular/compiler`を読み込みます。ブラウザでも実行されるコードではなく、サーバー関数から呼び出してください。ブラウザでは`''`を返します。

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### 型

| 型 | 説明 |
| --- | --- |
| `AngularMicroAppConfig<C>` | `createAngularMicroApp`のオプション。 |
| `AngularSsrMicroAppConfig<C>` | `ssr`を除いた`AngularMicroAppConfig<C>`。`createSsrAngularMicroApp`のオプション。 |
| `AngularSsrOptions` | `renderAngularToString`のオプション。型は`@tuvix.js/angular`からインポートします。 |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`。`createApplication`と`bootstrapApplication`が受け付ける形式です。 |

## 変更検知 {#change-detection}

アダプターはzone.jsをインポートしません。`zone: true`を渡さない限り、Angularのバージョンがサポートするzonelessの設定を選びます：

| Angular | アダプターが追加するプロバイダー | 変更検知のトリガー |
| --- | --- | --- |
| 20以降 | `provideZonelessChangeDetection()` | テンプレートのイベントリスナー、シグナルへの書き込み、`markForCheck()`、`AsyncPipe`、`setInput` |
| 18と19 | `provideExperimentalZonelessChangeDetection()` | 20と同じ |
| 15から17 | `NgZone`を`ɵNoopNgZone`に置き換え | それ自体では何もトリガーしません。ホストからの`update()`は描画されます。 |

Angular 18以降では、`setTimeout`や`fetch`のコールバック内で通常のフィールドを変更しても、テンプレートは再描画されません。その状態はシグナルで保持するか、`ChangeDetectorRef.markForCheck()`を呼び出してください：

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<time>{{ now() }}</time>`,
})
export class ClockComponent {
  readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
  }
}
```

Angular 15から17では、クリックなどのDOMイベントも変更検知をトリガーしません。状態を変更した後に`ChangeDetectorRef.detectChanges()`を呼び出してください：

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="increment()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  increment(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

zoneベースの変更検知を維持するには、アダプターがマウントする前にクライアントのエントリーでzone.jsをインポートし、`zone: true`を渡します。アダプターはAngularのデフォルトの`NgZone`をそのまま使い、その中でブートストラップします：

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.jsは、他のフレームワークのアプリを含むページ全体の`Promise`、タイマー、DOMリスナーをパッチします。

## サーバーレンダリング

1. サーバーで`renderAngularToString(Component)`を呼び出し、フラグメントをコンテナ要素に配置します。
2. クライアントでは、アイランドのエントリーから`createSsrAngularMicroApp({ name, component })`をエクスポートします。
3. オーケストレーターがそのコンテナにアプリをマウントします。Angularはサーバーのホスト要素にレンダリングし、アダプターはサーバーのスタイルを削除します。

アダプターはサーバーのDOMの上に再レンダリングします。Angularの非破壊ハイドレーション（`provideClientHydration`）は使いません。このハイドレーションは、Angularがページ全体をレンダリングしたことを前提としており、`<body>`の直接の子にあるAngularのハイドレーションマーカーコメントと、コンポーネントの`ngh`アノテーションを探すためです。React、Vue、またはプレーンなサーバーテンプレートがレンダリングしたページ内のアイランドには、どちらもありません。トレードオフとして、表示されるマークアップとスタイルはHTMLと一緒に届きますが、アイランド内の状態（フォーカス、入力された値、スクロール位置）はAngularが引き継いだ時点でリセットされ、それまでのクリックは何も起こしません。

クライアントのレンダリングがサーバーのマークアップと一致するように、サーバーレンダリングとクライアントのマウントには同じpropsを渡してください。レンダリングは、コンポーネントが開始したHTTPリクエストやタイマーを待ちません。先にデータを読み込み、propsとして渡してください。

```ts
// server.ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<{ html: string; props: { text: string } }> {
  const response = await fetch('https://api.example.com/about');
  const props = { text: await response.text() };
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props });
  return { html, props };
}
```

`props`をページと一緒にブラウザへ送り（たとえば`<script type="application/json">`タグ内のJSONとして）、それを使ってアプリを登録します：

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

APIのベースURLのように入力ではない値は、代わりに両方の側で`providers`を渡してください。

## エッジケース

- ページにzone.jsがない状態で`zone: true`を指定すると、マウントは`[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.`でrejectされ、`tuvix:error`がディスパッチされます。
- キーがコンポーネントの入力ではないpropsはスキップされるため、AngularはNG0303をログに出力しません。入力は公開名（設定している場合はエイリアス）で照合されます。
- 古いpropsにあって新しいpropsにない入力は`undefined`に設定されます。フィールドの初期化子（`name = ''`）は再実行されません。
- マウント完了前の`update`はpropsを保存し、保留中のブートストラップは最新のpropsを使います。このモジュールがマウントしていないコンテナに対する`update({ container })`は何もしません。
- `mount`がまだAngularを読み込んでいる間に`unmount`するとマウントはキャンセルされます。アプリケーションは破棄され、コンテナは空のままで、`tuvix:mounted`は発火しません。キャンセルがブートストラップ後に届いた場合は、`tuvix:mounted`の後に`tuvix:unmounted`が発火します。
- 同じコンテナに2回目の`mount`を行うと、新しいアプリケーションをブートストラップする前に最初のアプリケーションが破棄されます。
- このモジュールが一度もマウントしていないコンテナに対する`unmount`は何もしません。
- アプリケーションの破棄が例外を投げた場合、アダプターはコンテナを空にし、`tuvix:error`をディスパッチして例外を再スローします。
- SSRで、マークアップにホストタグと一致する直接の子がないコンテナには、新しいホスト要素が作られます。コンテナにマークアップがあったため、`hydrated`は`true`のままです。
- サーバーでは、属性セレクターのコンポーネント（`'[card]'`）は`<app-root>`ホストにフォールバックしますが、このホストはセレクターと一致しません。一致する要素を`<body>`に持つ`document`を渡してください。
- Angular 16では、サーバーレンダリング中に`@angular/platform-server`がDominoのDOMクラス（`Event`、`Node`など）をNodeのグローバルオブジェクトにコピーします。これはアダプターではなくAngularの動作です。
- Angularコンパイラープラグインを使わないJITコンポーネントには、引き続きTypeScriptの`experimentalDecorators`が必要です。Angularは標準デコレーターの提案をサポートしていません。

## 対象外のこと

- zone.jsやその他のポリフィルは読み込みません。
- `provideClientHydration()`を追加せず、非破壊ハイドレーションも行いません。
- サーバーのpropsをブラウザに送りません。自分でページにシリアライズし、同じオブジェクトをクライアントのマウントに渡してください。
- サーバーレンダリング中にコンポーネントが開始したHTTP呼び出し、タイマー、`PendingTasks`を待ちません。
- クライアントが引き継ぐとき、サーバーのDOMノード、フォーカス、フォームの状態を保持しません。
- コンポーネントにTuvixのpropsサービスやバスを提供しません。propsには入力を宣言し、他のアプリとの通信には[`@tuvix.js/event-bus`](/ja/packages/event-bus)を使ってください。

## 0.4からの移行

**`createAngularMicroApp`はコンポーネントを受け取ります。** `platform`と`compilerOptions`は削除されました。ルートコンポーネントを`component`として渡し、NgModuleで宣言されている場合はそのモジュールを`module`として渡します。

```ts no-check
// 0.4
createAngularMicroApp({
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

export default createAngularMicroApp({ name: 'admin', component: AppComponent, module: AppModule });
```

**propsは入力です。** `update()`は`window.__TUVIX_ANGULAR_PROPS__`に書き込まなくなりました。このグローバルを読み取るサービスを削除し、代わりにprop名で`@Input()`フィールドを宣言してください。

**デフォルトでzoneless。** `zone: true`を渡さない限り、アプリはzone.jsなしで動作します。Angular 15から17では、DOMイベントは変更検知をトリガーしなくなりました。ハンドラーで`ChangeDetectorRef.detectChanges()`を呼び出すか、zone.jsを有効にしてください。エントリーから`provideZonelessChangeDetection()`を削除できます。`import '@angular/compiler'`を削除するのは、コンポーネントのファイルが`@angular/core`以外のAngularパッケージから何もインポートしていない場合だけにしてください。それ以外の場合は、クライアントのエントリーの1行目に残すか、AOTでビルドしてください。

**自動の`provideClientHydration()`はありません。** `createSsrAngularMicroApp`はサーバーのマークアップの上に再レンダリングします。その`providers`に`provideClientHydration()`を含めないでください。

**`appId`が有効になりました。** 0.4では、`renderAngularToString`は`appId`を受け付けていましたが無視していました。現在はAngularの`APP_ID`を設定するため、styleタグの`ng-app-id`属性が`ng`から指定した値に変わります。

**ホスト要素。** クライアントとサーバーの両方で、ホストタグは固定の`'app-root'`ではなくコンポーネントのセレクターから決まり、クライアントアダプターはそれをコンテナ内に作成します。モジュールが一度もマウントしていないコンテナに対する`unmount`は、そのコンテナをクリアしなくなりました。

完全なアプリについては[Angularガイド](/ja/guide/angular)を参照してください。
