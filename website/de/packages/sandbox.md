---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="CSS isolation via Shadow DOM and JS isolation via Proxy scope. Prevent style leakage and global scope pollution between micro apps."
  icon="🔒"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/sandbox
```

## Usage via Orchestrator

The simplest way to use sandboxing is through the orchestrator:

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,  // Shadow DOM
    js: true,   // Proxy scope
  },
});
```

## Direkte Verwendung

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

const { container, cleanup } = sandbox.mount(document.getElementById('root')!);

// Render your app into `container`
myApp.mount(container);

// On teardown
cleanup();
```

## API

### `createSandbox(options)`

```ts
interface SandboxOptions {
  css?: boolean;  // Enable Shadow DOM isolation
  js?: boolean;   // Enable Proxy scope isolation
}
```

### `sandbox.mount(element) → { container, cleanup }`

Create an isolated scope for the given element. Returns the container to render into and a `cleanup` function.

### CSS Isolation Details

When `css: true`:

- The target element becomes a Shadow DOM host
- All styles inside are scoped to the shadow root
- External global styles do not affect the micro app

### JS Isolation Details

When `js: true`, the following are intercepted and cleaned up on `cleanup()`:

- `window.*` property assignments
- `addEventListener` calls
- `setTimeout` / `setInterval` calls
- `document.createElement` style/script injection
