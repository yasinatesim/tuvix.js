---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="Geliştirici Araçları"
  description="Tarayıcı içi hata ayıklama paneli. Kayıtlı mikro uygulamaları, aktif rotaları, event bus trafiğini, yükleyici durumunu ve performans metriklerini inceleyin."
  icon="🛠️"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/devtools
```

## Kullanım

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator({ container: '#app' });

if (process.env.NODE_ENV === 'development') {
  installDevTools(orchestrator);
}
```

## Neler İncelenebilir

- **Kayıtlı Uygulamalar** - adlar, giriş URL'leri, sandbox yapılandırması
- **Aktif Uygulamalar** - şu anda mount edilmiş mikro uygulamalar
- **Event Bus** - canlı olay akışı, yayınlanan olaylar ve yükleri
- **Yükleyici** - önbellek girişleri, getirme durumu ve zamanlamaları
- **Performans** - her uygulama için mount/unmount süreleri

## Klavye Kısayolu

DevTools panelini açmak/kapatmak için `Ctrl+Shift+T` (Mac'te `Cmd+Shift+T`) tuşlarına basın.

## Yapılandırma

```ts
installDevTools(orchestrator, {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
  height: 300,
  open: false,
});
```

::: warning Üretim
Devtools'u asla üretime göndermeyin. Ortam kontrollerini kullanın.
:::
