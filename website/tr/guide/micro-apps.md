# Mikro Uygulamalar

Bir **mikro uygulama**, standart bir yaşam döngüsü arayüzü aracılığıyla Tuvix.js shell'i ile entegre olan, bağımsız olarak oluşturulan ve dağıtılan bir frontend uygulamasıdır.

## MicroApp Arayüzü

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Mikro uygulama paketiniz bu arayüzü karşılayan bir nesne dışa aktarmalıdır.

## Vanilla JS Örneği

```ts
// my-app/main.ts
import type { MicroApp } from '@tuvix.js/core';

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

## Props Geçirme

Shell, kayıt sırasında veya dinamik olarak mikro uygulamalara props geçirebilir:

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
// Mikro uygulama mount() içinde props alır
export const app: MicroApp = {
  async mount(container, props) {
    const { userId, theme } = props as { userId: string; theme: string };
    // props ile render et
  },
};
```

## Üretim İçin Derleme

Her mikro uygulama bağımsız bir JavaScript paketine derlenir. Herhangi bir paketleyici kullanın:

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
      // Çoğaltmayı önlemek için framework'ü dışsallaştır
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
