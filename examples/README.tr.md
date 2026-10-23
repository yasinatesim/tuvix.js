<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.js örnekleri

Her özellik ya da framework için ayrı, çalıştırılabilir projeler. Her örneğin `e2e/` klasöründe CI'da çalışan bir Playwright spec'i bulunur.

## Hızlı başlangıç

Herhangi bir örneği `create-tuvix-app` CLI'ıyla başlatın:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

Bu repoyu klonladıysanız kök dizinde `pnpm install` çalıştırın, ardından örnek klasöründe `pnpm dev` (sunucu örneklerinde `pnpm start`) komutunu çalıştırın.

## Mevcut örnekler

| Örnek | Framework | Ne gösterir |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | Saf JS | Framework olmadan `defineMicroApp`, yönlendirme ve `interceptLinks` |
| [`with-react`](./with-react/) | React 18 | `@tuvix.js/react` ile shell, route'lar ve props |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | `getGlobalBus()` üzerinde olay yayınlayan ve alan uygulamalar |
| [`with-react-router`](./with-react-router/) | React 18 | Route'ları uygulamalara eşleme ve client tarafında link navigasyonu |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | `sandbox: true` ile shadow root CSS izolasyonu ve karşılaştırma için sandbox'sız bir uygulama |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | `@tuvix.js/devtools` ile sayfa içi debug paneli |
| [`with-module-federation-react`](./with-module-federation-react/) | React (webpack 5) | `createFederatedEntry` ile yüklenen remote uygulamalar |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | `composeHTML` ile sunucu tarafında fragment birleştirme |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | `composeHTML` ile birleştirilen React `renderToString` fragment'ları |
| [`with-ssr-islands`](./with-ssr-islands/) | React 19 shell, Vue 3, Svelte 5, Angular 20 (Express + Vite) | Client'ta hydrate olan, sunucuda render edilmiş island'lar; satır içi bir `TuvixReactApp`; ve hata verip sayfayı bozmadan fallback'e düşen bir island |
| [`with-vue`](./with-vue/) | Vue 3 | `defineProps` ile props alan `createVueMicroApp` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `export let` ile props alan `createSvelteMicroApp` |
| [`with-angular`](./with-angular/) | Angular 16 | Standalone bileşenler, zoneless çalışma, `createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React ve Vue 3 | Aynı sayfada event bus'ı paylaşan iki framework |

## Çeviriler

`README.md` dosyası olan örnekler bu dosyayı Türkçe, İspanyolca, Almanca, Fransızca, Japonca, Çince, İtalyanca, Portekizce ve Hintçe olarak da sunar. Çeviriler arasında fark olursa İngilizce README esas alınır.
