# Angularで使う

`@tuvix.js/angular`はAngularコンポーネントをマイクロアプリとしてブートストラップします。デフォルトではzone.jsを使いません。また、スタンドアロンコンポーネントをサーバーでHTMLにレンダリングします。

Angular 15以降をサポートします。`renderAngularToString`にはAngular 16以降と`@angular/platform-server`が必要です。

## インストール

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## コンポーネントをマイクロアプリにする

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin.component';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  providers: [provideHttpClient()],
});
```

| オプション | 型 | 説明 |
| --- | --- | --- |
| `name` | `string` | 必須。登録したアプリ名と一致する必要があります。 |
| `component` | `Type<C>` | 必須。ルートコンポーネント。スタンドアロン、または`module`で宣言されたもの。 |
| `module` | `Type<unknown>` | `component`を宣言するNgModule。そのプロバイダーは`importProvidersFrom`でインポートされます。 |
| `providers` | `Array<Provider \| EnvironmentProviders>` | 環境プロバイダー。 |
| `selector` | `string` | ホスト要素のタグ。デフォルト：コンポーネントのセレクターの要素部分、または`div`。 |
| `zone` | `boolean` | zone.jsによる変更検知を使います。デフォルトは`false`。 |
| `ssr` | `boolean` | `renderAngularToString`のマークアップを引き継ぎます。`createSsrAngularMicroApp`はこれを設定します。 |
| `bootstrap` | `() => void \| Promise<void>` | 最初のマウントの前に1回実行されます。 |

各マウントは`createApplication`を呼び出し、コンテナ内の専用のホスト要素にコンポーネントをブートストラップします。1つのページ上の2つのAngularアプリや、2つのコンテナにマウントされた1つのモジュールが、共有の`app-root`で衝突することはありません。

コンポーネントにコンパイル済みの`ɵcmp`がない場合（JIT）、アダプターは`@angular/platform-browser`の前に`@angular/compiler`を読み込みます。これが役立つのは、`@angular/core`以外のAngularパッケージを最初に読み込むコードがアダプターである場合だけです。コンポーネントのファイルが`@angular/common`（`NgIf`、`AsyncPipe`、`CommonModule`）、`@angular/forms`、`@angular/router`、またはその他のAngularライブラリをインポートしている場合、それらのパッケージはアダプターの実行前に評価され、"JIT compilation failed"で失敗します。クライアントエントリーの最初の行に`import '@angular/compiler'`を置くか、AOTでビルドしてください。

## プロパティからの入力

プロパティはコンポーネントの入力として宣言します。

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `<h1>Admin for {{ userId }}</h1>`,
})
export class AdminComponent {
  @Input() userId = '';
}
```

- マウントは最初の変更検知の前に`ComponentRef.setInput`で入力を設定するため、`ngOnInit`からそれらを参照できます。
- `update({ props })`は新しい値を設定し、変更検知を実行します。`container`を指定すると、そのマウントだけを更新します。
- 入力ではないキーはスキップされます。新しいプロパティにない入力は`undefined`にリセットされます。

## zone.jsを使わない変更検知

アダプターはzone.jsをインポートしないため、ページ上でもサーバー上でも`Promise`、タイマー、DOMイベントにパッチを当てません。Angularのバージョンに応じてプロバイダーを選びます。

| Angular | プロバイダー | DOMイベントが変更検知をトリガーするか |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | はい |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | はい |
| 15-17 | `NgZone`を何もしないzoneに置き換え | いいえ |

Angular 15-17では、クリックの後に変更検知を実行するものがありません。ハンドラー内で`detectChanges()`を呼び出します。

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="add()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  add(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

zoneベースの変更検知を使い続けるには、クライアントエントリーの先頭で`zone.js`をインポートし、`zone: true`を渡します。zone.jsが読み込まれていない場合、`mount`はrejectします。

## サーバーレンダリング

```ts
// server-only module
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<string> {
  return renderAngularToString(AboutComponent, { appId: 'about', props: { userId: '42' } });
}
```

```ts
// client
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export const about = createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })`は、コンポーネントの`<style>`タグに続けてホスト要素を返します。そのため、アイランドは初回描画の時点でスタイルが適用されています。zonelessで実行されます。
- `props`は、クライアントで`mount`が行うのと同様に、最初の変更検知の前にコンポーネントの入力を設定します。入力ではないキーはスキップされます。クライアントでも同じプロパティをアイランドに渡してください。そうしないと、ハイドレーションで異なる内容が表示されます。
- コンポーネントが開始したHTTPリクエストやタイマーは待ちません。先にデータを読み込み、それを提供します。
- サーバーのコードから呼び出します。ブラウザーでは`''`を返します。

クライアントでは、`createSsrAngularMicroApp`はサーバーのホスト要素にレンダリングし、Angularが自身のスタイルを追加した時点で、インライン化されたサーバーの`<style>`タグを削除します。`tuvix:mounted`イベントは`hydrated: true`を報告します。これはサーバーのDOMを置き換えます。Angularの非破壊的ハイドレーションには`<body>`直下のマーカーが必要で、別のページ内にあるアイランドはそれを提供できないため、アダプターは`provideClientHydration()`を追加しません。

## イベントバス

```ts
import { Component, OnDestroy, signal } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: `<span>{{ count() }}</span>`,
})
export class CartBadgeComponent implements OnDestroy {
  readonly count = signal(0);
  private readonly off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) =>
    this.count.set(itemCount),
  );

  ngOnDestroy(): void {
    this.off();
  }
}
```

Angular 18以降のzonelessでは、シグナルが変更検知をスケジュールします。15-17では、`set`の後に`ChangeDetectorRef.detectChanges()`を呼び出します。

## アダプターが行わないこと

- zone.jsや`@angular/localize`は読み込みません。必要な場合はエントリーでインポートします。
- 非破壊的なハイドレーションは行いません。上記を参照してください。
- マウント間で状態を共有しません。各マウントは専用のルートインジェクターを持つ独立したAngularアプリケーションなので、`providedIn: 'root'`のサービスはマウントごとに1つ存在します。

## API

| エクスポート | 用途 |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Angularマイクロアプリのモジュール |
| `createSsrAngularMicroApp(config)` | `ssr: true`を設定した同等のもの |
| `@tuvix.js/angular/server`の`renderAngularToString(component, options?)` | スタイル + ホスト要素のHTML |
