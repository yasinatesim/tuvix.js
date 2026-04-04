# Event Bus

`@tuvix.js/event-bus` fournit un canal de publication/abonnement typé pour la communication inter-applications - sans globales partagées ni couplage entre micro apps.

## Import

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';
```

## Utilisation de Base

```ts
// Publier un événement
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// S'abonner à un événement
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// Se désabonner quand c'est fini (important dans unmount !)
unsubscribe();
```

## Événements Typés

Définissez votre carte d'événements avec TypeScript pour une sécurité de type complète :

```ts
// events.d.ts (types partagés)
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

Maintenant TypeScript appliquera le nom de l'événement et son payload :

```ts
// ✅ Correct
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ Correct
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ Erreur TypeScript - mauvais payload
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

Abonnez-vous à un événement une seule fois - le handler est automatiquement supprimé après le premier appel :

```ts
eventBus.once('user:login', (payload) => {
  // Appelé une fois, puis supprimé
  initUserSession(payload.userId);
});
```

## Nettoyage dans les Micro Apps

Désabonnez-vous toujours dans `unmount` pour éviter les fuites de mémoire :

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

## Créer un Bus Personnalisé

Si vous avez besoin d'un canal d'événements isolé (ex. pour les tests) :

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## Référence API

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `emit` | `emit(event, payload)` | Publier un événement |
| `on` | `on(event, handler) → unsub` | S'abonner, retourne une fonction de désabonnement |
| `once` | `once(event, handler)` | S'abonner une fois, auto-suppression |
| `off` | `off(event, handler)` | Supprimer un handler spécifique |
| `clear` | `clear(event?)` | Supprimer tous les handlers (optionnellement pour un événement) |
