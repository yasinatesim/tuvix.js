# Başlarken

Bu sayfada iki mikro uygulamalı bir shell kuracaksınız: bir ana sayfa ve bir dashboard. Uygulamaları kaydedecek, router'ın onları mount etmesini sağlayacak ve mount edilmiş bir uygulamaya yeni props göndereceksiniz.

## Kurulum

Şemsiye paketi kurun. Paket orchestrator, router, loader, event bus ve sandbox'ı içerir:

```bash
pnpm add tuvix.js
```

Mikro uygulamalarınızın kullandığı her framework için bir adaptör ekleyin:

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## Proje iskeleti oluşturma

`create-tuvix-app`, 0.5 paketlerine bağımlı bir shell ya da mikro uygulama projesi oluşturur:

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

Şablonlar: `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. Bunun yerine repodaki örneklerden birini kopyalamak için `--example <name>` geçin.

## Shell oluşturma

Sayfa layout'u shell'e aittir ve hangi uygulamanın nereye gideceğine shell karar verir. Ona bir container elemanı verin:

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

Ardından orchestrator'ı oluşturun, uygulamaları kaydedin ve orchestrator'ı başlatın:

```ts
// src/main.ts
import { createOrchestrator, interceptLinks, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  // Tek başına '/' her path ile eşleşir; `end: true` eşleşmeyi tam yapar.
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
});

// <a href> tıklamalarını sayfa yüklemesi yerine router navigasyonuna çevirir.
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

Olan şu:

1. `start()` mevcut path'i okur ve `activeWhen` değeri eşleşen her uygulamayı mount eder.
2. `<a href="/dashboard">` linkine tıklamak `navigateTo('/dashboard')` çağrısını yapar. Router URL'yi push eder, orchestrator önce `home` uygulamasını unmount eder, ardından `dashboard` uygulamasını mount eder.
3. `dashboard` ilk kez mount edilirken script'i ve stil dosyası yüklenir. Sonraki mount'lar yüklenmiş modülü yeniden kullanır.

Router tıklamaları kendiliğinden yakalamaz. `interceptLinks` olmadan bir linke tıklamak sayfayı yeniden yükler ve orchestrator yeni sayfa yüklemesinde doğru uygulamayı mount eder.

## Mikro uygulama yazma

Mikro uygulama, `mount` ve `unmount` fonksiyonlarına sahip bir nesnedir. `defineMicroApp` nesnenin yapısını kontrol eder ve modülü kendi adıyla kaydeder. Böylece script çalıştıktan sonra loader modülü bulabilir:

```ts
// apps/home.ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Welcome, ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },

  update({ props, container }) {
    const title = container?.querySelector('h1');
    if (title) title.textContent = `Welcome, ${String(props.user ?? 'Guest')}`;
  },

  unmount({ container }) {
    container.replaceChildren();
  },
});
```

`defineMicroApp` fonksiyonuna verdiğiniz `name`, shell'de kaydettiğiniz adla aynı olmalıdır. Loader modülü bu adla arar.

## Framework adaptörü kullanma

Adaptörler aynı modülü bir kök bileşenden oluşturur. Modülü kaydeder, her container için bir framework instance'ı tutar ve lifecycle olaylarını tetikler.

```tsx
// dashboard/src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Dashboard for {user}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

```ts
// settings/src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Settings from './Settings.vue';

export default createVueMicroApp({ name: 'settings', App: Settings });
```

Framework sayfaları: [React](/tr/guide/react), [Vue](/tr/guide/vue), [Svelte](/tr/guide/svelte), [Angular](/tr/guide/angular).

Her mikro uygulamayı bir ES module bundle'ı olarak build edip yükleyin. Vite'ın library build'i iş görür:

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

Vite'ın ES çıktısı `.js` ile biter. Entry `type: 'module'` belirtmedikçe loader bu dosyayı klasik script olarak ele alır. Yukarıdaki gibi shell'deki entry'de `type: 'module'` değerini koruyun.

## Props'ları çalışma anında güncelleme

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` yeni props'ları kayıtlı olanlarla birleştirir. Uygulama mount edilmişse ve `update` fonksiyonu varsa orchestrator bu fonksiyonu birleştirilmiş props ile çağırır ve uygulama yerinde yeniden render edilir. Uygulama mount edilmemişse orchestrator props'ları bir sonraki mount için saklar.

## Shell'in yapmadıkları

- Layout'unuzu render etmez. Container'lar shell'in kendi HTML'inde bulunur.
- Uygulamalar arasında framework instance'ı paylaşmaz. İki React uygulaması iki ayrı React root'u alır.
- JavaScript'i sandbox içinde çalıştırmaz. Her uygulama sayfanın `window` nesnesinde çalışır.

## Sonraki adımlar

- [Mimari](/tr/guide/architecture): navigasyondan `mount` çağrısına giden yol.
- [Yönlendirme](/tr/guide/routing): `activeWhen` pattern'leri, yerleşik router, guard'lar.
- [Harici router](/tr/guide/external-router): TanStack Router veya React Router'ı takip etme.
- [SSR island'ları](/tr/guide/ssr-islands): mikro uygulamaları bir React sayfası içinde sunucuda render etme.
