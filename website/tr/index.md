---
layout: home

# Ana sayfadaki her görünür metin bu frontmatter'dan gelir. Bir dil için bu
# dosyanın çevrilmiş kopyası yeterlidir. Alan referansı:
# website/.vitepress/theme/components/home/model.ts

# Orbit bölümleri bu sayfadaki markdown gövdesinin yerini alır, bu yüzden
# gövde boş kalır. Bayrağı silmeyin: bayrak olmadan OrbitHome, alt bilginin
# üstünde boş ve kenarlıklı bir içerik bloğu gösterir.
markdownContent: false

hero:
  name: Tuvix.js
  badge: TypeScript mikro frontend'ler · MIT
  title: Çok sayıda uygulama.
  accent: Tek bir deneyim.
  tagline: Tuvix.js; React, Vue, Svelte, Angular ve vanilla JS mikro uygulamalarını tek bir host sayfaya mount eder. Yönlendirme, event bus, sandbox ve sunucu tarafı render ayrı paketler olarak gelir, ihtiyaç duyduğunuzda eklersiniz.
  image:
    src: /logo.svg
    alt: Tuvix.js logosu
  actions:
    - theme: brand
      text: Başlarken
      link: /tr/guide/getting-started
    - theme: alt
      text: Playground'u deneyin
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: Komutu kopyala
    copiedLabel: Kopyalandı

showcase:
  file: src/orchestrator.ts
  copyLabel: Kopyala
  copiedLabel: Kopyalandı
  shellTitle: Host shell
  routeLabel: URL
  mountedLabel: mount edildi
  busLabel: Ortak event bus

featuresSection:
  title: Tuvix.js ile gelenler
  lead: Sekiz yapı taşı. Temel beşliyi almak için tuvix.js şemsiye paketini kurun ya da shell'iniz büyüdükçe tek tek paket ekleyin.

features:
  - icon: layers
    title: Framework'ten bağımsız
    details: React, Vue, Svelte, Angular ve vanilla JS mikro uygulamalarını tek bir shell'de yan yana çalıştırın.
    link: /tr/guide/micro-apps
    linkText: Mikro uygulama rehberi
  - icon: box
    title: Üçüncü parti runtime bağımlılığı yok
    details: Her paket yalnızca diğer @tuvix.js paketlerine bağımlıdır. Sadece import ettiğiniz paketleri kurarsınız.
    link: /tr/packages/
    linkText: Tüm paketler
  - icon: route
    title: Yerleşik yönlendirme
    details: Router, URL değiştikçe uygulamaları history veya hash modunda mount ve unmount eder.
    link: /tr/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: Event bus
    details: Uygulamalar global değişken paylaşmadan tipli olaylar yayınlar ve bu olaylara abone olur.
    link: /tr/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: CSS ve JS sandbox
    details: Shadow DOM her uygulamanın stillerini kendi container'ı içinde tutar. JsSandbox bir script'i, işiniz bitince atabileceğiniz bir Proxy window üzerinde çalıştırır.
    link: /tr/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: Dinamik yükleme
    details: Loader, uygulama bundle'larını ihtiyaç anında indirir, önbelleğe alır ve başarısız yüklemeleri yeniden dener.
    link: /tr/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: Sayfa içi panel kayıtlı uygulamaları, aktif route'u ve event bus trafiğini listeler.
    link: /tr/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: Sunucu tarafı render
    details: Mikro uygulamaları sunucuda render edin ve HTML'lerini shell şablonuna string ya da stream olarak yerleştirin.
    link: /tr/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  eyebrow: Adaptörler
  title: Framework'ünüzü seçin
  lead: Her adaptör bir bileşeni, orchestrator'ın mount, update ve unmount edebildiği bir mikro uygulamaya dönüştürür.
  copyLabel: Kurulum komutunu kopyala
  copiedLabel: Kopyalandı
  items:
    - name: React
      details: createReactMicroApp bir bileşeni sarar. useTuvixProps ve useTuvixBus props'ları ve olayları okur.
      install: npm i @tuvix.js/react
      link: /tr/guide/react
    - name: Vue
      details: createVueMicroApp bir Vue 3 uygulamasını mount eder. Props ve event bus için composable'lar sunar.
      install: npm i @tuvix.js/vue
      link: /tr/guide/vue
    - name: Svelte
      details: createSvelteMicroApp Svelte 3, 4 ve 5 bileşenlerini mount eder.
      install: npm i @tuvix.js/svelte
      link: /tr/guide/svelte
    - name: Angular
      details: createAngularMicroApp bir Angular 15+ bileşenini kendi container'ına bootstrap eder.
      install: npm i @tuvix.js/angular
      link: /tr/guide/angular
    - name: Vanilla JS
      mark: JS
      color: vanilla
      details: defineMicroApp düz JavaScript'e mount, unmount ve update hook'ları verir.
      install: npm i @tuvix.js/core
      link: /tr/guide/micro-apps

