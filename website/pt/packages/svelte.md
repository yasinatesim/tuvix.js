---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Bindings para Svelte"
  description="Transforma um componente Svelte 3, 4 ou 5 em um micro app Tuvix.js: uma instância por container, atualização de props no lugar, hidratação da marcação do servidor e renderização no servidor com CSS."
  icon="🔥"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

A faixa de peer cobre Svelte 3, 4 e 5. O pacote tem dois pontos de entrada: `@tuvix.js/svelte` para o navegador e `@tuvix.js/svelte/server` para renderização no servidor.

## Quando usar

Use este pacote quando um componente Svelte deve rodar como um micro app Tuvix.js: o orquestrador o monta em um container em uma rota, passa props, as atualiza e o desmonta quando a rota muda. Ele também cobre ilhas: você renderiza o componente no servidor, coloca o HTML na página e o cliente o hidrata.

Você não precisa dele para uma página que o Svelte controla de ponta a ponta (SvelteKit). Nesse caso o Svelte monta a si mesmo e não há orquestrador com quem conversar.

## Início rápido

Um componente Svelte 5 com props:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

A entry do micro app o envolve. Passar `SvelteMap` permite que atualizações de props re-renderizem o componente no lugar:

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

O shell registra o app e inicia o orquestrador:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: the component re-renders in place, no remount.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

O bundle do cliente precisa resolver `svelte` para o build de navegador. `@sveltejs/vite-plugin-svelte` faz isso por você. Se a sua configuração descartar a condição de export `browser`, o `mount()` do Svelte 5 lança `lifecycle_function_unavailable` e `onMount` nunca roda.

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome do app. O adaptador registra o módulo com esse nome usando `registerModule` de `@tuvix.js/loader`. |
| `App` | `unknown` | obrigatório | Componente raiz: um componente Svelte 5 compilado (uma função) ou uma classe de componente Svelte 3/4. |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Configuração executada uma única vez. O `bootstrap()` do módulo aguarda sua conclusão. |
| `ssr` | `boolean` | `false` | Hidrata a marcação do servidor quando o container contém elementos ou texto que não seja só espaço em branco. Caso contrário, renderiza do zero. |
| `SvelteMap` | classe `SvelteMap` de `svelte/reactivity` | nenhum | Apenas Svelte 5. Com ela, `update()` re-renderiza no lugar; sem ela, um `update()` no Svelte 5 remonta o componente. Svelte 3/4 a ignoram. |

Na primeira montagem, o adaptador importa `svelte` e verifica se existe um export `mount`. Ele guarda o resultado em cache para a página.

- **Svelte 5** (`mount` existe): renderiza com `mount()`, hidrata com `hydrate()` e desmonta com `unmount()`. O funcionamento de `update()` depende de `SvelteMap`:
  - Com `SvelteMap`, o componente recebe um objeto de props apoiado em um `SvelteMap`. `update()` escreve os novos valores nesse map, então as partes do template que leem uma prop alterada são re-renderizadas e o componente mantém seus nós do DOM e seu state. Isso funciona para componentes com `$props()` e para componentes legados com `export let` compilados pelo Svelte 5.
  - Sem ela, `update()` desmonta a instância, esvazia o container, monta uma nova instância com as novas props e dispara `tuvix:mounted` de novo com `hydrated: false`. Nós do DOM, foco e state do componente são perdidos.
- **Svelte 3/4** (sem `mount`): `new App({ target, props, hydrate })`, `$set()` e `$destroy()`.

O módulo retornado funciona por container. Cada container recebe sua própria instância, então um módulo pode renderizar em três containers ao mesmo tempo.

- `mount({ container, props })` limpa o container (a menos que vá hidratar), renderiza, executa os callbacks de `onMount` e os effects e então dispara `tuvix:mounted` no container com `hydrated: true | false`. Uma falha dispara `tuvix:error` e rejeita com o erro original.
- `update({ props, container? })` atualiza a instância em `container`, ou todas as instâncias quando você omite `container`. Cada atualização substitui o conjunto inteiro de props: uma chave ausente nas novas props volta ao valor padrão do componente no Svelte 5 e se torna `undefined` no Svelte 3/4.
- `unmount({ container })` destrói a instância, esvazia o container e dispara `tuvix:unmounted`.

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// Updates the sidebar instance only.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

