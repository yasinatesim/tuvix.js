---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="Tuvix.js shell'i ya da React, Vue, Svelte, Angular veya vanilla mikro uygulaması için Vite proje iskeleti oluşturan ve bağımlılıkları kuran CLI."
  icon="🚀"
  npm="true"
  github="cli"
/>

## Kullanım

Paketin adı `create-` ile başladığı için her paket yöneticisinin `create` komutu onu bulur, `npx` de paketin `create-tuvix-app` binary'sini çalıştırır:

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create` bayrakları yalnızca `--` sonrasında iletir. Diğer komutlar bayrakları doğrudan geçirir:

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

Binary için Node.js gerekir. Dosyaları geçerli dizinin altında yeni bir klasöre yazar.

## Ne zaman kullanılır

Tek bir Tuvix.js parçasını sıfırdan başlatmak için kullanın: mikro uygulamaları kaydeden bir shell ya da belirli bir framework'te tek bir mikro uygulama. Her çalıştırma, `tuvix.js` ve ilgili `@tuvix.js/*` adaptörünü `^0.5.0` sürümüyle içeren tek bir Vite projesi oluşturur.

Tuvix.js'i zaten var olan bir uygulamaya ekliyorsanız başka bir yol seçin. Adaptörü paket yöneticinizle kurun ve bunun yerine [rehberi](/tr/guide/getting-started) izleyin. Okuyup kopyalayabileceğiniz, çalışan çok uygulamalı bir kurulum için `--example` kullanın ([Örnekler](#examples) bölümüne bakın).

## Hızlı başlangıç

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

CLI altı dosya yazar, `checkout/` içinde `pnpm install` çalıştırır ve sonraki adımları yazdırır:

```text
checkout/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    └── main.tsx
```

`src/main.tsx`, bir shell'in yüklediği mikro uygulama modülünü export eder:

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

`my-react-app` adını shell'inizin kaydettiği adla değiştirin. CLI oraya proje adınızı yazmaz.

## Seçenekler

```text
create-tuvix-app [project-name] [options]
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `project-name` | konumsal | soru | Klasör adı ve `package.json` adı. `-` ile başlamayan ilk argüman bu değeri belirler, sonraki bir argüman onu değiştirir. |
| `--template`, `-t` | `string` | soru | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app` değerlerinden biri. |
| `--typescript` | bayrak | soru (`Yes` önceden seçili) | TypeScript dosyaları ve bir `tsconfig.json` üretir. |
| `--no-typescript` | bayrak | soru | JavaScript dosyaları üretir. `angular-app` bunu yok sayar. |
| `--example`, `-e` | `string` | yok | Şablon yerine GitHub deposundaki `examples/` altından bir klasör indirir. Soruları ve kurulum adımını atlar. |
| `--help`, `-h` | bayrak | `false` | Kullanım bilgisini yazdırır ve çıkar. |
| `--version`, `-v` | bayrak | `false` | `create-tuvix-app v<version>` yazdırır ve çıkar. CLI sürümü kendi `package.json` dosyasından okur. |

Vermediğiniz her değer için CLI etkileşimli bir soru sorar. Sıra şöyledir: proje adı (yer tutucu `my-app`, boş giriş kabul edilmez), şablon, ardından TypeScript. Soru sorulmadan çalışması için üçünü de verin:

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

CLI tanımadığı bayrakları yok sayar.

## Şablonlar

Her şablon `index.html`, `package.json` ve `src/main.<ext>` dosyalarını yazar. Üretilen `package.json` dosyası `private` olur, `"type": "module"` içerir, sürümü `0.1.0` olur ve üç script barındırır: `dev` (`vite`), `build` (`vite build`) ve `preview` (`vite preview`). TypeScript modundaki `svelte-app` dördüncü bir script olarak `check` ekler. Her `package.json` dosyası `tuvix.js@^0.5.0` ve `vite@^6.0.0` listeler, TypeScript modunda bunlara `typescript@^5.7.0` eklenir.

| Şablon | `index.html` ve `package.json` dışındaki dosyalar | Ek bağımlılıklar |
| --- | --- | --- |
| `shell` | `src/main.ts` | yok |
| `react-app` | `src/main.tsx`, `src/App.tsx`, `vite.config.ts` | `react`, `react-dom` `^19.0.0`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3.0`; TS modunda `@types/react`, `@types/react-dom` |
| `vue-app` | `src/main.ts`, `src/App.vue`, `vite.config.ts`; TS modunda `src/vite-env.d.ts` | `vue@^3.5.0`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`, `src/App.svelte`, `vite.config.ts`, `svelte.config.js`; TS modunda `src/vite-env.d.ts` | `svelte@^5.0.0`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5.0.0`; TS modunda `svelte-check@^4.0.0` |
| `angular-app` | `src/main.ts`, `src/app/app.component.ts`, `vite.config.ts` | `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser` `^20.0.0`, `rxjs@^7.8.0`, `tslib@^2.6.0`, `@tuvix.js/angular`, `typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | yok |

TypeScript modu `tsconfig.json` ekler (`ES2020`, `ESNext` modülleri, `bundler` çözümlemesi, `strict`). `react-app`, `vue-app` ve `svelte-app` için bu dosya `src` klasörünün yanındaki `vite.config.ts` dosyasını da kapsar. JavaScript modu `.js` ve `.jsx` uzantılarını kullanır ve `tsconfig.json` yazmaz. `vite.config.ts` ise TypeScript olarak kalır, Vite onu her iki modda da yükler. Tüm `@tuvix.js/*` paketleri `^0.5.0` alır.

### `shell`

History router'lı bir orchestrator. `index.html` içinde bir `#header`, `/dashboard` ve `/settings` bağlantıları olan bir `<nav>` ve bir `<main id="main">` bulunur. `src/main.ts`:

```ts [src/main.ts]
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
```

`entry` URL'sini dashboard uygulamanızın build edilmiş entry'siyle değiştirin ve `settings` uygulamasını kendiniz kaydedin. Şablon yalnızca `dashboard` uygulamasını kaydeder.

### `react-app`

`@tuvix.js/react` paketinden `createReactMicroApp({ name: 'my-react-app', App })`. `App` bir başlık ve aldığı props'u JSON olarak render eder. `vite.config.ts` dosyası `@vitejs/plugin-react` eklentisini ekler. Bu eklenti JSX'i otomatik runtime ile derler, bu yüzden JavaScript modunda `App.jsx` dosyasında `React` import'u gerekmez. TS modundaki `tsconfig.json`, `"jsx": "react-jsx"` ayarını yapar.

### `vue-app`

`@tuvix.js/vue` paketinden `createVueMicroApp({ name: 'my-vue-app', App })`. `vite.config.ts` dosyası `@vitejs/plugin-vue` eklentisini ekler. `App.vue`, shell'in verdiği props'u `inject` ile okuyan bir `<script setup>` bileşenidir:

```vue [src/App.vue]
<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
</script>
```

TS modunda `src/vite-env.d.ts` dosyası `vite/client` tiplerine referans verir ve `*.vue` modüllerini bildirir. Böylece `tsc`, `App` import'unu kabul eder.

### `svelte-app`

Bir Svelte 5 mikro uygulaması. `src/main.ts`, `svelte/reactivity` modülünden `SvelteMap` verir. Böylece `update({ props })` uygulamayı yeniden mount etmek yerine yerinde yeniden render eder:

```ts [src/main.ts]
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
```

`App.svelte`, `name` prop'unu `$props()` ile okur. `vite.config.ts` Svelte eklentisini ekler, `svelte.config.js` de `<script lang="ts">` derlenebilsin diye `preprocess: vitePreprocess()` ayarını yapar. TS modunda `src/vite-env.d.ts` dosyası `svelte` ve `vite/client` tiplerine referans verir, `package.json` dosyası da bir `check` script'i (`svelte-check --tsconfig ./tsconfig.json`) alır.

### `angular-app`

zone.js olmadan Angular 20. Şablon `--no-typescript` verilse bile her zaman TypeScript kullanır. Soruda JavaScript seçtiyseniz `Angular requires TypeScript. Switching to TypeScript automatically.` yazdırır.

```ts [src/main.ts]
// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
```

`AppComponent`, inline şablonlu standalone bir bileşendir. `createSsrAngularMicroApp` onu boş bir container'a sıfırdan render eder. Container `renderAngularToString` ile üretilmiş HTML içeriyorsa mevcut markup'ın üzerine render eder. Adaptör zoneless çalışır. Vite, Angular'ı AOT ile derlemez, bu yüzden bileşenler tarayıcıda derlenir: `import '@angular/compiler'` satırını `src/main.ts` dosyasının ilk satırı olarak tutun ve derleyiciyi çalışma zamanı bağımlılığı olarak bırakın. `tsconfig.json` hedefi `ES2022` olur, `experimentalDecorators` açık, `useDefineForClassFields` kapalıdır. `vite.config.ts` de esbuild hedefini `es2022` yapar.

### `vanilla-app`

`tuvix.js` paketinden `defineMicroApp`. `mount` fonksiyonu `container.innerHTML` içine bir başlık yazar, `unmount` fonksiyonu da onu temizler.

## Örnekler {#examples}

`--example <name>`, `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master` adresini indirir ve `examples/<name>/` klasörünü proje klasörünüze çıkarır. Sorular, `--template`, `--typescript` ve kurulum adımı atlanır. CLI sonraki adım olarak `<pm> install` ve `<pm> run dev` komutlarını yazdırır.

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

Proje adı vermezseniz klasör `my-app` olur. Ad yalnızca harf, rakam ve tire içerebilir. `examples/` içinde şu klasörler var:

| Örnek | Ne gösterir |
| --- | --- |
| `with-react` | Bir shell içinde React mikro uygulamaları |
| `with-vue` | Bir shell içinde Vue mikro uygulamaları |
| `with-svelte` | Bir shell içinde Svelte mikro uygulamaları |
| `with-angular` | Bir shell içinde Angular mikro uygulamaları |
| `with-vanilla` | Framework'süz mikro uygulamalar |
| `with-multiple-frameworks` | Aynı sayfada React ve Vue mikro uygulamaları |
| `with-react-router` | React uygulamalarıyla `@tuvix.js/router` |
| `with-react-event-bus` | `@tuvix.js/event-bus` üzerinden konuşan uygulamalar |
| `with-react-sandbox` | `@tuvix.js/sandbox` ile CSS izolasyonu |
| `with-react-devtools` | [`@tuvix.js/devtools`](/tr/packages/devtools) paneli |
| `with-module-federation-react` | React remote'larıyla `@tuvix.js/module-federation` |
| `with-ssr-react` | React parçalarını birleştiren `@tuvix.js/server` |
| `with-ssr-vanilla` | Düz HTML parçalarını birleştiren `@tuvix.js/server` |
| `with-ssr-islands` | [`@tuvix.js/vite`](/tr/packages/vite) ile birkaç framework'te sunucuda render edilmiş island'lar |

Örnekler monorepo içinde yer aldığı için `package.json` dosyaları `workspace:*` bağımlılıkları içerir. Kurulum komutunu çalıştırmadan önce her `workspace:*` ve `workspace:^` değerini `^0.5.0` ile değiştirin. Aksi halde paket yöneticisi desteklenmeyen protokol hatasıyla durur.

## Paket yöneticisi tespiti

CLI, kurulum adımı ve yazdırılan komutlar için paket yöneticisini, kendisini nasıl başlattığınıza bakarak seçer. Sırasıyla şunları kontrol eder:

1. `process.versions.bun` tanımlıysa: `bun`.
2. `npm_execpath` içinde `pnpm` ya da `yarn` geçiyorsa: o yönetici.
3. `npm_config_user_agent` değeri `pnpm`, `yarn` ya da `bun/` ile başlıyorsa: o yönetici.
4. Hiçbiri değilse: `npm`.

`pnpm create tuvix-app` ve `pnpm dlx create-tuvix-app` pnpm ile, `yarn create` yarn ile, `npx` ve `npm create` npm ile kurar. Bu seçimi değiştiren bir bayrak yoktur.

## Kurulum adımı

Şablonla yapılan bir çalıştırmadan sonra CLI yeni klasörde `<pm> install` komutunu bir spinner (`Installing dependencies with <pm>`) arkasında çalıştırır. Paket yöneticisinin çıktısını gizler.

- Çıkış kodu 0 ise spinner `Dependencies installed` ile biter, CLI de `cd <name>` ve `<pm> run dev` komutlarını yazdırır.
- Çıkış kodu sıfırdan farklıysa ya da binary yoksa spinner `Install failed. Run manually:` ile biter, ardından `cd <absolute path>` ve `<pm> install` gelir. Proje dosyaları yerinde kalır ve CLI yine 0 koduyla çıkar.

`--example` çalıştırmaları hiçbir zaman kurulum yapmaz.

## Sınır durumlar

- Var olan bir klasör çalıştırmayı `Directory "<name>" already exists.` mesajı ve 1 çıkış koduyla durdurur. CLI var olan bir klasöre hiçbir zaman yazmaz ve onunla birleştirmez.
- Çözümlenmiş path'i geçerli dizinle başlamayan bir ad (`../app` gibi) `Project directory must be within the current working directory.` mesajıyla durur.
- Bilinmeyen bir `--template` değeri, sorulardan sonra `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app` hatasıyla başarısız olur.
- Son argüman olarak değersiz verilen `--template` ya da `--example` hiç verilmemiş sayılır: şablon sorusu gelir ya da normal bir şablon çalıştırması yapılır.
- CLI proje adını hem klasör hem de `package.json` içindeki `name` için yazıldığı gibi kullanır. npm adlandırma kurallarını kontrol etmez. Bu yüzden `My App` geçersiz bir paket adı üretir.
- Bir soruyu iptal etmek (Ctrl+C) `Operation cancelled.` yazdırır ve 0 koduyla çıkar.
- `master` dalında bulunmayan bir örnek adı boş bir klasör bırakır ve `Example "<name>" was not found or failed to extract.` hatasıyla başarısız olur. Yeniden denemeden önce klasörü silin.
- CLI tek bir örnek için deponun tüm tarball'ını indirir. Yavaş bir bağlantıda `--example` da yavaş çalışır.

## Ne yapmaz

- Mikro uygulama şablonları kendilerini mount etmez. `src/main` modülü export eder, `index.html` içinde `mount` çağıran hiçbir şey yoktur. Bu yüzden bir shell entry'yi yükleyene kadar `pnpm run dev` boş bir `#app` gösterir.
- Library modunda bir Vite ayarı yoktur. `vite build` hash'li dosya adlarıyla normal bir uygulama build'i üretir, shell'inizin yükleyeceği entry'yi siz seçersiniz.
- Monorepo, workspace ya da çok uygulamalı kurulum yoktur. CLI'ı her uygulama için bir kez çalıştırın ya da bir `--example` ile başlayın.
- git init, linter, test runner ya da CSS kurulumu yoktur.
- `--no-install` bayrağı ve paket yöneticisi bayrağı yoktur.
- Programatik API yoktur. Paketi import etmek CLI'ı çalıştırır.
