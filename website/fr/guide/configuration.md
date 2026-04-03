# Configuration

## Options de l'Orchestrator

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * Sélecteur ou élément du conteneur racine.
   * Les micro apps sont montées à l'intérieur de cet élément.
   * @default '#app'
   */
  container: '#app',

  /**
   * Appelé avant le montage de toute micro app.
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Appelé après le montage d'une micro app.
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Appelé quand une micro app lance une erreur pendant mount/unmount.
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## Enregistrer des Micro Apps

```ts
orchestrator.register('my-app', {
  /**
   * URL du bundle JavaScript de la micro app.
   * Peut être une chaîne ou une fonction lazy qui retourne une chaîne.
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * Optionnel : props supplémentaires à passer à la micro app au montage.
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * Options de sandbox pour l'isolation CSS et JS.
   */
  sandbox: {
    css: true,   // Isolation des styles avec Shadow DOM
    js: false,   // Isolation du scope avec JS Proxy
  },

  /**
   * Remplace le sélecteur de conteneur pour cette app spécifique.
   * Par défaut, utilise le conteneur de l'orchestrator.
   */
  container: '#dashboard-container',
});
```

## Options du Router

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history' utilise l'API History (par défaut).
   * 'hash' utilise les hashes d'URL (#/chemin).
   */
  mode: 'history',

  /**
   * Définitions des routes.
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * Fonction guard - retourne false pour bloquer la navigation.
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## Options de Sandbox

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * Activer l'isolation CSS avec Shadow DOM.
   */
  css: true,

  /**
   * Activer l'isolation du scope avec JS Proxy.
   * Intercepte et nettoie l'accès à window au démontage.
   */
  js: true,
});
```

## Variables d'Environnement

Tuvix.js ne nécessite aucune variable d'environnement. Toute la configuration se fait dans le code.

Pour la production, utilisez le plugin define/replace de votre bundler pour injecter des valeurs à l'exécution :

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
