# @tuvix.js/sandbox

> 再マウントをまたいで維持されるShadow DOMのCSS分離、スタイルシートの取り込み、スクリプトのグローバル変数のためのProxy window

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。完全なドキュメント：[tuvix.js.org/packages/sandbox](https://tuvix.js.org/packages/sandbox)。

`CssSandbox`はマイクロアプリのDOMをopen shadow rootに移動し、アプリのCSSとページのCSSを分離します。`@tuvix.js/core`のオーケストレーターは、`sandbox: true`でアプリを登録するとこれを使います。`JsSandbox`は、これを通じて実行したコードによる`window.x = ...`の書き込みを実際の`window`から切り離します。これはProxyであり、セキュリティ境界ではありません。信頼できないコードには`<iframe sandbox>`を使ってください。

## インストール

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## クイックスタート

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container); // ShadowRoot, or null with css: false
sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox(options?)`と`Sandbox`

`createSandbox(options)`は、`ISandbox`として型付けされた`new Sandbox(options)`を返します。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate`がコンテナーをshadow rootで包みます。`false`の場合：`activate`は`null`を返し、何もアタッチしません。 |
| `js` | `boolean` | `true` | `activate`/`deactivate`が`js.active`を切り替えます。どちらの場合も、プロキシは書き込みを`window`から切り離します。 |
| `allowedGlobals` | `string[]` | `[]` | strictモードでサンドボックス内のコードに代入を許可する名前（値はプロキシに格納されます）。 |
| `strict` | `boolean` | `false` | 許可リストと`allowedGlobals`に含まれないグローバルへの書き込みまたは`defineProperty`で`TypeError`を投げます。 |

メンバー：`css`（`CssSandbox`）、`js`（`JsSandbox`）、`activate(container): ShadowRoot | null`、`deactivate(container)`、`destroy(container)`（deactivateした後、保存されたグローバルをクリアします）。

### `CssSandbox`

| メソッド | 動作 |
| --- | --- |
| `wrap(container)` | 子要素をopen shadow rootに移動します。`container.shadowRoot`が存在する場合（以前の`wrap`、`unwrap`、別のインスタンスによるもの）はそれを再利用し、`unwrap`が残したslotを削除して、退避したスタイルシートを順序どおりに戻します。例外を投げるのは`attachShadow`が失敗した場合のみです。 |
| `unwrap(container)` | 子要素をlight DOMに戻し、`<style>`と`<link rel="stylesheet">`（`addStyle`、`adoptStyles`、アプリのいずれに由来するものも）をDOMから取り出して次の`wrap`のために保持し、子要素がレンダリングされるよう`<slot>`を残します。このインスタンスがwrapしていないコンテナーに対しては何もしません。 |
| `addStyle(shadowRoot, css)` | `<style>`を追加し、それを返します。 |
| `removeStyle(shadowRoot, styleEl)` | `styleEl`を削除します。unwrap中に削除した場合、次の`wrap`では復元されません。 |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | shadow rootの先頭、以前に取り込まれたスタイルの後に、`<link>`、続いて`<style>`を挿入します。退避されたlinkを含め、すでに取り込まれたURLはスキップします。`{ elements, ready, remove }`を返します。 |

`ready`は各linkが`load`または`error`を発火した時点で解決され、rejectされることはありません。jsdomはどちらも発火しないため、jsdomのテストではawaitしないでください。`remove()`はその呼び出しで挿入した要素のみを削除します。unwrap中に削除した場合、次の`wrap`で戻ることはありません。

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`。

| メンバー | 動作 |
| --- | --- |
| `proxyWindow` | `window`に対するProxy。読み取りはサンドボックスのストア、次に実際の`window`を確認します（関数は1回だけバインドされます）。`window`、`self`、`globalThis`、およびiframe外での`top`/`parent`/`frames`はプロキシを返します。書き込みと`Object.defineProperty`はストアに格納されます。`value`を持たないディスクリプターは保存された値を維持します。アクセサーディスクリプターと構成不可のディスクリプターは`TypeError`を投げます。 |
| `execScript(code)` | `code`を`with (scope)`内のsloppyモードのスクリプトとして実行します。`window`、`self`、`globalThis`、トップレベルの`this`はプロキシになり、自由識別子はプロキシを通じて解決されます。`eval("...")`はそのスコープ内で直接evalのままです。 |
| `activate()`, `deactivate()`, `active` | フラグです。プロキシの動作は変わりません。 |
| `reset()` | 保存されたグローバルをクリアし、`active`を`false`に設定します。 |

strictモードでは、許可リストに含まれない名前への代入、トップレベルの`var x = 1`、`defineProperty`に対して`TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.`を投げ、アクティブかどうかにかかわらず何も格納しません。

### 型

`SandboxOptions`、`ISandbox`、`ICssSandbox`、`IJsSandbox`、`AdoptStylesOptions`、`AdoptedStyles`。

## エッジケース

- `execScript`内では、`x = 1`、`var x = 1`、`window.x = 1`、`window.window.x = 1`、`top.x = 1`、および`eval("...")`内の同じ文は、`x`をプロキシに格納し、実際の`window`には格納しません。`let`/`const`はローカルにとどまります。
- `execScript`内で未宣言の識別子を読み取ると、例外を投げずに`undefined`を返します。また、`code`内の`"use strict"`は効果がありません。
- `f()`のような通常の関数呼び出しの内側では、sloppyモードのJavaScriptの定義どおり、`this`は実際のグローバルオブジェクトです。そこでの`this.x = 1`は実際の`window`に書き込みます。代わりに`window.x = 1`と書いてください。
- `execScript`は`new Function`を使うため、CSPに`'unsafe-eval'`が必要です。
- `JsSandbox`、`Sandbox`、`createSandbox()`はコンストラクターで`window`を読み取るため、サーバー上では例外を投げます。
- コンテナーがwrapされている間に追加したlight DOMの子要素はレンダリングされません。shadow rootに追加してください。

## 対象外のこと

- タイマー、イベントリスナー、`document`、`<script>`タグにはパッチを当てず、アプリが残したものもクリーンアップしません。
- コードに独自のオリジンやグローバルオブジェクトを与えません。
- 継承されるスタイル（`color`、フォント、カスタムプロパティ）がshadow rootに届くのは止めません。

## 0.4からの移行

- `Sandbox({ css: false }).activate()`は`null`を返し、shadow rootをアタッチしません。`ISandbox.activate`は`ShadowRoot | null`を返します。
- `strict: true`はブロックされた書き込みに対して、警告ではなく例外を投げます。
- `execScript`はコードを`with`ブロック内で実行します：strictモードのコードは使えず、未宣言の識別子の読み取りは`undefined`を返し、単独の`x = 1`はプロキシにとどまります。
- `unwrap`はスタイルシートを削除せず、次の`wrap`のために保持します。

## ライセンス

MIT
