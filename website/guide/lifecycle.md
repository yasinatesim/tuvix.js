# Lifecycle Hooks

## Overview

Every micro app in Tuvix.js follows a predictable lifecycle. The orchestrator calls lifecycle hooks at the appropriate times.

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

Called when the micro app's route becomes active (or when it's manually activated).

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**Arguments:**
- `container` - The root DOM element to render into
- `props` - Optional key-value props from the shell

**Example:**
```ts
async mount(container, props) {
  // Set up your app
  const root = document.createElement('div');
  container.appendChild(root);

  // Render your framework into root
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

Called when navigating away from the micro app's route (or when it's manually deactivated).

```ts
async unmount(container: HTMLElement): Promise<void>
```

This is where you **clean up** - unsubscribe from events, destroy framework instances, remove DOM nodes.

**Example:**
```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
Always clean up in `unmount`. Memory leaks from not destroying framework instances are the most common bug in microfrontend applications.
:::

## update

Called when the shell passes new props to an already-mounted micro app. **Optional.**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

If not implemented, the orchestrator will call `unmount` → `mount` for prop updates.

**Example:**
```ts
async update(container, props) {
  // Efficiently update without full remount
  this._root?.render(<App {...props} />);
}
```

## Orchestrator-level Hooks

The shell can also listen to lifecycle events globally:

```ts
const orchestrator = createOrchestrator({
  container: '#app',

  onBeforeMount(app) {
    console.log(`Mounting: ${app.name}`);
  },

  onAfterMount(app) {
    console.log(`Mounted: ${app.name}`);
    analytics.track('micro_app_mounted', { app: app.name });
  },

  onError(error, app) {
    console.error(`Error in ${app.name}:`, error);
    // Show fallback UI
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```
