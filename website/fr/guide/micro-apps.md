# Micro Apps

Une **micro app** est une application frontend construite et déployée de manière indépendante qui s'intègre au shell Tuvix.js via une interface de cycle de vie standard.

## L'Interface MicroApp

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Le bundle de votre micro app doit exporter un objet qui satisfait cette interface.

## Exemple Vanilla JS

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

## Passer des Props

Le shell peut passer des props aux micro apps au moment de l'enregistrement ou dynamiquement :

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
// La micro app reçoit les props dans mount()
export const app: MicroApp = {
  async mount(container, props) {
    const { userId, theme } = props as { userId: string; theme: string };
    // rendre avec les props
  },
};
```

## Compiler pour la Production

Chaque micro app est compilée en un bundle JavaScript autonome. Utilisez n'importe quel bundler :

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
      // Externaliser le framework pour éviter la duplication
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
