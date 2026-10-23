# Event bus

`@tuvix.js/event-bus` senkron çalışan bir publish/subscribe kanalıdır. Aynı sayfadaki uygulamalar, birbirlerinin kodunu import etmeden ne olduğunu ("sepet güncellendi", "kullanıcı çıkış yaptı") birbirlerine bunun üzerinden haber verir.

## Bir bus seçin

| Bus | Nasıl alınır | Ne zaman kullanılır |
| --- | --- | --- |
| Global bus | `getGlobalBus()` | Varsayılan. Sayfadaki her uygulama, hangi bundle'da olursa olsun aynı instance'ı alır. |
| Orchestrator bus | `orchestrator.getEventBus()` ya da mount context'teki `bus` | Mikro uygulamaların içinde. Shell `eventBus` seçeneklerini vermediyse global bus'ın kendisidir. |
| Özel bus | `createEventBus(options)` | Testler ya da yalnızca tek bir uygulamanın kullandığı bir kanal için. |

`getGlobalBus()`, instance'ını `window.__TUVIX_GLOBAL_BUS__` üzerinde tutar. `@tuvix.js/event-bus` paketini kendi bundle'ına dahil eden iki mikro uygulama da aynı instance'ı paylaşır. Sunucuda `window` olmadığı için modülün her kopyasının kendi instance'ı olur.

## Yayınlama ve abone olma

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit`, dönmeden önce bütün handler'ları çağırır. Hata fırlatan bir handler `console.error` ile loglanır ve kalan handler'lar çalışmaya devam eder. Hiçbir şey kuyruğa alınmaz: bir `emit` çağrısından sonra abone olan dinleyici o olayı görmez.

## Tipli olaylar

`on`, `once` ve `emit` üzerindeki generic parametre payload'un tipini belirler. Proje genelinde bir olay haritası için bus'ı sarmalayın:

```ts
import { getGlobalBus, type IEventBus } from '@tuvix.js/event-bus';

export interface AppEvents {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'cart:updated': { itemCount: number; total: number };
}

export function emit<E extends keyof AppEvents>(bus: IEventBus, event: E, payload: AppEvents[E]): void {
  bus.emit(event, payload);
}

export function on<E extends keyof AppEvents>(
  bus: IEventBus,
  event: E,
  handler: (payload: AppEvents[E]) => void,
): () => void {
  return bus.on<AppEvents[E]>(event, handler);
}

emit(getGlobalBus(), 'cart:updated', { itemCount: 3, total: 42 });
```

## Bir mikro uygulamada bus kullanma

Bus'ı mount context'ten alın ve aboneliklerden `unmount` içinde çıkın:

```ts
import { defineMicroApp } from '@tuvix.js/core';

const subscriptions: Array<() => void> = [];

export default defineMicroApp({
  name: 'header',

  mount({ container, bus }) {
    const badge = document.createElement('span');
    container.replaceChildren(badge);
    if (!bus) return;
    subscriptions.push(
      bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
        badge.textContent = String(itemCount);
      }),
      bus.on('user:logout', () => {
        badge.textContent = '';
      }),
    );
  },

  unmount({ container }) {
    for (const off of subscriptions.splice(0)) off();
    container.replaceChildren();
  },
});
```

React ve Vue bileşenleri `useTuvixBus(bus, event, handler)` kullanabilir. Bileşen unmount edildiğinde abonelik kendiliğinden kalkar. Bkz. [React](/tr/guide/react) ve [Vue](/tr/guide/vue).

## once ve wildcard'lar

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

`onAny` handler'ları her olayda, orchestrator'ın `tuvix:app:*` olayları dahil, isimli handler'lardan sonra çalışır.

## Dinleyicileri kaldırma

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // tek bir handler
bus.offAll('ping'); // 'ping' için bütün handler'lar
bus.offAll(); // wildcard'lar dahil bütün handler'lar
```

Global bus üzerinde `offAll()` fonksiyonunu yalnızca sayfanın tamamı size aitse çağırın. Diğer uygulamaların dinleyicilerini de kaldırır.

## Hatalar ve yok edilmiş bus'lar

- `on`, `once`, `emit` ve `onAny`, boş bir olay adı ya da fonksiyon olmayan bir handler aldığında hata fırlatır.
- `bus.destroy()` çağrısından sonra abone olan ya da olay yayınlayan her metot hata fırlatır. `resetGlobalBus()` global bus'ı yok eder; sonraki `getGlobalBus()` çağrısı yenisini oluşturur.
- `orchestrator.destroy()` yalnızca özel bir bus'ı yok eder.

## İnceleme

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## Bus'ın yapmadıkları

- Olayları saklamaz ve yeniden oynatmaz. Güncel state'i props olarak verin ya da sonradan gelen uygulama state'i, sahibinin yanıtladığı bir olayla istesin.
- Pencereler, sekmeler ya da iframe'ler arasında çalışmaz. Bunun için `BroadcastChannel` ya da `postMessage` kullanın.
- Payload'ları çalışma zamanında doğrulamaz. Generic'ler yalnızca derleme zamanında işe yarar.
