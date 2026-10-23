---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Servidor"
  description="Composição de páginas no servidor para Tuvix.js. Busque o fragmento HTML de cada micro app via HTTP e preencha os slots de um template de shell, como uma única resposta ou como um stream BigPipe."
  icon="🖥️"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

O pacote roda no Node.js 18 ou superior e usa o `fetch` global. Ele depende de `@tuvix.js/router` para o casamento de rotas.

## Quando usar

Use quando cada micro app roda seu próprio serviço de renderização e um servidor de shell monta a página. Você escreve um template HTML de shell com placeholders `<tuvix-slot name="...">`. Para cada requisição, o renderizador escolhe os apps cujas `routes` casam com o caminho, busca os fragmentos deles em paralelo e coloca cada fragmento no lugar do seu slot.

Escolha `createServerRenderer` com `createMiddleware` quando quiser uma resposta HTML completa e um status 502 quando todos os fragmentos falharem. Escolha `createStreamingRenderer` com `createStreamingMiddleware` quando quiser que o `<head>` do shell chegue ao navegador antes que o fragmento mais lento retorne.

Se um único servidor renderiza todas as ilhas sozinho (um app Next.js, Astro ou Vite SSR chamando `renderVueToString` ou o `renderToString` do React), você não precisa deste pacote. Veja [`@tuvix.js/vite`](/pt/packages/vite) para vincular os assets das ilhas nesse cenário.

## Início rápido

```ts
import express from 'express';
import { createServerRenderer, createMiddleware } from '@tuvix.js/server';

const renderer = createServerRenderer({
  shellTemplate: `<!doctype html>
<html>
  <head><title>Shop</title></head>
  <body>
    <tuvix-slot name="header"></tuvix-slot>
    <tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>
  </body>
</html>`,
  apps: [
    { name: 'header', ssrUrl: 'http://header-service:3001/render', routes: ['/'] },
    { name: 'cart', ssrUrl: 'http://cart-service:3002/render', routes: ['/cart/*'], timeout: 2000 },
  ],
  timeout: 3000,
});

const app = express();
app.use(createMiddleware(renderer));
app.listen(3000);
```

Uma requisição para `/cart/42?coupon=x`:

1. `header` casa (`'/'` casa com qualquer caminho) e `cart` casa com `/cart/*`.
2. O renderizador envia `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx` e o mesmo para o serviço do carrinho, em paralelo. O middleware lê `req.originalUrl`, então a query string chega aos serviços de fragmento.
3. O corpo de cada resposta substitui o elemento `<tuvix-slot>` inteiro.
4. O middleware envia status 200 com `Content-Type: text/html; charset=utf-8` e `X-Powered-By: Tuvix.js`.

Em `/about`, só `header` casa. O slot `cart` permanece no HTML como `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>`, e o navegador renderiza o conteúdo de fallback dele.

## Serviços de fragmento

O renderizador chama a `ssrUrl` de cada app com `GET` e `Accept: text/html`. Ele monta a URL com `new URL(ssrUrl)` e define um parâmetro de busca `path` com o pathname da requisição mais a query, sem o `#hash`. Os parâmetros que já estão em `ssrUrl` são mantidos: `http://cart:3002/render?v=2` vira `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc` para `/shop?sort=asc`. O corpo de uma resposta 2xx é o fragmento. Qualquer outro status, um erro de rede, um timeout ou uma `ssrUrl` relativa conta como falha, e o renderizador coloca `<!-- SSR error: <app> (<status or message>) -->` no slot.

O fragmento substitui a própria tag `<tuvix-slot>`, então o renderizador não adiciona nenhum elemento wrapper. Retorne o elemento no qual seu app do lado do cliente é montado, para que o orquestrador encontre o container e o adaptador o hidrate:

