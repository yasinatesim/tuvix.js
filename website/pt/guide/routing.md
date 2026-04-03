# Roteamento

`@tuvix.js/router` fornece ativação de micro apps baseada em URL. Quando uma URL corresponde a uma rota, a micro app correspondente é montada. Quando a URL muda, a app é desmontada.

## Configuração

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // ou 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## Correspondência de Rotas

As rotas são comparadas em ordem. A primeira correspondência vence.

| Padrão | Corresponde a | Parâmetros |
|--------|--------------|------------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

Os parâmetros de rota são passados para a micro app como `props.params`:

```ts
// Na sua micro app
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // buscar usuário com id
}
```

## Guards de Navegação

Proteja rotas com funções guard:

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // Bloquear navegação
      }
      return true;
    },
  },
],
```

## Navegação Programática

```ts
// Navegar para um caminho
router.navigate('/dashboard');

// Navegar com parâmetros de consulta
router.navigate('/search?q=tuvix');

// Substituir entrada atual do histórico (sem botão voltar)
router.replace('/dashboard');

// Voltar / Avançar
router.go(-1);
```

## Modo Hash

Use o modo hash para ambientes sem reescrita de URL do lado do servidor (ex: hospedagem estática sem fallback SPA):

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URLs: /#/, /#/about
```

## Rota Ativa

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```
