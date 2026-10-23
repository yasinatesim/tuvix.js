---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Roteador"
  description="Roteamento por history e hash para micro apps, um único matcher de caminhos compartilhado com o core e o servidor, e interceptação de links para navegação no lado do cliente."
  icon="🔀"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` depende deste pacote e reexporta `createRouter`, `matchPath` e `interceptLinks`, então você também pode importar esses três a partir do core.

## Quando usar

O roteador mapeia caminhos de URL para nomes de micro apps e avisa quando o caminho muda. Use-o quando o shell controla a navegação e decide qual micro app fica ativo para uma URL. O orquestrador cria um para você quando você passa `router` para `createOrchestrator`, então a maioria dos shells nunca o constrói manualmente.

`matchPath` é o único matcher de padrões do Tuvix.js. O core o usa para strings de `activeWhen` e o `@tuvix.js/server` o usa para as `routes` dos apps, então um padrão significa a mesma coisa nos três lugares. Você pode chamá-lo sozinho, sem roteador.

Se o seu shell já usa React Router, TanStack Router ou outro roteador de framework, mantenha-o. Conecte-o ao orquestrador com `orchestrator.connectRouter({ subscribe, getPath })` de `@tuvix.js/core` e dispense este roteador. Você ainda pode usar `matchPath` e `interceptLinks` junto com ele.

## Início rápido

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> now calls router.push('/users/42') instead of reloading.
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// On teardown:
stopLinks();
router.destroy();
```

O roteador anexa seu listener de `popstate` (modo history) ou `hashchange` (modo hash) no construtor. Não existe chamada `start()`.

Com o orquestrador, passe a mesma config como `router` e navegue pelo orquestrador:

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Um app sem `activeWhen` segue as `routes` que o nomeiam. `orchestrator.getRouter()` retorna a instância de `IRouter`.

## API

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

Retorna `new Router(config)` tipado como `IRouter`.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | obrigatório | Tabela de rotas. O roteador verifica as rotas na ordem do array e a primeira correspondência vence. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` lê `location.pathname + location.search` e grava com `pushState`. `hash` lê e grava `#/path`. |
| `base` | `string` | `'/'` | Prefixo de caminho sob o qual o app é servido, apenas no modo history. O roteador o remove ao ler a URL e o adiciona ao gravar. O modo hash o ignora. |

Cada `RouteConfig`:

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `path` | `string` | obrigatório | Padrão na sintaxe de `matchPath`, comparado com o caminho inteiro. `'/'` corresponde apenas à página inicial, `'/*'` corresponde a todo caminho, `'/blog/*'` corresponde a `/blog` e a tudo abaixo dele. |
| `app` | `string` | obrigatório | Nome do micro app a ativar. |
| `meta` | `Record<string, unknown>` | nenhum | Seus dados. O roteador os repassa em `MatchedRoute.route.meta`. |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

A classe por trás de `createRouter`. Ela implementa `IRouter`:

| Membro | Assinatura | Comportamento |
| --- | --- | --- |
| `currentPath` | `readonly string` | Caminho relativo ao app, sem `base`. No modo history, inclui a query string. |
| `currentRoute` | `readonly MatchedRoute \| null` | Resultado de `match(currentPath)`. |
| `push` | `(path: string) => Promise<void>` | Executa os guards, grava a URL com `history.pushState` (`base + path` no modo history, `#path` no modo hash) e então executa os handlers de `onChange`. |
| `replace` | `(path: string) => Promise<void>` | O mesmo que `push`, com `history.replaceState`. |
| `back` | `() => void` | Chama `window.history.back()`. |
| `forward` | `() => void` | Chama `window.history.forward()`. |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | Executa `handler` após cada navegação concluída. Retorna uma função de cancelamento da assinatura. |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | Adiciona um guard. Retorna uma função que o remove. |
| `match` | `(path: string) => MatchedRoute \| null` | Primeira rota que corresponde a `path`, ou `null`. |
| `getActiveApps` | `(path?: string) => string[]` | Nomes de app de todas as rotas que correspondem ao `path` inteiro (padrão: `currentPath`), na ordem das rotas, sem duplicatas. |
| `destroy` | `() => void` | Remove o listener de window e limpa handlers e guards. |

