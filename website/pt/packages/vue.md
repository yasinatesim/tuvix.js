---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Bindings para Vue"
  description="Transforme um componente Vue 3 em um micro app Tuvix.js com props reativas, um app Vue por container e hidratação SSR. Renderize-o no servidor com renderVueToString."
  icon="💚"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Para renderização no servidor, instale também o renderizador de servidor do Vue, uma dependência peer opcional:

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

O pacote requer Vue 3 (faixa de peer `>=3.0.0`). Ele depende de `@tuvix.js/loader` e `@tuvix.js/event-bus`.

## Quando usar

Use `@tuvix.js/vue` quando um dos micro apps do seu shell Tuvix for um app Vue 3. `createVueMicroApp` envolve o componente raiz no módulo `{ bootstrap, mount, unmount, update }` que o orquestrador e o loader chamam. O orquestrador então o monta em um container, envia novas props com `updateAppProps` e o desmonta na mudança de rota.

Adicione renderização no servidor quando o app Vue precisar aparecer na primeira resposta HTML, para SEO ou para evitar uma área em branco antes de o JavaScript rodar. Renderize o HTML com `renderVueToString` de `@tuvix.js/vue/server` em uma função de servidor, coloque-o no container e hidrate-o com `createSsrVueMicroApp`. Dentro de uma página host React, passe esse HTML para [`TuvixIsland`](/pt/packages/react#tuvixisland).

Se a página inteira for um único app Vue, você não precisa deste pacote; use o `createApp` do próprio Vue ou o Nuxt.

## Início rápido

O componente raiz declara as props que o shell passa:

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

Envolva-o em um módulo:

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Registre-o no shell:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'settings',
  entry: () => import('./micro-apps/settings'),
  container: '#app',
  activeWhen: '/settings/*',
  props: { userId: 'u_42', theme: 'light' },
});

await orchestrator.start();

// Re-renders App with theme="dark"; local component state survives.
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome sob o qual o módulo se registra por meio de `registerModule` de `@tuvix.js/loader`. Os eventos de ciclo de vida o carregam. |
| `App` | `Component` | obrigatório | Componente Vue raiz. |
| `plugins` | `VuePluginEntry[]` | nenhum | Plugins a instalar em cada app Vue. Uma entrada é um plugin ou uma tupla `[plugin, ...options]` passada para `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Configuração executada uma única vez. O `bootstrap()` do módulo aguarda sua conclusão. |
| `ssr` | `boolean` | `false` | Hidrata a marcação do servidor com `createSSRApp` quando o container contém elementos ou texto que não seja só espaço em branco. Um container vazio recebe uma renderização com `createApp`. |

O módulo retornado:

- `mount({ container, props })` cria um app Vue para aquele container, instala os plugins e o monta. Ele dispara `tuvix:mounted` no container com `hydrated: true` quando o Vue adotou a marcação do servidor.
- `update({ props, container })` escreve `props` no objeto de props reativo daquele container e resolve depois que o Vue aplica a re-renderização (`nextTick`). Chaves ausentes nas novas props são removidas. Sem `container`, ele atualiza todos os containers que o módulo montou.
- `unmount({ container })` desmonta o app Vue, esvazia o container com `replaceChildren()` e dispara `tuvix:unmounted`.
- `bootstrap()` executa `config.bootstrap`.

Cada container recebe seu próprio app Vue e suas próprias props, então um módulo pode ser montado em vários lugares ao mesmo tempo:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### Lendo props nos componentes

O adaptador mantém as props em um objeto `shallowReactive` e renderiza `App` por meio de um wrapper raiz que as passa como props do componente. O wrapper não renderiza nenhum DOM próprio. Você lê as props de uma de duas formas:

- **`defineProps`** no componente raiz. `update` o re-renderiza com os novos valores.
- **`inject('tuvixProps')`** (ou `inject(TUVIX_PROPS_KEY)`) em qualquer componente da árvore. Você recebe o mesmo objeto reativo, então um `computed` que o lê é atualizado após `update`. Use-o em filhos profundos em vez de repassar props.

```vue
<!-- src/micro-apps/settings/ThemeLabel.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

const tuvixProps = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
const theme = computed(() => String(tuvixProps.theme ?? 'light'));
</script>

