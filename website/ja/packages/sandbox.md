---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="サンドボックス"
  description="再利用可能なShadow DOMルートによるCSS分離、そのルートへのスタイルシートの取り込み、スクリプトのグローバル変数を実際のwindowに書き込ませないProxy windowを提供します。"
  icon="🔒"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## 使いどころ

マイクロアプリのCSSとページのCSSが互いに影響してはならない場合は`CssSandbox`を使います。アプリのDOMをコンテナー上のopen shadow rootに移動するため、アプリのセレクターは内側に、ページのセレクターは外側にとどまります。`@tuvix.js/core`のオーケストレーターは、`sandbox: true`でアプリを登録するとこれを自動で行います。オーケストレーターを使わずにアプリをマウントする場合は、このパッケージを直接呼び出してください。

サードパーティのスクリプトテキストを実行し、そのグローバルへの書き込みを実際の`window`から切り離したい場合は`JsSandbox`を使います。コードは`execScript`で実行し、`window`、`this`、自由識別子はProxyを通じて解決されます。オーケストレーターはこれを適用しません。

信頼できないコードを強固に分離する必要がある場合は、別の手段を選んでください。`sandbox`属性付きの`<iframe>`はコードに独自のグローバルオブジェクトとオリジンを与えますが、このパッケージはそうしません。

## クイックスタート

オーケストレーター経由（CSSのみ）：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'cart',
  entry: { scripts: ['/apps/cart/main.js'], styles: ['/apps/cart/style.css'] },
  container: '#cart',
  activeWhen: '/cart/*',
  sandbox: true,
});

await orchestrator.start();
```

オーケストレーターは`#cart`をshadow rootで包み、その内側の`<div data-tuvix-sandbox-root="cart">`にアプリをレンダリングし、`style.css`を`<head>`ではなくshadow rootに読み込みます。マウントはローダーの`timeout`（デフォルトは10000 ms）を上限として、これらのスタイルシートを待ちます。アプリが再度マウントされるとき、オーケストレーターはshadow rootを再利用します。

手動で使う場合：

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container);
const target = shadowRoot ?? container;

const adopted = sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });
await adopted.ready;
target.append(Object.assign(document.createElement('p'), { textContent: 'Cart' }));

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox`

```ts
import type { ISandbox, SandboxOptions } from '@tuvix.js/sandbox';

declare function createSandbox(options?: SandboxOptions): ISandbox;
```

`new Sandbox(options)`を返します。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate`がコンテナーをshadow rootで包みます。`false`の場合、`activate`は`null`を返し、何もアタッチしません。 |
| `js` | `boolean` | `true` | `activate`/`deactivate`が`sandbox.js.active`を切り替えます。どちらの場合も、`sandbox.js.proxyWindow`のプロキシは書き込みを実際の`window`から切り離します。 |
| `allowedGlobals` | `string[]` | `[]` | strictモードでサンドボックス内のコードに代入を許可する追加のグローバル名。これらへの書き込みもプロキシに格納されます。 |
| `strict` | `boolean` | `false` | サンドボックス内のコードが、組み込みの許可リストと`allowedGlobals`に含まれないグローバルを代入または定義したときに`TypeError`を投げます。 |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

`createSandbox`の背後にあるクラスです。`ISandbox`を実装しています。

| メンバー | シグネチャ | 動作 |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | 使用する`CssSandbox`インスタンス。 |
| `js` | `readonly IJsSandbox` | 使用する`JsSandbox`インスタンス。 |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css`が有効なら`css.wrap(container)`を、続いて`js`が有効なら`js.activate()`を実行します。shadow rootまたは`null`を返します。 |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()`を実行し、続いて`css.unwrap(container)`を実行します。 |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)`を実行し、続いて`js.reset()`を実行して保存されたすべてのグローバルをクリアします。 |

### `CssSandbox`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const container = document.querySelector<HTMLElement>('#widget')!;

const shadowRoot = cssSandbox.wrap(container);
const style = cssSandbox.addStyle(shadowRoot, ':host { display: block; } p { color: teal; }');
cssSandbox.unwrap(container); // the <style> leaves the DOM and waits for the next wrap
cssSandbox.removeStyle(shadowRoot, style); // removed for good: the next wrap does not restore it
```

