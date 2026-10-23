---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="Orchestrator için sayfa içi hata ayıklama paneli. Kayıtlı ve mount edilmiş mikro uygulamaları, geçerli route'u ve event bus'taki son trafiği listeler."
  icon="🛠️"
  npm="true"
/>

## Kurulum

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Ne zaman kullanılır

Orchestrator'ın hangi mikro uygulamaları tanıdığını, şu anda hangilerinin mount edildiğini ve bus üzerinden hangi olayların geçtiğini görmeniz gerektiğinde geliştirme ortamına kurun. Panel sayfanın sağ alt köşesinde durur ve saniyede bir yenilenir.

Bileşen ağaçlarını, ağ sürelerini ya da olay payload'larını bir arayüzde görmek istiyorsanız tarayıcının DevTools'unu veya framework'ün devtools eklentisini kullanın. Bu paket uygulama adlarını, tek bir route string'ini ve zaman damgasıyla olay adlarını gösterir. Payload'lar logger'da kalır, onları konsoldan okuyabilirsiniz.

## Hızlı başlangıç

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

`/dashboard` adresini açın: panel `dashboard` uygulamasını yeşil, `settings` uygulamasını beyaz noktayla listeler. Route satırında `/dashboard` yazar, Events listesi de dashboard mount işleminin `tuvix:app:status-change` ve `tuvix:app:mount` olaylarını gösterir.

## Panel neyi gösterir

`installDevTools` fonksiyonu `document.body` içine tek bir `<div id="tuvix-devtools">` ekler. Bu elemanda yuvarlak bir aç/kapa düğmesi (sağ alt köşeden 12px uzakta sabit, `z-index: 99999`) ve düğmenin üstünde 280px genişliğinde, üç bölümlü bir panel bulunur:

| Bölüm | Kaynak | İçerik |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` ve `getMountedApps()` | Her kayıtlı uygulama için bir satır. Yeşil nokta, durumun `mounted` olduğunu gösterir. Beyaz nokta, `loading` ve `error` dahil diğer tüm durumları kapsar. |
| Route | `orchestrator.getRouter()?.currentPath` | Router'ın geçerli path'i: `base` öneki olmadan, query string dahil. Orchestrator'da router yoksa `/` gösterir. |
| Events | `orchestrator.getEventBus()` üzerine bağlanan `EventLogger` | En yeni 10 olay, en yenisi en üstte. Her satırda yerel saat, bir tire ve olay adı yer alır. |

Orchestrator varsayılan olarak `getGlobalBus()` kullanır. Bu yüzden Events listesinde orchestrator'ın kendi olaylarının yanında mikro uygulamalarınızın ortak bus'a yayınladığı olaylar da görünür:

| Olay | Ne zaman yayınlanır |
| --- | --- |
| `tuvix:app:registered` | `register()` bir uygulama eklediğinde |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | Bir uygulama ilgili lifecycle adımından geçtiğinde |
| `tuvix:app:error` | Bir uygulamanın yüklenmesi, bootstrap edilmesi ya da mount edilmesi başarısız olduğunda |
| `tuvix:app:status-change` | Bir uygulamanın durumu değiştiğinde. Her mount için birkaç tane gelir. |
| `tuvix:route:change` | Router navigasyon yaptığında |
| `tuvix:started`, `tuvix:destroyed` | `start()` ve `destroy()` tamamlandığında |

Panel ayrıca `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }` nesnesini açar. Panelin yazdırmadığı payload'ları okumak için tarayıcı konsolunda `__TUVIX_DEVTOOLS__.logger.getEntries()` çalıştırın.

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

İlk argüman bu dört metoda sahip herhangi bir nesneyi kabul eder. `@tuvix.js/core` ya da `tuvix.js` paketinden gelen bir `Orchestrator` bu şekle uyar.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Logger'ın tuttuğu en fazla olay sayısı. Panel bunların 10 tanesini yazdırır, geri kalanı `__TUVIX_DEVTOOLS__.logger` üzerinden okunabilir. |
| `autoOpen` | `boolean` | `true` | `false` verilirse panel gizli mount edilir. Aç/kapa düğmesi görünür kalır ve paneli açar. |
| `updateInterval` | `number` | `1000` | Panel yenilemeleri arasındaki milisaniye. |

Her çağrıda fonksiyon şunları yapar:

1. bir `DevToolsPanel` ve bir `EventLogger(maxLogEntries)` oluşturur,
2. logger'ı `onAny` ile `orchestrator.getEventBus()` üzerine bağlar,
3. paneli mount eder, `autoOpen` değeri `false` ise gizler,
4. orchestrator'ı okuyup `panel.update()` çağıran bir `setInterval` başlatır,
5. `window.__TUVIX_DEVTOOLS__` değerini atar.

Dönüş değeri bir temizlik fonksiyonudur. Bu fonksiyon interval'ı temizler, logger'ı ayırır, paneli kaldırır ve `window.__TUVIX_DEVTOOLS__` değerini siler.

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger`, bir bus üzerindeki her olayı `bus.onAny` ile kaydeder. Her kayıtta `timestamp` (yayın anındaki `Date.now()`), `event` (olay adı) ve `data` (yayınlandığı haliyle payload, kopyalanmaz) bulunur. Kayıt sayısı `maxEntries` değerini aşınca logger en eski kayıtları atar.

