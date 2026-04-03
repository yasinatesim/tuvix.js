# माइक्रो ऐप्स

एक **माइक्रो ऐप** एक स्वतंत्र रूप से निर्मित और तैनात फ्रंटएंड एप्लिकेशन है जो मानक लाइफसाइकल इंटरफ़ेस के माध्यम से Tuvix.js शेल के साथ एकीकृत होता है।

## MicroApp इंटरफ़ेस

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

आपके माइक्रो ऐप बंडल को एक ऑब्जेक्ट एक्सपोर्ट करना होगा जो इस इंटरफ़ेस को पूरा करता है।

## Vanilla JS उदाहरण

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

## Props पास करना

शेल पंजीकरण समय पर या गतिशील रूप से माइक्रो ऐप्स को props पास कर सकता है:

```ts
// शेल
orchestrator.register('profile', {
  entry: '/profile.js',
  props: {
    userId: getCurrentUserId(),
    theme: 'dark',
  },
});
```

```ts
// माइक्रो ऐप mount() में props प्राप्त करता है
export const app: MicroApp = {
  async mount(container, props) {
    const { userId, theme } = props as { userId: string; theme: string };
    // props के साथ रेंडर करें
  },
};
```

## प्रोडक्शन के लिए बिल्ड

प्रत्येक माइक्रो ऐप को एक स्टैंडअलोन JavaScript बंडल में बनाया जाता है। कोई भी बंडलर उपयोग करें:

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
      // दोहराव से बचने के लिए फ्रेमवर्क को एक्सटर्नलाइज़ करें
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
