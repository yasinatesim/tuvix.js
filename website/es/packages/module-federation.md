---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Webpack 5 Module Federation integration. Load remote Tuvix.js micro apps using federated modules."
  icon="🌐"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/module-federation
```

## Configuración

### App Remota (lado micro app)

Configure the remote micro app to expose itself as a federated module:

```js
// webpack.config.js (remote)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboardApp',
      filename: 'remoteEntry.js',
      exposes: {
        './app': './src/main.ts',
      },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
  ],
};
```

### Shell (lado host)

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator({ container: '#app' });

// Use the federation loader instead of a direct URL
const loader = createFederatedLoader();

orchestrator.register('dashboard', {
  entry: loader.remote({
    url: 'https://dashboard.example.com/remoteEntry.js',
    scope: 'dashboardApp',
    module: './app',
  }),
});

orchestrator.start();
```

## Dependencias Compartidas

Configure sharing to avoid loading multiple copies of the same library:

```ts
const loader = createFederatedLoader({
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
    '@tuvix.js/event-bus': { singleton: true },
  },
});
```
