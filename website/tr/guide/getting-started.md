# Başlarken

## Kurulum

Hepsi bir arada paketi yükleyin:

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

## CLI ile İskelet Oluşturma

Başlamanın en hızlı yolu `create-tuvix-app` kullanmaktır:

```bash
npx create-tuvix-app uygulamam
cd uygulamam
npm install
npm run dev
```

## Temel Kurulum

### 1. Shell Uygulamasını Oluşturun

**Shell** (ana bilgisayar olarak da bilinir), tüm mikro uygulamaları düzenleyen kök uygulamadır.

```ts
// shell/main.ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  container: '#app',
});

const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'ana-sayfa' },
    { path: '/panel', app: 'panel' },
    { path: '/profil', app: 'profil' },
  ],
});

orchestrator.register('ana-sayfa', {
  entry: 'https://cdn.example.com/ana-sayfa/main.js',
});

orchestrator.register('panel', {
  entry: 'https://cdn.example.com/panel/main.js',
});

orchestrator.start();
```

### 2. Mikro Uygulama Oluşturun

Her mikro uygulama standart bir lifecycle nesnesi dışa aktarır:

```ts
// panel/main.ts
import type { MicroAppDefinition } from '@tuvix.js/core';

export const app: MicroApp = {
  async mount(container, props) {
    container.innerHTML = `
      <div>
        <h1>Panel</h1>
        <p>Merhaba, ${props?.kullanici ?? 'Misafir'}!</p>
      </div>
    `;
  },

  async unmount(container) {
    container.innerHTML = '';
  },
};
```

## Sonraki Adımlar

- [Mimari Genel Bakış](/tr/guide/architecture) - Tuvix.js'in nasıl çalıştığını anlayın
- [Lifecycle Hooks](/tr/guide/lifecycle) - İnce taneli kontrol
- [Event Bus](/tr/guide/event-bus) - Uygulamalar arası iletişim
- [Sandbox](/tr/guide/sandbox) - Stil ve betik izolasyonu
