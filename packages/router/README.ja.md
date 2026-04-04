# @tuvix.js/router

> URL routing for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/router
```

## Quick Start

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'history' });

router.addRoute({
  path: '/dashboard',
  name: 'dashboard',
});

router.onChange((event) => {
  console.log('Route changed:', event.path);
});

router.start();
```

## API

- **`createRouter(config?)`** — Create a new router instance
- **`Router`** — URL routing with history/hash modes, dynamic segments, route guards
- **`pathToRegex(path)`** — Convert a path pattern to a RegExp
- **`matchRoute(path, routes)`** — Match a path against route configs
- **`parseQuery(queryString)`** — Parse URL query parameters
- **`normalizePath(path)`** — Normalize a URL path

## License

MIT
