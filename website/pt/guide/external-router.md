# Roteador externo

Quando o TanStack Router, o React Router ou outro roteador já controla a navegação no seu shell, deixe que ele continue com essa tarefa. `orchestrator.connectRouter()` faz o orquestrador seguir esse roteador, e `interceptLinks()` envia para ele os cliques em `<a href>` simples vindos dos micro apps.

## Quando usar

- Seu shell é um app React com roteador próprio, e algumas rotas hospedam micro apps.
- Seus micro apps renderizam links simples (templates Vue, Svelte, Angular ou HTML) que devem navegar sem recarregar a página.

Se o shell não tem roteador próprio, use o embutido; veja [Roteamento](/pt/guide/routing).

## connectRouter

```ts
import { createOrchestrator, type RouterSource } from 'tuvix.js';

const source: RouterSource = {
  // Call `callback` after every navigation; return an unsubscribe function.
  subscribe(callback) {
    window.addEventListener('popstate', callback);
    return () => window.removeEventListener('popstate', callback);
  },
  // The path activeWhen patterns are matched against.
  getPath: () => window.location.pathname,
};

const orchestrator = createOrchestrator(); // no `router` option
const disconnect = orchestrator.connectRouter(source);
await orchestrator.start();

// later
disconnect();
```

- `start()` faz a reconciliação com base em `getPath()`. Depois disso, cada callback de `subscribe` enfileira uma reconciliação para o novo `getPath()`.
- Conectar um orquestrador que já foi iniciado faz a reconciliação imediatamente.
- As reconciliações rodam uma de cada vez e só o caminho enfileirado mais recente roda em seguida, então uma rajada de eventos do roteador custa uma reconciliação por caminho estabilizado.
- `destroy()` desconecta todos os roteadores conectados.

## TanStack Router

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // your createRouter({ routeTree }) instance

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'blog',
  entry: () => import('./micro-apps/blog'),
  container: '#micro-app',
  activeWhen: '/blog/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

// Plain <a href> inside micro apps → TanStack history.
interceptLinks({ navigate: (path) => router.history.push(path) });

await orchestrator.start();
```

`onResolved` dispara assim que o roteador resolve a nova localização. Use-o em vez de `onLoad` com um `setTimeout`.

## React Router

Com um data router criado por `createBrowserRouter`:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // createBrowserRouter(routes)

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'account',
  entry: () => import('./micro-apps/account'),
  container: '#micro-app',
  activeWhen: '/account/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe(() => callback()),
  getPath: () => router.state.location.pathname,
});

interceptLinks({ navigate: (path) => router.navigate(path) });

await orchestrator.start();
```

Com `<BrowserRouter>` não existe um objeto de roteador para assinar. Faça a ponte a partir de um componente que lê `useLocation()`:

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Orchestrator, RouterSource } from 'tuvix.js';

export function TuvixBridge({ orchestrator }: { orchestrator: Orchestrator }) {
  const location = useLocation();
  const listeners = useRef(new Set<() => void>());
  const path = useRef<string>(location.pathname);
  path.current = location.pathname;

  useEffect(() => {
    const source: RouterSource = {
      subscribe(callback) {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
      },
      getPath: () => path.current,
    };
    return orchestrator.connectRouter(source);
  }, [orchestrator]);

  useEffect(() => {
    for (const callback of listeners.current) callback();
  }, [location.pathname]);

  return null;
}
```

## Links simples dentro de micro apps

Os componentes `<Link>` do seu roteador já navegam no cliente. Os links que os micro apps renderizam como `<a href>` simples não fazem isso; sem `interceptLinks`, eles recarregam a página. `interceptLinks` ignora cliques com teclas modificadoras, outras origens, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` e links só com hash no caminho atual, e chama o seu `navigate` para o restante. Adicione `prefetch` para preparar a próxima rota no hover ou no focus. Com o TanStack Router:

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

Chame `stop()` quando o shell for desmontado.

## Caminhos base

Com um basename de roteador como `/app`:

- Os padrões de `activeWhen` correspondem exatamente à string que `getPath()` retorna. Se o seu roteador informa caminhos com `/app`, escreva `'/app/blog/*'`, ou remova a base em `getPath`.
- `interceptLinks({ base: '/app', ... })` ignora links fora de `/app` e remove `/app` antes de chamar `navigate`. Use isso quando o `navigate` do seu roteador espera caminhos relativos ao basename (o `router.navigate` do React Router). Deixe `base` de fora quando `navigate` recebe o caminho completo da URL (o `router.history.push` do TanStack).

## Containers renderizados por rotas

O orquestrador procura o `container` no momento da montagem. Se um componente de rota renderiza o elemento container, ele pode ainda não estar no DOM quando o callback do roteador dispara, e a montagem falha com `Container "#micro-app" not found in DOM`. Há duas saídas:

- Mantenha o container em um layout compartilhado por todas as rotas de micro apps, para que ele exista antes da navegação.
- Renderize o micro app a partir do próprio componente de rota com `TuvixIsland` (`@tuvix.js/react`) e não use o orquestrador para esse app.

## O que o connectRouter não faz

- Ele não navega. A navegação continua com o seu roteador.
- Ele não lê params de rota. Passe-os como props com `updateAppProps`, ou leia-os dentro do app.
- Ele não trata cliques em links. Chame `interceptLinks` para isso.
