# @tuvix.js/vue

> Vue 3 bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/vue vue
```

## Quick Start

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export const app = createVueMicroApp({
  name: 'my-vue-app',
  component: App,
});
```

## API

- **`createVueMicroApp(config)`** — Wrap a Vue 3 component as a Tuvix micro app
- **`useTuvixBus(event, handler)`** — Composable for event bus with auto-cleanup on unmount
- **`useTuvixProps()`** — Composable for reactive orchestrator props (ShallowRef)

## License

MIT
