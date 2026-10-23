# @tuvix.js/router

> Roteamento por history e hash para micro apps, o matcher compartilhado `matchPath` e interceptação de links

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentação completa: [tuvix.js.org/packages/router](https://tuvix.js.org/packages/router).

O roteador associa caminhos de URL a nomes de micro apps e avisa quando o caminho muda. `matchPath` é o matcher de padrões que o `activeWhen` do core e o `@tuvix.js/server` também usam. Se o seu shell já usa React Router ou TanStack Router, conecte-o com `orchestrator.connectRouter()` de `@tuvix.js/core` em vez disso.

## Instalação

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## Início rápido

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

O construtor anexa o listener de `popstate` ou `hashchange`. Não existe chamada a `start()`.

## API

### `createRouter(config)` e `Router`

`createRouter(config)` retorna `new Router(config)` tipado como `IRouter`.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | obrigatório | `{ path, app, meta? }`. Verificadas em ordem, a primeira correspondência vence. Os caminhos correspondem ao caminho inteiro: `'/'` é apenas a página inicial, `'/*'` todo caminho, `'/blog/*'` `/blog` e o que estiver abaixo. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` usa `pushState` e `location.pathname + search`. `hash` usa `#/path`. |
| `base` | `string` | `'/'` | Prefixo no modo history. Removido na leitura (apenas em limite de segmento) e adicionado na escrita. |

| Membro | Comportamento |
| --- | --- |
| `currentPath`, `currentRoute` | Caminho relativo ao app (com query no modo history) e seu `MatchedRoute \| null`. |
| `push(path)`, `replace(path)` | `Promise<void>`. Executam os guards, escrevem `base + path` (ou `#path`) e executam os handlers de `onChange`. Mesmo caminho: não faz nada. |
| `back()`, `forward()` | `window.history.back()` / `forward()`. |
| `onChange(handler)` | Roda depois de cada navegação concluída. Retorna uma função para cancelar a inscrição. |
| `beforeEach(guard)` | Os guards rodam em ordem. `false`, um erro lançado ou uma rejeição cancela. Em voltar/avançar, o roteador restaura a URL anterior com `replaceState`. Retorna uma função de remoção. |
| `match(path)` | Primeira rota correspondente ou `null`. |
| `getActiveApps(path?)` | Apps de todas as rotas que correspondem ao caminho inteiro, sem duplicatas. Uma rota `'/'` fica ativa apenas em `/`; use `'/*'` para todas as páginas. |
| `destroy()` | Remove os listeners. Chamadas posteriores a `push`, `replace`, `back`, `forward`, `onChange` e `beforeEach` lançam erro. |

### `matchPath(pattern, path, options?)`

Retorna `{ matched, params }`.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | Exige que um padrão sem `/*` corresponda ao caminho inteiro. |

- Descarta `?query` e `#hash` e ignora uma barra final.
- `:name` captura um segmento, decodificado como URI. Um `/*` final corresponde ao caminho base e a tudo abaixo dele; o restante não é capturado. Um `*` no meio corresponde a um segmento.
- Por padrão, `/docs` corresponde a `/docs/intro`, mas não a `/docsify`, e `'/'` corresponde a todo caminho. Com `{ end: true }`, `'/'` corresponde apenas a `/`. As rotas do roteador usam as regras de `end: true`; o `activeWhen` do core e as rotas do `@tuvix.js/server` usam o padrão por prefixo.
- Os padrões compilados ficam em cache. A correspondência diferencia maiúsculas de minúsculas.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### Helpers

| Export | Comportamento |
| --- | --- |
| `matchRoute(path, routes)` | Primeira correspondência completa como `{ route, path, params, query }`, ou `null`. Ignora `#hash`. |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`, as regras de caminho inteiro que as rotas usam. |
| `pathToRegex(pattern)` | `{ regex, paramNames }` de correspondência completa, em cache. Não altere `regex`. |
| `parseQuery(query)` | `'?a=1&b'` para `{ a: '1', b: '' }`. Divide no primeiro `=`, decodifica e mantém o texto bruto quando a codificação é inválida. |
| `normalizePath(path)` | Adiciona uma barra inicial e remove uma barra final. |

### `interceptLinks(options)`

Transforma cliques em `<a href>` de mesma origem em chamadas a `navigate(path)`. Retorna uma função de limpeza.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | obrigatório | Recebe `pathname + search + hash` sem `base`. Os erros são registrados no log. |
| `root` | `Document \| HTMLElement` | `document` | Onde fica o listener de clique. |
| `base` | `string` | `'/'` | Links fora dela ficam com o navegador; removida antes de `navigate`/`prefetch`. |
| `shouldIntercept` | `(anchor, url, event) => boolean` | nenhum | Retorne `false` para deixar o navegador tratar o clique. Roda depois das verificações embutidas. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | nenhum | Em `pointerenter` ou `focusin`, uma vez por `pathname + search`. |

O navegador mantém o clique quando: outro handler chamou `preventDefault()`; o botão não é o principal ou há Ctrl/Meta/Shift/Alt; `target` é diferente de `_self`; há `download`; `rel` contém `external`; há `data-tuvix-reload`; a origem é outra; o caminho está fora de `base`; é um link de hash para o caminho e a query atuais; ou `shouldIntercept` retorna `false`. Links dentro de shadow roots abertas são tratados; elementos `<a>` de SVG ficam com o navegador.

### `resolveLink(event, options?)`

Retorna `{ anchor, url, path }` para o `<a href>` HTML em que um evento aconteceu, ou `null` quando o navegador deve tratar o link. `path` é `pathname + search + hash` sem `base`. `interceptLinks` e o prefetch por hover do orquestrador a usam; chame-a nos seus próprios listeners para aplicar as mesmas regras.

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

Ela retorna `null` para: um `<a>` de SVG, um `<a>` sem `href` ou nenhum `<a>` (o `<a>` mais próximo no caminho do evento decide); `target` diferente de `_self`; `download`; `rel` contendo `external`; `data-tuvix-reload`; outra origem; um caminho fora de `base`; ausência de `window`. Ela lê `event.composedPath()`, então encontra links em shadow roots abertas, não em fechadas. Chame-a durante o despacho do evento. Ela não verifica botões, teclas modificadoras nem links só de hash.

### Tipos

`RouterMode`, `RouterConfig`, `RouteConfig`, `MatchedRoute`, `NavigationEvent` (`{ from, to, fromRoute, toRoute }`, caminhos sem `base`), `NavigationGuard`, `RouteChangeHandler`, `IRouter`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolveLinkOptions` (`{ base? }`), `ResolvedLink` (`{ anchor, url, path }`).

## Casos extremos

- O roteador não cancela uma navegação pendente quando outra começa; a última cadeia de guards a terminar escreve a URL.
- Se outro código chamar `history.pushState`, `currentPath` fica desatualizado até o próximo `popstate`, `hashchange` ou navegação do roteador.
- No servidor, o construtor define `currentPath` como `'/'` e não anexa nada. Os métodos de navegação precisam de `window`.
- Um guard que cancela uma navegação de voltar/avançar corrige a barra de endereço; a posição no histórico continua onde o navegador a deixou.

## O que ele não faz

- Ele não monta apps. Quem faz isso é o orquestrador de `@tuvix.js/core`, usando a configuração `router` ou `connectRouter`.
- Ele não intercepta links, a menos que você chame `interceptLinks`.
- Sem rotas aninhadas, redirecionamentos, guards por rota nem restauração de rolagem.

## Migração a partir da 0.4

- `push()`/`replace()` adicionam o prefixo `base`: com `base: '/app'`, `push('/x')` escreve `/app/x`. Passe caminhos relativos a `base`.
- `base` só é removida em limite de segmento.
- As rotas correspondem ao caminho inteiro em `match`, `getActiveApps` e `isPathActive`; uma rota `'/'` fica ativa apenas em `/`. Use `'/*'` para capturar tudo.
- `RouteConfig.exact` foi removido (era ignorado).
- `pathToRegex(pattern)` perdeu o argumento `exact` e retorna um `RegExp` em cache.
- Caracteres de regex nos padrões correspondem literalmente; um `*` no meio corresponde a um segmento.
- `matchRoute()` e `isPathActive()` ignoram `#hash`.

## Licença

MIT
