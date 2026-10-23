# @tuvix.js/event-bus

> Bus síncrono de publish/subscribe para mensagens entre micro apps, com um bus global por página.

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentação completa: [tuvix.js.org/packages/event-bus](https://tuvix.js.org/packages/event-bus).

## Instalação

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Início rápido

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

O orquestrador de `@tuvix.js/core` usa `getGlobalBus()` (a menos que você passe opções em `eventBus`) e o repassa a todos os apps como `bus` no contexto de montagem.

## API

### `EventBus` e `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Quantidade por evento a partir da qual `on` imprime um `console.warn` quando você adiciona mais um, uma vez por nome de evento, com ou sem `debug`. O listener é adicionado mesmo assim. `0` significa sem aviso. |
| `debug` | `boolean` | `false` | Registra no log as chamadas de inscrição, cancelamento de inscrição e emissão. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Recebe a saída de debug. |

| Método | Comportamento |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | Faz a inscrição; retorna uma função de remoção. |
| `once<T>(event, handler): Unsubscribe` | Remove o handler antes da primeira chamada. Cancele-o pela função retornada, não por `off`. |
| `emit<T>(event, data?)` | Chama os handlers do evento em ordem e depois os handlers de `onAny`, antes de retornar. Um handler que lança erro é registrado com `console.error`; os demais continuam rodando. |
| `off(event, handler)` | Remove um handler. |
| `offAll(event?)` | Remove os handlers de um evento, ou todos os handlers, incluindo os de `onAny`. |
| `onAny(handler): Unsubscribe` | O handler recebe `(eventName, data)` para todo evento. |
| `offAny(handler)` | Remove um handler de `onAny`. |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | Inspecionam as inscrições; handlers de `onAny` não são contados. |
| `destroy()` | Remove todos os handlers. Chamadas posteriores a `on`, `once`, `emit` e `onAny` lançam erro. |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

Retorna o bus compartilhado da página, armazenado em `window.__TUVIX_GLOBAL_BUS__`, então micro apps que empacotam sua própria cópia deste pacote recebem a mesma instância. As `options` só se aplicam na chamada que o cria. Sem `window`, o bus é um singleton no nível do módulo.

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

Destrói o bus global; o próximo `getGlobalBus()` cria um novo. Referências antigas lançam erro ao serem usadas. Feito para testes.

### Tipos

`EventHandler<T>` (`(data: T) => void`), `WildcardHandler<T>` (`(eventName: string, data: T) => void`), `Unsubscribe` (`() => void`), `EventBusOptions`, `IEventBus`.

## Casos extremos

- `emit` trabalha sobre uma cópia da lista de handlers: handlers adicionados durante uma emissão rodam a partir da próxima emissão.
- A mesma função inscrita duas vezes em um evento é armazenada uma única vez.
- `emit` não aguarda handlers assíncronos; as rejeições deles ficam sem tratamento.
- Nomes de evento vazios ou só com espaços lançam `[Tuvix EventBus] Event name must be a non-empty string.`
- Um micro app que empacota a 0.4 deste pacote mantém seu próprio bus.

## O que ele não faz

- Sem tipagem por mapa de eventos; passe o tipo do payload como `on<T>` / `emit<T>`.
- Sem replay para inscritos tardios, sem padrões `user:*`, sem mensagens entre abas ou iframes.

## Licença

MIT
