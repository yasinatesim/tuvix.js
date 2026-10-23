<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Bir mikro frontend araç seti: React, Vue, Svelte, Angular ya da saf TypeScript ile yazılmış, bağımsız deploy edilen uygulamaları tarayıcıda veya bir React sayfası içinde sunucuda render edilmiş island'lar olarak yükleyin, mount edin ve birbirine bağlayın.
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

- 🧩 **Framework adaptörleri.** React 18/19, Vue 3, Svelte 3-5 ve Angular 15+ desteklenir. Her adaptör, kök bileşeni `mount`, `update` ve `unmount` içeren bir mikro uygulama modülüne çevirir. Her container'da ayrı bir instance çalışır.
- 🛣️ **Path'e göre aktivasyon.** `activeWhen: '/users/:id'` uygulamayı eşleşen path'lerde mount eder. Query string ya da hash değişince uygulama unmount edilmez. Orchestrator, router ve server paketi aynı eşleştiriciyi (`matchPath`) kullanır.
- 🔁 **Sıralı mount.** Route değişiklikleri tek tek reconcile edilir. Yeni uygulamalar mount edilmeden önce aktif olmayanlar unmount edilir, bu yüzden hızlı bir A → B → A geçişinden sonra sayfada yalnızca A kalır.
- 🔗 **Harici router'lar.** `orchestrator.connectRouter()` TanStack Router'ı ya da React Router'ı takip eder. `interceptLinks()` sıradan `<a href>` tıklamalarını istemci tarafı navigasyona çevirir.
- 🏝️ **SSR island'ları.** `TuvixIsland`, sunucuda render edilmiş bir React sayfasında Vue, Svelte, Angular ve React mikro uygulamalarını barındırır, onları yerinde hydrate eder ve yeniden render sırasında DOM'larına hiç dokunmaz.
- 🎨 **İlk boyamada stiller hazır.** `@tuvix.js/vite`, her island'ın hangi stil dosyalarına ihtiyaç duyduğunu sunucunuza bildirir. Böylece bu dosyaları `<head>` içine ekleyebilirsiniz.
- 📦 **Esnek entry'ler.** Script URL'leri, `{ scripts, styles, type }` ya da `() => import('./app')` gibi loader fonksiyonları. Paralel yükleme, yeniden deneme, zaman aşımı, SRI hash'leri.
- 📡 **Ortak event bus.** `getGlobalBus()` her sayfa için tek bir bus döndürür. Ayrı ayrı bundle edilen uygulamalar da aynı bus'ı alır.
- 🔔 **Lifecycle olayları.** `tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`, ayrıca `whenMounted(name)` ve `onLifecycle()`.
- 🔒 **İsteğe bağlı CSS izolasyonu.** `sandbox: true`, uygulamayı kendi stil dosyalarıyla birlikte bir shadow root içinde render eder.
- 🟦 **TypeScript.** Her kütüphane paketi, tip tanımlarıyla birlikte ESM ve CommonJS build'leri sunar.

Tuvix.js, uygulamalar arasında JavaScript izolasyonu yapmaz: her uygulama sayfanın `window` nesnesinde çalışır. Güvenilmeyen kod için `<iframe>` kullanın.

---

## 🤖 AI bileşen üreticisi

Dokümantasyon sitesindeki chatbot ile doğal dilde anlatarak tuvix.js bileşenleri üretin.

- **Sohbet modeli:** OpenRouter üzerinden MiniMax M2.5
- **Embedding modeli:** OpenRouter üzerinden NVIDIA Nemotron Embed 1B (RAG retrieval)
- **Desteklenenler:** React, Vue, Svelte, Angular
- **Veri seti:** HuggingFace üzerinde [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset)

> Deneyin: dokümantasyon sitesindeki [AI Üretici](https://tuvix.js.org/tr/chatbot)

---

## 📦 Kurulum

```bash
# Orchestrator, router, loader, event bus ve sandbox
pnpm add tuvix.js

# İhtiyaç duyduğunuz adaptörler
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# Ya da hazır bir proje iskeleti oluşturun
npx create-tuvix-app my-app --template shell
```

---

## 🚀 Hızlı başlangıç

### Shell

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main-content',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
  fallback: '<p>Dashboard is unavailable.</p>',
});

orchestrator.register({
  name: 'settings',
  entry: () => import('./apps/settings'),
  container: '#main-content',
  activeWhen: '/settings/*',
});

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

### Mikro uygulama

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}</h1>;
}

// Kendini "dashboard" adıyla kaydeder, böylece shell'in script entry'si onu bulur.
export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Framework olmadan:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'settings',
  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Settings for ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

### Props güncelleme

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

Mount edilmiş ve `update` fonksiyonu olan bir uygulama yerinde yeniden render edilir. Aksi halde orchestrator birleştirilmiş props'u bir sonraki mount için saklar.

---

## 🌉 Harici bir router'ı takip etme

```ts
import { createOrchestrator } from 'tuvix.js';
import { router } from './router'; // TanStack Router instance'ı

const orchestrator = createOrchestrator(); // yerleşik router yok

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

await orchestrator.start();
```

