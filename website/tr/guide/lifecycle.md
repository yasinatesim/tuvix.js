# Lifecycle Hook'ları

## Genel Bakış

Tuvix.js'teki her mikro uygulama tahmin edilebilir bir lifecycle takip eder.
Orchestrator hook'ları uygun zamanlarda çağırır — siz onları loader'a dönen
module üzerinde implement edersiniz.

```
register()  →  bootstrap()  →  mount()  →  update()*  →  unmount()
                                              ↑   mounted iken döngü
```

`bootstrap()` sayfa ömrü boyunca yalnızca bir kez çalışır. `mount()` ve
`unmount()` uygulamanın route'u her aktif/pasif olduğunda çalışır. `update()`
opsiyoneldir ve shell `orchestrator.updateAppProps()` ile yeni props
gönderdiğinde çalışır.

## Module Şekli

Tüm hook'lar tek bir context objesi alır — asla pozisyonel argüman değil.

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: ({ container, props }) => void | Promise<void>;
  unmount: ({ container }) => void | Promise<void>;
  update?: ({ props }) => void | Promise<void>;
}
```

## bootstrap

İlk `mount()`'tan önce bir kez çağrılır. Veri ön yükleme, global'leri
register etme veya cache ısıtma gibi tek seferlik kurulum için kullanın.

```ts
async bootstrap() {
  await preloadCriticalChunks();
}
```

`bootstrap()` throw ederse, orchestrator uygulamayı `error` olarak işaretler
ve bus'a `app:error` emit eder.

## mount

Uygulamanın route'u aktif olduğunda (veya `mountApp()` manuel çağrıldığında)
çalışır. UI'ınızı verilen container'a render edin.

```ts
async mount({ container, props }) {
  this._root = createRoot(container);
  this._root.render(<App {...props} />);
}
```

`props`, `register({ props })`'a iletilenlerdir (sonradan yapılan
`updateAppProps()` çağrılarıyla birleştirilmiş halde).

## unmount

Route deaktif olduğunda çalışır. **Burada her zaman temizleme yapın** —
framework instance'larını yok edin, event'lerden unsubscribe olun, timer'ları
temizleyin.

```ts
async unmount({ container }) {
  this._root?.unmount();
  this._root = null;
  container.innerHTML = '';
}
```

::: warning
Temizliği atlamaktan kaynaklanan memory leak'ler en yaygın mikro frontend
bug'ıdır. Orchestrator framework instance'larınızı sizin için yok etmez.
:::

## update

Opsiyonel. Shell unmount **etmeden** yeni props gönderdiğinde çalışır:

```ts
await orchestrator.updateAppProps('dashboard', { theme: 'dark' });
```

UI'ı yerinde patch'lemek için implement edin — bu unmount/remount
döngüsünün flicker'ını önler:

```ts
async update({ props }) {
  this._root?.render(<App {...props} />);
}
```

`update()` implement edilmezse, yeni props saklanır ve uygulama bir sonraki
mount'ta uygulanır. Uygulama yalnızca props değiştiği için **otomatik olarak
yeniden mount edilmez**.

## Manuel Lifecycle Kontrolü

Shell, lifecycle'ı router üzerinden geçmeden doğrudan yönetebilir:

```ts
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');
await orchestrator.unregister('dashboard');

orchestrator.getAppStatus('dashboard');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting'
//   | 'mounted' | 'updating' | 'unmounting' | 'unmounted' | 'error'
```

## Shell Seviyesi Hook'lar

Shell genelinde reaksiyonları orchestrator config callback'leri veya event
bus'a subscribe olarak bağlayın:

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { /* ... */ },

  onError(error, name) {
    reportToSentry(error, { app: name });
  },

  onStatusChange(name, status) {
    console.log(`[${name}] → ${status}`);
  },
});

const bus = orchestrator.getEventBus();
bus.on(OrchestratorEvent.APP_MOUNT,   ({ name }) => analytics.track('app_mount', { name }));
bus.on(OrchestratorEvent.APP_UNMOUNT, ({ name }) => analytics.track('app_unmount', { name }));
bus.on(OrchestratorEvent.ROUTE_CHANGE, ({ from, to }) => analytics.page(to, { from }));
```

## Tear Down

`destroy()` idempotent'tir — sayfa shell'den ayrıldığında çağırın:

```ts
await orchestrator.destroy();
```

Tüm aktif uygulamaları unmount eder, viewport observer'ı disconnect eder,
router'ı unsubscribe eder, loader cache'i temizler ve son olarak event bus'ı
yıkar.
