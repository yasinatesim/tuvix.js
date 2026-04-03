# Configuração

## Opções do Orchestrator

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * Seletor ou elemento do contêiner raiz.
   * Micro apps são montadas dentro deste elemento.
   * @default '#app'
   */
  container: '#app',

  /**
   * Chamado antes de qualquer micro app ser montada.
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Chamado após uma micro app ter sido montada.
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Chamado quando uma micro app lança um erro durante mount/unmount.
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## Registrando Micro Apps

```ts
orchestrator.register('my-app', {
  /**
   * URL do bundle JavaScript da micro app.
   * Pode ser uma string ou uma função lazy que retorna uma string.
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * Opcional: props adicionais para passar à micro app na montagem.
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * Opções de sandbox para isolamento CSS e JS.
   */
  sandbox: {
    css: true,   // Isolamento de estilos com Shadow DOM
    js: false,   // Isolamento de escopo com JS Proxy
  },

  /**
   * Sobrescreve o seletor de contêiner para esta app específica.
   * Usa como padrão o contêiner do orchestrator.
   */
  container: '#dashboard-container',
});
```

## Opções do Router

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history' usa a API History (padrão).
   * 'hash' usa hashes na URL (#/caminho).
   */
  mode: 'history',

  /**
   * Definições de rotas.
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * Função guard - retorna false para bloquear a navegação.
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## Opções de Sandbox

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * Habilitar isolamento CSS com Shadow DOM.
   */
  css: true,

  /**
   * Habilitar isolamento de escopo com JS Proxy.
   * Intercepta e limpa o acesso ao window na desmontagem.
   */
  js: true,
});
```

## Variáveis de Ambiente

Tuvix.js não requer variáveis de ambiente. Toda a configuração é feita em código.

Para produção, use o plugin define/replace do seu bundler para injetar valores em tempo de execução:

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