```ts
import { createServer } from 'node:http';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import Cart from './Cart';

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname !== '/render') {
    res.writeHead(404).end();
    return;
  }
  const html = renderToString(createElement(Cart, { path: url.searchParams.get('path') ?? '/' }));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<div id="cart">${html}</div>`);
}).listen(3002);
```

No cliente, registre o app com `container: '#cart'` e construa-o com um adaptador com suporte a SSR (`createSsrReactMicroApp`, `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`). O adaptador hidrata o markup do servidor em vez de renderizar do zero.

## API

### `createServerRenderer`

```ts
import type { RenderResult, ServerAppConfig, ServerRendererConfig } from '@tuvix.js/server';

declare function createServerRenderer(config: ServerRendererConfig): {
  render(path: string): Promise<RenderResult>;
  matchApps(path: string): ServerAppConfig[];
  fetchAppHTML(app: ServerAppConfig, path: string): Promise<string>;
};
```

`ServerRendererConfig`:

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | obrigatório | HTML da página com placeholders `<tuvix-slot name="x"></tuvix-slot>` ou `<tuvix-slot name="x" />`. O renderizador lê os nomes dos slots uma única vez, na criação. |
| `apps` | `ServerAppConfig[]` | obrigatório | Apps que podem ser renderizados no servidor. |
| `timeout` | `number` | `5000` | Timeout do fetch em ms para apps sem `timeout` próprio. |
| `metrics` | `TuvixMetrics` | nenhum | Coletor de `createMetricsCollector()`. O renderizador registra cada busca de fragmento e cada renderização. |

`ServerAppConfig`:

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome do app. O fragmento preenche o slot com o mesmo nome. |
| `ssrUrl` | `string` | obrigatório | Endpoint absoluto do fragmento. O renderizador define um parâmetro de busca `path` e mantém os parâmetros que já estão na URL. Uma URL relativa faz o fragmento desse app falhar. |
| `routes` | `string[]` | obrigatório | Padrões na sintaxe de [`matchPath`](/pt/packages/router#matchpath) com as regras de prefixo padrão, iguais às do `activeWhen` do core: `'/'` casa com qualquer caminho e `'/cart'` casa com `/cart` e tudo abaixo. As `routes` do roteador são diferentes: elas casam com o caminho inteiro. O app é renderizado quando qualquer padrão casa. |
| `timeout` | `number` | `timeout` da config | Timeout do fetch em ms para este app. O renderizador aborta a requisição quando ele expira. |

Funções retornadas:

- `render(path)` casa os apps, busca todos os fragmentos em paralelo, preenche os slots e resolve para `{ html, statusCode, headers }`. `statusCode` é `502` quando pelo menos um app casou e todos os fragmentos falharam; caso contrário, `200`. `headers` contém `Content-Type: text/html; charset=utf-8` e `X-Powered-By: Tuvix.js`. Um fragmento com falha aparece como um comentário HTML no seu slot; `render` não rejeita por causa dele. Um caminho cujo pathname contém `://` ou começa com `//` resolve para `400` com o texto `Bad Request`, depois de um aviso e sem buscar nenhum fragmento.
- `matchApps(path)` retorna os apps cujas `routes` casam com `path` segundo as regras de prefixo de `matchPath(pattern, path)`. A query string e o hash não afetam o casamento.
- `fetchAppHTML(app, path)` busca um fragmento e retorna o HTML dele, ou o comentário de erro. Não registra métricas.

```ts
import { createServerRenderer } from '@tuvix.js/server';

const renderer = createServerRenderer({
  shellTemplate: '<main><tuvix-slot name="profile" /></main>',
  apps: [{ name: 'profile', ssrUrl: 'http://profile:3003/render', routes: ['/users/:id'] }],
});

const { html, statusCode } = await renderer.render('/users/42#bio');
console.log(statusCode); // 200, or 502 if the profile service failed
console.log(html);
```

### `createStreamingRenderer`

```ts
import type { ServerAppConfig, ServerRendererConfig, StreamingResponse, StreamOptions } from '@tuvix.js/server';

declare function createStreamingRenderer(config: ServerRendererConfig): {
  stream(path: string, res: StreamingResponse, options?: StreamOptions): Promise<void>;
  matchApps(path: string): ServerAppConfig[];
};
```

