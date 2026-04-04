# Event Bus

`@tuvix.js/event-bus` uygulamalar arası iletişim için yazılı yayın/abone kanalı sağlar.

## İçe Aktarma

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const eventBus = getGlobalBus();
```

## Temel Kullanım

```ts
// Olay yayınla
eventBus.emit('kullanici:giris', { userId: '42', name: 'Alice' });

// Olaya abone ol
const aboneliktenCik = eventBus.on('kullanici:giris', (payload) => {
  console.log('Giriş yapıldı:', payload.userId);
});

// Abonelikten çık
aboneliktenCik();
```

## Yazılı Olaylar

TypeScript ile tam tip güvenliği için olay haritanızı tanımlayın:

```ts
// events.d.ts
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

## Once

Bir olaya yalnızca bir kez abone ol - ilk çağrıdan sonra handler otomatik olarak kaldırılır:

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';
const eventBus = getGlobalBus();

eventBus.once('user:login', (payload) => {
  initUserSession(payload.userId);
});
```

## Mikro Uygulamalarda Temizlik

Bellek sızıntılarını önlemek için `unmount`'ta her zaman abonelikten çıkın:

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

export const app: MicroAppDefinition = {
  _subscriptions: [] as (() => void)[],

  async mount(container, props) {
    const eventBus = getGlobalBus();
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

## Özel Bus Oluşturma

İzole bir olay kanalına ihtiyacınız varsa (örn. test için):

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## API Referansı

| Metod | İmza | Açıklama |
|-------|------|----------|
| `emit` | `emit(event, payload)` | Olay yayınla |
| `on` | `on(event, handler) → unsub` | Abone ol, abonelikten çıkma fonksiyonu döner |
| `once` | `once(event, handler)` | Bir kez abone ol, otomatik kaldırılır |
| `off` | `off(event, handler)` | Belirli bir handler'ı kaldır |
| `clear` | `clear(event?)` | Tüm handler'ları kaldır |
