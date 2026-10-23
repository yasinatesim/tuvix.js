# @tuvix.js/server

> Busca fragmentos HTML de micro apps e os compõe em uma página shell, como uma única resposta ou como um stream BigPipe

Parte do framework de microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentação completa: [tuvix.js.org/packages/server](https://tuvix.js.org/packages/server).

Você escreve um template de shell com placeholders `<tuvix-slot name="...">`. A cada requisição, o renderizador escolhe os apps cujas `routes` correspondem ao caminho (com `matchPath` de `@tuvix.js/router`), busca os fragmentos deles em paralelo via HTTP e coloca cada fragmento onde estava o slot correspondente. Requer Node.js 18+ (`fetch` global).

## Instalação

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## Início rápido

```ts
import express from 'express';
import { createServerRenderer, createMiddleware } from '@tuvix.js/server';

const renderer = createServerRenderer({
  shellTemplate:
    '<html><body><tuvix-slot name="header"></tuvix-slot><tuvix-slot name="cart"><p>Loading...</p></tuvix-slot></body></html>',
  apps: [
    { name: 'header', ssrUrl: 'http://header-service:3001/render', routes: ['/'] },
    { name: 'cart', ssrUrl: 'http://cart-service:3002/render', routes: ['/cart/*'], timeout: 2000 },
  ],
});

const app = express();
app.use(createMiddleware(renderer));
app.listen(3000);
```

Para `/cart/42?coupon=x`, o renderizador chama `GET <ssrUrl>` com `path=%2Fcart%2F42%3Fcoupon%3Dx` definido via `URL.searchParams` (parâmetros que já estão em `ssrUrl` são mantidos; o `#hash` é descartado) e `Accept: text/html` nos dois serviços. `ssrUrl` precisa ser absoluta. Cada body 2xx substitui a tag `<tuvix-slot>` correspondente. Um status diferente de 2xx, um erro de rede, um timeout ou uma `ssrUrl` relativa vira `<!-- SSR error: <app> (<reason>) -->`. Retorne o elemento container do seu app a partir do serviço de fragmentos (`<div id="cart">...</div>`) para que o adaptador do cliente possa hidratá-lo.

## API

### `createServerRenderer(config)`

Retorna `{ render, matchApps, fetchAppHTML }`.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | obrigatório | HTML com `<tuvix-slot name="x">fallback</tuvix-slot>` ou `<tuvix-slot name="x" />`. |
| `apps` | `ServerAppConfig[]` | obrigatório | `{ name, ssrUrl, routes, timeout? }`. `name` escolhe o slot; `routes` usam as regras de prefixo de `matchPath` (query e hash ignorados). |
| `timeout` | `number` | `5000` | Timeout do fetch em ms quando o app não define um. |
| `metrics` | `TuvixMetrics` | nenhum | Coletor criado com `createMetricsCollector()`. |

- `render(path)` resolve para `{ html, statusCode, headers }`. `statusCode` é `502` quando pelo menos um app corresponde e todos os fragmentos falham; caso contrário, é `200`. Slots sem correspondência mantêm o fallback. Um caminho cujo pathname contém `://` ou começa com `//` retorna `400` com o texto `Bad Request` e não busca nada.
- `matchApps(path)` retorna os apps correspondentes.
- `fetchAppHTML(app, path)` busca um fragmento (ou o comentário de erro), sem métricas.

### `createStreamingRenderer(config)`

Mesma configuração. Retorna `{ stream, matchApps }`. `stream(path, res, { nonce? })` grava o shell até `</body>` com placeholders `<div id="tvx-slot-x" style="display:contents">` (slots com par de tags mantêm o HTML interno como fallback, slots autofechados ficam vazios). Em seguida, grava um `<script>` inline por fragmento, conforme cada um chega: o script faz o parse do fragmento em um `<template>`, substitui o placeholder e recria cada `<script>` do fragmento (todos os atributos, incluindo `nonce`, além do texto), um de cada vez na ordem do documento. Depois de um script externo sem `async`, o próximo espera pelo `load` ou `error` dele, então `<script src="/lib.js"></script><script>Lib.init()</script>` funciona. Scripts `async` e blocos de dados (`type="application/json"`) nunca bloqueiam. O fragmento é escapado como JSON, então `</script>` não consegue escapar do script. Depois, grava o restante do shell. O status é 200, ou 400 (`Bad Request`, sem shell) para um caminho que aponta para outro host. `res` é um `StreamingResponse` (`write`, `end`, `setHeader`, `statusCode` opcional); o `ServerResponse` do Node atende a esse formato.

Com uma CSP sem `'unsafe-inline'`, passe um `nonce` novo por resposta; o renderizador o coloca nos scripts inline dele. Os scripts dos fragmentos precisam do próprio atributo `nonce`, ou de uma política com `'strict-dynamic'`.

```ts
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { createStreamingRenderer } from '@tuvix.js/server';

const renderer = createStreamingRenderer({
  shellTemplate: '<html><body><tuvix-slot name="cart"></tuvix-slot></body></html>',
  apps: [{ name: 'cart', ssrUrl: 'http://cart-service:3002/render', routes: ['/*'] }],
});

createServer(async (req, res) => {
  const nonce = randomBytes(16).toString('base64');
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}' 'strict-dynamic'`);
  await renderer.stream(req.url ?? '/', res, { nonce });
}).listen(3000);
```

### `createMiddleware(renderer)`

Handler Express/Connect `(req, res, next?)`. Renderiza `req.originalUrl ?? req.url` (incluindo a query string e o prefixo de montagem do Express), define os headers com `res.set` ou `res.setHeader` e envia `res.status(statusCode).send(html)`. Em caso de exceção: `next(error)`, ou 500 sem `next`.

### `createStreamingMiddleware(renderer, options?)`

Chama `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, com `nonce` vindo de `options.nonce?.(req, res)` (por exemplo `res.locals.cspNonce`). Erro antes da primeira gravação: `next(error)`; sem `next`, `res.status(500).send()` no Express, ou `statusCode = 500` mais `end()` em um `ServerResponse` do Node. Erro depois dela: encerra a resposta e não chama `next`.

