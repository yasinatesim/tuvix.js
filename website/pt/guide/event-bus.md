# Event Bus

`@tuvix.js/event-bus` fornece um canal de publicação/assinatura tipado para comunicação entre aplicações - sem globais compartilhadas ou acoplamento entre micro apps.

## Importar

```ts
import { eventBus } from '@tuvix.js/event-bus';
```

## Uso Básico

```ts
// Publicar um evento
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// Assinar um evento
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// Cancelar assinatura quando terminar (importante no unmount!)
unsubscribe();
```

## Eventos Tipados

Defina seu mapa de eventos com TypeScript para segurança de tipos completa:

```ts
// events.d.ts (tipos compartilhados)
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

Agora o TypeScript validará o nome do evento e seu payload:

```ts
// ✅ Correto
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ Correto
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ Erro TypeScript - payload incorreto
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

Assine um evento apenas uma vez - o handler é removido automaticamente após a primeira chamada:

```ts
eventBus.once('user:login', (payload) => {
  // Chamado uma vez, depois removido
  initUserSession(payload.userId);
});
```

## Limpeza em Micro Apps

Sempre cancele assinaturas em `unmount` para prevenir vazamentos de memória:

```ts
export const app: MicroApp = {
  _subscriptions: [] as (() => void)[],

  async mount(container, props) {
    this._subscriptions.push(
      eventBus.on('theme:changed', ({ theme }) => applyTheme(theme))
    );
  },

  async unmount(container) {
    this._subscriptions.forEach((unsub) => unsub());
    this._subscriptions = [];
    container.innerHTML = '';
  },
};
```

## Criar um Bus Personalizado

Se você precisar de um canal de eventos isolado (ex: para testes):

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## Referência da API

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `emit` | `emit(event, payload)` | Publicar um evento |
| `on` | `on(event, handler) → unsub` | Assinar, retorna função de cancelamento |
| `once` | `once(event, handler)` | Assinar uma vez, auto-remoção |
| `off` | `off(event, handler)` | Remover um handler específico |
| `clear` | `clear(event?)` | Remover todos os handlers (opcionalmente para um evento) |