Passe para `push` e `replace` um caminho relativo a `base`. Com `base: '/app'`, `router.push('/x')` grava `/app/x` e `currentPath` passa a ser `/x`.

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (first match wins)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, no new history entry
router.back();
```

`match`, `getActiveApps` e `isPathActive` aplicam as mesmas regras de caminho inteiro. Uma rota `'/'` fica ativa apenas em `/`; use `'/*'` para um app que aparece em todas as páginas.

#### Guards

Os guards rodam na ordem em que você os adicionou, um de cada vez, antes de a URL mudar. Resolver para `false` cancela a navegação e pula os guards restantes. Qualquer outro valor a deixa continuar. Um guard que lança um erro ou rejeita cancela a navegação, e o roteador registra o erro com `console.error`.

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

Os guards também rodam para os botões voltar e avançar. Nesse momento o navegador já mudou de página, então quando um guard cancela, o roteador chama `history.replaceState` para colocar a URL anterior (com `base`) de volta na barra de endereço. A entrada do histórico fica onde o navegador a deixou.

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true` exige que um padrão sem `/*` corresponda ao caminho inteiro. `false` também corresponde a todo subcaminho. |

Retorna `{ matched, params }`. Regras:

- O matcher descarta `?query` e `#hash` de `path` e ignora uma barra final dos dois lados.
- `:name` captura um segmento não vazio em `params.name`, decodificado como URI. Um valor com percent-encoding malformado fica como foi escrito. Um segmento pode misturar texto e params: `/v:version` corresponde a `/v2`.
- Um `/*` final corresponde ao caminho base e a tudo abaixo dele: `/docs/*` corresponde a `/docs` e `/docs/a/b`. O restante não é capturado em `params`.
- Um `*` no meio de um padrão corresponde a um segmento.
- Por padrão, um padrão simples corresponde aos seus subcaminhos em um limite de segmento: `/docs` corresponde a `/docs/intro` e não corresponde a `/docsify`.
- `'/'` corresponde a todo caminho por padrão. Com `{ end: true }`, corresponde apenas a `/`. As rotas do roteador sempre usam as regras de `end: true`; strings de `activeWhen` do core e as `routes` dos apps do `@tuvix.js/server` usam as regras padrão de prefixo.
- Outros caracteres de regex em um padrão correspondem literalmente. A correspondência diferencia maiúsculas de minúsculas.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

O matcher compila cada padrão uma vez e guarda o `RegExp` em cache, então você pode chamá-lo a cada navegação.

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