| メソッド | シグネチャ | 動作 |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | コンテナーの子要素をopen shadow rootに移動し、そのshadow rootを返します。 |
| `unwrap` | `(container: HTMLElement) => void` | 子要素をlight DOMに戻し、shadow rootのスタイルシートを退避して、shadow rootに`<slot>`を残します。 |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | `css`を持つ`<style>`をshadow rootの末尾に追加します。 |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | `styleEl`を削除します。ホストがunwrapされている場合は退避リストからも`styleEl`を取り除くため、次の`wrap`では復元されません。 |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | `<link>`要素と`<style>`要素をshadow rootの先頭に挿入します。 |

#### `wrap`と再マウント

DOM要素は一度アタッチしたshadow rootを外せません。`wrap`はこれに次のように対処します。

1. この`CssSandbox`インスタンスがすでにコンテナーをwrapしていて、まだunwrapしていない場合、`wrap`は同じshadow rootを返し、何も移動しません。
2. コンテナーがopenな`shadowRoot`を持っている場合（以前の`wrap`、`unwrap`、または別の`CssSandbox`インスタンスによるもの）、`wrap`は`unwrap`が残した`<slot>`を削除し、`unwrap`が退避したスタイルシートを（先頭に、元の順序で）戻して、そのルートを再利用します。
3. それ以外の場合は`container.attachShadow({ mode: 'open' })`を呼び出します。

その後、light DOMのすべての子要素をshadow rootに移動します。`wrap`が例外を投げるのは`attachShadow`が失敗した場合のみです。たとえば、shadow rootをホストできない要素（`<img>`、`<input>`）や、すでにclosedなルートを持つ要素の場合です：`[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`。

#### `unwrap`とslot

`unwrap`はshadow rootの子要素をコンテナーに戻します。`<style>`ノードと`<link rel="stylesheet">`ノードは、`addStyle`、`adoptStyles`、アプリのどれに由来するかにかかわらずDOMから取り出されるため、アプリのCSSは適用されなくなり、ページにも届きません。これらはshadow rootとともに保持されます。shadow rootは残り、`<slot data-tuvix-sandbox-slot>`を1つ保持するため、ブラウザは戻された子要素をそれを通してレンダリングします。このインスタンスがwrapしていないコンテナーに対しては、`unwrap`は何もしません。

そのホストを次に`wrap`すると、このインスタンスか他の`CssSandbox`インスタンスかにかかわらず、slotを削除し、退避したスタイルシートを順序どおりに戻し、子要素を再び移動します。再マウント後にスタイルを再度取り込む必要はありません。ホストがunwrapされている間に`removeStyle(shadowRoot, el)`または`adopted.remove()`を呼び出すと、それらのスタイルシートは完全に削除されます。

#### `adoptStyles`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const shadowRoot = cssSandbox.wrap(document.querySelector<HTMLElement>('#cart')!);

const adopted = cssSandbox.adoptStyles(shadowRoot, {
  urls: ['/apps/cart/style.css', '/shared/tokens.css'],
  cssText: ':host { display: block; }',
});

await adopted.ready; // every <link> fired load or error
console.log(adopted.elements.length); // 3

adopted.remove();
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | 各URLが順に`<link rel="stylesheet" data-tuvix-style>`になります。 |
| `cssText` | `string \| readonly string[]` | なし | 各文字列が`<style data-tuvix-style>`になり、linkの後に配置されます。 |

動作：

