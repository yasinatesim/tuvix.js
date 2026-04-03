# Configurazione

## Opzioni dell'Orchestrator

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * Selettore o elemento del contenitore radice.
   * Le micro app vengono montate all'interno di questo elemento.
   * @default '#app'
   */
  container: '#app',

  /**
   * Chiamato prima del montaggio di qualsiasi micro app.
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Chiamato dopo che una micro app è stata montata.
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Chiamato quando una micro app genera un errore durante mount/unmount.
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## Registrare Micro App

```ts
orchestrator.register('my-app', {
  /**
   * URL del bundle JavaScript della micro app.
   * Può essere una stringa o una funzione lazy che restituisce una stringa.
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * Opzionale: props aggiuntive da passare alla micro app al montaggio.
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * Opzioni sandbox per l'isolamento CSS e JS.
   */
  sandbox: {
    css: true,   // Isolamento stili con Shadow DOM
    js: false,   // Isolamento scope con JS Proxy
  },

  /**
   * Sovrascrive il selettore del contenitore per questa specifica app.
   * Ricade sul contenitore dell'orchestrator.
   */
  container: '#dashboard-container',
});
```

## Opzioni del Router

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history' usa l'API History (predefinito).
   * 'hash' usa gli hash URL (#/percorso).
   */
  mode: 'history',

  /**
   * Definizioni delle route.
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * Funzione guard - restituisce false per bloccare la navigazione.
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## Opzioni Sandbox

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * Abilita l'isolamento CSS con Shadow DOM.
   */
  css: true,

  /**
   * Abilita l'isolamento scope con JS Proxy.
   * Intercetta e pulisce l'accesso a window allo smontaggio.
   */
  js: true,
});
```

## Variabili d'Ambiente

Tuvix.js non richiede variabili d'ambiente. Tutta la configurazione avviene nel codice.

Per la produzione, usa il plugin define/replace del tuo bundler per iniettare valori a runtime:

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
