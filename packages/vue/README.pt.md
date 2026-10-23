# @tuvix.js/vue

> Transforme componentes Vue 3 em micro apps Tuvix.js com props reativas, um app Vue por container e hidratação SSR.

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalação

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Para renderização no servidor, instale também o peer opcional `@vue/server-renderer`.

## Início rápido

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

O módulo se registra como `'settings'` por meio de `registerModule` de `@tuvix.js/loader`, então o orquestrador o encontra depois que o script carrega. `App` recebe as props do orquestrador como props do componente; declare-as com `defineProps`.

## API

### `createVueMicroApp(config)`

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome no registro; os eventos de ciclo de vida o carregam. |
| `App` | `Component` | obrigatório | Componente Vue raiz. |
| `plugins` | `VuePluginEntry[]` | nenhum | Plugins, ou tuplas `[plugin, ...options]` repassadas a `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Configuração executada uma única vez. |
| `ssr` | `boolean` | `false` | Hidrata o markup do servidor com `createSSRApp` quando o container tem elementos ou texto que não seja só espaço em branco. |

- Cada container recebe seu próprio app Vue e suas próprias props, então um módulo pode ser montado em vários lugares. Cada montagem instala os plugins de novo.
- `mount({ container, props })` dispara `tuvix:mounted` com `hydrated`.
- `update({ props, container })` substitui as chaves de um objeto de props `shallowReactive` (chaves ausentes são removidas) e resolve depois de `nextTick`. Sem `container`, atualiza todas as montagens. O estado do componente é preservado.
- `unmount({ container })` desmonta o app, esvazia o container e dispara `tuvix:unmounted`.

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })`. Opções: `name`, `App`, `plugins`, `bootstrap`. O Vue adota o markup de `renderVueToString`; um container vazio recebe uma renderização normal.

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

De `@tuvix.js/vue/server`. Retorna o HTML de `App` renderizado com o mesmo wrapper raiz que o cliente usa, então a hidratação corresponde e `inject('tuvixProps')` funciona no servidor. O Vue escreve `teleports` e `modules` em `ssrContext`.

Apenas no servidor: chame-o a partir de uma função de servidor, não de um loader de rota isomórfico. No navegador ele retorna `''`, e um loader que o importa envia o renderizador de servidor do Vue para o cliente.

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'`. `inject(TUVIX_PROPS_KEY)` retorna o objeto de props reativo em que `update` escreve, em qualquer componente da árvore.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

Faz a inscrição em `onMounted`, cancela a inscrição em `onUnmounted` e retorna uma função para cancelar a inscrição antes. Passe `getGlobalBus()` de `@tuvix.js/event-bus`; o adaptador não entrega o bus do orquestrador a `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Retorna um `ShallowRef<T>` que mescla cada payload de `updateEvent` (padrão `'tuvix:props:update'`) em `bus`. Nada no Tuvix emite esse evento; quem o emite é você. Para props do orquestrador, use `defineProps` ou `inject(TUVIX_PROPS_KEY)`.

### Tipos

`VueMicroAppConfig`, `VueSsrMicroAppConfig`, `VuePluginEntry` de `@tuvix.js/vue`; `VueSsrContext` de `@tuvix.js/vue/server`.

## Casos extremos

- Erros de setup, renderização e hooks durante `mount` rejeitam tanto em builds de desenvolvimento quanto de produção; o adaptador desmonta o app que falhou e dispara `tuvix:error`. O `app.config.errorHandler` de um plugin continua rodando.
- `mount` em um container que o módulo já controla desmonta primeiro o app antigo.
- `unmount` em um container que o módulo nunca montou não faz nada.
- Props que o componente raiz não declara passam como atributos no elemento raiz dele.
- Com `ssr: true`, um container que contém apenas espaço em branco ou comentários recebe uma renderização do zero.

## O que ele não faz

- Suportar Vue 2.
- Carregar módulos por URL. Use `@tuvix.js/core` ou `@tuvix.js/loader`.
- Coletar CSS ou fazer streaming de HTML no servidor. Use `@tuvix.js/vite` para os links de folhas de estilo.

## Breaking changes na 0.5

- `update()` não escreve mais em `app.config.globalProperties.$tuvixProps`. Use `defineProps` ou `inject('tuvixProps')`.
- `unmount()` em um container que o módulo nunca montou não faz nada; antes, ele limpava o container.
- `VueSsrMicroAppConfig` não aceita mais `ssr`.

Documentação completa: [tuvix.js.org/packages/vue](https://tuvix.js.org/packages/vue)

## Licença

MIT
