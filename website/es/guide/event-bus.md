# Event Bus

`@tuvix.js/event-bus` proporciona un canal de publicación/suscripción tipado para la comunicación entre aplicaciones - sin globales compartidos ni acoplamiento entre micro apps.

## Importar

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';
```

## Uso Básico

```ts
// Publicar un evento
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// Suscribirse a un evento
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// Cancelar suscripción cuando termine (¡importante en unmount!)
unsubscribe();
```

## Eventos Tipados

Define tu mapa de eventos con TypeScript para seguridad de tipos completa:

```ts
// events.d.ts (tipos compartidos)
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

Ahora TypeScript validará el nombre del evento y su payload:

```ts
// ✅ Correcto
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ Correcto
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ Error de TypeScript - payload incorrecto
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

Suscríbete a un evento solo una vez - el handler se elimina automáticamente después de la primera llamada:

```ts
eventBus.once('user:login', (payload) => {
  // Llamado una vez, luego eliminado
  initUserSession(payload.userId);
});
```

## Limpieza en Micro Apps

Siempre cancela la suscripción en `unmount` para prevenir fugas de memoria:

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

## Crear un Bus Personalizado

Si necesitas un canal de eventos aislado (ej. para pruebas):

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## Referencia de API

| Método | Firma | Descripción |
|--------|-------|-------------|
| `emit` | `emit(event, payload)` | Publicar un evento |
| `on` | `on(event, handler) → unsub` | Suscribirse, retorna función de cancelación |
| `once` | `once(event, handler)` | Suscribirse una vez, se auto-elimina |
| `off` | `off(event, handler)` | Eliminar un handler específico |
| `clear` | `clear(event?)` | Eliminar todos los handlers (opcionalmente para un evento) |
