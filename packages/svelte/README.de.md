# @tuvix.js/svelte

> Svelte 3/4/5 bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/svelte svelte
```

## Quick Start

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export const app = createSvelteMicroApp({
  name: 'my-svelte-app',
  component: App,
});
```

## API

- **`createSvelteMicroApp(config)`** — Wrap a Svelte component as a Tuvix micro app with reactive lifecycle integration

## License

MIT