---

## 🏝️ Sunucuda render edilen island'lar

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });

// `footerHtml`, yalnızca sunucuda çalışan koddaki renderSvelteToString() çağrısından gelir.
export function Layout({ footerHtml }: { footerHtml?: string }) {
  return <TuvixIsland name="footer" app={footer} props={{ year: 2026 }} ssrHtml={footerHtml} fallback={<footer>© 2026</footer>} />;
}
```

Hydration sırasında island kendi HTML'ini sayfadan okur, bu yüzden istemcinin `footerHtml` değerine hiç ihtiyacı olmaz. Ayrıntılar için [SSR island'ları rehberine](https://tuvix.js.org/tr/guide/ssr-islands) ve [`examples/with-ssr-islands`](./examples/with-ssr-islands) örneğine bakın.

---

## 🔔 Lifecycle olayları

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer');
container.classList.add(hydrated ? 'hydrated' : 'rendered');
```

---

## 🔌 Event bus

```ts
import { getGlobalBus } from 'tuvix.js';

const bus = getGlobalBus(); // orchestrator'ın mount() fonksiyonuna verdiği bus ile aynı

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => console.log(userId));
bus.emit('user:login', { userId: '42' });
off();
```

---

## 📦 Paketler

| Paket | Açıklama |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Şemsiye paket: core, router, loader, event bus, sandbox |
| [`@tuvix.js/core`](./packages/core) | Orchestrator: kayıt, reconcile, props, `connectRouter` |
| [`@tuvix.js/router`](./packages/router) | History/hash router, `matchPath`, `interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | Entry yükleme ve lifecycle runtime'ı |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Pub/sub bus, sayfa genelinde tek `getGlobalBus()` |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox` (Shadow DOM), `JsSandbox` (proxy window) |
| [`@tuvix.js/react`](./packages/react) | React adaptörü, `TuvixReactApp`, `TuvixIsland`, hook'lar |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 adaptörü, `renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 adaptörü, `renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ adaptörü (zoneless), `renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Vite eklentisi: sunucuda render edilen `<head>` için island stil dosyası linkleri |
| [`@tuvix.js/server`](./packages/server) | HTML parçalarını sunucuda birleştirme, streaming, metrikler |
| [`@tuvix.js/module-federation`](./packages/module-federation) | webpack Module Federation remote'larıyla çalışan entry'ler |
| [`@tuvix.js/devtools`](./packages/devtools) | Sayfa içi debug paneli |
| [`create-tuvix-app`](./packages/cli) | Proje iskeleti |

---

## 📁 Proje yapısı

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 Örnekler

| Örnek | Gösterdiği |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | Sunucuda render edilen Vue, Svelte, Angular ve React island'ları içeren bir React host |
| [`with-react`](./examples/with-react) | React shell ve mikro uygulamalar |
| [`with-vue`](./examples/with-vue) | Vue 3 mikro uygulamaları |
| [`with-svelte`](./examples/with-svelte) | Svelte mikro uygulamaları |
| [`with-angular`](./examples/with-angular) | Angular mikro uygulamaları |
| [`with-vanilla`](./examples/with-vanilla) | Framework olmadan |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | Tek shell'de React ve Vue |
| [`with-react-router`](./examples/with-react-router) | Yönlendirme |
| [`with-react-event-bus`](./examples/with-react-event-bus) | Event bus |
| [`with-react-sandbox`](./examples/with-react-sandbox) | CSS sandbox |
| [`with-react-devtools`](./examples/with-react-devtools) | Devtools paneli |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | `@tuvix.js/server` ile sunucuda birleştirme |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | Framework olmadan sunucuda birleştirme |

---

## 🗺️ Yol haritası

Yayında olanlar:

- Sıralı reconcile, `connectRouter`, viewport'a girince mount ve fallback HTML destekleyen orchestrator
- SSR hydration destekli React, Vue, Svelte 3-5 ve Angular (zoneless) adaptörleri
- `TuvixIsland`, lifecycle olayları, `@tuvix.js/vite` ile island asset'leri
- Streaming ve Prometheus metrikleriyle sunucuda birleştirme (`@tuvix.js/server`)
- Module Federation entry'leri, sayfa içi devtools, CLI ile proje iskeleti
- 10 dilde dokümantasyon

Planlananlar:

- Mikro uygulamalar arasında hot module reload
- Native ESM / import map desteği
- Stale-while-revalidate ile parça önbelleği kullanan, edge'e uygun sunucu tarafı birleştirme
- Test araçları ve mock orchestrator
- Parça bazında A/B testi

---

## 🤝 Katkıda bulunma

Pull request açmadan önce [katkı rehberini](./CONTRIBUTING.md) okuyun.

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

0.4 sürümünden mi geçiyorsunuz? [Geçiş rehberini](https://tuvix.js.org/tr/guide/migration-0-5) okuyun.

---

## 🔑 Lisans

Copyright © 2026, MIT Lisansı.
Ayrıntılar için [LICENSE](./LICENSE) dosyasına bakın.

---

<p align="center">Bu README, <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> ile oluşturuldu 🥲</p>
