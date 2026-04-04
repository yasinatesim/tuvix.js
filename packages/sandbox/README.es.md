# @tuvix.js/sandbox

> CSS and JavaScript isolation for Tuvix.js micro apps

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/sandbox
```

## Quick Start

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  css: { mode: 'shadow' },
  js: { enabled: true },
});

const container = document.getElementById('app')!;
sandbox.attach(container);
```

## API

- **`createSandbox(options?)`** — Create a combined CSS + JS sandbox
- **`CssSandbox`** — CSS isolation via Shadow DOM
- **`JsSandbox`** — JavaScript isolation via Proxy scope
- **`Sandbox`** — Combined sandbox managing both CSS and JS isolation

## License

MIT
