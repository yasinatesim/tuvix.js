# Tuvix.js nedir?

Tuvix.js, tarayıcı için bir mikro frontend araç setidir. Host sayfa (shell) mikro uygulamaları kaydeder. Tuvix.js her uygulamanın kodunu yükler, uygulamayı bir container'a mount eder, ona props geçer ve URL ya da kodunuz söylediğinde uygulamayı unmount eder. Her mikro uygulama React, Vue, Svelte, Angular kullanabilir ya da hiçbir framework kullanmayabilir. Her ekip kendi uygulamasını kendi takvimine göre build edip deploy eder.

## Ne yapar

- **Mikro uygulamaları yönetir.** `createOrchestrator()` uygulamaların bir kaydını tutar. Her uygulama için mevcut path'e bakarak uygulamanın mount edilip edilmeyeceğine karar verir ve aynı anda tek bir reconcile çalıştırır. Böylece aynı container'ı paylaşan iki uygulama hiçbir zaman çakışmaz.
- **Kodu ihtiyaç anında yükler.** Bir uygulamanın `entry` değeri bir script URL'si, script ve stil dosyalarından oluşan bir liste ya da `() => import('./dashboard')` gibi bir fonksiyon olabilir. Loader başarısız yüklemeleri yeniden dener, yavaş olanları iptal eder.
- **URL'ye göre yönlendirir.** `activeWhen: '/dashboard/*'` bir uygulamayı `/dashboard` ve altındaki her path'te mount eder. Yerleşik router'ı kullanabilir ya da `connectRouter()` ile TanStack Router veya React Router'ı takip edebilirsiniz.
- **Framework'leri uyarlar.** `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp` ve `createAngularMicroApp` bir kök bileşeni `mount`, `update` ve `unmount` fonksiyonlarına sahip bir modüle dönüştürür.
- **Bir React sayfasında island barındırır.** `TuvixIsland`, sunucuda render edilmiş bir React ağacının içine bir Vue, Svelte, Angular veya React mikro uygulaması mount eder ve sunucu HTML'ini iki kez göndermeden hydrate eder. Bkz. [SSR island'ları](/tr/guide/ssr-islands).
- **Lifecycle'ı bildirir.** Adaptörler ve `defineMicroApp`; `tuvix:mounted`, `tuvix:unmounted` ve `tuvix:error` DOM olaylarını tetikler. `whenMounted(name)` ise uygulama sayfaya geldiğinde resolve olur. Bkz. [Lifecycle olayları](/tr/guide/lifecycle-events).
- **Uygulamaları birbirine bağlar.** Bir sayfadaki tüm uygulamalar `getGlobalBus()` üzerinden tek bir event bus paylaşır. Her uygulama kendi `@tuvix.js/event-bus` kopyasını bundle'lasa bile bu geçerlidir.
- **İstendiğinde CSS'i izole eder.** `sandbox: true` bir uygulamayı shadow root içinde render eder. Böylece sayfa CSS'i ile uygulamanın CSS'i birbirinden ayrı kalır.

## Ne zaman kullanılır

Tek bir sayfanın parçalarını birden fazla ekip geliştiriyorsa ve bu parçaları ayrı ayrı deploy etmesi gerekiyorsa Tuvix.js'e başvurun. Eski bir uygulamayı, başka bir framework ile yeniden yazılan sürümünün yanında çalışır tutmak istediğinizde de işe yarar. Sunucu tarafı render kullanan bir React sitesine Vue veya Svelte widget'ları eklemek isteyen tek bir ekip için de uygundur.

## Ne zaman kullanılmaz

- Tek ekip, tek framework, tek deploy: sıradan bir single-page uygulama daha basittir.
- Uygulamalar arasında sıkı bir güvenlik izolasyonu gerekiyorsa. Tuvix.js her uygulamayı aynı JavaScript realm'inde çalıştırır. `@tuvix.js/sandbox` paketindeki `JsSandbox`, kendi proxy'si üzerinden yapılan global yazmaları gizler ama bir uygulamanın `window` nesnesine erişmesini engellemez. Güvenilmeyen kod için `<iframe>` kullanın.
- Tüm uygulamalar arasında ortak state taşıyan tek bir bundle istiyorsanız. Mikro uygulamalar tasarım gereği olaylar ve props üzerinden haberleşir.

## Paketler

| Paket | Ne için kullanılır |
| --- | --- |
| `tuvix.js` | Core, router, event bus, loader ve sandbox'ı tek kurulumla getirir |
| `@tuvix.js/core` | `createOrchestrator`, `defineMicroApp` |
| `@tuvix.js/router` | `createRouter`, `matchPath`, `interceptLinks` |
| `@tuvix.js/loader` | Entry yükleme ve lifecycle runtime'ı (`whenMounted`, `onLifecycle`) |
| `@tuvix.js/event-bus` | `createEventBus`, `getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`, `JsSandbox` |
| `@tuvix.js/react`, `vue`, `svelte`, `angular` | Framework adaptörleri, `TuvixIsland` (React) |
| `@tuvix.js/vite` | Sunucuda render edilen `<head>` için island stil dosyası linkleri |
| `@tuvix.js/server` | HTML parçalarının sunucu tarafında birleştirilmesi |
| `@tuvix.js/module-federation` | webpack Module Federation remote'larından yüklenen entry'ler |
| `@tuvix.js/devtools` | Sayfa içi debug paneli |
| `create-tuvix-app` | Proje iskeleti oluşturma |

## Temel kavramlar

| Terim | Anlamı |
| --- | --- |
| Shell | Orchestrator'ı oluşturan ve layout'un sahibi olan host sayfa |
| Mikro uygulama | `mount` ve `unmount` (isteğe bağlı olarak `bootstrap`, `update`) fonksiyonlarına sahip bir modül |
| Entry | Loader'ın mikro uygulamayı aldığı yer: URL, `{ scripts, styles }` ya da bir loader fonksiyonu |
| Container | Mikro uygulamanın içine render edildiği eleman |
| Island | Host'un sunucuda render ettiği ve client'ın yerinde hydrate ettiği mikro uygulama |
| Event bus | Sayfadaki tüm uygulamaların paylaştığı bir pub/sub kanalı |

## Sonraki adımlar

- [Başlarken](/tr/guide/getting-started) bir shell ve iki mikro uygulama kurar.
- [Mimari](/tr/guide/architecture) bir navigasyonun nasıl mount'a dönüştüğünü gösterir.
- 0.4'ten mi geliyorsunuz? [0.5 sürümüne geçiş](/tr/guide/migration-0-5) sayfasını okuyun.
