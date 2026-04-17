# Başlarken

## Kurulum

Şemsiye paketi yükleyin (her şey bir arada):

```bash
npm install tuvix.js
# veya
pnpm add tuvix.js
# veya
yarn add tuvix.js
```

Veya yalnızca ihtiyacınız olan paketleri yükleyin:

```bash
npm install @tuvix.js/core @tuvix.js/router @tuvix.js/event-bus @tuvix.js/loader
```

## CLI ile Kurulum

Başlamanın en hızlı yolu `create-tuvix-app`:

```bash
npx create-tuvix-app my-app
cd my-app
pnpm install
pnpm dev
```

## Temel Kurulum

### 1. Shell Uygulamasını Oluşturun

**Shell** (host olarak da bilinir), tüm mikro uygulamaları orchestrate eden kök
uygulamadır.

```ts
// shell/main.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/', app: 'home' },
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/profile/*', app: 'profile' },
    ],
  },
});

orchestrator.register({
  name: 'home',
  entry: 'https://cdn.example.com/home/main.js',
  container: '#app',
  activeWhen: '/',
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
});

await orchestrator.start();
```

### 2. Bir Mikro Uygulama Oluşturun

Her mikro uygulama, lifecycle interface'ini implement eden bir module export
eder. `defineMicroApp` helper'ı yalnızca tip doğrulayıcı bir identity
fonksiyonudur — objeyi elle de oluşturabilirsiniz.

```ts
// dashboard/main.ts
import { defineMicroApp } from '@tuvix.js/core';

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // İlk mount öncesi tek seferlik kurulum
  },

  mount({ container, props }) {
    container.innerHTML = `
      <div>
        <h1>Hoş geldiniz, ${props?.user ?? 'Misafir'}!</h1>
      </div>
    `;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // orchestrator.updateAppProps('dashboard', { user: 'Yasin' }) tarafından tetiklenir.
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `Hoş geldiniz, ${props?.user ?? 'Misafir'}!`;
    }
  },
});
```

> Uygulamalar, loader tarafından bulunabilmek için kendilerini
> `window.__TUVIX_MODULES__[name]` üzerine kaydetmelidir. `defineMicroApp`
> helper'ı bunu otomatik yapmaz — fakat framework adapter'ları
> (`createReactMicroApp`, `createVueMicroApp` vb.) yapar.

### 3. Bağımsız Build ve Deploy

Her mikro uygulama bağımsız olarak build edilir ve deploy edilir. Shell
yalnızca entry URL'lerine referans verir:

```bash
cd packages/dashboard
pnpm build
# → dist/'i CDN'e yükle
```

## React ile

```tsx
// dashboard/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Hoş geldiniz, {user}!</h1>;
}

export default createReactMicroApp({
  name: 'dashboard',
  App: Dashboard,
});
```

## Vue ile

```ts
// dashboard/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export default createVueMicroApp({
  name: 'dashboard',
  App: Dashboard,
});
```

## Svelte ile

```ts
// dashboard/main.ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Dashboard from './Dashboard.svelte';

export default createSvelteMicroApp({
  name: 'dashboard',
  App: Dashboard,
});
```

## Angular ile (standalone, 17+)

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createSsrAngularMicroApp({
  name: 'dashboard',
  component: DashboardComponent,
});
```

## Çalışma Anında Props Güncelleme

```ts
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

Eğer uygulama `update()` implement ediyorsa, birleştirilmiş props'ları yerinde
alır. Etmiyorsa, yeni props saklanır ve sonraki mount'ta uygulanır.

## Sonraki Adımlar

- Tasarım için [Mimari Genel Bakış](/tr/guide/architecture)
- İnce taneli kontrol için [Lifecycle Hooks](/tr/guide/lifecycle)
- Uygulamalar arası iletişim için [Event Bus](/tr/guide/event-bus)
- Stil ve script izolasyonu için [Sandboxing](/tr/guide/sandbox)
