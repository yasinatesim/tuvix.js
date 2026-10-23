# Com Vue

`@tuvix.js/vue` transforma um componente raiz Vue 3 em um micro app, hidrata markup renderizado no servidor e renderiza componentes para HTML no servidor.

## Instalação

```bash
pnpm add @tuvix.js/vue vue
# for renderVueToString on the server
pnpm add @vue/server-renderer
```

## Transforme um componente em micro app

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `name` | `string` | Obrigatório. Deve ser igual ao nome do app registrado. |
| `App` | `Component` | Obrigatório. Componente raiz. |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | Instalados com `app.use(plugin, ...options)` em cada montagem. |
| `bootstrap` | `() => void \| Promise<void>` | Roda uma vez antes da primeira montagem. |
| `ssr` | `boolean` | Hidrata markup do servidor. `createSsrVueMicroApp` define essa opção. |

Cada container recebe o seu próprio app Vue, então cada montagem executa de novo o `install` de cada plugin. Uma instância de plugin como `createPinia()` é compartilhada por todas as montagens do módulo. Crie-a dentro de uma função de plugin quando cada montagem precisar da sua própria store.

Montar em um container que já contém este app desmonta antes a instância antiga. `unmount` destrói o app, esvazia o container e dispara `tuvix:unmounted`.

## Props

O adaptador passa as props para o componente raiz e também as fornece sob `'tuvixProps'` (`TUVIX_PROPS_KEY`) para qualquer descendente:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })` substitui as props em um objeto `shallowReactive` e espera o próximo tick do Vue. O componente raiz renderiza de novo com os novos valores e mantém o seu state local. Chaves ausentes nas novas props são removidas. Sem `container`, `update` atualiza todas as montagens do módulo.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## Renderização no servidor e hidratação

Renderize no servidor com `renderVueToString` e hidrate no cliente com `createSsrVueMicroApp`:

```ts
// server-only module
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports holds <Teleport> output
}
```

```ts
// client
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)` envolve `App` na mesma raiz que o cliente usa, então `inject('tuvixProps')` funciona no servidor e a hidratação corresponde.
- Chame-o apenas a partir de código de servidor: uma server function, uma rota de API ou a sua entry de servidor. No navegador, ele retorna `''`. Um loader de rota isomórfico também roda no navegador, e o bundler acaba enviando o renderizador de servidor do Vue para o cliente.
- Com `ssr: true` e markup do servidor no container, o adaptador chama `createSSRApp` e mantém os nós de DOM do servidor. Um container vazio recebe uma renderização nova com `createApp`.
- O HTML não contém CSS. O Vite injeta os blocos `<style>` dos SFCs a partir do JavaScript, depois que a hidratação começa. Vincule as folhas de estilo no `<head>` com `@tuvix.js/vite`; veja [Ilhas SSR](/pt/guide/ssr-islands).

Dentro de um host React, monte o módulo com `TuvixIsland`.

## Composables

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

Ele assina em `onMounted`, cancela a assinatura em `onUnmounted` e retorna uma função para limpeza antecipada.

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` retorna um `ShallowRef` que incorpora cada payload emitido em `updateEvent`. Nada no Tuvix.js emite esse evento. Com o adaptador, as props passadas por `updateAppProps` já renderizam o componente de novo, então raramente você vai precisar dele.

## Casos extremos

- Aliases de caminho como `~/utils` também precisam ser resolvidos em arquivos `.vue`. Se o seu alias vem de `vite-tsconfig-paths`, inclua `**/*.vue` no `include` desse tsconfig, ou defina `resolve.alias` na configuração do Vite. Veja [Solução de problemas](/pt/guide/troubleshooting).
- Um erro de setup, de renderização ou de hook de ciclo de vida durante a montagem rejeita `mount` e dispara `tuvix:error`, inclusive em builds de produção. O `app.config.errorHandler` próprio de um plugin continua rodando.
- `unmount` em um container que este módulo nunca montou não faz nada.

## API

| Export | Finalidade |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Módulo de micro app Vue |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | O mesmo com `ssr: true` |
| `TUVIX_PROPS_KEY` | Chave de injeção (`'tuvixProps'`) para as props reativas |
| `useTuvixBus(bus, event, handler)` | Assinatura do event bus vinculada ao componente |
| `useTuvixProps(initial, bus?, event?)` | `ShallowRef` mesclado a partir de eventos do bus |
| `renderVueToString(App, props?, plugins?, ssrContext?)` de `@tuvix.js/vue/server` | HTML do servidor |
