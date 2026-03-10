# Sandboxing

`@tuvix.js/sandbox` provides CSS and JavaScript isolation to prevent micro apps from interfering with each other or the shell.

## CSS Isolation (Shadow DOM)

When CSS sandboxing is enabled, the micro app's container is upgraded to a Shadow DOM host. Styles defined inside are scoped to that shadow root — they cannot leak out to the shell or other micro apps.

### Enable per app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### How it works

```
Shell DOM
├── #app (orchestrator container)
│   ├── Shadow Root (my-app)  ← styles scoped here
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
Shadow DOM CSS isolation is fully supported in all modern browsers. For legacy browser support, consider the `js` isolation mode only.
:::

## JS Isolation (Proxy Scope)

When JS sandboxing is enabled, the micro app's global scope is wrapped in a `Proxy`. Access to `window.*`, event listeners, intervals and timeouts are intercepted and automatically cleaned up on `unmount`.

### Enable per app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### What gets intercepted

| Access | Intercepted? | Cleaned up on unmount? |
|--------|-------------|------------------------|
| `window.someGlobal = x` | ✅ | ✅ |
| `addEventListener(...)` | ✅ | ✅ |
| `setTimeout(...)` | ✅ | ✅ |
| `setInterval(...)` | ✅ | ✅ |
| `localStorage` | ✅ | Optional |
| `sessionStorage` | ✅ | Optional |

## Using Both Together

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,   // Shadow DOM isolation
    js: true,    // Proxy scope isolation
  },
});
```

## Custom Sandbox

You can also use `@tuvix.js/sandbox` directly:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// Create an isolated container for an element
const { container, cleanup } = sandbox.mount(rootElement);

// Later, tear it down
cleanup();
```
