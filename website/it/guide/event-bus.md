# Event Bus

`@tuvix.js/event-bus` fornisce un canale di pubblicazione/sottoscrizione tipizzato per la comunicazione tra applicazioni - senza globali condivisi o accoppiamento tra micro app.

## Import

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';
```

## Uso di Base

```ts
// Pubblicare un evento
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// Iscriversi a un evento
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// Annullare l'iscrizione quando finito (importante in unmount!)
unsubscribe();
```

## Eventi Tipizzati

Definisci la tua mappa di eventi con TypeScript per la sicurezza di tipo completa:

```ts
// events.d.ts (tipi condivisi)
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

Ora TypeScript applicherà il nome dell'evento e il payload:

```ts
// ✅ Corretto
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ Corretto
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ Errore TypeScript - payload errato
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

Iscriviti a un evento solo una volta - l'handler viene rimosso automaticamente dopo la prima chiamata:

```ts
eventBus.once('user:login', (payload) => {
  // Chiamato una volta, poi rimosso
  initUserSession(payload.userId);
});
```

## Pulizia nelle Micro App

Annulla sempre le iscrizioni in `unmount` per prevenire perdite di memoria:

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

## Creare un Bus Personalizzato

Se hai bisogno di un canale di eventi isolato (es. per i test):

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## Riferimento API

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `emit` | `emit(event, payload)` | Pubblicare un evento |
| `on` | `on(event, handler) → unsub` | Iscriversi, restituisce funzione di annullamento |
| `once` | `once(event, handler)` | Iscriversi una volta, auto-rimozione |
| `off` | `off(event, handler)` | Rimuovere un handler specifico |
| `clear` | `clear(event?)` | Rimuovere tutti gli handler (opzionalmente per un evento) |