- 要素はshadow rootの先頭、以前に取り込まれたスタイルの後に配置されます。そのため、アプリのコンテンツと`addStyle`のスタイルはカスケードの後方に来ます。
- このshadow rootにすでに取り込まれたURLはスキップされ、`elements`には含まれません。`unwrap`が退避したlinkも対象です。以前の呼び出しで作成されたlinkの場合、`ready`はその既存のlinkも待ちます。
- `ready`は各linkが`load`または`error`を発火した時点で解決されます。rejectされることはないため、404のスタイルシートで処理が止まることはありません。jsdomはどちらのイベントも発火しないため、jsdomのテストでは`ready`をawaitしないでください。
- `remove()`はこの呼び出しで挿入した要素（退避されたものを含む）のみを削除するため、次の`wrap`ではそれらは復元されません。

### `JsSandbox`

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const jsSandbox = new JsSandbox(['analyticsQueue'], true);
jsSandbox.activate();

jsSandbox.execScript('window.analyticsQueue = []'); // allowed, stored on the proxy
console.log('analyticsQueue' in window); // false
console.log(Reflect.get(jsSandbox.proxyWindow, 'analyticsQueue')); // []

try {
  jsSandbox.execScript('window.tracker = {}');
} catch (error) {
  console.log(error instanceof TypeError); // true
}

jsSandbox.reset();
```

コンストラクター：`new JsSandbox(allowedGlobals: string[] = [], strict = false)`。

| メンバー | シグネチャ | 動作 |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | 実際の`window`に対するProxy。 |
| `active` | `readonly boolean` | `activate`で設定され、`deactivate`/`reset`でクリアされるフラグ。 |
| `activate` | `() => void` | `active`を`true`に設定します。 |
| `deactivate` | `() => void` | `active`を`false`に設定します。保存されたグローバルは残ります。 |
| `execScript` | `(code: string) => unknown` | `new Function`を通じて、`code`を`with (scope)`内のsloppyモードのスクリプトとして実行します。`window`、`self`、`globalThis`、トップレベルの`this`はプロキシになり、自由識別子はプロキシを通じて解決されます。`eval("...")`はそのスコープ内で直接evalのままです。コードが返す値を返します。 |
| `reset` | `() => void` | 保存されたすべてのグローバルをクリアし、`active`を`false`に設定します。 |

プロキシの動作：

- 読み取りはまずサンドボックス自身のストアを確認し、なければ実際の`window`にフォールバックします。`prototype`を持たない実際のwindowの関数（`fetch`、`setTimeout`）は、関数ごとに1回だけ実際の`window`にバインドされて返されるため、`proxyWindow.fetch === proxyWindow.fetch`となります。
- `proxyWindow.window`、`.self`、`.globalThis`、およびページがiframe内にない場合の`.top`/`.parent`/`.frames`は、プロキシ自身を返します。iframe内では、`top`と`parent`は実際のものが返されます。
- 代入と`Object.defineProperty`は値をプロキシに格納します。実際の`window`は変更されません。`value`を持たないディスクリプター（`{ enumerable: false }`）は保存された値を維持します。アクセサーディスクリプター（`get`/`set`）と`configurable: false`を指定すると、`Object.defineProperty`は`TypeError`を投げます。
- `delete proxyWindow.x`は保存された値を削除します。実際のwindowのプロパティに対しては`false`を返し、strictモードのコードでは`TypeError`になります。
- `in`はストアと実際の`window`の両方を確認します。

strictモード（`strict: true`）：組み込みの許可リストと`allowedGlobals`に含まれない名前に対する代入（`window.x = 1`または単独の`x = 1`）、トップレベルの`var x = 1`、`Object.defineProperty`の呼び出しは、`TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.`を投げ、何も格納しません。このチェックはサンドボックスがアクティブかどうかにかかわらず実行されます。Symbolキーは常にブロック対象です。組み込みの許可リストには、`console`、タイマー、`Promise`、`Map`、`JSON`、`fetch`、`URL`、`navigator`、`document`、`location`、`history`などの標準グローバルが含まれます。許可された書き込み（これらの名前への書き込みを含む）はプロキシにとどまります。

### 型

| 型 | 説明 |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`。`createSandbox`のオプションです。 |
| `ISandbox` | `Sandbox`が実装するインターフェース：`css`、`js`、`activate`、`deactivate`、`destroy`。 |
| `ICssSandbox` | `CssSandbox`が実装するインターフェース。 |
| `IJsSandbox` | `JsSandbox`が実装するインターフェース。 |
| `AdoptStylesOptions` | `adoptStyles`用の`{ urls?, cssText? }`。 |
| `AdoptedStyles` | `adoptStyles`が返す`{ elements, ready, remove }`。 |

