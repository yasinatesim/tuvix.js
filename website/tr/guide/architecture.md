# Mimari

## Genel Bakış

Tuvix.js, küçük, birleştirilebilir paketlerden oluşan bir monorepo olarak yapılandırılmıştır. Yalnızca kullandığınız şeyleri içe aktarırsınız.

```
@tuvix.js/core          ← Orkestratör, yaşam döngüsü, kayıt
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
@tuvix.js/core           ← Orkestratör bağlama/bağ kesme kararı alır
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

## Yaşam Döngüsü

Her mikro uygulama `MicroApp` arayüzünü uygulamalıdır:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```
