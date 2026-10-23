---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="Mikro uygulamalar arası mesajlar için senkron publish/subscribe bus. Sayfa başına tek bir global bus, paketin bundle edilmiş tüm kopyaları onu paylaşır."
  icon="📡"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Ne zaman kullanılır

Aynı sayfadaki mikro uygulamaların birbirine bir şeyler söylemesi gerekir: sepet uygulaması `cart:updated` olayını duyurur, header yeni sayıyı gösterir. Event bus sayesinde uygulamalar birbirini import etmeden, olay adı üzerinden haberleşir.

`@tuvix.js/core` paketindeki orchestrator `getGlobalBus()` kullanır ve bu bus'ı mount context içinde `bus` adıyla her uygulamaya verir. Mikro uygulama içinde bu `bus` nesnesini kullanın ya da `getGlobalBus()` çağırın. İkisi de aynı instance'ı döndürür. Testler için ya da tek bir uygulamanın içinde kalan mesajlar için `createEventBus()` ile özel bir bus oluşturun.

Sonradan abone olan birinin okuması gereken state için (bir store ya da URL) ve sekmeler veya iframe'ler arası mesajlar için (`BroadcastChannel`, `postMessage`) başka bir yol seçin.

## Hızlı başlangıç

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

interface CartUpdated {
  itemCount: number;
  total: number;
}

const bus = getGlobalBus();

// header app
const stop = bus.on<CartUpdated>('cart:updated', ({ itemCount }) => {
  document.querySelector('#cart-count')!.textContent = String(itemCount);
});

// cart app
bus.emit<CartUpdated>('cart:updated', { itemCount: 3, total: 59.9 });

// header app, on unmount
stop();
```

Orchestrator'ın mount ettiği bir mikro uygulama, bus'ı mount context içinde alır:

```ts
import { registerModule } from '@tuvix.js/loader';

let stop: (() => void) | undefined;

registerModule('header', {
  mount({ container, bus }) {
    stop = bus?.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
      container.textContent = `Cart: ${itemCount}`;
    });
  },
  unmount({ container }) {
    stop?.();
    container.replaceChildren();
  },
});
```

## API

### `EventBus`

```ts no-check
class EventBus implements IEventBus {
  constructor(options?: EventBusOptions);
}
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Olay başına listener sayısı. Bu sayıya ulaşıldıktan sonra bir listener daha eklediğinizde `on` bir `console.warn` basar. Uyarı, bus'ın ömrü boyunca her olay adı için bir kez çıkar. Listener her durumda eklenir. `0` uyarıyı kapatır. Uyarı `debug` değerine bakmaz. |
| `debug` | `boolean` | `false` | Her abone olma, abonelikten çıkma ve yayınlama işlemini `logger` üzerinden loglar. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Debug mesajlarını alır. Her mesajın başında `[Tuvix EventBus]` yer alır. `maxListeners` uyarısı bu fonksiyondan geçmez. |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

`handler` fonksiyonunu `event` olayına abone eder ve aboneliği iptal eden bir fonksiyon döndürür. `T` payload'un tipini belirler. Bus bunu çalışma anında kontrol etmez.

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

`on` gibidir ama handler'ı ilk çağrısından önce kaldırır. Olay tetiklenmeden iptal etmek için döndürülen fonksiyonu çağırın. `off(event, handler)` onu bulamaz, çünkü bus bir sarmalayıcı saklar.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
const cancel = bus.once('app:ready', () => console.log('ready'));
cancel();
```

#### `emit(event, data?)`

```ts no-check
emit<T = unknown>(event: string, data?: T): void;
```

`event` olayının her handler'ını abone olma sırasıyla, ardından her `onAny` handler'ını çağırır. Bunların hepsi `emit` dönmeden olur. Hata fırlatan bir handler `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` ile loglanır ve kalan handler'lar yine çalışır.

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

Tek bir handler'ı kaldırır. Bilinmeyen olaylar ve handler'lar yok sayılır.

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

`event` verilirse o olayın tüm handler'larını kaldırır. Verilmezse tüm olayların tüm handler'larını ve tüm `onAny` handler'larını kaldırır.

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

Tüm olaylara abone olur. Handler `(eventName, data)` alır. Loglama ve devtools için kullanın.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const stopLogging = getGlobalBus().onAny((event, data) => {
  console.debug('[bus]', event, data);
});
```

#### `offAny(handler)`

```ts no-check
offAny<T = unknown>(handler: WildcardHandler<T>): void;
```

Bir `onAny` handler'ını kaldırır.

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

Abonelikleri incelemenizi sağlar. `onAny` handler'ları sayılmaz. `eventNames()` yalnızca en az bir handler'ı olan olayları listeler.

#### `destroy()`

```ts no-check
destroy(): void;
```

Tüm handler'ları kaldırır ve bus'ı yok edilmiş olarak işaretler. Bundan sonra `on`, `once`, `emit` ve `onAny` şu hatayı fırlatır: `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.` Orchestrator, `destroy()` içinde özel bir bus'ı (`eventBus` seçeneklerinden kendi oluşturduğu bus'ı) yok eder, global bus'a dokunmaz.

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

