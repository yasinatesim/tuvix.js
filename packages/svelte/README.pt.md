# @tuvix.js/svelte

> Bindings Svelte 3/4/5 para o framework de microfrontends Tuvix.js

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalação

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## Início rápido

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

O adaptador registra o módulo com `registerModule` de `@tuvix.js/loader`, então o orquestrador o encontra pelo nome. Na primeira montagem, ele importa `svelte` e verifica se existe um export `mount`:

- **Svelte 5**: `mount()` / `hydrate()` / `unmount()` de `svelte`.
- **Svelte 3/4**: `new App({ target, props })`, `$set()` e `$destroy()`.

Seu bundler precisa resolver `svelte` para o build de cliente (a condição de export `browser`; o `@sveltejs/vite-plugin-svelte` a define). Se ele escolher o build de servidor, o `mount()` do Svelte 5 lança `lifecycle_function_unavailable`.

## API

### `createSvelteMicroApp(config)`

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome do app, registrado com `registerModule` |
| `App` | `unknown` | obrigatório | Componente Svelte 5 ou classe de componente Svelte 3/4 |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Configuração executada uma única vez |
| `ssr` | `boolean` | `false` | Hidrata o markup do servidor quando o container tem algum |
| `SvelteMap` | classe `SvelteMap` | nenhum | Apenas Svelte 5: `SvelteMap` de `svelte/reactivity`, para que `update()` renderize de novo no lugar em vez de remontar |

- Cada container recebe sua própria instância, então um módulo pode ser montado em vários containers.
- `mount` limpa o container (a menos que hidrate), renderiza e dispara `tuvix:mounted` depois que os callbacks de `onMount` e os effects rodaram. Uma montagem que falha dispara `tuvix:error` e rejeita.
- `unmount` destrói a instância, esvazia o container e dispara `tuvix:unmounted`. Se for chamado enquanto `mount` ainda está carregando, ele aguarda a montagem e depois a desfaz.
- `update({ props, container? })` atualiza um container, ou todas as instâncias quando não há `container`. O Svelte 3/4 usa `$set()`. O Svelte 5 remonta por padrão: desmonta a instância, monta uma nova com as novas props e dispara `tuvix:mounted` de novo, então os nós do DOM e o estado do componente se perdem. Passe `SvelteMap` para atualizar no lugar (funciona com `$props()` e `export let`):

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

O adaptador não importa `svelte/reactivity` por conta própria: o Svelte 3/4 não tem esse módulo, e esse import quebraria os builds de apps Svelte 3/4.

O host envia novas props pelo orquestrador:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
});
await orchestrator.start();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

### `createSsrSvelteMicroApp(config)`

Igual a `createSvelteMicroApp({ ...config, ssr: true })`. Hidrata quando o container contém elementos ou texto que não seja só espaço em branco e, caso contrário, renderiza do zero. A hidratação do Svelte 5 precisa dos marcadores de comentário que `svelte/server` escreve. Compile componentes Svelte 3/4 com `hydratable: true`.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString(App, props?, options?)` de `@tuvix.js/svelte/server`

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | nenhum | `render` de `svelte/server`; sem ele, o adaptador importa `svelte/server` em runtime |

Retorna as tags `<style>` do componente seguidas do markup. Quando `render` é passado, sempre usa o `render` do Svelte 5. Sem ele, o adaptador importa `svelte`: se esse módulo exportar `mount`, carrega `svelte/server` (Svelte 5); caso contrário, chama `App.render(props)` (Svelte 3/4) e envolve `css.code` em `<style>`. Componentes Svelte 5 compilados com `dev: true` (vite-plugin-svelte em modo serve) trazem um `App.render` que lança erro, então o adaptador nunca decide com base em `App.render`. Chame-o a partir de uma função de servidor; no navegador ele retorna `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const footerHtml = await renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);
```

### `renderSvelte(App, props?, options?)` de `@tuvix.js/svelte/server`

Mesmas opções. Retorna `{ html, head, css }`, para que você possa colocar o conteúdo de `<svelte:head>` no head do documento.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const { html, head, css } = await renderSvelte(
  Footer,
  { year: 2026 },
  { render }
);
```

### Tipos

`SvelteMicroAppConfig`, `SvelteProps` (de `@tuvix.js/svelte`); `RenderSvelteOptions`, `SvelteServerRender`, `SvelteRenderResult` (de `@tuvix.js/svelte/server`).

## Casos extremos

- O Svelte 5 só emite CSS na saída do servidor quando você compila com `css: 'injected'` (Vite: `svelte({ compilerOptions: { css: 'injected' } })`). Com o padrão `css: 'external'`, seu bundler escreve o CSS em um arquivo.
- Passe `render` de `svelte/server` quando o seu bundle de servidor incluir o Svelte (Nitro, Vinxi, um build SSR do Vite com `noExternal`). O renderizador de servidor do Svelte falha quando o componente e o renderizador vêm de duas cópias do Svelte.
- Cada atualização substitui o conjunto inteiro de props. Uma chave ausente nas novas props é removida no Svelte 5 (o valor padrão se aplica) e definida como `undefined` no Svelte 3/4.
- `mount` em um container já montado desmonta primeiro a instância antiga. `unmount` em um container que o módulo nunca montou não faz nada: deixa os filhos do container no lugar e não dispara nenhum evento.
- Um erro de import ou de renderização do Svelte 5 no servidor rejeita; não há fallback para `App.render`.

## O que ele não faz

- Ele não compila arquivos `.svelte` nem verifica qual build do Svelte o seu bundler escolheu.
- Ele só repassa props: sem slots, snippets nem eventos de componente vindos do host.
- Ele não escreve o conteúdo de `<svelte:head>` no documento nem vincula folhas de estilo `css: 'external'`.

Documentação completa: [tuvix.js.org/packages/svelte](https://tuvix.js.org/packages/svelte)

## Licença

MIT
