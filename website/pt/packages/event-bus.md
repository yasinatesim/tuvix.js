---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="Bus publish/subscribe síncrono para mensagens entre micro apps. Um bus global por página, compartilhado por todas as cópias empacotadas do pacote."
  icon="📡"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Quando usar

Os micro apps de uma página precisam avisar uns aos outros sobre coisas: o app do carrinho anuncia `cart:updated` e o header mostra a nova contagem. O event bus permite que eles façam isso pelo nome do evento, sem importar uns aos outros.

O orquestrador de `@tuvix.js/core` usa `getGlobalBus()` e o entrega a cada app como `bus` no contexto de montagem. Dentro de um micro app, use esse `bus` ou chame `getGlobalBus()`; os dois retornam a mesma instância. Crie um bus privado com `createEventBus()` para testes ou para mensagens que ficam dentro de um único app.

Escolha outra solução para estado que um assinante que chega depois precisa ler (um store, ou a URL) e para mensagens entre abas ou iframes (`BroadcastChannel`, `postMessage`).

## Início rápido

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

interface CartUpdated {
  itemCount: number;
  total: number;
}

const bus = getGlobalBus();

// header app
const stop = bus.on<CartUpdated>('cart:updated', ({ itemCount }) => {
  document.querySelector('#cart-count')!.textContent = String(itemCount);
});

// cart app
bus.emit<CartUpdated>('cart:updated', { itemCount: 3, total: 59.9 });

// header app, on unmount
stop();
```

Um micro app montado pelo orquestrador recebe o bus no seu contexto de montagem:

```ts
import { registerModule } from '@tuvix.js/loader';

let stop: (() => void) | undefined;

registerModule('header', {
  mount({ container, bus }) {
    stop = bus?.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
      container.textContent = `Cart: ${itemCount}`;
    });
  },
  unmount({ container }) {
    stop?.();
    container.replaceChildren();
  },
});
```

## API

### `EventBus`

```ts no-check
class EventBus implements IEventBus {
  constructor(options?: EventBusOptions);
}
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Número de listeners por evento a partir do qual `on` exibe um `console.warn` quando você adiciona mais um, uma vez por nome de evento durante toda a vida do bus. O listener é adicionado de qualquer forma. `0` desativa o aviso. O aviso ignora `debug`. |
| `debug` | `boolean` | `false` | Registra no log cada assinatura, cancelamento de assinatura e emissão por meio de `logger`. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Recebe as mensagens de debug, cada uma com o prefixo `[Tuvix EventBus]`. O aviso de `maxListeners` não passa por ele. |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Inscreve `handler` em `event` e retorna uma função que cancela a assinatura. `T` tipa o payload; o bus não o verifica em tempo de execução.

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Igual a `on`, mas remove o handler antes da primeira chamada dele. Para cancelar antes de o evento disparar, chame a função retornada. `off(event, handler)` não o encontra, porque o bus armazena um wrapper.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
const cancel = bus.once('app:ready', () => console.log('ready'));
cancel();
```

#### `emit(event, data?)`

```ts no-check
emit<T = unknown>(event: string, data?: T): void;
```

Chama cada handler de `event` na ordem de assinatura e depois cada handler de `onAny`, tudo antes de `emit` retornar. Um handler que lança um erro é registrado com `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` e os handlers restantes continuam rodando.

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

Remove um handler. Eventos e handlers desconhecidos são ignorados.

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

Com `event`, remove todos os handlers daquele evento. Sem ele, remove todos os handlers de todos os eventos e todos os handlers de `onAny`.

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

Assina todos os eventos. O handler recebe `(eventName, data)`. Use-o para logging e devtools.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const stopLogging = getGlobalBus().onAny((event, data) => {
  console.debug('[bus]', event, data);
});
```

#### `offAny(handler)`

```ts no-check
offAny<T = unknown>(handler: WildcardHandler<T>): void;
```

Remove um handler de `onAny`.

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

Inspecionam as assinaturas. Handlers de `onAny` não são contados, e `eventNames()` lista apenas eventos com pelo menos um handler.

#### `destroy()`

```ts no-check
destroy(): void;
```

Remove todos os handlers e marca o bus como destruído. Depois disso, `on`, `once`, `emit` e `onAny` lançam `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.` O orquestrador destrói um bus privado (um que ele criou a partir das opções de `eventBus`) em `destroy()` e mantém o bus global vivo.

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