`IEventBus` tipinde `new EventBus(options)` döndürür. Yukarıdaki tablodaki seçenekleri alır.

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
bus.on<string>('hello', (name) => console.log(`Hello, ${name}!`));
bus.emit('hello', 'World');
```

### `getGlobalBus`

```ts no-check
function getGlobalBus(options?: EventBusOptions): IEventBus;
```

Sayfanın ortak bus'ını döndürür, ilk çağrıda onu oluşturur. Bus `window.__TUVIX_GLOBAL_BUS__` üzerinde durur. Bu yüzden `@tuvix.js/event-bus` paketinin kendi kopyasını bundle eden bir mikro uygulama da shell ile aynı instance'ı alır. `options` yalnızca bus'ı oluşturan çağrıda geçerlidir. Sunucuda, `window` olmadığında, bus modül düzeyinde bir singleton'dır.

`createOrchestrator` fonksiyonuna `eventBus` seçenekleri vermediğiniz sürece orchestrator bu bus'ı kullanır. Yani `orchestrator.getEventBus() === getGlobalBus()` doğrudur.

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

Global bus'ı yok eder ve `window.__TUVIX_GLOBAL_BUS__` değerini temizler. Sonraki `getGlobalBus()` çağrısı yeni bir bus oluşturur. Eski instance'ı tutan kod (orchestrator dahil) bundan sonra `emit` çağrısında hata fırlatır. Testler arasında çağırın.

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### Tipler

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| Tip | Anlamı |
| --- | --- |
| `EventHandler<T>` | Tek bir olayın handler'ı. |
| `WildcardHandler<T>` | `onAny` handler'ı. Olay adını ve veriyi alır. |
| `Unsubscribe` | `on`, `once` ve `onAny` fonksiyonlarının döndürdüğü fonksiyon. |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`. |
| `IEventBus` | `EventBus` sınıfının uyguladığı arayüz: yukarıda listelenen tüm metotlar. `@tuvix.js/loader` paketindeki `MicroAppBus` tipini karşılar. |

## Sınır durumlar

- **Her emit'te anlık kopya.** `emit` önce handler listesinin kopyasını alır. Bir emit sırasında eklenen handler bir sonraki emit'ten itibaren çalışır. Bir emit sırasında kaldırılan handler mevcut emit'te yine çalışır.
- **Aynı fonksiyon iki kez.** Bir fonksiyonu aynı olaya iki kez abone ederseniz bus onu bir kez saklar ve tek bir `off` onu kaldırır.
- **Async handler'lar.** `emit` döndürülen promise'leri beklemez. Reject olan bir promise bus'ın `try`/`catch` bloğundan kaçar ve unhandled rejection olarak görünür.
- **Geçersiz girdi.** `''` ya da yalnızca boşluk içeren bir değer için `on`, `once` ve `emit` şu hatayı fırlatır: `[Tuvix EventBus] Event name must be a non-empty string.` Handler bir fonksiyon değilse `on` ve `onAny` şu hatayı fırlatır: `[Tuvix EventBus] Handler must be a function.` `once` handler'ı önce sarmaladığı için fonksiyon olmayan bir değer kontrolden geçer ve ilk `emit` çağrısında hata verir. Bus bu hatayı loglar.
- **`destroy()` sonrası.** `off`, `offAll`, `offAny`, `hasListeners`, `listenerCount` ve `eventNames` çalışmaya devam eder ve boş bir bus bildirir.
- **Karışık sürümler.** `@tuvix.js/event-bus` 0.4'ü bundle eden bir mikro uygulama kendi modül düzeyindeki bus'ını korur ve ortak bus'ı görmez.
- **Listener sınırı.** `maxListeners: 20` ile bir olaya 21. handler eklendiğinde şu uyarı basılır: `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.` Bus ömrü boyunca her olay adı için bir kez uyarır. Handler'ları kaldırıp yeniden eklemek ikinci bir uyarı üretmez.
- **Iframe'ler.** Her window'un kendi `__TUVIX_GLOBAL_BUS__` değeri vardır.

## Ne yapmaz

- Olayları ada göre tiplemez. Bir event map ya da genişletilecek bir `TuvixEvents` arayüzü yoktur. Payload tipini `on<T>` ve `emit<T>` ile verin.
- Olayları yeniden oynatmaz. Bir `emit` sonrasında abone olan handler o olayı kaçırır.
- `user:*` gibi pattern'lerle eşleştirme yapmaz. `onAny` tüm olayları alır.
- Diğer sekmelere, pencerelere ya da iframe'lere mesaj göndermez.

## 0.4 sürümünden geçiş

- `getGlobalBus()` artık singleton'ını `window.__TUVIX_GLOBAL_BUS__` üzerinde tutar. 0.4'te paketin bundle edilmiş her kopyası kendi "global" bus'ını oluşturuyordu. Bu yüzden kendi kopyasını taşıyan mikro uygulamalar shell'i hiç duymuyordu. Artık herhangi bir kopyadan çağrılan `resetGlobalBus()` hepsi için bus'ı sıfırlar.
- Bu sayfanın 0.4 sürümü `clear(event?)`, `createEventBus<EventMap>()` ve bir `TuvixEvents` arayüzünü belgeliyordu. Bunların hiçbiri yoktu. `offAll(event?)` ve çağrı başına generic `on<T>` / `emit<T>` kullanın.
