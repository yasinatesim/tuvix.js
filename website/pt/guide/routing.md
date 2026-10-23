# Roteamento

O Tuvix.js decide quais apps montar a partir do caminho atual. Você descreve isso com `activeWhen` em cada app, com `routes` no roteador embutido, ou com os dois. Um único matcher, `matchPath` de `@tuvix.js/router`, interpreta todos os padrões, então `activeWhen`, o roteador e `@tuvix.js/server` concordam sobre o que `/users/:id` significa.

## Regras de padrão

Strings de `activeWhen` usam correspondência por prefixo:

| Padrão | Corresponde a | Não corresponde a | Params |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`, `/dashboard/`, `/dashboard/stats` | `/dashboards` | nenhum |
| `/dashboard/*` | os mesmos caminhos de `/dashboard` | `/dashboards` | nenhum |
| `/users/:id` | `/users/42`, `/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | todo caminho | nenhum | nenhum |

- O matcher descarta `?query` e `#hash` antes de comparar, então `/dashboard?tab=1` ainda corresponde a `/dashboard`.
- Ele decodifica os params: `/users/J%C3%BCrgen` resulta em `{ id: 'Jürgen' }`.
- Caracteres como `.` e `(` correspondem literalmente.
- Um `*` no meio de um padrão corresponde a um segmento.

Teste um padrão você mesmo:

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## Ative apps com activeWhen

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  activeWhen: '/users/:id',
});

orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header'),
  container: '#header',
  activeWhen: '/', // every page
});

await orchestrator.start();
```

Uma função recebe o caminho e retorna um booleano. Use-a para correspondências exatas, vários prefixos ou feature flags.

## O roteador embutido

Passe `router` para `createOrchestrator` e o orquestrador faz a reconciliação após cada navegação feita pelo roteador:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/settings', app: 'settings' },
      { path: '/billing/*', app: 'billing' },
    ],
  },
});

orchestrator.register({ name: 'settings', entry: () => import('./apps/settings'), container: '#app' });
orchestrator.register({ name: 'billing', entry: () => import('./apps/billing'), container: '#app' });

await orchestrator.start();
await orchestrator.navigateTo('/billing/invoices');
```

Um app sem `activeWhen` segue as rotas que o nomeiam. Duas diferenças em relação a `activeWhen`:

- Caminhos de rota correspondem por inteiro. `/settings` corresponde a `/settings` e `/settings/`, mas não a `/settings/profile`. Adicione `/*` para subcaminhos.
- Uma rota com caminho `/` ativa seu app apenas em `/`. Use `/*` para uma rota que corresponda a todo caminho.

Quando um app tem `activeWhen`, o orquestrador usa esse valor e ignora `routes`.

O roteador escuta `popstate` (modo history) ou `hashchange` (modo hash). Ele não intercepta cliques em links; veja a próxima seção.

## Cliques em links

`interceptLinks` transforma cliques em `<a href>` da mesma origem em chamadas à sua função `navigate` e retorna uma função de limpeza:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// later, when the shell leaves the page
stop();
```

Ele deixa estes cliques para o navegador:

- uma tecla modificadora (Ctrl, Meta, Shift, Alt) ou um botão diferente do principal;
- `event.defaultPrevented` já `true`;
- `target` diferente de `_self`, um atributo `download`, `rel="external"` ou `data-tuvix-reload`;
- outra origem, ou um caminho fora de `base`;
- um link só com hash no caminho atual, para que o navegador faça a rolagem.

`prefetch(path)` roda no pointerenter ou no focus, uma vez por caminho. `shouldIntercept(anchor, url, event)` adiciona seu próprio filtro; retorne `false` para deixar o navegador tratar o clique. `root` limita a escuta a um elemento.

## Navegação e guards

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/users/:id', app: 'user' }] });

const offGuard = router.beforeEach(async ({ to }) => {
  if (!to.startsWith('/admin')) return true;
  const response = await fetch('/api/me');
  return response.ok;
});

const offChange = router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} → ${to}`, toRoute?.params);
});

await router.push('/users/42'); // pushState
await router.replace('/users/43'); // replaceState
router.back();

router.currentPath; // '/users/43'
router.currentRoute?.params; // { id: '43' }
router.currentRoute?.query; // parsed ?query
router.match('/users/7'); // MatchedRoute | null, no navigation
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- Os guards rodam em ordem antes de `push`, `replace` e voltar/avançar. `false` cancela. Um guard que lança um erro cancela a navegação e registra o erro.
- Uma navegação de voltar/avançar cancelada restaura a URL anterior com `replaceState`.
- `push` para o caminho atual não faz nada.
- `router.match` retorna a primeira rota que corresponde; `getActiveApps` retorna todos os apps cuja rota corresponde.

## Caminho base

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL becomes /app/reports
```

Com `base: '/app'`:

- o roteador remove `/app` antes de comparar, então as rotas e os padrões de `activeWhen` não o incluem;
- `push('/x')` e `replace('/x')` escrevem `/app/x`;
- `/application` continua `/application`: a base só é removida em um limite de segmento;
- `interceptLinks` precisa da mesma `base`, senão ele passa `/app/x` para `navigateTo`, que escreve `/app/app/x`.

## Modo hash

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

Use-o em hosts estáticos que não conseguem reescrever todo caminho para `index.html`. O roteador ignora `base` no modo hash.

## Leia params em um app

O contexto de montagem não tem params. Leia-os a partir do caminho, ou envie-os como props:

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { routes: [{ path: '/users/:id', app: 'user' }] },
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  props: { id: matchPath('/users/:id', location.pathname).params.id },
});

orchestrator.getRouter()?.onChange(({ toRoute }) => {
  if (toRoute?.route.app === 'user') {
    void orchestrator.updateAppProps('user', { id: toRoute.params.id });
  }
});

await orchestrator.start();
```

## Roteadores externos

Se o TanStack Router, o React Router ou outro roteador controla a navegação, omita `config.router` e chame `orchestrator.connectRouter({ subscribe, getPath })`. Veja [Roteador externo](/pt/guide/external-router).

## O que o roteamento não faz

- Ele não renderiza componentes de rota. Os apps se renderizam nos próprios containers.
- Ele não carrega dados. Use um guard, `onChange` ou o próprio `mount` do app.
- O roteador não trata cliques em links, a menos que você chame `interceptLinks`.
