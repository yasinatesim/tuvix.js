---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Core Orchestrator"
  description="The heart of Tuvix.js. Registers micro apps, manages their lifecycle (mount, unmount, update), and coordinates routing and sandboxing."
  icon="⚙️"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/core
```

## Inicio Rápido

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ container: '#app' });

orchestrator.register('home', {
  entry: 'https://cdn.example.com/home.js',
});

orchestrator.register('dashboard', {
  entry: 'https://cdn.example.com/dashboard.js',
  props: { apiUrl: 'https://api.example.com' },
  sandbox: { css: true },
});

orchestrator.start();
```

## API

### `createOrchestrator(options)`

Creates the main orchestrator instance.

```ts
interface OrchestratorConfig {
  container: string | HTMLElement;
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;
  onError?: (error: Error, app: RegisteredApp) => void;
}
```

### `orchestrator.register(name, options)`

Register a micro app.

```ts
interface AppOptions {
  entry: string | (() => Promise<string>);
  props?: Record<string, unknown>;
  container?: string | HTMLElement;
  sandbox?: { css?: boolean; js?: boolean };
}
```

### `orchestrator.mount(name, props?)`

Manually mount a micro app.

```ts
await orchestrator.mount('dashboard', { userId: '42' });
```

### `orchestrator.unmount(name)`

Manually unmount a micro app.

```ts
await orchestrator.unmount('dashboard');
```

### `orchestrator.update(name, props)`

Update props of a mounted micro app.

```ts
await orchestrator.update('dashboard', { userId: '99' });
```

### `orchestrator.start()`

Start the orchestrator. Integrates with the router if one is registered.

### `orchestrator.stop()`

Stop the orchestrator. Unmounts all active micro apps and cleans up.

## La Interfaz MicroApp

Your micro app bundle must export an object implementing this interface:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

## Ejemplo: Límites de Error

```ts
const orchestrator = createOrchestrator({
  container: '#app',

  onError(error, app) {
    console.error(`[${app.name}] crashed:`, error);

    // Render a fallback
    const container = document.querySelector(app.container as string);
    if (container) {
      container.innerHTML = `
        <div class="error-boundary">
          <p>Failed to load. <button onclick="location.reload()">Reload</button></p>
        </div>
      `;
    }
  },
});
```

## TypeScript

```ts
import type { MicroAppDefinition, RegisteredApp, OrchestratorConfig } from '@tuvix.js/core';
```
