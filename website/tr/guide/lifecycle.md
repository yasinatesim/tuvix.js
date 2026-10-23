# Lifecycle hook'ları

Orchestrator kayıtlı her uygulamayı sabit bir hook ve durum sırasından geçirir. Bu sayfa modülünüzün uyguladığı hook'ları, shell'in okuyabildiği durumları ve hatalarda ya da hızlı navigasyonda ne olduğunu anlatır. Bir uygulamanın sayfada olduğunu dışarıdan öğrenmek için [Lifecycle olayları](/tr/guide/lifecycle-events) sayfasına bakın.

## Hook sırası

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

Orchestrator her hook'u await eder. Hâlâ mount edilmekte olan bir uygulamada `mount` çağırmaz. `mount` çalışırken de `unmount` çağırmaz: unmount, mount'un tamamlanmasını bekler.

## bootstrap

Yüklenen her modül için bir kez, entry yüklendikten sonra ve ilk `mount` çağrısından önce çalışır. Yapılandırma okumak gibi remount'lardan sonra da geçerli kalması gereken işler için kullanın.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

`bootstrap` hata fırlatırsa uygulama `error` durumuna geçer ve mount başarısız olur. Bir sonraki mount denemesi `bootstrap` fonksiyonunu tekrar çağırır. Bir kez başarıyla çalıştıktan sonra remount'lar onu atlar.

## mount

Uygulama her aktif olduğunda ya da `mountApp(name)` çağırdığınızda çalışır. Context şunları içerir:

| Alan | Değer |
| --- | --- |
| `container` | İçine render edilecek eleman. `sandbox: true` uygulamalarında shadow root içindeki bir eleman. |
| `props` | Kayıtlı props'ların, yapılan her `updateAppProps` çağrısıyla birleştirilmiş hali. |
| `name` | Kayıtlı uygulama adı. |
| `bus` | Orchestrator'ın event bus'ı. |

`mountApp(name)`, `mount` tamamlandıktan sonra resolve olur; yükleme ya da mount hatasıyla reject olur.

## update

Uygulama mount edilmişken shell `updateAppProps(name, props)` çağırdığında çalışır:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

Context birleştirilmiş `props` ve `container` değerlerini içerir. `update` yoksa ya da uygulama mount edilmemişse orchestrator props'ları saklar ve bir sonraki `mount` çağrısına geçer. Props değişti diye bir uygulamayı asla remount etmez.

`updateAppProps` önce bekleyen bir mount varsa onu bekler. Böylece güncelleme yeni instance'a ulaşır. Güncelleme sırasında gelen bir `unmount` güncellemeyi bekler.

## unmount

Uygulama pasif olduğunda, `unmountApp(name)`, `unregister(name)` ve `destroy()` çağrılarında çalışır. `mount` fonksiyonunun oluşturduğu her şeyi kaldırın: framework root'ları, listener'lar, timer'lar, bus abonelikleri.

`unmount` sonrasında orchestrator uygulamanın entry stil dosyalarını `document.head` içinden kaldırır. Bir sonraki mount onları geri ekler ve yüklenmelerini bekler.

## Uygulama durumu

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (kayıtlı değil)
```

| Metot | Döndürdüğü |
| --- | --- |
| `getAppStatus(name)` | Durum; bilinmeyen bir ad için `null`. |
| `getMountedApps()` | Durumu `mounted` olan adlar. |
| `getRegisteredApps()` | Kayıtlı tüm adlar. |

## Hatalar ve fallback

Yükleme, `bootstrap` veya `mount` başarısız olduğunda orchestrator:

1. tanımladıysanız uygulamanın `fallback` HTML'ini container'ına yazar;
2. durumu `error` yapar;
3. bus üzerinde `{ name, error, phase }` ile `OrchestratorEvent.APP_ERROR` (`tuvix:app:error`) olayını yayınlar;
4. `onError(error, name)` çağırır;
5. `mountApp` çağrısını reject eder. Route değişikliği sırasında başarısız olan bir mount bunun yerine `console.error` ile loglanır ve diğer uygulamalar yine mount edilir.

Başarısız bir `update` veya `unmount`, 2 ile 4 arasındaki adımları çalıştırır ve `updateAppProps` ya da `unmountApp` çağrısını reject eder; fallback HTML yazmaz. `phase` değeri `'load'` (container'ın çözülmesi de buna dahildir), `'bootstrap'`, `'mount'`, `'update'` veya `'unmount'` olur.

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

`error` durumundaki bir uygulamayı aktifleştiren bir sonraki route değişikliği onu yeniden mount etmeyi dener.

## Hızlı navigasyon

Route değişiklikleri sırayla, birer birer reconcile edilir. Pasif uygulamalar, aktif uygulamalar mount edilmeden önce unmount edilir. Path'ler uygulamaların mount hızından daha hızlı gelirse:

- yalnızca kuyruktaki en yeni path bir sonraki sırada çalışır;
- entry'si yüklenirken pasif olan bir uygulama mount adımını atlar;
- `mount` çalışırken pasif olan bir uygulama, `mount` tamamlanır tamamlanmaz unmount edilir.

Bu yüzden A → B → A şeklinde art arda hızlı navigasyon yalnızca A mount edilmiş halde biter ve hiçbir uygulama başka bir uygulamanın hâlâ tuttuğu bir container'a render etmez.

## Shell düzeyindeki hook'lar

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| Olay | Payload | Ne zaman yayınlanır |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | `bootstrap` sonrasında |
| `tuvix:app:mount` | `{ name }` | `mount` sonrasında |
| `tuvix:app:unmount` | `{ name }` | `unmount` sonrasında |
| `tuvix:app:error` | `{ name, error, phase }` | yükleme, bootstrap, mount, update veya unmount başarısız olduğunda |
| `tuvix:app:status-change` | `{ name, status }` | her durum değişikliğinde |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | yalnızca yerleşik router navigasyonunda |
| `tuvix:started` | `{}` | `start()` sonunda |
| `tuvix:destroyed` | `{}` | `destroy()` sonunda |

Bu bus olaylarını orchestrator yayınlar. [Lifecycle olayları](/tr/guide/lifecycle-events) sayfasındaki `tuvix:mounted` DOM olayları ise adaptörlerden ve `defineMicroApp` fonksiyonundan gelir. Bu olaylar orchestrator olmadan mount edilen island'lar için de tetiklenir.

## Kapatma

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` çalışan bir reconcile varsa onu bekler, tüm uygulamaları unmount eder; router'ı, `connectRouter` aboneliklerini, prefetch'i ve viewport observer'ını durdurur ve loader önbelleğini temizler. Özel bir event bus'ı yok eder, global bus'a dokunmaz. İki kez çağırmak güvenlidir. Sonrasında `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` ve `connectRouter` hata fırlatır; bunun yerine yeni bir orchestrator oluşturun.
