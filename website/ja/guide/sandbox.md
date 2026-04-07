# サンドボックス

`@tuvix.js/sandbox` は、マイクロアプリが互いに、またはシェルに干渉するのを防ぐための CSS と JavaScript の分離を提供します。

## CSS 分離（Shadow DOM）

CSS サンドボックスが有効な場合、マイクロアプリのコンテナは Shadow DOM ホストにアップグレードされます。内部で定義されたスタイルはその shadow root にスコープされ、シェルや他のマイクロアプリに漏れることはありません。

### アプリごとに有効化

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### 仕組み

```
Shell DOM
├── #app (orchestrator コンテナ)
│   ├── Shadow Root (my-app)  ← スタイルはここにスコープ
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
Shadow DOM CSS 分離はすべてのモダンブラウザで完全にサポートされています。レガシーブラウザのサポートには、`js` 分離モードのみを検討してください。
:::

## JS 分離（Proxy Scope）

JS サンドボックスが有効な場合、マイクロアプリのグローバルスコープは `Proxy` でラップされます。`window.*` へのアクセス、イベントリスナー、インターバル、タイムアウトはインターセプトされ、`unmount` 時に自動的にクリーンアップされます。

### アプリごとに有効化

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### 何がインターセプトされるか

| アクセス | インターセプト？ | アンマウント時にクリーンアップ？ |
|---------|---------------|-------------------------------|
| `window.someGlobal = x` | ✅ | ✅ |
| `addEventListener(...)` | ✅ | ✅ |
| `setTimeout(...)` | ✅ | ✅ |
| `setInterval(...)` | ✅ | ✅ |
| `localStorage` | ✅ | オプション |
| `sessionStorage` | ✅ | オプション |

## 両方を一緒に使う

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,   // Shadow DOM 分離
    js: true,    // Proxy スコープ分離
  },
});
```

## カスタムサンドボックス

`@tuvix.js/sandbox` を直接使用することもできます：

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// 分離を有効化
const shadowRoot = sandbox.activate(rootElement);

// ... アプリが分離された状態で実行 ...

// 完了したら無効化
sandbox.deactivate(rootElement);
```
