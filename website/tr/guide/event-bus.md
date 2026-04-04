# Event Bus

`@tuvix.js/event-bus` uygulamalar arası iletişim için yazılı yayın/abone kanalı sağlar.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

// Olay yayınla
eventBus.emit('kullanici:giris', { kullaniciId: '42', ad: 'Alice' });

// Olaya abone ol
const abonelikten_cik = eventBus.on('kullanici:giris', ({ kullaniciId }) => {
  console.log('Giriş yapıldı:', kullaniciId);
});

// Temizle
abonelikten_cik();
```

İngilizce belgeler için → [Event Bus](/tr/guide/event-bus)