### `composeHTML(template, slots)` e `compileShellTemplate(template)`

`composeHTML` substitui cada slot nomeado em `slots` em uma única passada; os demais ficam como foram escritos. `$&`, `$1` e um `<tuvix-slot>` dentro do HTML do fragmento permanecem literais. `compileShellTemplate` retorna `{ slotNames, render(slots) }` com os nomes lidos uma única vez.

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

Retorna `TuvixMetrics`: `recordRender(ms)`, `recordFragment(name, ms, isError)`, `toPrometheusText()`, `reset()`. Métricas: `tuvix_renders_total`, `tuvix_render_duration_ms_total` (contadores), `tuvix_render_duration_ms_avg`, `tuvix_render_duration_ms_max` (gauges) e, por app (`{app="..."}`), `tuvix_fragment_fetches_total`, `tuvix_fragment_errors_total`, `tuvix_fragment_avg_duration_ms`, `tuvix_fragment_max_duration_ms`. Um `# HELP` e um `# TYPE` por família; os valores de label escapam `\`, `"` e quebras de linha. Sirva com `Content-Type: text/plain; version=0.0.4`.

### Tipos

`ServerRendererConfig`, `ServerAppConfig`, `RenderResult`, `StreamingResponse`, `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`, `CompiledTemplate`, `TuvixMetrics`.

## Casos extremos

- `render` e `stream` respondem `400 Bad Request` uma única vez para um pathname de requisição que contém `://` ou começa com `//`; eles não buscam nenhum fragmento e não registram métricas de fragmento. A query não é verificada. `fetchAppHTML` retorna `<!-- SSR error: invalid path -->` para um caminho assim. Sequências de `..` são removidas do pathname antes que ele seja enviado aos serviços de fragmentos.
- Os scripts nos fragmentos enviados por stream são executados. Remova-os no serviço de fragmentos se eles precisarem permanecer inertes.
- Um app correspondente sem um slot de mesmo nome é buscado e o HTML dele é descartado.

## O que ele não faz

- Ele não renderiza componentes, não faz cache de fragmentos, não tenta buscas de novo nem repassa cookies e headers.
- Ele não hidrata. Os adaptadores do cliente (`createSsrReactMicroApp` e os equivalentes de Vue, Svelte e Angular) fazem isso.
- Ele não move o conteúdo do `<head>` dos fragmentos para o `<head>` do shell.

## Migração a partir da 0.4

- `render()` retorna 502 quando todos os fragmentos correspondentes falham; `createMiddleware` envia esse status.
- Os dois middlewares chamam `next(error)` em vez de `next()` em caso de erro.
- As rotas usam `matchPath`: `/dashboard?tab=1` corresponde a `/dashboard/*`.
- A saída de `toPrometheusText()` é texto Prometheus válido: um HELP/TYPE por família.
- Os dois middlewares renderizam `req.originalUrl ?? req.url` em vez de `req.path ?? req.url`.
- `ssrUrl` precisa ser absoluta; os parâmetros de query que ela já tem são mantidos.
- Os scripts nos fragmentos enviados por stream agora são executados, e slots autofechados recebem um placeholder de streaming.
- Um pathname de requisição que contém `://` ou começa com `//` recebe `400 Bad Request` de `render` e `stream`.

## Licença

MIT
