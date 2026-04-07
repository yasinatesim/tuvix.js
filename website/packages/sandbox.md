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

## Direct Usage

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

### `createSandbox(options)`

```ts
interface SandboxOptions {
  css?: boolean;            // Enable Shadow DOM isolation (default: true)
  js?: boolean;             // Enable Proxy scope isolation (default: true)
  allowedGlobals?: string[]; // Extra globals to pass through the JS sandbox
  strict?: boolean;          // Block all writes to the real window (default: false)
}
```

### `sandbox.activate(element) → ShadowRoot`

Activates all isolation layers for a container. Returns the Shadow DOM root (if CSS isolation is enabled).

### `sandbox.deactivate(element)`

Deactivates all isolation layers and restores the container.

### `sandbox.destroy(element)`

Deactivates and fully resets the JS sandbox scope.

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
