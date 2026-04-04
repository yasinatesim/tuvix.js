# Mimari

## Genel Bakış

Tuvix.js, küçük, birleştirilebilir paketlerden oluşan bir monorepo olarak yapılandırılmıştır. Yalnızca kullandığınız şeyleri içe aktarırsınız.

```
@tuvix.js/core          ← Orchestrator, lifecycle, registration
@tuvix.js/router        ← URL tabanlı yönlendirme
@tuvix.js/event-bus     ← Uygulamalar arası yayın/abone
@tuvix.js/loader        ← Dinamik paket yükleme
@tuvix.js/sandbox       ← CSS + JS izolasyonu
@tuvix.js/react         ← React bağlamaları
@tuvix.js/vue           ← Vue bağlamaları
@tuvix.js/svelte        ← Svelte bağlamaları
@tuvix.js/angular       ← Angular bağlamaları
@tuvix.js/devtools      ← Hata ayıklama paneli
@tuvix.js/server        ← SSR bileşimi
@tuvix.js/module-federation  ← Webpack 5 entegrasyonu
create-tuvix-app        ← CLI iskelet oluşturma
tuvix.js                ← Şemsiye paket
```

## İstek Akışı

```
URL değişikliği
    │
    ▼
@tuvix.js/router         ← Yolu mikro uygulama adına eşler
    │
    ▼
@tuvix.js/core           ← Orchestrator bağlama/bağ kesme kararı alır
    │
    ▼
@tuvix.js/loader         ← Mikro uygulama paketini getirir ve çalıştırır
    │
    ▼
@tuvix.js/sandbox        ← Uygulamayı izole kapsamla sarar (isteğe bağlı)
    │
    ▼
Mikro Uygulama .mount()  ← Uygulama container elementine render eder
```

## Lifecycle

Her mikro uygulama `MicroApp` arayüzünü uygulamalıdır:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Orchestrator bu hook'ları doğru zamanda çağırır:

1. **`mount`** - uygulamanın rotası etkin olduğunda çağrılır
2. **`unmount`** - uygulamanın rotasından ayrılırken çağrılır
3. **`update`** - tam yeniden bağlama olmadan props değiştiğinde çağrılır

## İzolasyon Modeli

### CSS İzolasyonu (Shadow DOM)

`sandbox.css = true` olduğunda, mikro uygulama konteyneri Shadow DOM ana bilgisayarı olur.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### JS İzolasyonu (Proxy Kapsamı)

`sandbox.js = true` olduğunda, mikro uygulamanın global kapsamı bir `Proxy` ile sarılır.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

Event bus, tüm mikro uygulamalar arasında paylaşılan ayrıştırılmış bir yayın/abone kanalıdır:

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';
const eventBus = getGlobalBus();
eventBus.emit('user:login', { userId: '42' });

eventBus.on('user:login', ({ userId }) => {
  console.log('Kullanıcı giriş yaptı:', userId);
});
```
