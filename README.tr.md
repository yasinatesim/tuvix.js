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

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    console.log('Dashboard başlatıldı');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Hoş geldiniz, ${props?.user}!</h1>`;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('Props güncellendi:', props);
  },
});
```

---

## 🔌 Uygulamalar Arası İletişim

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// Uygulama A - olay gönder
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// Uygulama B - olayı dinle
bus.on('user:login', (data) => {
  console.log(`${data.name} giriş yaptı!`);
});
```

---

## 🛣️ Yönlendirme

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/settings/*', app: 'settings' },
    { path: '/profile/*', app: 'profile' },
  ],
});
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
│   ├── react/              # React 18+ örneği
│   ├── vue/                # Vue 3 örneği
│   ├── svelte/             # Svelte 5 örneği
│   ├── angular/            # Angular 15+ örneği
│   └── vanilla/            # Saf JS örneği
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
| [React Örneği](./examples/with-react) | React 18+ | `examples/with-react/` |
| [Vue Örneği](./examples/with-vue) | Vue 3 | `examples/with-vue/` |
| [Svelte Örneği](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Angular Örneği](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Saf JS Örneği](./examples/with-vanilla) | Framework'süz | `examples/with-vanilla/` |
| [Saf JS + SSR Örneği](./examples/with-ssr-vanilla) | Framework'süz | `examples/with-ssr-vanilla/` |

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
