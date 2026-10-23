# Event Bus

`@tuvix.js/event-bus` é um canal publish/subscribe síncrono. Os apps de uma página o usam para avisar uns aos outros sobre o que aconteceu ("cart updated", "user logged out") sem importar o código uns dos outros.

## Escolha um bus

| Bus | Como obter | Quando usar |
| --- | --- | --- |
| Bus global | `getGlobalBus()` | Padrão. Todos os apps da página, em qualquer bundle, recebem a mesma instância. |
| Bus do orquestrador | `orchestrator.getEventBus()` ou `bus` no contexto de montagem | Dentro de micro apps. É o bus global, a menos que o shell tenha passado opções de `eventBus`. |
| Bus privado | `createEventBus(options)` | Testes, ou um canal que só um app usa. |

`getGlobalBus()` guarda sua instância em `window.__TUVIX_GLOBAL_BUS__`. Dois micro apps que incluem `@tuvix.js/event-bus` cada um no próprio bundle ainda a compartilham. No servidor, sem `window`, cada cópia do módulo tem a sua.

## Emita e assine

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit` chama todos os handlers antes de retornar. Um handler que lança um erro é registrado com `console.error`; os demais handlers continuam rodando. Nada fica em fila: um assinante que entra depois de um `emit` não o recebe.

## Eventos tipados

O genérico em `on`, `once` e `emit` tipa o payload. Para um mapa válido em todo o projeto, encapsule o bus:

```ts
import { getGlobalBus, type IEventBus } from '@tuvix.js/event-bus';

export interface AppEvents {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'cart:updated': { itemCount: number; total: number };
}

export function emit<E extends keyof AppEvents>(bus: IEventBus, event: E, payload: AppEvents[E]): void {
  bus.emit(event, payload);
}

export function on<E extends keyof AppEvents>(
  bus: IEventBus,
  event: E,
  handler: (payload: AppEvents[E]) => void,
): () => void {
  return bus.on<AppEvents[E]>(event, handler);
}

emit(getGlobalBus(), 'cart:updated', { itemCount: 3, total: 42 });
```

## Use o bus em um micro app

Pegue o bus do contexto de montagem e cancele as assinaturas em `unmount`:

```ts
import { defineMicroApp } from '@tuvix.js/core';

const subscriptions: Array<() => void> = [];

export default defineMicroApp({
  name: 'header',

  mount({ container, bus }) {
    const badge = document.createElement('span');
    container.replaceChildren(badge);
    if (!bus) return;
    subscriptions.push(
      bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
        badge.textContent = String(itemCount);
      }),
      bus.on('user:logout', () => {
        badge.textContent = '';
      }),
    );
  },

  unmount({ container }) {
    for (const off of subscriptions.splice(0)) off();
    container.replaceChildren();
  },
});
```

Componentes React e Vue podem usar `useTuvixBus(bus, event, handler)`, que cancela a assinatura quando o componente é desmontado. Veja [React](/pt/guide/react) e [Vue](/pt/guide/vue).

## once e curingas

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

Os handlers de `onAny` rodam depois dos handlers nomeados em todos os eventos, incluindo os eventos `tuvix:app:*` do orquestrador.

## Remova listeners

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // one handler
bus.offAll('ping'); // every handler for 'ping'
bus.offAll(); // every handler, wildcards included
```

Chame `offAll()` no bus global somente quando a página inteira for sua. Ele remove também os listeners de outros apps.

## Erros e buses destruídos

- `on`, `once`, `emit` e `onAny` lançam um erro para um nome de evento vazio ou um handler que não é função.
- Depois de `bus.destroy()`, todo método que assina ou emite lança um erro. `resetGlobalBus()` destrói o bus global; a próxima chamada a `getGlobalBus()` cria um novo.
- `orchestrator.destroy()` destrói apenas um bus privado.

## Introspecção

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## O que o bus não faz

- Ele não persiste nem reproduz eventos. Passe o estado atual como props, ou faça o app que chega depois pedir esse estado com um evento que o dono responde.
- Ele não atravessa janelas, abas ou iframes. Use `BroadcastChannel` ou `postMessage` para isso.
- Ele não valida payloads em tempo de execução. Os genéricos valem só em tempo de compilação.
