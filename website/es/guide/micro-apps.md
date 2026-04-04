# Micro Apps

Una **micro app** es una aplicación frontend construida y desplegada de forma independiente que se integra con el shell de Tuvix.js a través de una interfaz de ciclo de vida estándar.

## La Interfaz MicroApp

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

El bundle de tu micro app debe exportar un objeto que satisfaga esta interfaz.

## Ejemplo con Vanilla JS

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

## Pasando Props

El shell puede pasar props a las micro apps en el momento del registro o dinámicamente:

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
// La micro app recibe props en mount()
export const app: MicroApp = {
  async mount(container, props) {
    const { userId, theme } = props as { userId: string; theme: string };
    // renderizar con props
  },
};
```

## Compilando para Producción

Cada micro app se compila a un bundle JavaScript independiente. Usa cualquier bundler:

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
      // Externalizar framework para evitar duplicación
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
