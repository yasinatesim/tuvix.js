# マイクロアプリ

**マイクロアプリ**は、標準的なライフサイクルインターフェースを通じて Tuvix.js シェルと統合する、独立してビルド・デプロイされるフロントエンドアプリケーションです。

## MicroApp インターフェース

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

マイクロアプリのバンドルは、このインターフェースを満たすオブジェクトをエクスポートする必要があります。

## Vanilla JS の例

```ts
// my-app/main.ts
import type { MicroAppDefinition } from '@tuvix.js/core';

export const app: MicroApp = {
  async mount(container, props) {
    const div = document.createElement('div');
    div.className = 'my-app';
    div.innerHTML = `<h1>Hello from My App</h1>`;
    container.appendChild(div);
  },

  async unmount(container) {
    container.innerHTML = '';
  },
};
```

## Props の受け渡し

シェルは登録時またはに動的にマイクロアプリに props を渡すことができます：

```ts
// シェル
orchestrator.register('profile', {
  entry: '/profile.js',
  props: {
    userId: getCurrentUserId(),
    theme: 'dark',
  },
});
```

```ts
// マイクロアプリは mount() で props を受け取る
export const app: MicroApp = {
  async mount(container, props) {
    const { userId, theme } = props as { userId: string; theme: string };
    // props でレンダリング
  },
};
```

## プロダクション用ビルド

各マイクロアプリはスタンドアロンの JavaScript バンドルにビルドされます。任意のバンドラーを使用できます：

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'MyApp',
      formats: ['es'],
    },
    rollupOptions: {
      // 重複を避けるためフレームワークを外部化
      external: ['react', 'react-dom'],
    },
  },
});
```

### Webpack

```js
// webpack.config.js
module.exports = {
  entry: './src/main.ts',
  output: {
    library: { type: 'module' },
    filename: 'main.js',
  },
  experiments: { outputModule: true },
};
```