Recebe o mesmo `ServerRendererConfig`. Na criação, transforma cada `<tuvix-slot name="x">fallback</tuvix-slot>` em `<div id="tvx-slot-x" style="display:contents">fallback</div>` e divide o shell no último `</body>`.

`stream(path, res, options?)`:

1. Define `Content-Type: text/html; charset=utf-8`, `Transfer-Encoding: chunked` e `X-Powered-By: Tuvix.js`.
2. Escreve o shell até `</body>`. Cada slot vira `<div id="tvx-slot-x" style="display:contents">`, contendo o HTML interno da forma com par de tags como fallback, ou nada no caso de um `<tuvix-slot name="x" />` auto-fechado.
3. Busca os fragmentos que casaram em paralelo. Conforme cada um chega, escreve um `<script>` inline que faz o parse do fragmento em um `<template>` e substitui o placeholder por ele. Em seguida, o script recria cada `<script>` do fragmento, um de cada vez na ordem do documento, copiando todos os atributos (incluindo `nonce`) e o texto, para que o navegador o execute. Depois de um script externo sem `async`, o próximo espera pelo evento `load` ou `error` dele, então `<script src="/lib.js"></script><script>Lib.init()</script>` encontra `Lib`. Scripts `async` e blocos de dados (`type="application/json"`) não seguram o restante.
4. Escreve `</body></html>` (o resto do shell) e chama `res.end()`.

O status é 200: os headers saem junto com o shell, antes de qualquer fragmento ser buscado. Para um caminho cujo pathname contém `://` ou começa com `//`, `stream` define `res.statusCode = 400`, escreve `Bad Request` como `text/plain` e encerra, sem o shell. O renderizador codifica o HTML do fragmento em JSON e escapa `<`, `>`, U+2028 e U+2029, então um fragmento contendo `</script>` ou `<!--` não consegue encerrar o script inline.

Com uma Content Security Policy sem `'unsafe-inline'`, passe um nonce novo por resposta em `options.nonce`. O renderizador o escreve como `<script nonce="...">` em todos os scripts inline. Os scripts que ele recria a partir de um fragmento carregam apenas o próprio atributo `nonce` do fragmento, então dê esse nonce aos scripts do fragmento ou adicione `'strict-dynamic'` à política. Sem um nonce, a política bloqueia os scripts inline e os placeholders mantêm o fallback.

```ts
import { randomBytes } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { createStreamingRenderer } from '@tuvix.js/server';

declare const renderer: ReturnType<typeof createStreamingRenderer>;

function handle(url: string, res: ServerResponse) {
  const nonce = randomBytes(16).toString('base64');
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}' 'strict-dynamic'`);
  return renderer.stream(url, res, { nonce });
}
```

```ts
import { createStreamingRenderer, createServerRenderer } from '@tuvix.js/server';
import { createServer } from 'node:http';

const config = {
  shellTemplate: '<html><head></head><body><tuvix-slot name="feed"><p>Loading...</p></tuvix-slot></body></html>',
  apps: [{ name: 'feed', ssrUrl: 'http://feed:3004/render', routes: ['/'] }],
};
const streaming = createStreamingRenderer(config);
const buffered = createServerRenderer(config);

createServer((req, res) => {
  const path = req.url ?? '/';
  if (req.headers['user-agent']?.includes('bot')) {
    void buffered.render(path).then(({ html, statusCode, headers }) => res.writeHead(statusCode, headers).end(html));
  } else {
    void streaming.stream(path, res);
  }
}).listen(3000);
```

### `createMiddleware`

```ts
import type { createServerRenderer } from '@tuvix.js/server';

