# @tuvix.js/event-bus

> Mikro uygulamalar arasında mesajlaşma için senkron bir publish/subscribe bus'ı. Her sayfada tek bir global bus bulunur.

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır. Tüm dokümantasyon: [tuvix.js.org/tr/packages/event-bus](https://tuvix.js.org/tr/packages/event-bus).

## Kurulum

```bash
npm install @tuvix.js/event-bus
# ya da pnpm add @tuvix.js/event-bus
```

## Hızlı başlangıç

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

`@tuvix.js/core` paketindeki orchestrator `getGlobalBus()` kullanır (siz `eventBus` seçeneklerini vermedikçe) ve bu bus'ı mount context içinde `bus` adıyla her uygulamaya iletir.

## API

### `EventBus` ve `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Bir olayın dinleyici sayısı bu değere ulaştıktan sonra bir tane daha eklerseniz `on`, `console.warn` ile uyarı basar. Uyarı her olay adı için bir kez çıkar, `debug` açık olsun ya da olmasın. Dinleyici yine de eklenir. `0` uyarı yok demektir. |
| `debug` | `boolean` | `false` | Subscribe, unsubscribe ve emit çağrılarını loglar. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Debug çıktısını alır. |

| Metot | Davranış |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | Abone olur; aboneliği kaldıran bir fonksiyon döndürür. |
| `once<T>(event, handler): Unsubscribe` | Handler'ı ilk çağrısından önce kaldırır. İptal etmek için `off` yerine dönen fonksiyonu kullanın. |
| `emit<T>(event, data?)` | Dönmeden önce olayın handler'larını sırayla, ardından `onAny` handler'larını çağırır. Hata fırlatan bir handler `console.error` ile loglanır; diğerleri çalışmaya devam eder. |
| `off(event, handler)` | Tek bir handler'ı kaldırır. |
| `offAll(event?)` | Bir olayın handler'larını ya da `onAny` handler'ları dahil tüm handler'ları kaldırır. |
| `onAny(handler): Unsubscribe` | Handler her olay için `(eventName, data)` alır. |
| `offAny(handler)` | Bir `onAny` handler'ını kaldırır. |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | Abonelikleri incelemenizi sağlar; `onAny` handler'ları sayılmaz. |
| `destroy()` | Tüm handler'ları kaldırır. Sonraki `on`, `once`, `emit` ve `onAny` çağrıları hata fırlatır. |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

Sayfanın ortak bus'ını döndürür. Bus `window.__TUVIX_GLOBAL_BUS__` üzerinde tutulur, böylece bu paketin kendi kopyasını bundle eden mikro uygulamalar da aynı instance'ı alır. `options` yalnızca bus'ı oluşturan çağrıda geçerlidir. `window` yoksa bus modül seviyesinde bir singleton olur.

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

Global bus'ı yok eder; bir sonraki `getGlobalBus()` çağrısı yenisini oluşturur. Eski referanslar kullanıldığında hata fırlatır. Testler için tasarlanmıştır.

### Tipler

`EventHandler<T>` (`(data: T) => void`), `WildcardHandler<T>` (`(eventName: string, data: T) => void`), `Unsubscribe` (`() => void`), `EventBusOptions`, `IEventBus`.

## Sınır durumlar

- `emit`, handler listesinin bir kopyası üzerinde çalışır: emit sırasında eklenen handler'lar bir sonraki emit'ten itibaren çalışır.
- Aynı olaya iki kez abone edilen aynı fonksiyon yalnızca bir kez saklanır.
- `emit` async handler'ları beklemez; bu handler'ların reject'leri yakalanmadan kalır.
- Boş ya da yalnızca boşluktan oluşan olay adları `[Tuvix EventBus] Event name must be a non-empty string.` hatası fırlatır.
- Bu paketin 0.4 sürümünü bundle eden bir mikro uygulama kendi ayrı bus'ını kullanmaya devam eder.

## Ne yapmaz

- Olay haritası üzerinden tipleme yoktur; payload tipini `on<T>` / `emit<T>` ile verin.
- Geç abone olanlar için replay yoktur, `user:*` gibi desenler yoktur, sekmeler ya da iframe'ler arasında mesajlaşma yoktur.

## Lisans

MIT