## エッジケース

- `execScript`内では、`x = 1`、トップレベルの`var x = 1`、`window.x = 1`、`window.window.x = 1`、`top.x = 1`、および`eval("...")`内の同じ文は、いずれも`x`をプロキシに格納し、実際の`window`には格納しません。`let`と`const`はスクリプト内のローカルにとどまります。
- `execScript`内で未宣言の識別子を読み取ると、`ReferenceError`を投げずに`undefined`を返します。また、`with`にはsloppyモードが必要なため、`code`内の`"use strict"`ディレクティブは効果がありません。
- `f()`のような通常の関数呼び出しの内側では、sloppyモードのJavaScriptの定義どおり、`this`は実際のグローバルオブジェクトです。そのような関数内の`this.x = 1`は実際の`window`に書き込みます。`execScript`で実行するコードでは`window.x = 1`と書いてください。
- `execScript`は`new Function`を使うため、`'unsafe-eval'`を含まないContent Security Policyではブロックされます。
- `JsSandbox`、`Sandbox`、`createSandbox()`は構築時に`window`を読み取るため、サーバー上では`ReferenceError`を投げます。`CssSandbox`が`document`を必要とするのは、メソッドを呼び出したときだけです。
- 2つの`CssSandbox`インスタンスは同じホストを共有できます。2つ目の`wrap`は1つ目のインスタンスのshadow rootを再利用します。
- コンテナーがwrapされている間に追加したlight DOMの子要素はshadow rootの外側にとどまり、どのslotを通してもレンダリングされないため表示されません。代わりにshadow rootに追加してください。
- `Sandbox({ css: false }).activate()`は`null`を返します。コンテナーにレンダリングしてください。

## 対象外のこと

- タイマー、イベントリスナー、`document`、`<script>`タグにはパッチを当てません。`proxyWindow`を経由しないコードは実際のページに影響します。
- アプリが残したインターバルやリスナーはクリーンアップしません。アプリの`unmount`でクリアしてください。
- コードに別のオリジンやグローバルオブジェクトを与えません。信頼できないコードには`<iframe sandbox>`を使ってください。
- shadow rootをデタッチしません。DOMにはそのためのAPIがないため、`unwrap`は代わりにslotを残します。
- 継承は止めません。ホストやその祖先に設定された`color`、`font-family`、CSSカスタムプロパティは、引き続きshadow rootに伝わります。

## 0.4からの移行

- `Sandbox({ css: false }).activate(container)`は`null`を返し、shadow rootをアタッチしません。0.4ではshadow rootをアタッチし、コンテナーの子要素を非表示にしていました。`ISandbox.activate`は`ShadowRoot | null`を返すようになりました。

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true`はブロックされた書き込みに対して`TypeError`を投げます。0.4では警告をログに出力し、値を格納していました。スクリプトが設定する名前を`allowedGlobals`に追加してください。
- `execScript`はコードを`with`ブロック内で実行します。コードはstrictモードのコードにはできず、未宣言の識別子を読み取ると例外を投げずに`undefined`を返し、単独の`x = 1`は実際の`window`ではなくプロキシに格納されるようになりました。
- `unwrap`はshadow rootのスタイルシートを保持し、次の`wrap`がそれらを復元します。0.4では`unwrap`がそれらを削除していました。再マウント後に`cssText`や`addStyle`のスタイルを再度追加するコードは削除してください。残すと重複します。
- 0.4のドキュメントには、`js: true`が`addEventListener`、タイマー、`document.createElement`をインターセプトすると書かれていました。実際にはそうしたことはなく、0.5でも同様です。