declare function createMiddleware(
  renderer: ReturnType<typeof createServerRenderer>
): (
  req: { url: string; originalUrl?: string },
  res: {
    status: (code: number) => { send: (body: string) => void };
    set?: (headers: Record<string, string>) => void;
    setHeader?: (name: string, value: string) => void;
  },
  next?: (error?: unknown) => void
) => Promise<void>;
```

Handler no estilo Express/Connect. Ele renderiza `req.originalUrl ?? req.url`, então a query string e um prefixo de montagem do Express (`app.use('/shop', ...)`) fazem parte do caminho que as rotas casam e que os serviços de fragmento recebem. Ele define os headers do resultado com `res.set` (ou `res.setHeader` para cada header quando `set` não existe) e chama `res.status(result.statusCode).send(result.html)`. Quando `render` lança um erro, ele registra o erro no log e chama `next(error)`, ou envia `500 Internal Server Error` quando você não passou `next`.

O middleware renderiza todas as requisições que recebe, incluindo caminhos que nenhum app casa. Monte-o nas rotas que pertencem ao seu shell, depois dos handlers de arquivos estáticos.

### `createStreamingMiddleware`

```ts
import type { createStreamingRenderer, MiddlewareRequest, StreamingMiddlewareOptions, StreamingMiddlewareResponse } from '@tuvix.js/server';

declare function createStreamingMiddleware(
  renderer: ReturnType<typeof createStreamingRenderer>,
  options?: StreamingMiddlewareOptions
): (
  req: MiddlewareRequest,
  res: StreamingMiddlewareResponse,
  next?: (error?: unknown) => void
) => Promise<void>;
```

Chama `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, em que `nonce` é `options.nonce?.(req, res)`. Leia o nonce de onde seu middleware de CSP o guarda, por exemplo `res.locals.cspNonce`. Em caso de erro:

- antes da primeira escrita: chama `next(error)`. Sem `next`, envia 500 por meio de `res.status` (Express), ou define `res.statusCode = 500`, escreve `Internal Server Error` e encerra a resposta (`http` do Node);
- depois da primeira escrita: encerra a resposta e não chama `next`, já que os headers já foram enviados.

```ts
import express from 'express';
import { createStreamingRenderer, createStreamingMiddleware } from '@tuvix.js/server';

declare const shellTemplate: string;

const renderer = createStreamingRenderer({
  shellTemplate,
  apps: [{ name: 'feed', ssrUrl: 'http://feed:3004/render', routes: ['/'] }],
});

const app = express();
app.use(express.static('public'));
app.use(createStreamingMiddleware(renderer));
app.listen(3000);
```

### `composeHTML`

```ts
declare function composeHTML(template: string, slots: Record<string, string>): string;
```

Substitui cada `<tuvix-slot name="x">...</tuvix-slot>` ou `<tuvix-slot name="x" />` cujo nome é uma chave própria de `slots` por `slots[x]`. Slots sem entrada ficam como foram escritos. Ele preenche todos os slots em uma única passada com uma função de substituição, então `$&`, `$1`, `` $` ``, `$'` e `$$` no HTML do fragmento continuam literais e um `<tuvix-slot>` dentro de um fragmento não é preenchido.

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main><tuvix-slot name="footer">(c)</tuvix-slot>', {
  main: '<p>Save $1 today</p>',
});
// '<main><p>Save $1 today</p></main><tuvix-slot name="footer">(c)</tuvix-slot>'
```

### `compileShellTemplate`

```ts
import type { CompiledTemplate } from '@tuvix.js/server';

declare function compileShellTemplate(template: string): CompiledTemplate;
```

Lê os nomes dos slots uma única vez e retorna `{ slotNames, render }`. `slotNames` lista cada nome uma vez, na ordem da primeira ocorrência. `render(slots)` retorna a mesma saída que `composeHTML(template, slots)`. `createServerRenderer` chama essa função para você.

```ts
import { compileShellTemplate } from '@tuvix.js/server';

const shell = compileShellTemplate('<tuvix-slot name="header" /><tuvix-slot name="main" />');
console.log(shell.slotNames); // ['header', 'main']
const html = shell.render({ header: '<header>Shop</header>', main: '<main>Home</main>' });
```

### `createMetricsCollector`

```ts
import type { TuvixMetrics } from '@tuvix.js/server';