Equivale a `createSvelteMicroApp({ ...config, ssr: true })`. Use-o no cliente para ilhas que o servidor renderizou com `renderSvelteToString` ou `renderSvelte`.

- **Svelte 5**: `hydrate(App, { target, props })`. A marcação precisa vir de `svelte/server`, porque a hidratação lê os marcadores de comentário (`<!--[-->`) que ele escreve.
- **Svelte 3/4**: `new App({ target, props, hydrate: true })`. Compile o componente com `hydratable: true`.

A hidratação mantém os nós do DOM do servidor e anexa handlers de eventos a eles. Um container que contém apenas espaços em branco ou comentários recebe uma renderização nova.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | nenhum | `render` de `svelte/server`. Sem ela, o adaptador importa `svelte/server` em tempo de execução. |

Renderiza o componente no servidor e retorna suas tags `<style>` seguidas da sua marcação. Coloque a string dentro do container da ilha e monte-a com `createSsrSvelteMicroApp`. A string deixa de fora o conteúdo de `<svelte:head>`; use `renderSvelte` quando precisar dele.

A função escolhe a versão do Svelte em tempo de execução. Com `render` passada, ela sempre segue o caminho do Svelte 5 e chama `render(App, { props })`. Sem ela, o adaptador importa `svelte`: se esse módulo exportar `mount`, ele carrega `svelte/server` e renderiza com Svelte 5. Caso contrário, chama `App.render(props)` (Svelte 3/4, compilado com `generate: 'ssr'`) e envolve `css.code` em uma tag `<style>`. O adaptador nunca decide verificando `App.render`, porque componentes Svelte 5 compilados com `dev: true` (vite-plugin-svelte em modo serve) carregam um stub `App.render` que lança um erro.

Chame-a a partir de uma função de servidor, não de código que também roda no navegador. No navegador ela retorna `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

Recebe os mesmos argumentos e opções que `renderSvelteToString` e retorna as partes separadamente:

| Campo | Significado |
| --- | --- |
| `html` | Marcação do componente. A saída do Svelte 5 inclui os comentários de hidratação. |
| `head` | Conteúdo de `<svelte:head>` sem as tags `<style>` do componente. Coloque-o no `<head>` do documento. |
| `css` | CSS do componente como tags `<style>`, ou `''` quando o compilador não emitiu nenhum. |

No navegador, os três campos são `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### Tipos

| Tipo | Entry | Significado |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | Opções de `createSvelteMicroApp`. |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`: as props que o orquestrador passa ao componente. |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`. |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | Formato do `render` do Svelte 5 de `svelte/server`. |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `{ html, head, css }`, retornado por `renderSvelte`. |

## Renderização no servidor

Uma ilha passa por três etapas: renderizar no servidor, enviar o HTML dentro do container, hidratar no cliente.

1. Chame `renderSvelteToString` (ou `renderSvelte`) em uma função de servidor e coloque o resultado no elemento container.
2. Carregue a entry do cliente, que exporta `createSsrSvelteMicroApp({ name, App })`.
3. O orquestrador monta o app no mesmo container. O adaptador encontra a marcação e a hidrata.

**CSS.** O Svelte 5 coloca o CSS do componente na saída da renderização apenas quando você compila com `css: 'injected'`. Com o padrão `css: 'external'`, o seu bundler escreve o CSS em um arquivo e a string não contém tags `<style>`. No Vite:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

Se você mantiver `css: 'external'`, faça o link da folha de estilo gerada no head da página. [`@tuvix.js/vite`](/pt/packages/vite) informa ao seu servidor quais folhas de estilo uma entry de ilha precisa.

**Uma única cópia do Svelte.** Passe `render` de `svelte/server` quando o seu bundle de servidor incluir o Svelte (Nitro, Vinxi, um build SSR do Vite com `noExternal`). O componente e o renderizador então compartilham uma única cópia do Svelte. Sem a opção, o adaptador importa `svelte/server` em tempo de execução, o que pode carregar uma segunda cópia de `node_modules`. O renderizador de servidor do Svelte usa verificações com `instanceof` e falha quando o componente e o renderizador vêm de cópias diferentes.

## Casos extremos