Retorna a primeira rota cujo `path` corresponde a `path` por inteiro (regras de `end: true`), com o caminho limpo, os params decodificados e a query interpretada. Ignora o `#hash`. `Router.match` a chama.

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched`: as regras de caminho inteiro que as rotas usam, então `'/'` fica ativo apenas em `/`. `Router.getActiveApps` a usa.

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

Retorna o `RegExp` compilado de correspondência completa para um padrão e os nomes dos seus params, em ordem. O objeto `regex` vem do cache compartilhado: não altere seu `lastIndex` nem outro estado. A regex roda sobre um caminho normalizado, sem query nem hash; use `matchPath` quando o caminho puder contê-los.

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

Interpreta `a=1&b=2`, com ou sem o `?` inicial. Divide cada par no primeiro `=`, para que valores como JWTs mantenham seus caracteres `=`, decodifica chaves e valores e mantém o texto bruto quando a decodificação falha. Uma chave sem `=` vira `''`. Uma chave repetida fica com o último valor.

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

Adiciona uma barra inicial e remove uma barra final. Não mexe na query nem no hash.

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

Escuta cliques em elementos `<a href>` dentro de `root`, chama `preventDefault()` nos que trata e passa o caminho deles para `navigate`. Retorna uma função que remove todos os listeners que adicionou.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | obrigatório | Recebe `pathname + search + hash` sem `base`. A função registra um erro lançado ou uma promise rejeitada com `console.error`. |
| `root` | `Document \| HTMLElement` | `document` | Elemento em que fica o listener de clique. |
| `base` | `string` | `'/'` | Prefixo de caminho sob o qual o app é servido. Links fora dele ficam com o navegador. A função o remove antes de chamar `navigate` e `prefetch`. |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | nenhum | Roda após as verificações embutidas. Retorne `false` para deixar o navegador tratar o clique. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | nenhum | Roda em `pointerenter` ou `focusin` sobre um link elegível, uma vez por `pathname + search`. O caminho não tem hash. |

`interceptLinks` deixa o clique para o navegador quando qualquer uma destas condições vale:

- Outro handler já chamou `preventDefault()`.
- O botão não é o principal, ou Ctrl, Meta, Shift ou Alt está pressionado.
- A âncora tem um `target` diferente de `_self`, um atributo `download`, `rel` contendo `external` ou um atributo `data-tuvix-reload`.
- A URL resolvida tem uma origem diferente da página.
- O caminho da URL está fora de `base` (`/app` cobre `/app` e `/app/...`, não `/application`).
- O link tem um hash e o mesmo caminho e query da página atual. O navegador rola até a âncora.
- `shouldIntercept` retorna `false`.

`prefetch` aplica as verificações de atributo, origem e `base`. Ignora as teclas modificadoras e a regra de só hash, e dispara também para um link para a página atual.

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks` encontra a âncora com [`resolveLink`](#resolvelink), então links dentro de shadow roots abertas funcionam e elementos `<a>` de SVG ficam com o navegador. Em um ambiente sem `document` ou `window`, retorna uma função de limpeza que não faz nada.

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

Encontra o `<a href>` em que um evento aconteceu e o retorna com sua URL absoluta e seu caminho relativo ao app. Retorna `null` quando o navegador deve tratar o link. `interceptLinks` e o `prefetch: { strategy: 'hover' }` do orquestrador a usam. Chame-a nos seus próprios listeners quando precisar das mesmas regras de link, por exemplo para pré-carregar dados no hover ou registrar no log a navegação dentro do app.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | Prefixo de caminho sob o qual o app é servido. Um link fora dele retorna `null`. A função o remove de `path`. |

| Campo | Tipo | Significado |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | O elemento `<a>`. |
| `url` | `URL` | URL absoluta do link. |
| `path` | `string` | `pathname + search + hash`, sem `base`. |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter does not bubble, so listen in the capture phase.
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

`resolveLink` retorna `null` quando qualquer uma destas condições vale:

- O `<a>` mais próximo no caminho do evento é um `<a>` de SVG, ou um `<a>` HTML sem `href`, ou não há nenhum `<a>`. A busca para no primeiro `<a>` que encontra.
- A âncora tem um `target` diferente de `_self`, um atributo `download`, `rel` contendo `external` ou um atributo `data-tuvix-reload`.
- A URL tem uma origem diferente da página.
- O caminho da URL está fora de `base` (`/app` cobre `/app` e `/app/...`, não `/application`).
- Não existe `window`, como no servidor.

Ela lê `event.composedPath()`, então um listener em `document` encontra links dentro de shadow roots abertas. Links dentro de shadow roots fechadas ficam invisíveis para ela. Chame-a enquanto o evento está sendo despachado: quando o despacho termina, o caminho composto fica vazio e a função recorre a `event.target.closest('a')`, que não consegue olhar dentro de uma shadow root.

Ela não verifica o botão do mouse, as teclas modificadoras, `defaultPrevented` nem a regra de só hash. `interceptLinks` aplica essas verificações por cima para cliques.

### Tipos

| Tipo | Significado |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`. |
| `RouterConfig` | `{ mode?, base?, routes }`, as opções de `createRouter`. |
| `RouteConfig` | `{ path, app, meta? }`, uma rota. |
| `MatchedRoute` | `{ route, path, params, query }`. `path` é o pathname limpo, `params` os valores de `:param` decodificados, `query` a query string interpretada. |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`. `from` e `to` são caminhos relativos ao app, sem `base`. |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`. |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`. |
| `IRouter` | Interface que `Router` implementa e `createRouter` retorna. |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`, o resultado de `matchPath`. `params` é `{}` quando nada correspondeu. |
| `MatchPathOptions` | `{ end?: boolean }`. |
| `InterceptLinksOptions` | Opções de `interceptLinks`. |
| `ResolveLinkOptions` | `{ base?: string }`, as opções de `resolveLink`. |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`, o resultado de `resolveLink`. |

## Casos extremos

- `push` e `replace` para o caminho em que você já está (mesma string, query incluída) retornam sem executar guards nem handlers.
- O roteador não cancela uma navegação pendente quando você inicia outra. Cada `push` aguarda os próprios guards e então grava a URL, então a última cadeia de guards a terminar vence.
- O roteador fica sabendo de mudanças de URL pelos próprios `push`/`replace` e por `popstate`/`hashchange`. Se outro código chamar `history.pushState`, `currentPath` fica desatualizado até o próximo evento ou navegação do roteador.
- Após `destroy()`, `push`, `replace`, `back`, `forward`, `onChange` e `beforeEach` lançam `[Tuvix Router] Cannot use a destroyed Router. Create a new one.` `match` e `getActiveApps` continuam funcionando.
- O roteador registra com `console.error` um handler de `onChange` que lança um erro e ainda chama os outros handlers.
- Com `base: '/app'`, o roteador lê `/application` como `/application`: ele remove a base apenas em um limite de segmento. No modo history, descarta o `#hash` ao ler a URL.
- No servidor (sem `window`), o construtor define `currentPath` como `'/'` e não anexa listener. `push`, `replace`, `back` e `forward` precisam de `window`.
- `matchPath` com um padrão `/*` corresponde ao próprio caminho base: `/dashboard/*` corresponde a `/dashboard`.
- Um evento em um `<a>` dentro de um `<svg>` resolve para `null`, mesmo quando um `<a>` HTML envolve o SVG. `interceptLinks` e o prefetch por hover do orquestrador deixam esse link para o navegador, que carrega a página inteira.

## O que ele não faz

- Não monta nem desmonta micro apps. Ele reporta correspondências e mudanças; o orquestrador em `@tuvix.js/core` age sobre elas.
- Não intercepta cliques em links, a menos que você chame `interceptLinks`.
- Não tem rotas aninhadas, rotas nomeadas, redirecionamentos nem guards por rota. Use `beforeEach` e verifique `to` ou `toRoute`.
- Não captura em `params` o restante `/*` de um caminho.
- Não restaura a posição de rolagem.

## Migração a partir da 0.4

`push()` e `replace()` agora adicionam o prefixo `base`. Passe caminhos relativos a `base`:

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

Outras breaking changes:

- `base` é removido apenas em um limite de segmento: `/application` não é mais lido como `/lication`.
- As rotas correspondem ao caminho inteiro em `match`, `getActiveApps` e `isPathActive`. Na 0.4, `getActiveApps` e `isPathActive` tratavam uma rota `'/'` como ativa em todo caminho. Troque um catch-all `{ path: '/', app }` por `{ path: '/*', app }`.
- `RouteConfig.exact` foi removido. Ele era aceito e ignorado; apague-o dos seus objetos de rota.
- `pathToRegex(pattern)` perdeu o segundo argumento `exact` e retorna um `RegExp` em cache.
- Caracteres de regex em padrões correspondem literalmente, e um `*` no meio de um padrão corresponde a um segmento.
- `matchRoute()` e `isPathActive()` ignoram um `#hash` no caminho.
- A documentação da 0.4 listava `navigate`, `go` e `onRouteChange`, uma opção `orchestrator` no roteador e um `guard` por rota. Nenhum deles existe. Use `push`, `back`/`forward`, `onChange`, a config `router` do orquestrador e `beforeEach`.