| Metot | Davranış |
| --- | --- |
| `attach(bus)` | `bus` üzerindeki tüm olaylara abone olur. Bus destroy edilmişse hata fırlatır. |
| `detach()` | Aboneliği kaldırır. Kaydedilen girdiler kalır. |
| `getEntries()` | Tüm kaydı döndürür, en eskisi başta. |
| `getRecent(count)` | Son `count` girdiyi döndürür, en eskisi başta. |
| `clear()` | Kaydı boşaltır, aboneliği korur. |

Bir testte bus trafiğini doğrulamak ya da bir sayfadaki olayları dökmek için paneli kullanmadan da çalıştırabilirsiniz:

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel`, panelin herhangi bir yoklama yapmayan DOM kısmıdır. Göstermek istediğiniz state ile `update()` metodunu siz çağırırsınız.

| Metot | Davranış |
| --- | --- |
| `mount()` | `#tuvix-devtools` elemanını açık halde `document.body` içine ekler. Aynı instance üzerinde ikinci çağrı hiçbir şey yapmaz. |
| `unmount()` | Elemanı kaldırır. |
| `toggle()` | Panel gövdesini gösterir ya da gizler. Aç/kapa düğmesi yerinde kalır. `mount()` çağrılmadan önce hiçbir şey yapmaz. |
| `update(state)` | Apps, Route ve Events bölümlerini yeniden oluşturur. `events` dizisinin son 10 öğesini en yenisi başta olacak şekilde yazdırır. `mount()` çağrılmadan önce hiçbir şey yapmaz. |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### Tipler

| Ad | Anlamı |
| --- | --- |
| `DevToolsOptions` | `installDevTools` seçenekleri: `maxLogEntries`, `autoOpen`, `updateInterval`. |

Orchestrator şekli ve kayıt girdisi şekli export edilmez. Bunlara tip olarak ihtiyacınız olduğunda `Parameters<typeof installDevTools>[0]` ve `ReturnType<EventLogger['getEntries']>[number]` kullanın.

## Production build'leri

Paket `"sideEffects": false` bildirir, ama kodunuzun çağırdığı statik bir `import { installDevTools } from '@tuvix.js/devtools'` yine de bundle'a girer. Hızlı başlangıçtaki gibi, build zamanı bir bayrağın arkasında dinamik `import()` ile yükleyin. Bundler'lar `process.env.NODE_ENV` ifadesini bir string ile değiştirir, ölü dalı ve onun chunk'ını atar. Vite uygulamasında bunun yerine `import.meta.env.DEV` değerine bakabilirsiniz.

Paneli production'da açık bırakmanın bedeli şunlardır: her saniye üç DOM bölümünü yeniden oluşturan bir `setInterval`, her bus olayına bir abonelik ve orchestrator'ı sayfadaki her script'e veren bir global.

## Sınır durumlar

- `register()` ve `start()` çağrılarından önce kurun. Logger yalnızca `attach` sonrasında yayınlanan olayları görür. Panel de ilk yenilemeye kadar, yani çağrıdan `updateInterval` milisaniye sonrasına kadar boş kalır.
- `installDevTools` için `document` ve `window` gerekir. Sunucuda render sırasında çağırırsanız `ReferenceError` hatası fırlatır. Yalnızca istemcide çalışan koddan çağırın.
- `connectRouter()` kullanıp `router` seçeneğini vermediğinizde `getRouter()` `null` döndürür ve Route satırı `/` gösterir.
- `getMountedApps()` yalnızca `mounted` durumunu sayar. `mounting` ya da `error` durumundaki bir uygulama beyaz nokta alır, panel de durum adını hiçbir zaman yazdırmaz.
- Özel bir bus (`createOrchestrator({ eventBus: {...} })`) `orchestrator.destroy()` ile destroy edilir. Bundan sonra kurulum yaparsanız `onAny` hata fırlatır. Varsayılan global bus ile logger, temizlik fonksiyonunu çağırana kadar `destroy()` sonrasında da kayda devam eder.
- Her çağrı yeni bir panel oluşturur. İki çağrı sayfaya aynı eleman id'lerine sahip iki panel koyar ve ikinci çağrı `window.__TUVIX_DEVTOOLS__` değerinin üzerine yazar. Bu durumda ilk temizlik fonksiyonu, ikinci çağrının atadığı global'i siler.
- Aynı instance üzerinde `EventLogger.attach()` metodunu iki kez çağırmak, saklanan abonelik iptal fonksiyonunu değiştirir. Ardından `detach()` yalnızca ikinci aboneliği kaldırır.
- Kayıt `maxLogEntries` sınırına ulaştıktan sonra logger her yeni olayda diziyi kopyalar. Çok konuşan bus'lara sahip sayfalarda `maxLogEntries` değerini yüzler mertebesinde tutun.
- Panel uygulama adlarını, route'ları ve olay adlarını `textContent` ile yazar. Olay adındaki markup metin olarak görünür.

## Ne yapmaz

- Klavye kısayolu yoktur, konum, boyut ya da tema seçeneği de yoktur. Panel her zaman inline stillerle sağ altta durur.
- Arayüzde olay payload'ları, entry URL'leri, loader önbellek durumu ya da mount süreleri yoktur. Payload'ları `__TUVIX_DEVTOOLS__.logger.getEntries()` ile okuyun.
- Tarayıcı eklentisi yoktur, React, Vue, Svelte ya da Angular devtools ile bağlantısı da yoktur.
- Zamanda yolculuk ya da olay tekrarı yoktur. Logger kaydeder, hiçbir olayı yeniden yayınlamaz.
- Production build'lerinde kendini otomatik kaldırmaz. Import'u kendiniz koşula bağlarsınız.