- `mount` em um container que já contém uma instância do mesmo módulo desmonta a instância antiga primeiro.
- `unmount` chamado enquanto `mount` ainda está carregando `svelte` aguarda a montagem terminar e então destrói a instância. Nenhum componente órfão fica para trás.
- `unmount` em um container que este módulo nunca montou, ou cuja montagem falhou, não faz nada: o container mantém seus filhos e nenhum evento é disparado.
- `update` chamado enquanto uma montagem está pendente aguarda por ela e então aplica as props. Um update para uma montagem que falhou não faz nada.
- No Svelte 3/4, uma prop ausente nas novas props se torna `undefined`. O padrão de `export let name = 'x'` não volta. No Svelte 5 o padrão se aplica, com ou sem `SvelteMap`.
- O adaptador não importa `svelte/reactivity` por conta própria. Svelte 3/4 não têm esse módulo, e um bundler falharia ao gerar o build de um app Svelte 3/4 que o referenciasse, então o import fica na sua entry Svelte 5.
- Uma remontagem no Svelte 5 (sem `SvelteMap`) dispara `tuvix:mounted` de novo, mas nenhum `tuvix:unmounted` entre eles. Se a nova renderização lançar um erro, `update()` rejeita com o erro e a instância antiga já terá sido removida.
- Sem `ssr`, `mount` limpa o container antes de renderizar, então placeholders de carregamento desaparecem.
- Com `ssr`, o adaptador hidrata quando o container tem um elemento ou texto que não seja só espaço em branco. Apenas comentários e espaços em branco disparam uma renderização nova.
- O adaptador detecta a versão do Svelte uma vez por página. Se `import('svelte')` falhar, a próxima montagem tenta de novo.
- Um erro de import ou de renderização do Svelte 5 no servidor chega a você como uma promise rejeitada. O adaptador não recorre a `App.render` como fallback.
- O `render` do Svelte 5 pode retornar uma promise (renderização assíncrona no servidor). As duas funções de servidor aguardam por ela.

## O que ele não faz

- Ele não compila arquivos `.svelte`. O seu bundler faz isso com `@sveltejs/vite-plugin-svelte` ou `svelte/compiler`.
- Ele não verifica qual build do Svelte o seu bundler escolheu. Um bundle de cliente que resolve `svelte` para o build de servidor falha na montagem.
- Ele passa apenas props. Slots, snippets e eventos de componente não têm canal a partir do host. Use [`@tuvix.js/event-bus`](/pt/packages/event-bus) para se comunicar entre apps.
- Ele não escreve o conteúdo de `<svelte:head>` no documento. `renderSvelte` o retorna; o seu servidor o coloca no `<head>`.
- Ele não faz o link do CSS compilado com `css: 'external'`. Veja [`@tuvix.js/vite`](/pt/packages/vite).
- Ele não aguarda dados no servidor. Carregue-os antes e passe-os como props.

## Migração a partir da 0.4

- **Svelte 5 funciona.** Na 0.4 o adaptador chamava `new App()` em todo componente, então componentes Svelte 5 falhavam, e `createSsrSvelteMicroApp` renderizava uma segunda cópia em vez de hidratar. A montagem não exige mudanças no código. Para atualizações de props no lugar, passe `SvelteMap` de `svelte/reactivity` na configuração; sem ele, cada atualização no Svelte 5 remonta o componente.
- **O container é limpo na montagem.** Sem `ssr`, o Svelte 3/4 anexava o componente depois de qualquer marcação já presente no container. Agora o adaptador esvazia o container primeiro. Se você dependia de marcação ao lado do componente, mova-a para fora do container.
- **Sem fallback silencioso no servidor.** `renderSvelteToString` recorria a `App.render` quando `svelte/server` não carregava. Agora ele segue o caminho do Svelte 5 quando você passa `render` ou quando `svelte` exporta `mount`, chama `App.render` apenas no Svelte 3/4 e rejeita em caso de erro de import ou de renderização do Svelte 5. Builds de desenvolvimento do Svelte 5 no SSR de desenvolvimento do Vite seguem o caminho do Svelte 5 mesmo carregando um stub `App.render`.
- **`unmount` em um container desconhecido não faz nada.** `unmount({ container })` em um container que o módulo nunca montou costumava esvaziá-lo. Agora ele deixa o container intacto, como os adaptadores de React, Vue e Angular.
- **Passe `render`.** Adicione `{ render }` de `svelte/server` como terceiro argumento quando o seu bundle de servidor incluir o Svelte:

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

Veja o [guia de Svelte](/pt/guide/svelte) para um app completo.
