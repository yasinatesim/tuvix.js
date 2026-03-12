---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Webpack 5 Module Federation entegrasyonu. Federe modülleri kullanarak uzak Tuvix.js mikro uygulamalarını yükleyin."
  icon="🌐"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/module-federation
```

## Kurulum

### Uzak Uygulama (mikro uygulama tarafı)

Uzak mikro uygulamayı federe modül olarak kendini açığa çıkaracak şekilde yapılandırın:

```js
// webpack.config.js (remote)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboardApp',
      filename: 'remoteEntry.js',
      exposes: { './app': './src/main.ts' },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
  ],
};
```

### Shell (host tarafı)

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createFederationLoader } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator({ container: '#app' });
const loader = createFederationLoader();

orchestrator.register('dashboard', {
  entry: loader.remote({
    url: 'https://dashboard.example.com/remoteEntry.js',
    scope: 'dashboardApp',
    module: './app',
  }),
});

orchestrator.start();
```

## Paylaşılan Bağımlılıklar

Aynı kütüphanenin birden fazla kopyasının yüklenmesini önlemek için paylaşımı yapılandırın.
