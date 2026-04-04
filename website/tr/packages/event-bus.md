---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="Uygulamalar arası mesajlaşma için tipli yayınla/abone ol iletişim kanalı. Paylaşılan global yok, bağımlılık yok."
  icon="📡"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/event-bus
```

## Hızlı Başlangıç

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

// Yayınla
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// Abone ol
const unsub = eventBus.on('user:login', ({ userId, name }) => {
  console.log(`${name} giriş yaptı (id: ${userId})`);
});

// Temizle
unsub();
```

## Tip Güvenli Olaylar

Tam tip çıkarımı almak için `TuvixEvents` arayüzünü genişletin:

```ts
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':    { userId: string; name: string };
    'user:logout':   { userId: string };
    'cart:updated':  { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

## API

### `eventBus.emit(event, payload)`

Tüm abonelere bir olay yayınlar.

### `eventBus.on(event, handler) → unsubscribe`

Bir olaya abone olur. Abonelik iptal fonksiyonu döndürür.

### `eventBus.once(event, handler)`

Bir kez abone olur - handler ilk çağrıdan sonra kaldırılır.

### `eventBus.off(event, handler)`

Belirli bir handler'ı kaldırır.

### `eventBus.clear(event?)`

Bir olay için tüm handler'ları kaldırır (veya belirtilmezse tüm olayları).

### `createEventBus<T>()`

Kendi olay haritasına sahip izole bir event bus örneği oluşturur.
