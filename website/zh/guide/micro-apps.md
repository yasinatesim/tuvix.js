# 微应用

**微应用**是一个独立构建和部署的前端应用程序，通过标准生命周期接口与 Tuvix.js shell 集成。

## MicroApp 接口

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

你的微应用包必须导出一个满足此接口的对象。

## Vanilla JS 示例

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

## 传递 Props

Shell 可以在注册时或动态地向微应用传递 props：

```ts
// Shell
orchestrator.register('profile', {
  entry: '/profile.js',
  props: {
    userId: getCurrentUserId(),
    theme: 'dark',
  },
});
```

```ts
// 微应用在 mount() 中接收 props
export const app: MicroApp = {
  async mount(container, props) {
    const { userId, theme } = props as { userId: string; theme: string };
    // 使用 props 渲染
  },
};
```

## 生产构建

每个微应用被构建为一个独立的 JavaScript 包。使用任何打包工具：

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
      // 外部化框架以避免重复
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