<template>
  <span>Theme: {{ theme }}</span>
</template>
```

#### Plugins com opções

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import type { VuePluginEntry } from '@tuvix.js/vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';

const analytics = {
  install(app: VueApp, options: { siteId: string }) {
    app.provide('analyticsSiteId', options.siteId);
  },
};

const plugins: VuePluginEntry[] = [[analytics, { siteId: 'site-42' }]];

export default createVueMicroApp({ name: 'checkout', App, plugins });
```

Cada container recebe seu próprio app Vue, então cada montagem chama `app.use` de novo para cada plugin. Um objeto de plugin com estado, como um único resultado de `createPinia()`, é compartilhado por todos os containers do módulo.

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

Equivale a `createVueMicroApp({ ...config, ssr: true })`. Opções: `name`, `App`, `plugins`, `bootstrap`, como na tabela acima.

Quando o container contém marcação de `renderVueToString`, o Vue adota esses nós do DOM por meio de `createSSRApp` e anexa listeners a eles. O servidor e o cliente usam o mesmo wrapper raiz, então as árvores de componentes correspondem. Monte com as mesmas props usadas na renderização no servidor:

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

Importe-o do subpath `@tuvix.js/vue/server`.

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| Argumento | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `App` | `Component` | obrigatório | Componente raiz, o mesmo que você passa para `createSsrVueMicroApp`. |
| `props` | `Record<string, unknown>` | `{}` | Props para `App`. `inject('tuvixProps')` também as enxerga durante o SSR. |
| `plugins` | `VuePluginEntry[]` | nenhum | Plugins a instalar, com a mesma forma de tupla de `createVueMicroApp`. |
| `ssrContext` | `VueSsrContext` | `{}` | Objeto em que o Vue escreve durante a renderização. Leia `teleports` e `modules` depois que a promise resolver. |

Ele cria um app SSR com o wrapper raiz compartilhado, instala os plugins e retorna o HTML de `renderToString` de `@vue/server-renderer`. Instale esse pacote; `renderVueToString` o importa na primeira chamada.

`renderVueToString` é exclusivo do servidor. Chame-o a partir de uma função de servidor (um handler `createServerFn` do TanStack Start, uma rota de API, o seu handler Express), não a partir de um loader de rota isomórfico. Um loader também roda no navegador durante a navegação no cliente, onde a função retorna `''`, e o seu bundler envia o renderizador de servidor do Vue para o cliente porque o loader o importa.

```ts
// src/server/contact.ts
import { createServerFn } from '@tanstack/react-start';
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from '../micro-apps/contact/App.vue';

export const renderContact = createServerFn().handler(async () => {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return { html, teleports: ssrContext.teleports ?? {} };
});
```

Coloque `html` dentro do elemento container (`<div id="contact">…</div>`) na sua página e depois monte `createSsrVueMicroApp` no cliente, como mostrado acima. O HTML de um alvo de `<Teleport>` fica em `ssrContext.teleports['#target']`, não na string retornada; imprima-o onde o alvo estiver.

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

Chave de injeção do objeto de props reativo. `inject(TUVIX_PROPS_KEY)` e `inject('tuvixProps')` retornam o mesmo objeto, no cliente e durante `renderVueToString`.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe;
```

Inscreve `handler` em `event` em `onMounted` e cancela a inscrição em `onUnmounted`. A função retornada cancela a inscrição antecipadamente. Chame-a durante o `setup`. `onMounted` não roda durante a renderização no servidor, então a inscrição existe apenas no cliente.

O adaptador não passa o bus do orquestrador para `App`. O orquestrador usa `getGlobalBus()`, a menos que você tenha passado opções `eventBus` a ele:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);

useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
  count.value = items.length;
});
</script>

<template>
  <span>{{ count }}</span>
</template>
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): ShallowRef<T>;
```

| Argumento | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `initialProps` | `T` | obrigatório | Valor inicial, copiado uma vez. |
| `bus` | `IEventBus` | nenhum | Bus a escutar. Sem ele, a ref mantém `initialProps`. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Evento cujo payload o composable mescla na ref (`{ ...prev, ...payload }`). |

