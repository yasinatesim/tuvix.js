# サンドボックス

`@tuvix.js/sandbox`には2つのツールがあります。`CssSandbox`はアプリをShadow Rootの中に置き、アプリのCSSとページのCSSを分離します。`JsSandbox`はプロキシの`window`に対してコードを実行し、グローバルへの書き込みをプロキシ上に留めます。オーケストレーターは`sandbox: true`で登録したアプリに`CssSandbox`を使います。`JsSandbox`は適用しません。

## アプリごとのCSS分離

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'widget',
  entry: {
    scripts: ['https://cdn.example.com/widget/main.js'],
    styles: ['https://cdn.example.com/widget/main.css'],
    type: 'module',
  },
  container: '#widget',
  activeWhen: '/',
  sandbox: true, // same as { css: true }
});
```

このアプリに対して、オーケストレーターは次の処理を行います。

1. `#widget`にopenのShadow Rootをアタッチします（以前のマウントで作成したものがあれば再利用します）。
2. その中に`<div data-tuvix-sandbox-root>`を作成し、その要素を`container`として`mount`に渡します。
3. エントリーの`styles`を`document.head`ではなくShadow Rootの中に`<link>`タグとして追加し、`mount`を呼び出す前に、最大`loader.timeout`までそれらの読み込みを待ちます。

ページのCSSはアプリに届かなくなり、アプリのCSSもページに届かなくなります。`color`や`font-family`などの継承プロパティは、引き続きホスト要素から流れ込みます。これを止めるには、アプリのCSSで`:host`に設定します。

アプリがグローバルなセレクター（`button { ... }`、CSSリセット）を含む場合や、ページのCSSがアプリを壊す場合に使います。

### エッジケース

- フレームワークが実行時に注入するスタイルは、Shadow Rootの外にある`document.head`に入ります。ViteのCSS注入、CSS-in-JSライブラリ、Angularのコンポーネントスタイルはすべてこの動作をします。CSSファイルを配布して`entry.styles`に指定するか、自分でShadow RootにCSSを追加します。
- `document.body`にレンダリングするポータル、モーダル、トーストはShadow Rootの外に出るため、アプリのスタイルが適用されません。
- アプリ内からの`document.querySelector`は、Shadow Root内の要素を見つけられません。代わりに`container`から検索します。
- ローダー関数のエントリーは`styles`を指定しないため、バンドラーがそのCSSを`document.head`に注入し、Shadow Rootがそれを遮断します。サンドボックス化するアプリは`{ scripts, styles, type }`形式のエントリーで登録します。

## CssSandboxを直接使う

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const css = new CssSandbox();
const shadow = css.wrap(container); // moves existing children into the shadow root

const adopted = css.adoptStyles(shadow, {
  urls: ['/widget/main.css'],
  cssText: ':host { display: block; font-family: system-ui; }',
});
await adopted.ready; // resolves once each <link> fired load or error

const button = document.createElement('button');
button.textContent = 'Buy';
shadow.append(button);

// Later
adopted.remove();
css.unwrap(container);
```

| メソッド | 効果 |
| --- | --- |
| `wrap(container)` | openのShadow Rootをアタッチし（既存のopenのものがあれば再利用し）、コンテナの子要素をその中に移動します。 |
| `adoptStyles(shadow, { urls, cssText })` | Shadow Rootの先頭に`<link>`要素と`<style>`要素を挿入します。そこですでに適用済みのURLはスキップします。`{ elements, ready, remove }`を返します。 |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | `<style>`を1つ追加または削除します。 |
| `unwrap(container)` | スタイル以外のノードをLight DOMに戻し、それらがレンダリングされるように`<slot>`を残します。`<style>`とスタイルシートの`<link>`ノード（`addStyle`と`adoptStyles`で追加したものを含む）はDOMから取り出され、そのコンテナを次に`wrap`したときに元の順序で戻されます。 |

要素がShadow Rootをホストできない場合（例：`<input>`）や、すでにclosedのShadow Rootを持つ場合、`wrap`は例外を投げます。`ready`がrejectされることはありません。jsdomはリンクの`load`を発火しないため、jsdomのテストでは`ready`をawaitしないでください。コンテナがunwrapされている間に`removeStyle`または`adopted.remove()`を呼び出すと、そのスタイルシートは次の`wrap`で戻されません。

## JsSandbox

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['dataLayer'], /* strict */ true);

js.execScript('window.dataLayer = []'); // allowed, stored on the proxy
console.log('dataLayer' in window); // false, unless the page defined it

try {
  js.execScript('counter = 1'); // bare assignment to a global that is not allowed
} catch (error) {
  console.log(error instanceof TypeError); // true: strict mode blocked the write
}

const loose = new JsSandbox(); // not strict
loose.execScript('var version = 2; build = 7;');
console.log(Reflect.get(loose.proxyWindow, 'version'), 'version' in window); // 2 false

js.reset(); // forget every stored global
```

- プロキシを通じた書き込みと`Object.defineProperty`は、サンドボックス上のストアに保存されます。読み取りはまずそのストアを確認し、次に実際の`window`を確認します。
- `strict: true`の場合、組み込みの許可リストと`allowedGlobals`にないグローバルへの代入、トップレベルでの`var`宣言、`Object.defineProperty`は`TypeError`を投げ、何も保存しません。
- `execScript(code)`は`with (scope)`の中で`code`を実行し、`window`、`self`、`globalThis`、`this`をプロキシにバインドします。裸の代入（`x = 1`）、トップレベルの`var x`、`window.x = 1`はすべてプロキシに保存されます。`let`と`const`はスクリプト内のローカルに留まります。
- `with`はsloppyモードを必要とするため、`execScript`の中では、宣言されていない識別子を読み取ると`ReferenceError`を投げずに`undefined`を返し、`"use strict"`ディレクティブは効果を持ちません。`new Function`を使うため、Content Security Policyに`unsafe-eval`が必要です。
- `activate()`と`deactivate()`は`active`フラグを設定します。プロキシはどちらの状態でも書き込みを保存します。

`JsSandbox`が対象とするのは、`proxyWindow`を通じてグローバルにアクセスするコードだけです。`<script>`タグで読み込んだスクリプト、バンドルされたモジュール、タイマー、イベントリスナーはすべて実際の`window`を使います。実行するスニペットでの意図しないグローバルへの書き込みを防ぐものとして扱い、セキュリティ境界としては扱わないでください。

## 組み合わせたサンドボックス

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + reset the JS store
```

`css`が`false`の場合、`activate`は`null`を返し、何もアタッチしません。

## マイクロアプリ内で使う

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

export default defineMicroApp({
  name: 'widget',
  mount({ container }) {
    const shadow = css.wrap(container);
    css.addStyle(shadow, 'p { color: rebeccapurple; }');
    const text = document.createElement('p');
    text.textContent = 'Isolated';
    shadow.append(text);
  },
  unmount({ container }) {
    container.shadowRoot?.replaceChildren();
    css.unwrap(container);
  },
});
```

オーケストレーターがアプリをマウントする場合は、`register`で`sandbox: true`を指定する方法を優先します。同じ処理を行い、再マウントの間でShadow Rootを再利用します。

## サンドボックスを使うべきでない場合

- アプリが`document.body`へのポータルを使い、そこでスタイルを必要とする場合。
- ページのデザインシステムでアプリをスタイリングすべき場合。
- 本当のJavaScript分離が必要な場合。`<iframe>`を使います。
