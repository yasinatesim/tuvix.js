# Configuración

## Opciones del Orchestrator

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * Selector o elemento del contenedor raíz.
   * Las micro apps se montan dentro de este elemento.
   * @default '#app'
   */
  container: '#app',

  /**
   * Se llama antes de montar cualquier micro app.
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Se llama después de que una micro app se ha montado.
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Se llama cuando una micro app lanza un error durante mount/unmount.
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## Registrando Micro Apps

```ts
orchestrator.register('my-app', {
  /**
   * URL del bundle JavaScript de la micro app.
   * Puede ser un string o una función lazy que retorna un string.
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * Opcional: props adicionales para pasar a la micro app al montar.
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * Opciones de sandbox para aislamiento CSS y JS.
   */
  sandbox: {
    css: true,   // Aislamiento de estilos con Shadow DOM
    js: false,   // Aislamiento de scope con JS Proxy
  },

  /**
   * Sobrescribe el selector de contenedor para esta app específica.
   * Por defecto usa el contenedor del orchestrator.
   */
  container: '#dashboard-container',
});
```

## Opciones del Router

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history' usa la API de History (por defecto).
   * 'hash' usa hashes en la URL (#/ruta).
   */
  mode: 'history',

  /**
   * Definiciones de rutas.
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * Función guard - retorna false para bloquear la navegación.
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## Opciones de Sandbox

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * Habilitar aislamiento CSS con Shadow DOM.
   */
  css: true,

  /**
   * Habilitar aislamiento de scope con JS Proxy.
   * Intercepta y limpia el acceso a window al desmontar.
   */
  js: true,
});
```

## Variables de Entorno

Tuvix.js no requiere variables de entorno. Toda la configuración se realiza en código.

Para producción, usa el plugin define/replace de tu bundler para inyectar valores en tiempo de ejecución:

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
