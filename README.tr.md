<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Ölçeklenebilir ve bağımsız olarak dağıtılabilen frontend uygulamaları oluşturmak için Lightweight ve esnek bir <strong>mikro frontend framework'ü</strong>.<br/>
  Tuvix.js, birden fazla frontend uygulamasını kusursuz ve bütünleşik bir kullanıcı deneyiminde birleştirir - tıpkı adının ima ettiği gibi.
</p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a> ·
  <a href="./README.tr.md">🇹🇷 Türkçe</a> ·
  <a href="./README.es.md">🇪🇸 Español</a> ·
  <a href="./README.de.md">🇩🇪 Deutsch</a> ·
  <a href="./README.fr.md">🇫🇷 Français</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.zh.md">🇨🇳 中文</a> ·
  <a href="./README.it.md">🇮🇹 Italiano</a> ·
  <a href="./README.pt.md">🇧🇷 Português</a> ·
  <a href="./README.hi.md">🇮🇳 हिंदी</a>
</p>

---

## ✨ Özellikler

- 🧩 **Framework Bağımsız** - React, Vue, Svelte, Angular veya saf JS kullanın
- 📦 **Bağımsız Deployment** - Her mikro uygulamayı ayrı ayrı dağıtın
- 🔗 **Dinamik Modül Yükleme** - Mikro frontendleri talep üzerine yükleyin
- 🛣️ **Yerleşik Yönlendirme** - Mikro uygulamalar arası kesintisiz yönlendirme
- 📡 **Uygulamalar Arası İletişim** - Çapraz uygulama mesajlaşması için olay yolu
- ⚡ **Lightweight** - Sıfır çalışma zamanı bağımlılığı, minimal çekirdek
- 🔄 **Lifecycle Yönetimi** - Bağlama, ayırma, güncelleme kancaları
- 🔒 **Type-Safe** - Katı türlerle tam TypeScript desteği

---

## 🤖 AI Bileşen Üreticisi

Yerleşik AI chatbot ile doğal dilden tuvix.js bileşenleri üretin.

- **Sohbet modeli:** OpenRouter üzerinden MiniMax M2.5 (ücretsiz API, sunucu gerektirmez)
- **Gömme modeli:** OpenRouter üzerinden NVIDIA Nemotron Embed 1B (RAG erişimi)
- **Destekler:** React, Vue, Svelte, Angular
- **Veri seti:** HuggingFace'de [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset)

---

## 📦 Kurulum

```bash
# Hepsi bir arada paket
npm install tuvix.js

# Veya paketleri ayrı ayrı kurun
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 Hızlı Başlangıç

### Host (Shell) Uygulaması

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main-content',
  activeWhen: '/dashboard/*',
});

orchestrator.register({
  name: 'settings',
  entry: 'https://cdn.example.com/settings/main.js',
  container: '#main-content',
  activeWhen: '/settings/*',
});

orchestrator.start();
```

### Mikro Frontend Uygulaması

```ts
import { defineMicroApp } from 'tuvix.js';

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // İlk mount öncesi tek seferlik kurulum (örn. veri ön yükleme)
    console.log('Dashboard başlatıldı');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Hoş geldiniz, ${props?.user ?? 'Misafir'}!</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Shell, orchestrator.updateAppProps(name, props) çağırdığında tetiklenir.
  // DOM'u yerinde güncelle — remount yok, flash yok.
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `Hoş geldiniz, ${props?.user ?? 'Misafir'}!`;
    }
  },
});
```

---

## 🔄 Çalışma Anında Props Güncelleme

Bir mikro uygulamayı yeniden mount etmeden ona yeni props gönderin:

```ts
// Shell'den güncel props gönder — mikro uygulamanın update() hook'unu tetikler
await orchestrator.updateAppProps('dashboard', {
  user: 'Yasin',
  theme: 'dark',
});
```

Props orijinal config props'larıyla birleştirilir. Uygulama `update()` hook'u
tanımlamamışsa, yeni props saklanır ve sonraki mount'ta uygulanır.

---

## 🧭 Manuel Yaşam Döngüsü Kontrolü

```ts
// Route reconciliation dışında manuel mount / unmount
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');

// Mevcut durumu sorgula
orchestrator.getAppStatus('dashboard');     // 'mounted' | 'mounting' | 'error' | ...
orchestrator.getMountedApps();              // ['dashboard']
orchestrator.getRegisteredApps();           // ['dashboard', 'settings']

// Her şeyi temizle (idempotent — birden fazla çağrılabilir)
await orchestrator.destroy();
```

---

## 🌉 Harici Router'a Köprü Kurmak

Halihazırda TanStack Router, Next.js App Router veya React Router kullanıyorsanız,
`config.router`'ı atlayıp mevcut router'ınızın Tuvix.js'i `reconcile(path)`
üzerinden yönetmesini sağlayabilirsiniz:

