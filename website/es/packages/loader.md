---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="Dynamic module loader with caching, retry logic and error boundary support. Fetches and evaluates micro app bundles on demand."
  icon="📦"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/loader
```

## Inicio Rápido

```ts
import { loadMicroApp } from '@tuvix.js/loader';

const app = await loadMicroApp('https://cdn.example.com/dashboard.js');
await app.mount(container, props);
```

## API

### `loadMicroApp(entry, options?)`

Load a micro app bundle by URL. Returns the exported `MicroApp` object.

```ts
interface LoadOptions {
  timeout?: number;         // ms, default: 30000
  retries?: number;         // default: 2
  retryDelay?: number;      // ms between retries, default: 1000
  cache?: boolean;          // default: true
}

const app = await loadMicroApp('/my-app.js', {
  timeout: 10000,
  retries: 3,
});
```

### `createLoader(options?)`

Create a custom loader instance with shared configuration:

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({
  timeout: 15000,
  retries: 3,
  cache: true,
  onLoadStart: (url) => console.log('Loading:', url),
  onLoadEnd: (url) => console.log('Loaded:', url),
  onError: (url, error) => console.error('Failed:', url, error),
});

const app = await loader.load('https://cdn.example.com/my-app.js');
```

### `loader.clear(url?)`

Clear the loader cache. Omit `url` to clear all cached entries.

```ts
loader.clear(); // clear all
loader.clear('https://cdn.example.com/my-app.js'); // clear one
```

## Manejo de Errores

```ts
try {
  const app = await loadMicroApp('/my-app.js', { retries: 2 });
  await app.mount(container);
} catch (error) {
  if (error.code === 'LOAD_TIMEOUT') {
    // Show timeout message
  } else if (error.code === 'LOAD_FAILED') {
    // Show load failure message
  }
}
```