declare function createMetricsCollector(): TuvixMetrics;
```

Um coletor em memória. Passe-o como `metrics` para qualquer um dos renderizadores, ou chame os métodos dele você mesmo:

| Método | Assinatura | Comportamento |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | Conta uma renderização e sua duração. |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | Conta uma busca para o app `name`, sua duração e se ela falhou. |
| `toPrometheusText` | `() => string` | Formato de exposição de texto do Prometheus 0.0.4. |
| `reset` | `() => void` | Zera todos os contadores. |

```ts
import { createServer } from 'node:http';
import { createMetricsCollector, createServerRenderer } from '@tuvix.js/server';

declare const shellTemplate: string;

const metrics = createMetricsCollector();
const renderer = createServerRenderer({
  shellTemplate,
  apps: [{ name: 'cart', ssrUrl: 'http://cart:3002/render', routes: ['/cart/*'] }],
  metrics,
});

createServer(async (req, res) => {
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' }).end(metrics.toPrometheusText());
    return;
  }
  const { html, statusCode, headers } = await renderer.render(req.url ?? '/');
  res.writeHead(statusCode, headers).end(html);
}).listen(3000);
```

Saída após uma renderização em que `header` levou 12 ms e `cart` falhou após 2000 ms:

```text
# HELP tuvix_renders_total Total number of SSR renders
# TYPE tuvix_renders_total counter
tuvix_renders_total 1
# HELP tuvix_render_duration_ms_total Cumulative render duration (ms)
# TYPE tuvix_render_duration_ms_total counter
tuvix_render_duration_ms_total 2003
# HELP tuvix_render_duration_ms_avg Average render duration (ms)
# TYPE tuvix_render_duration_ms_avg gauge
tuvix_render_duration_ms_avg 2003.00
# HELP tuvix_render_duration_ms_max Peak render duration (ms)
# TYPE tuvix_render_duration_ms_max gauge
tuvix_render_duration_ms_max 2003
# HELP tuvix_fragment_fetches_total Total fetches per fragment
# TYPE tuvix_fragment_fetches_total counter
tuvix_fragment_fetches_total{app="header"} 1
tuvix_fragment_fetches_total{app="cart"} 1
# HELP tuvix_fragment_errors_total Total fetch errors per fragment
# TYPE tuvix_fragment_errors_total counter
tuvix_fragment_errors_total{app="header"} 0
tuvix_fragment_errors_total{app="cart"} 1
# HELP tuvix_fragment_avg_duration_ms Average fetch duration per fragment (ms)
# TYPE tuvix_fragment_avg_duration_ms gauge
tuvix_fragment_avg_duration_ms{app="header"} 12.00
tuvix_fragment_avg_duration_ms{app="cart"} 2000.00
# HELP tuvix_fragment_max_duration_ms Peak fetch duration per fragment (ms)
# TYPE tuvix_fragment_max_duration_ms gauge
tuvix_fragment_max_duration_ms{app="header"} 12
tuvix_fragment_max_duration_ms{app="cart"} 2000
```

Cada família de métricas recebe uma linha `# HELP` e uma linha `# TYPE`. Os labels aparecem apenas nas amostras, e os valores de label escapam `\`, `"` e quebras de linha. O coletor omite uma família sem amostras: antes da primeira renderização você recebe só os dois totais de renderização em 0, e as quatro famílias de fragmento aparecem depois da primeira busca de fragmento. Ele guarda totais, médias e máximos; não há histogramas nem quantis.

### Tipos

