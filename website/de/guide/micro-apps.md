# Micro Apps

Eine **Micro App** ist eine unabhängig gebaute und deploybare Frontend-Anwendung, die sich über eine standardisierte Lifecycle-Schnittstelle in die Tuvix.js Shell integriert.

## Das MicroApp Interface

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Ihr Micro-App-Bundle muss ein Objekt exportieren, das dieses Interface erfüllt.

## Vanilla JS Beispiel

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

## Props Übergeben

Die Shell kann Props bei der Registrierung oder dynamisch an Micro Apps übergeben:

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
// Micro App empfängt Props in mount()
export const app: MicroApp = {
  async mount(container, props) {
    const { userId, theme } = props as { userId: string; theme: string };
    // mit Props rendern
  },
};
```

## Für Produktion Bauen

Jede Micro App wird zu einem eigenständigen JavaScript-Bundle gebaut. Verwenden Sie einen beliebigen Bundler:

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
      // Framework externalisieren um Duplizierung zu vermeiden
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
