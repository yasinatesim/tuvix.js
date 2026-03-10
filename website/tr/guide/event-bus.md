# Olay Yolu (Event Bus)

`@tuvix.js/event-bus` uygulamalar arası iletişim için yazılı yayın/abone kanalı sağlar.

```ts
import { eventBus } from '@tuvix.js/event-bus';

// Olay yayınla
eventBus.emit('kullanici:giris', { kullaniciId: '42', ad: 'Alice' });

// Olaya abone ol
const abonelikten_cik = eventBus.on('kullanici:giris', ({ kullaniciId }) => {
  console.log('Giriş yapıldı:', kullaniciId);
});

// Temizle
abonelikten_cik();
```

İngilizce belgelerin tamamı için → [Event Bus (EN)](/guide/event-bus)