Retorna `new EventBus(options)` tipado como `IEventBus`. Recebe as opções da tabela acima.

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
bus.on<string>('hello', (name) => console.log(`Hello, ${name}!`));
bus.emit('hello', 'World');
```

### `getGlobalBus`

```ts no-check
function getGlobalBus(options?: EventBusOptions): IEventBus;
```

Retorna o bus compartilhado da página e o cria na primeira chamada. O bus fica em `window.__TUVIX_GLOBAL_BUS__`, então um micro app que empacota a própria cópia de `@tuvix.js/event-bus` recebe a mesma instância que o shell. As `options` só se aplicam na chamada que cria o bus. No servidor, sem `window`, o bus é um singleton no nível do módulo.

O orquestrador usa esse bus, a menos que você passe opções de `eventBus` para `createOrchestrator`, então `orchestrator.getEventBus() === getGlobalBus()`.

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

Destrói o bus global e limpa `window.__TUVIX_GLOBAL_BUS__`. O próximo `getGlobalBus()` cria um bus novo. O código que guardou a instância antiga, incluindo um orquestrador, passa então a lançar um erro em `emit`. Chame-a entre testes.

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### Tipos

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| Tipo | Significado |
| --- | --- |
| `EventHandler<T>` | Handler para um evento. |
| `WildcardHandler<T>` | Handler para `onAny`, recebe o nome do evento e os dados. |
| `Unsubscribe` | Função retornada por `on`, `once` e `onAny`. |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`. |
| `IEventBus` | Interface que `EventBus` implementa: todos os métodos listados acima. Ela satisfaz `MicroAppBus` de `@tuvix.js/loader`. |

## Casos extremos

- **Snapshot por emissão.** `emit` copia a lista de handlers primeiro. Um handler adicionado durante uma emissão roda a partir da próxima emissão; um handler removido durante uma emissão ainda roda na atual.
- **A mesma função duas vezes.** Inscrever a mesma função duas vezes no mesmo evento a armazena uma única vez, e um único `off` a remove.
- **Handlers assíncronos.** `emit` não espera as promises retornadas. Uma promise rejeitada escapa do `try`/`catch` do bus e aparece como uma rejeição não tratada.
- **Entrada inválida.** `on`, `once` e `emit` lançam `[Tuvix EventBus] Event name must be a non-empty string.` para `''` ou espaços em branco. `on` e `onAny` lançam `[Tuvix EventBus] Handler must be a function.` quando o handler não é uma função. `once` envolve o handler primeiro, então um valor que não é função passa e falha no primeiro `emit`, onde o bus registra o erro.
- **Depois de `destroy()`.** `off`, `offAll`, `offAny`, `hasListeners`, `listenerCount` e `eventNames` continuam funcionando e reportam um bus vazio.
- **Versões misturadas.** Um micro app que empacota `@tuvix.js/event-bus` 0.4 mantém o próprio bus no nível do módulo e não vê o compartilhado.
- **Limite de listeners.** Com `maxListeners: 20`, adicionar o 21º handler a um evento exibe `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.` O bus avisa uma vez por nome de evento durante toda a vida dele, então remover handlers e adicioná-los de novo não gera um segundo aviso.
- **Iframes.** Cada window tem o próprio `__TUVIX_GLOBAL_BUS__`.

## O que ele não faz

- Não tipa eventos pelo nome. Não existe mapa de eventos nem interface `TuvixEvents` para estender; passe o tipo do payload como `on<T>` e `emit<T>`.
- Não reproduz eventos. Um handler inscrito depois de um `emit` perde esse evento.
- Não casa padrões como `user:*`. `onAny` recebe todos os eventos.
- Não envia mensagens para outras abas, janelas ou iframes.

## Migração a partir da 0.4

- `getGlobalBus()` agora mantém seu singleton em `window.__TUVIX_GLOBAL_BUS__`. Na 0.4, cada cópia empacotada do pacote criava o próprio bus "global", então micro apps com a própria cópia nunca ouviam o shell. `resetGlobalBus()` chamado a partir de qualquer cópia agora reinicia o bus para todas elas.
- A versão 0.4 desta página documentava `clear(event?)`, `createEventBus<EventMap>()` e uma interface `TuvixEvents`. Nada disso existia. Use `offAll(event?)` e o generic por chamada `on<T>` / `emit<T>`.
