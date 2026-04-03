# Konfiguration

## Orchestrator-Optionen

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * Selektor oder Element des Root-Containers.
   * Micro Apps werden innerhalb dieses Elements gemountet.
   * @default '#app'
   */
  container: '#app',

  /**
   * Wird aufgerufen, bevor eine Micro App gemountet wird.
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Wird aufgerufen, nachdem eine Micro App gemountet wurde.
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Wird aufgerufen, wenn eine Micro App während mount/unmount einen Fehler wirft.
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## Micro Apps Registrieren

```ts
orchestrator.register('my-app', {
  /**
   * URL des JavaScript-Bundles der Micro App.
   * Kann ein String oder eine Lazy-Funktion sein, die einen String zurückgibt.
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * Optional: zusätzliche Props, die beim Mounten an die Micro App übergeben werden.
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * Sandbox-Optionen für CSS- und JS-Isolation.
   */
  sandbox: {
    css: true,   // Shadow DOM Style-Isolation
    js: false,   // JS Proxy Scope-Isolation
  },

  /**
   * Überschreibt den Container-Selektor für diese spezifische App.
   * Fällt auf den Orchestrator-Container zurück.
   */
  container: '#dashboard-container',
});
```

## Router-Optionen

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history' verwendet die History API (Standard).
   * 'hash' verwendet URL-Hashes (#/pfad).
   */
  mode: 'history',

  /**
   * Route-Definitionen.
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * Guard-Funktion - gibt false zurück, um die Navigation zu blockieren.
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## Sandbox-Optionen

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * Shadow DOM CSS-Isolation aktivieren.
   */
  css: true,

  /**
   * JS Proxy Scope-Isolation aktivieren.
   * Fängt Window-Zugriffe ab und bereinigt sie beim Unmount.
   */
  js: true,
});
```

## Umgebungsvariablen

Tuvix.js benötigt keine Umgebungsvariablen. Die gesamte Konfiguration erfolgt im Code.

Für die Produktion verwenden Sie das Define/Replace-Plugin Ihres Bundlers, um Laufzeitwerte einzufügen:

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
