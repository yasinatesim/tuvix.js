---
title: Paketler
---

# Paketler

Tuvix.js 15 paketten oluşur: `@tuvix.js/*` scope'undaki 13 kütüphane, `tuvix.js` şemsiye paketi ve proje iskeleti oluşturan `create-tuvix-app`. Uygulamanızın import ettiği paketleri kurun.

<PackagesOverview />

## Hepsini birden kurmak

```bash
npm install tuvix.js
```

[`tuvix.js` şemsiye paketi](/tr/packages/tuvix) core, router, event bus, loader ve sandbox paketlerini yeniden export eder. Framework adaptörlerini, `@tuvix.js/server`, `@tuvix.js/vite`, `@tuvix.js/devtools` ve `@tuvix.js/module-federation` paketlerini içermez; bunları ayrıca kurun.

## Paketleri tek tek kurmak

```bash
# Core
npm install @tuvix.js/core
npm install @tuvix.js/router
npm install @tuvix.js/event-bus
npm install @tuvix.js/loader
npm install @tuvix.js/sandbox

# Framework adaptörleri (her mikro uygulamanın kullandığını kurun)
npm install @tuvix.js/react
npm install @tuvix.js/vue
npm install @tuvix.js/svelte
npm install @tuvix.js/angular

# Sunucu tarafı render ve build araçları
npm install @tuvix.js/server
npm install -D @tuvix.js/vite
npm install @tuvix.js/module-federation
npm install @tuvix.js/devtools

# Yeni proje iskeleti oluşturun
npx create-tuvix-app my-app
```

pnpm kullanıyorsanız `npm install` yerine `pnpm add` yazın.
