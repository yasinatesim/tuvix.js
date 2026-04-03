# Micro App

Una **micro app** è un'applicazione frontend costruita e distribuita indipendentemente che si integra con la shell di Tuvix.js tramite un'interfaccia di ciclo di vita standard.

## L'Interfaccia MicroApp

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Il bundle della tua micro app deve esportare un oggetto che soddisfa questa interfaccia.

## Esempio Vanilla JS

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

## Passaggio di Props

La shell può passare props alle micro app al momento della registrazione o dinamicamente:

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
// La micro app riceve le props in mount()
export const app: MicroApp = {
  async mount(container, props) {
    const { userId, theme } = props as { userId: string; theme: string };
    // renderizzare con le props
  },
};
```

## Build per la Produzione

Ogni micro app viene compilata in un bundle JavaScript autonomo. Usa qualsiasi bundler:

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
      // Esternalizzare il framework per evitare duplicazione
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