packages:
  eyebrow: Paketler
  title: Her biri kendi sürümüne sahip 15 paket
  lead: Şemsiye paketle başlayın. Daha küçük bir kurulum istediğinizde tek tek paketlere geçin.
  items:
    - name: tuvix.js
      details: Core, router, event bus, loader ve sandbox'ı içeren şemsiye paket.
      link: /tr/packages/tuvix
    - name: '@tuvix.js/core'
      details: Orchestrator. Mikro uygulamaları kaydeder ve lifecycle'larını yürütür.
      link: /tr/packages/core
    - name: '@tuvix.js/router'
      details: Mikro uygulamaları URL'ye göre history veya hash modunda aktifleştirir.
      link: /tr/packages/router
    - name: '@tuvix.js/event-bus'
      details: Mikro uygulamalar arasında tipli publish/subscribe.
      link: /tr/packages/event-bus
    - name: '@tuvix.js/loader'
      details: Uygulama bundle'larını ihtiyaç anında, önbellek ve yeniden deneme ile yükler.
      link: /tr/packages/loader
    - name: '@tuvix.js/sandbox'
      details: Shadow DOM ile CSS izolasyonu, Proxy ile JS izolasyonu.
      link: /tr/packages/sandbox
    - name: '@tuvix.js/server'
      details: Host sayfa için sunucu tarafı birleştirme ve streaming.
      link: /tr/packages/server
    - name: '@tuvix.js/module-federation'
      details: Mikro uygulamaları Webpack Module Federation remote'larından yükler.
      link: /tr/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: Uygulamalar, route'lar ve olaylar için sayfa içi debug paneli.
      link: /tr/packages/devtools
    - name: '@tuvix.js/react'
      details: React adaptörü, hook'lar ve sunucu tarafı render yardımcıları.
      link: /tr/packages/react
    - name: '@tuvix.js/vue'
      details: Vue 3 adaptörü, composable'lar ve sunucu tarafı render yardımcıları.
      link: /tr/packages/vue
    - name: '@tuvix.js/svelte'
      details: Sunucu tarafı render desteğiyle Svelte adaptörü.
      link: /tr/packages/svelte
    - name: '@tuvix.js/angular'
      details: Sunucu tarafı render desteğiyle Angular adaptörü.
      link: /tr/packages/angular
    - name: '@tuvix.js/vite'
      details: Island CSS'ini ve modulepreload linklerini SSR head'ine ekleyen Vite eklentisi. Sunucuda render edilen mikro uygulamalar ilk boyamada stilli gelir.
      link: /tr/packages/vite
    - name: create-tuvix-app
      details: Komut satırından yeni bir host ve mikro uygulama projesi iskeleti oluşturur.
      link: /tr/packages/create-tuvix-app

footer:
  tagline: React, Vue, Svelte, Angular ve vanilla JS için mikro frontend orchestrator'ı.
  columns:
    - title: Dokümantasyon
      links:
        - text: Başlarken
          link: /tr/guide/getting-started
        - text: Mimari
          link: /tr/guide/architecture
        - text: Yapılandırma
          link: /tr/guide/configuration
        - text: Playground
          link: /playground
    - title: Paketler
      links:
        - text: Core
          link: /tr/packages/core
        - text: Router
          link: /tr/packages/router
        - text: Event bus
          link: /tr/packages/event-bus
        - text: Tüm paketler
          link: /tr/packages/
    - title: Proje
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: Sürümler
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: Katkı Sağlama
          link: /tr/contributing
  copyright: MIT Lisansı · © 2026 Yasin ATEŞ
---
