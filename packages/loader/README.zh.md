# @tuvix.js/loader

> Dynamic module loader for Tuvix.js micro apps

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/loader
```

## Quick Start

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();

const app = await loader.load({
  name: 'my-app',
  entry: '/apps/my-app.js',
});

await app.module.mount({ container: document.getElementById('app')! });
```

## API

- **`createLoader(options?)`** — Create a new module loader instance
- **`ModuleLoader`** — Dynamic loader with caching, retry logic, and timeout support
- **`loadScript(url)`** — Load a JavaScript file
- **`loadStyle(url)`** — Load a CSS stylesheet
- **`prefetchResource(url, strategy?)`** — Prefetch resources for faster loading

## License

MIT
