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

const sandbox = createSandbox({ css: true, js: true });
const container = document.getElementById('app')!;

// Activate isolation — styles and globals are now scoped
const shadowRoot = sandbox.activate(container);

// ... app runs in isolation ...

// Deactivate when done
sandbox.deactivate(container);
```

## API

- **`createSandbox(options?)`** — Create a combined CSS + JS sandbox
- **`CssSandbox`** — CSS isolation via Shadow DOM (`wrap`, `addStyle`, `removeStyle`, `unwrap`)
- **`JsSandbox`** — JavaScript isolation via Proxy scope (`activate`, `deactivate`, `execScript`, `reset`)
- **`Sandbox`** — Combined sandbox: `activate(container)` → `deactivate(container)` → `destroy(container)`

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `css` | `boolean` | `true` | Enable CSS isolation via Shadow DOM |
| `js` | `boolean` | `true` | Enable JS isolation via Proxy |
| `allowedGlobals` | `string[]` | `[]` | Extra globals to pass through the JS sandbox |
| `strict` | `boolean` | `false` | Block all writes to the real `window` |

## License

MIT
