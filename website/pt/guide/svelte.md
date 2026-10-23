# Com Svelte

`@tuvix.js/svelte` transforma um componente Svelte em um micro app. Ele suporta Svelte 5 e Svelte 3/4, hidrata markup do servidor e renderiza componentes para HTML no servidor.

## Instalação

```bash
pnpm add @tuvix.js/svelte svelte
```

## Transforme um componente em micro app

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

Na primeira montagem, o adaptador importa `svelte` e verifica qual API ele tem:

| Svelte | Montagem | Hidratação | Atualização | Desmontagem |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | no lugar com `SvelteMap`, senão remonta | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

O seu bundler precisa resolver `svelte` para o build de navegador. Se ele escolher o build de servidor, o `mount()` do Svelte 5 lança `lifecycle_function_unavailable`, ou os callbacks de `onMount` nunca rodam. Veja [Solução de problemas](/pt/guide/troubleshooting).

Cada container recebe a sua própria instância de componente. `mount` dispara `tuvix:mounted` depois que os callbacks de `onMount` e os effects rodaram. Sem `ssr`, `mount` esvazia o container antes de renderizar. `unmount` em um container que este módulo nunca montou, ou cuja montagem falhou, não faz nada.

## Props

Svelte 5 com runes:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4, ou Svelte 5 em modo legado:

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

No Svelte 5, passe `SvelteMap` de `svelte/reactivity` na configuração. O adaptador então entrega ao componente um objeto de props apoiado em um `SvelteMap`, e `update({ props })` escreve os novos valores nele: só as partes que leem uma prop alterada renderizam de novo, e os nós de DOM e o state do componente são preservados. Isso funciona para `$props()` e para `export let`. Sem `SvelteMap`, um `update()` no Svelte 5 desmonta a instância, monta uma nova com as novas props e dispara `tuvix:mounted` de novo, então o state local é reiniciado. O adaptador não importa `svelte/reactivity` por conta própria, porque esse módulo não existe no Svelte 3/4 e os builds dessas versões falhariam.

No Svelte 3/4, `update` chama `$set` e ignora `SvelteMap`.

Cada atualização substitui o conjunto inteiro de props. Uma chave ausente nas novas props volta ao valor padrão da prop no Svelte 5 e vira `undefined` no Svelte 3/4. O orquestrador sempre envia as props mescladas, então isso só importa quando você mesmo chama `update`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## Renderização no servidor e hidratação

```ts
// server-only module
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooter(): Promise<string> {
  return renderSvelteToString(Footer, { year: 2026 }, { render });
}
```

```ts
// client
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

- `renderSvelteToString(App, props?, { render? })` retorna as tags `<style>` do componente seguidas do seu markup. Chame-o a partir de código de servidor; no navegador, ele retorna `''`.
- Passe `render` de `svelte/server` quando o seu bundle de servidor inclui o Svelte (Nitro, Vinxi, um build SSR do Vite com `noExternal`). Sem ele, o adaptador importa `svelte/server` em tempo de execução, o que pode carregar uma segunda cópia do Svelte, e o renderizador de servidor do Svelte falha entre cópias diferentes.
- `renderSvelte(App, props?, { render? })` retorna `{ html, head, css }` quando você precisa da saída de `<svelte:head>`. Coloque `head` no `<head>` do documento você mesmo; a ilha não deve conter `<title>` nem `<meta>`.
- `createSsrSvelteMicroApp` hidrata quando o container contém elementos ou texto que não seja só espaço em branco, e faz uma renderização nova caso contrário. Componentes Svelte 3/4 precisam ser compilados com `hydratable: true`.

### CSS na primeira pintura

Escolha uma opção:

- **CSS no HTML.** Compile com `compilerOptions: { css: 'injected' }`. O Svelte 5 então coloca o CSS do componente na saída do servidor, e `renderSvelteToString` o inclui como tags `<style>` dentro da ilha.
- **CSS em arquivos.** Mantenha o padrão `emitCss: true` e vincule as folhas de estilo da ilha no `<head>` com `@tuvix.js/vite`. Veja [Ilhas SSR](/pt/guide/ssr-islands).

Com `css: 'injected'` não existe arquivo de folha de estilo, então `@tuvix.js/vite` não encontra nada para vincular. Não combine as duas opções.

## Event bus

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let count = $state(0);
  const off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });
  onDestroy(off);
</script>

<span class="badge">{count}</span>
```

## O que o adaptador não faz

- Ele não compila arquivos `.svelte`; quem faz isso é o `@sveltejs/vite-plugin-svelte`.
- Ele passa apenas props. Slots, snippets e eventos de componente não atravessam a partir do host.
- Ele não verifica qual build do Svelte o seu bundler escolheu.

## API

| Export | Finalidade |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Módulo de micro app Svelte |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | O mesmo com `ssr: true` |
| `renderSvelteToString(App, props?, options?)` de `@tuvix.js/svelte/server` | Estilos + markup |
| `renderSvelte(App, props?, options?)` de `@tuvix.js/svelte/server` | `{ html, head, css }` |
