# @tuvix.js/module-federation

> Webpack 5 Module Federation integration for Tuvix.js

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/module-federation
```

## Quick Start

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const loader = createFederatedLoader({
  remotes: {
    app1: {
      url: 'http://localhost:3001/remoteEntry.js',
      scope: 'app1',
      module: './App',
    },
  },
});

const app = await loader.loadModule('app1');
```

## API

- **`createFederatedLoader(config)`** — Create a loader for Module Federation remotes
- **`federatedEntry(config)`** — Convenience function for creating federated entries
- **`loadRemoteContainer(url)`** — Load a remote container
- **`createFederatedApp(config)`** — Create a federated micro app

## Documentation

📖 [Full documentation](https://tuvix.js.org/packages/module-federation)

## License

MIT