| Tipo | Significado |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`, opções para os dois renderizadores. |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`, um app. |
| `RenderResult` | `{ html: string; statusCode: number; headers: Record<string, string> }` retornado por `render`. |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`. O `ServerResponse` do Node se encaixa nele. |
| `StreamOptions` | `{ nonce?: string }`, opções por requisição para `stream`. |
| `StreamingMiddlewareOptions` | `{ nonce?: (req, res) => string \| undefined }` para `createStreamingMiddleware`. |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`, os campos da requisição que os dois middlewares leem. |
| `StreamingMiddlewareResponse` | `StreamingResponse` mais um `status(code).send(body)` opcional no estilo Express. |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`. |
| `TuvixMetrics` | Interface do coletor retornada por `createMetricsCollector`. |

## Casos extremos

- O fragmento preenche o slot cujo nome é igual ao `name` do app. Um app que casou mas não tem slot é buscado e o HTML dele é descartado.
- `render` e `stream` rejeitam um pathname de requisição que contém `://` ou começa com `//` com um aviso e um `400 Bad Request`. Eles não buscam nenhum fragmento e não registram métricas de fragmento. A verificação ignora a query, então `?next=https://...` passa. `fetchAppHTML` retorna `<!-- SSR error: invalid path -->` para um caminho assim. O renderizador remove sequências de `..` e junta barras repetidas no pathname (não na query) antes de enviá-lo aos serviços de fragmento.
- Scripts em um fragmento transmitido por stream rodam quando o script de troca dele roda, depois dos scripts do próprio shell que estão acima dele. Remova os elementos `<script>` no serviço de fragmento se eles precisarem continuar inertes.
- O renderizador escapa o nome do app e a mensagem de erro nos comentários de erro, então um texto de erro contendo `-->` não consegue fechar o comentário.
- Um `statusCode` 200 pode esconder falhas parciais. Leia `tuvix_fragment_errors_total` ou procure `<!-- SSR error` no HTML.

## O que ele não faz

- Não renderiza componentes. Cada serviço de fragmento renderiza seu próprio app com o renderizador de servidor do seu framework.
- Não faz cache de fragmentos nem tenta de novo uma busca que falhou.
- Não repassa cookies nem headers da requisição para os serviços de fragmento. Envia apenas `Accept: text/html`.
- Não hidrata nada. Isso é feito pelos adaptadores do lado do cliente.
- Não mescla o conteúdo de `<head>` dos fragmentos (estilos, meta tags) no `<head>` do shell. Coloque os assets compartilhados no shell, ou use [`@tuvix.js/vite`](/pt/packages/vite) quando um único servidor Vite renderiza as ilhas.

## Migração a partir da 0.4

- `createServerRenderer().render()` retorna `statusCode: 502` quando pelo menos um app casou e todos os fragmentos falharam. `createMiddleware` envia esse status. O renderizador de streaming continua enviando 200.
- Um pathname de requisição que contém `://` ou começa com `//` recebe `400 Bad Request` de `render` e `stream`. Na 0.4, todos os fragmentos falhavam com um comentário de erro dentro de uma página 200.
- `createMiddleware` e `createStreamingMiddleware` chamam `next(error)` em vez de `next()` quando a renderização lança um erro, então o Express executa seu handler de erros.
- As rotas usam `matchPath`, então `/dashboard?tab=1` casa com `/dashboard/*` e `/users/42#bio` casa com `/users/:id`.
- `toPrometheusText()` escreve uma linha `# HELP` e uma linha `# TYPE` por família, com labels apenas nas amostras. A saída da 0.4 as repetia para cada app com os labels no nome da métrica, o que o Prometheus rejeitava.
- Os dois middlewares renderizam `req.originalUrl ?? req.url` em vez de `req.path ?? req.url`. Os serviços de fragmento recebem a query string em `path` e, sob `app.use('/prefix', ...)`, veem a URL completa com `/prefix`.
- `ssrUrl` precisa ser absoluta. Uma relativa agora produz o comentário de erro para aquele app. Os parâmetros de query em `ssrUrl` são mantidos, em vez de gerar um segundo `?`.
- Scripts em fragmentos transmitidos por stream agora rodam. Remova-os no serviço de fragmento se você dependia de eles continuarem inertes.
- Um `<tuvix-slot name="x" />` auto-fechado também recebe um placeholder de streaming.

A documentação da 0.4 mostrava `createMiddleware({ template })`, `renderer.render({ apps, props })` e uma opção `hydrate: true` no orquestrador. Nada disso existe. Passe um renderizador para `createMiddleware`:

```ts
import { createServerRenderer, createMiddleware } from '@tuvix.js/server';

declare const shellTemplate: string;

// 0.4 docs (never worked): createMiddleware({ template: './index.html' })
const middleware = createMiddleware(
  createServerRenderer({
    shellTemplate,
    apps: [{ name: 'main', ssrUrl: 'http://main:3001/render', routes: ['/'] }],
  })
);
```