Nem o orquestrador nem o adaptador emitem `tuvix:props:update`; você mesmo o emite. Para props vindas do orquestrador, use `defineProps` ou `inject(TUVIX_PROPS_KEY)`, que acompanham `update` sem um bus.

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### Tipos

| Tipo | Exportado de | Significado |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | Configuração de `createVueMicroApp`: `name`, `App`, `plugins?`, `bootstrap?`, `ssr?`. |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `VueMicroAppConfig` sem `ssr`; configuração de `createSsrVueMicroApp`. |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`: um plugin, ou um plugin mais suas opções de `app.use`. |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`, preenchido pelo Vue e seus plugins durante `renderVueToString`. `@vitejs/plugin-vue` registra em `modules` os módulos de componentes renderizados. |

## Casos extremos

- **Erros de montagem.** Erros de setup, de renderização e de hooks de ciclo de vida durante `mount` rejeitam a promise em builds de desenvolvimento e de produção. O adaptador desmonta o app que falhou e dispara `tuvix:error`. O `app.config.errorHandler` de um plugin ainda recebe o erro.
- **Montar duas vezes no mesmo container.** Um segundo `mount` em um container que o módulo já controla desmonta o app antigo primeiro (disparando `tuvix:unmounted` e esvaziando o container) e depois monta um novo. Com `ssr: true`, essa segunda montagem renderiza do zero, porque o container está vazio.
- **Container desconhecido.** `unmount` em um container que o módulo nunca montou não faz nada. `update` com um `container` desse tipo não altera nada.
- **As props são substituídas.** O `update` do módulo define as props como o objeto que você passa e apaga as chaves ausentes. `orchestrator.updateAppProps` mescla as novas props sobre as registradas antes de chamar `update`.
- **Props não declaradas.** Props que o componente raiz não declara com `defineProps` chegam a ele como atributos e passam para o seu elemento raiz, como o Vue faz com qualquer componente. `{ lang: 'en' }` renderiza `lang="en"` no elemento raiz, a menos que você declare `lang` ou defina `inheritAttrs: false`.
- **Container só com espaços em branco e `ssr: true`.** O adaptador renderiza com `createApp`, porque `hasServerMarkup` ignora texto de espaço em branco e comentários. O Vue não emite aviso sobre hidratar um container vazio.
- **`renderVueToString` no navegador.** Ele retorna `''` quando `window` existe.
- **Erro na desmontagem.** Se `app.unmount()` lançar um erro, o adaptador esvazia o container, dispara `tuvix:error` e relança o erro.
- **O mesmo nome duas vezes.** `registerModule` mantém o último módulo criado com um mesmo nome.

## O que ele não faz

- Ele não suporta Vue 2.
- Ele não carrega módulos por URL. Importe o módulo ou deixe que [`@tuvix.js/core`](/pt/packages/core) o carregue por meio de um `entry`.
- Ele não passa `MountContext.bus` nem `MountContext.name` para os seus componentes. Use `getGlobalBus()` de `@tuvix.js/event-bus`.
- `renderVueToString` não faz streaming e não coleta CSS. Use [`@tuvix.js/vite`](/pt/packages/vite) para imprimir links de folhas de estilo para ilhas renderizadas no servidor.
- Ele não posiciona o HTML teleportado por você. Leia `ssrContext.teleports` e imprima-o.

## Migração a partir da 0.4

**`$tuvixProps` foi removido.** `update()` não escreve mais `app.config.globalProperties.$tuvixProps`. Leia as props com `defineProps` ou `inject`:

```vue
<!-- Before (0.4) -->
<template>
  <span>{{ $tuvixProps.theme }}</span>
</template>
```

```vue
<!-- After (0.5) -->
<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<template>
  <span>{{ theme }}</span>
</template>
```

**`unmount` em um container desconhecido não faz nada.** Na 0.4 ele limpava o container. Chame `container.replaceChildren()` você mesmo se dependia disso.

**`VueSsrMicroAppConfig` não tem o campo `ssr`.** Remova `ssr` da configuração que você passa para `createSsrVueMicroApp`.

**Objeto de configuração.** Versões anteriores desta página mostravam `createVueMicroApp(App)`. A função recebe um objeto de configuração: `createVueMicroApp({ name: 'settings', App })`.

Veja o [guia de Vue](/pt/guide/vue) para mais exemplos passo a passo.