```ts
const orchestrator = createOrchestrator(); // router config yok

orchestrator.register({
  name: 'dashboard',
  entry: '/dashboard.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();

// Her navigasyondan sonra tuvix.js'e mevcut path'i bildirin
tanstackRouter.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

---

## 👁️ Tembel Mount (Viewport)

Pahalı mikro uygulamaları, container'ları görünür alana girene kadar erteleyin:

```ts
orchestrator.register({
  name: 'comments',
  entry: '/comments.js',
  container: '#comments-section',
  mountWhenVisible: true, // ilk IntersectionObserver isabetinde mount eder
});
```

---

## 🛟 Yükleme Hatasında Yedek HTML

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',
  container: '#reports',
  activeWhen: '/reports/*',
  fallback: '<p class="error">Raporlar geçici olarak kullanılamıyor.</p>',
});
```

---

## ⚡ Önyükleme Stratejileri

```ts
const orchestrator = createOrchestrator({
  router: { /* ... */ },
  prefetch: {
    strategy: 'idle', // 'immediate' | 'idle' | 'hover' | 'none' (varsayılan)
  },
});
```

| Strateji | Bundle ne zaman fetch edilir |
| --- | --- |
| `immediate` | `start()` hemen sonrasında |
| `idle` | Tarayıcı boşa çıktığında (`requestIdleCallback`) |
| `hover` | Sayfada ilk `mouseover` olduğunda |
| `none` | Hiç (varsayılan) — sadece talep üzerine |

---

## 🔌 Uygulamalar Arası İletişim

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// Uygulama A — olay gönder
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// Uygulama B — dinle (unsubscribe fonksiyonu döner)
const unsubscribe = bus.on('user:login', (data) => {
  console.log(`${data.name} giriş yaptı!`);
});

// Bir kez tetikle ve otomatik unsubscribe et
bus.once('app:ready', () => console.log('hazır'));

// Hata ayıklama için tüm olayları dinle
bus.onAny((event, data) => console.log('[bus]', event, data));

