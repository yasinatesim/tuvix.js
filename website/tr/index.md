---
layout: home

hero:
  name: Tuvix.js
  text: Mikro Frontend Çatısı
  tagline: Hafif, framework'ten bağımsız bir orkestratör. React, Vue, Svelte, Angular veya Vanilla JS ile ölçeklenebilir, bağımsız olarak dağıtılabilir frontend uygulamaları oluşturun.
  image:
    src: /logo.svg
    alt: Tuvix.js
  actions:
    - theme: brand
      text: Başlarken
      link: /tr/guide/getting-started
    - theme: alt
      text: GitHub'da görüntüle
      link: https://github.com/yasinatesim/tuvix.js
    - theme: alt
      text: Paketler
      link: /tr/packages/

features:
  - icon: 🔧
    title: Framework Bağımsız
    details: React, Vue, Svelte, Angular ve Vanilla JS mikro uygulamalarını tek bir shell'de karıştırın — hepsi aynı anda.
  - icon: 📦
    title: Sıfır Çalışma Zamanı Bağımlılığı
    details: Her paket sıfır çalışma zamanı bağımlılığıyla gelir. Tree-shakeable ve ağda küçük.
  - icon: 🔀
    title: Yerleşik Yönlendirme
    details: URL tabanlı mikro uygulama aktivasyonu. Rota değiştikçe uygulamaları otomatik olarak bağlayın ve bağlantısını kesin.
  - icon: 📡
    title: Olay Yolu
    details: Paylaşılan global'lar olmadan mikro uygulamalar arasında yazılı yayın/abone iletişimi.
  - icon: 🔒
    title: CSS ve JS Sandbox
    details: Shadow DOM stil izolasyonu ve JS Proxy kapsam izolasyonu. Artık stil sızıntısı yok.
  - icon: ⚡
    title: Dinamik Yükleme
    details: Mikro uygulama paketlerini önbelleğe alma, yeniden deneme mantığı ve hata sınırlarıyla isteğe bağlı yükleyin.
---

## Hızlı Kurulum

```bash
# Hepsi bir arada paket
npm install tuvix.js

# Veya bireysel paketleri yükleyin
npm install @tuvix.js/core @tuvix.js/router @tuvix.js/event-bus
```

## 14 Paket · 10 Dil · MIT Lisansı

<PackagesOverview />
