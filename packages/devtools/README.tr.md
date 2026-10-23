# @tuvix.js/devtools

> Bir orchestrator'ın kayıtlı ve mount edilmiş uygulamalarını, güncel route'unu ve son event bus trafiğini listeleyen sayfa içi debug paneli

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır.

## Kurulum

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Hızlı başlangıç

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

Sağ alt köşede yuvarlak bir buton belirir. Üstündeki panel her saniye yenilenir ve şunları gösterir:

- **Apps**: kayıtlı tüm uygulamalar. Durumu `mounted` olanın yanında yeşil, diğerlerinin yanında beyaz nokta görünür.
- **Route**: `orchestrator.getRouter()?.currentPath`, router yoksa `/`.
- **Events**: bus'taki en yeni 10 olay (zaman ve ad), en yenisi en üstte.

Panel ayrıca `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }` değerini atar. Olay payload'larını okumak için konsolda `__TUVIX_DEVTOOLS__.logger.getEntries()` çalıştırın.

## API

### `installDevTools(orchestrator, options?): () => void`

`getRegisteredApps()`, `getMountedApps()`, `getEventBus()` ve `getRouter()` metotlarına sahip her nesneyi kabul eder; örneğin bir `Orchestrator`. Polling'i durduran, logger'ı ayıran, paneli kaldıran ve global değişkeni silen bir temizlik fonksiyonu döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Logger'ın tuttuğu en fazla olay sayısı |
| `autoOpen` | `boolean` | `true` | `false` paneli gizli mount eder; açma/kapama butonu açar |
| `updateInterval` | `number` | `1000` | Panel yenilemeleri arasındaki milisaniye |

### `EventLogger`

`new EventLogger(maxEntries = 200)` bir bus'ın tüm olaylarını `onAny` ile kaydeder. Kayıtlar `{ timestamp, event, data }` biçimindedir.

| Metot | Davranış |
| --- | --- |
| `attach(bus)` | Tüm olaylara abone olur. Yok edilmiş bir bus'ta hata fırlatır. |
| `detach()` | Aboneliği bırakır, kayıtları korur |
| `getEntries()` | Tüm log, en eskisi önce |
| `getRecent(count = 20)` | Son `count` kayıt, en eskisi önce |
| `clear()` | Log'u boşaltır |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

Polling içermeyen panel DOM'u. State'i siz verirsiniz.

| Metot | Davranış |
| --- | --- |
| `mount()` | `#tuvix-devtools` elemanını açık halde `document.body` içine ekler. İkinci çağrı bir şey yapmaz. |
| `unmount()` | Elemanı kaldırır |
| `toggle()` | Panel gövdesini gösterir ya da gizler; buton yerinde kalır |
| `update({ registeredApps, mountedApps, currentRoute, events })` | Üç bölümü yeniden render eder |

### `DevToolsOptions`

Yukarıdaki `installDevTools` seçeneklerinin tipi.

## Sınır durumlar

- Logger yalnızca `installDevTools` çağrısından sonra yayınlanan olayları görür. Panel ilk yenilemede, yani `updateInterval` ms sonra dolar.
- Yalnızca tarayıcıda çalışır: sunucuda render sırasında `installDevTools` bir `ReferenceError` fırlatır.
- `mounting` ya da `error` durumundaki bir uygulama beyaz nokta gösterir; panel durum adlarını yazmaz.
- Varsayılan global bus kullanılıyorsa logger, `orchestrator.destroy()` çağrısından sonra da siz temizlik fonksiyonunu çağırana kadar kayda devam eder.
- İki `installDevTools` çağrısı aynı eleman id'lerine sahip iki panel oluşturur ve ikinci çağrı `window.__TUVIX_DEVTOOLS__` değerinin üzerine yazar.

## Ne yapmaz

- Klavye kısayolu yoktur; konum, boyut ya da tema seçeneği yoktur.
- Arayüzde payload, entry URL'i, loader state'i ya da süre bilgisi göstermez.
- Tarayıcı eklentisi ya da framework devtools'larına bağlantı yoktur.
- Production'da kendiliğinden kaldırılmaz: hızlı başlangıçtaki gibi import'u build zamanı bir bayrağın arkasına alın.

Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/devtools](https://tuvix.js.org/tr/packages/devtools)

## Lisans

MIT