// Temizlik
unsubscribe();
```

Orchestrator kendi bus'ını `orchestrator.getEventBus()` ile sağlar; tüm
kayıtlı uygulamalar otomatik olarak aynı kanalı paylaşır.

---

## 🛣️ Yönlendirme

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // veya 'hash'
  base: '/',       // opsiyonel base path
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'users' },
    { path: '/settings', app: 'settings', exact: true },
  ],
});

// Programatik navigasyon
await router.push('/dashboard/overview');
await router.replace('/users/42');
router.back();

// Navigation guard'ları (false dönerse iptal eder)
const off = router.beforeEach(async ({ from, to }) => {
  if (to.startsWith('/admin') && !isAdmin()) return false;
});

// Değişikliklere tepki ver
router.onChange(({ from, to, toRoute }) => {
  console.log(`navigasyon ${from} → ${to}`, toRoute?.params);
});

// Veya orchestrator'ın hazır helper'ını kullan
await orchestrator.navigateTo('/settings');
```

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────┐
│              Tuvix.js Kabuğu                │
│  ┌─────────────────────────────────────────┐│
│  │          Orchestrator                   ││
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ││
│  │  │ Router   │ │Event Bus │ │ Loader  │ ││
│  │  └──────────┘ └──────────┘ └─────────┘ ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌───────┐  ┌───────┐  ┌───────┐          │
│  │ Uyg A │  │ Uyg B │  │ Uyg C │  ...      │
│  │(React)│  │ (Vue) │  │(Svelte│          │
│  └───────┘  └───────┘  └───────┘          │
└─────────────────────────────────────────────┘
```

---

## 📦 Paketler

| Paket | Açıklama |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Hepsi bir arada şemsiye paket |
| [`@tuvix.js/core`](./packages/core) | Lifecycle yönetimli çekirdek orkestratör |
| [`@tuvix.js/router`](./packages/router) | URL tabanlı mikro uygulama yönlendirmesi |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Uygulamalar arası iletişim olay yolu |
| [`@tuvix.js/loader`](./packages/loader) | Dinamik modül yükleyici |
| [`@tuvix.js/sandbox`](./packages/sandbox) | CSS/JS izolasyonu (Shadow DOM + Proxy) |
| [`@tuvix.js/react`](./packages/react) | React 18+ bağlamaları ve kancaları |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 bağlamaları ve composable'ları |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 bağlamaları |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ bağlamaları |
| [`create-tuvix-app`](./packages/cli) | CLI iskele aracı |
| [`@tuvix.js/devtools`](./packages/devtools) | Sayfa içi hata ayıklama paneli |
| [`@tuvix.js/server`](./packages/server) | Sunucu taraflı bileşim |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Webpack Module Federation entegrasyonu |

---

## 📁 Proje Yapısı

```
tuvix.js/
├── packages/
│   ├── core/               # @tuvix.js/core
│   ├── router/             # @tuvix.js/router
│   ├── event-bus/          # @tuvix.js/event-bus
│   ├── loader/             # @tuvix.js/loader
│   ├── sandbox/            # @tuvix.js/sandbox
│   ├── react/              # @tuvix.js/react
│   ├── vue/                # @tuvix.js/vue
│   ├── svelte/             # @tuvix.js/svelte
│   ├── angular/            # @tuvix.js/angular
│   ├── cli/                # create-tuvix-app
│   ├── devtools/           # @tuvix.js/devtools
│   ├── server/             # @tuvix.js/server
│   ├── module-federation/  # @tuvix.js/module-federation
│   └── tuvix/              # tuvix.js (şemsiye)
├── examples/
│   ├── with-angular/              # Angular 15+ örneği
│   ├── with-module-federation-react/ # Module Federation + React örneği
│   ├── with-multiple-frameworks/  # Çoklu framework örneği
│   ├── with-react/                # React 18+ örneği
│   ├── with-react-devtools/       # React + DevTools örneği
│   ├── with-react-event-bus/      # React + Event Bus örneği
│   ├── with-react-router/         # React + Router örneği
│   ├── with-react-sandbox/        # React + Sandbox örneği
│   ├── with-ssr-react/            # SSR + React örneği
│   ├── with-ssr-vanilla/          # SSR + Saf JS örneği
│   ├── with-svelte/               # Svelte 5 örneği
│   ├── with-vanilla/              # Saf JS örneği
│   └── with-vue/                  # Vue 3 örneği
├── website/                # Dokümantasyon sitesi (VitePress, 10 dil)
├── .github/                # CI/CD iş akışları
├── package.json            # Kök çalışma alanı yapılandırması
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ Yol Haritası

### ✅ Tamamlandı

- [x] Çekirdek Orchestrator
- [x] Lifecycle yönetimi
- [x] Dinamik modül yükleme
- [x] Event Bus
- [x] History/hash modlarıyla URL yönlendirmesi
- [x] CSS/JS sandbox izolasyonu
- [x] CLI iskele aracı (`npx create-tuvix-app`)
- [x] DevTools tarayıcı eklentisi
- [x] Sunucu taraflı bileşim
- [x] Module federation desteği
- [x] Framework bağlamaları (React, Vue, Svelte, Angular)
- [x] Çoklu dil dokümantasyonu (10 dil)

### 🔜 Yakında

- [ ] Mikro uygulamalar arası sıcak modül yenileme
- [ ] Paylaşımlı durum yönetimi adaptörü
- [ ] Ön yükleme ve ön getirme stratejileri
- [ ] Eklenti sistemi ve ara yazılım API'si
- [ ] DevTools'ta görsel bağımlılık grafiği
- [ ] Test araçları ve sahte orkestratör
- [ ] Yerel ESM / importmap desteği
- [ ] Edge/CDN uyumlu sunucu bileşimi
- [ ] DevTools entegrasyonu için VS Code eklentisi
- [ ] Mikro uygulama izolasyonu için Storybook entegrasyonu

---

## 🧪 Örnekler

Desteklenen her framework için çalıştırmaya hazır örnekler [`examples/`](./examples) dizininde mevcuttur:

| Örnek | Framework | Yol |
| --- | --- | --- |
| [Angular Örneği](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Module Federation + React Örneği](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [Çoklu Framework Örneği](./examples/with-multiple-frameworks) | Karma | `examples/with-multiple-frameworks/` |
| [React Örneği](./examples/with-react) | React 18+ | `examples/with-react/` |
| [React + DevTools Örneği](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [React + Event Bus Örneği](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [React + Router Örneği](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [React + Sandbox Örneği](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [SSR + React Örneği](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [SSR + Saf JS Örneği](./examples/with-ssr-vanilla) | Framework'süz | `examples/with-ssr-vanilla/` |
| [Svelte Örneği](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Saf JS Örneği](./examples/with-vanilla) | Framework'süz | `examples/with-vanilla/` |
| [Vue Örneği](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

Her örnek şunları gösterir:

- Orchestrator'ü başlatan bir **Shell (Host)** uygulaması
- Dinamik olarak kaydedilen ve yüklenen iki **mikro frontend uygulaması**
- Event Bus üzerinden uygulamalar arası iletişim

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! PR göndermeden önce lütfen [Katkıda Bulunma Rehberi](./CONTRIBUTING.md)'ni okuyun.

```bash
# Depoyu klonlayın
git clone https://github.com/yasinatesim/tuvix.js.git

# Bağımlılıkları yükleyin
pnpm install

# Tüm paketleri derleyin
pnpm build

# Testleri çalıştırın
pnpm test
```

---

## 🔑 Lisans

Telif Hakkı © 2026 - MIT Lisansı.
Daha fazla bilgi için [LICENSE](./LICENSE) dosyasına bakın.

---

<p align="center">Bu README <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> tarafından oluşturulmuştur 🥲</p>
