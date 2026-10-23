# Micro Apps

Um micro app é um módulo com as funções `mount` e `unmount`. O shell chama `mount` com um elemento container e props; o app é renderizado nesse elemento. O shell chama `unmount` quando o app deve sair da página; o app remove o que renderizou.

## O formato do módulo

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  bootstrap: async () => {},
  mount: async ({ container, props, name, bus }) => {
    container.textContent = `${name ?? 'app'} mounted`;
    void props;
    void bus;
  },
  update: async ({ props, container }) => {
    if (container) container.dataset.props = JSON.stringify(props);
  },
  unmount: async ({ container }) => {
    container.replaceChildren();
  },
};
```

| Hook | Obrigatório | Chamado |
| --- | --- | --- |
| `bootstrap()` | não | Uma vez, após o primeiro carregamento, antes do primeiro `mount`. |
| `mount({ container, props, name, bus })` | sim | Toda vez que o app se torna ativo. |
| `update({ props, container })` | não | Quando o shell chama `updateAppProps` enquanto o app está montado. |
| `unmount({ container })` | sim | Toda vez que o app se torna inativo. |

Cada hook pode retornar uma promise. O orquestrador espera por ela antes do próximo passo.

## Escrever um à mão

`defineMicroApp` valida os hooks, registra o módulo com o `name`, dispara `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error` no container e retorna o módulo:

```ts
import { defineMicroApp } from '@tuvix.js/core';

let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'notifications',

  mount({ container, props, bus }) {
    const list = document.createElement('ul');
    container.replaceChildren(list);
    off = bus?.on<{ text: string }>('notify', ({ text }) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    container.dataset.user = String(props?.user ?? '');
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.replaceChildren();
  },
});
```

Use o `bus` do contexto de montagem. Ele é o bus do orquestrador, que é `getGlobalBus()`, a menos que o shell tenha passado opções de `eventBus`.

## Usar um adaptador

Os adaptadores constroem o módulo a partir de um componente e cuidam de detalhes que você teria de escrever:

- uma instância do framework por container, para que um módulo possa ser montado em vários lugares;
- `update` renderiza de novo com as novas props, sem remontar;
- um `unmount` que chega enquanto `mount` ainda está carregando espera e deixa o container vazio;
- eventos `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error` no container;
- hidratação de markup renderizado no servidor quando você passa `ssr: true`.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## Expor o módulo ao loader

O orquestrador obtém um módulo pelo `entry` do app:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

// Bundled with the shell, code-split by your bundler.
orchestrator.register({
  name: 'cart',
  entry: () => import('./apps/cart'),
  container: '#cart',
  activeWhen: '/shop/*',
});

// Deployed on its own. The script registers itself by name.
orchestrator.register({
  name: 'notifications',
  entry: { scripts: ['https://cdn.example.com/notifications/main.js'], type: 'module' },
  container: '#notifications',
  activeWhen: '/',
});
```

Em uma entry com URL, o módulo deve chamar `registerModule(name, module)` (os adaptadores e `defineMicroApp` fazem isso) ou expor um global UMD com uma função `mount`. Uma função de carregamento só precisa resolver para o módulo ou para `{ default: module }`.

## Passar props

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

await orchestrator.updateAppProps('profile', { theme: 'light' });
// The app now has { userId: '42', theme: 'light' }.
```

- As props são mescladas de forma rasa. Para remover uma chave, defina-a como `undefined`.
- Quando o app está montado e tem `update`, o orquestrador o chama e resolve depois que ele termina. Um `update` rejeitado coloca o app no status `error` e chama `onError`.
- Quando o app não está montado, ou não tem `update`, o orquestrador guarda as props mescladas para a próxima montagem. Ele não remonta o app.

## Montar um módulo em vários lugares

Os adaptadores mantêm uma instância separada por container. `TuvixIsland` e o seu próprio código podem chamar `mount` em dois containers com o mesmo módulo:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Price from './Price.vue';

const price = createVueMicroApp({ name: 'price', App: Price });

const first = document.querySelector<HTMLElement>('#price-1');
const second = document.querySelector<HTMLElement>('#price-2');
if (first && second) {
  await price.mount({ container: first, props: { sku: 'a' } });
  await price.mount({ container: second, props: { sku: 'b' } });
  await price.update?.({ props: { sku: 'c' }, container: second }); // only #price-2
}
```

Sem `container`, `update` atualiza todas as montagens desse módulo. O orquestrador sempre passa `container`.

## Build e deploy

Faça o build de cada app como um bundle ES module e registre-o com `type: 'module'`, ou como um bundle IIFE/UMD e registre a URL dele como script clássico. Com o Vite:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Leave dependencies bundled unless the shell provides them.
  },
});
```

Fique atento às cópias de framework: dois micro apps que incluem o React em seus bundles enviam o React duas vezes. A página continua funcionando, porque cada app renderiza a própria raiz. Para compartilhar uma única cópia, use import maps, Module Federation (`@tuvix.js/module-federation`) ou faça o shell incluir os apps no bundle por meio de entries com função de carregamento.

## O que um micro app não deve fazer

- Escrever fora do seu container. O Tuvix.js não impede isso, e o próximo app nesse container não vai esperar por isso.
- Deixar listeners, timers ou inscrições para trás depois de `unmount`.
- Contar com `bootstrap` rodando mais de uma vez. Ele roda uma vez por módulo carregado.
