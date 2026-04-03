# ライフサイクルフック

## 概要

Tuvix.js のすべてのマイクロアプリは予測可能なライフサイクルに従います。Orchestrator は適切なタイミングでライフサイクルフックを呼び出します。

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

マイクロアプリのルートがアクティブになった時（または手動でアクティブ化された時）に呼び出されます。

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**引数：**
- `container` - レンダリング先のルート DOM 要素
- `props` - シェルからのオプションのキー・バリュー props

**例：**
```ts
async mount(container, props) {
  // アプリをセットアップ
  const root = document.createElement('div');
  container.appendChild(root);

  // フレームワークを root にレンダリング
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

マイクロアプリのルートから離れた時（または手動で非アクティブ化された時）に呼び出されます。

```ts
async unmount(container: HTMLElement): Promise<void>
```

ここで**クリーンアップ**を行います - イベントの購読解除、フレームワークインスタンスの破棄、DOM ノードの削除。

**例：**
```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
`unmount` では必ずクリーンアップしてください。フレームワークインスタンスを破棄しないことによるメモリリークは、マイクロフロントエンドアプリケーションで最も一般的なバグです。
:::

## update

シェルが既にマウントされたマイクロアプリに新しい props を渡す時に呼び出されます。**オプション。**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

実装されていない場合、Orchestrator は props の更新に `unmount` → `mount` を呼び出します。

**例：**
```ts
async update(container, props) {
  // 完全な再マウントなしで効率的に更新
  this._root?.render(<App {...props} />);
}
```

## Orchestrator レベルのフック

シェルはライフサイクルイベントをグローバルにリッスンすることもできます：

```ts
const orchestrator = createOrchestrator({
  container: '#app',

  onBeforeMount(app) {
    console.log(`Mounting: ${app.name}`);
  },

  onAfterMount(app) {
    console.log(`Mounted: ${app.name}`);
    analytics.track('micro_app_mounted', { app: app.name });
  },

  onError(error, app) {
    console.error(`Error in ${app.name}:`, error);
    // フォールバック UI を表示
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```
