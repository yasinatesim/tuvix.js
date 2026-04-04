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

## Installation

```bash
npm install @tuvix.js/loader
```

## Quick Start

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
const module = await loader.load('https://cdn.example.com/dashboard.js');
await module.app.mount(container, props);
```

## API

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

## Error Handling

```ts
import { createLoader } from '@tuvix.js/loader';
const loader = createLoader({ retries: 2 });

try {
  const result = await loader.load('/my-app.js');
  await result.app.mount(container);
} catch (error) {
  if (error.code === 'LOAD_TIMEOUT') {
    // Show timeout message
  } else if (error.code === 'LOAD_FAILED') {
    // Show load failure message
  }
}
```
