---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Yükleyici"
  description="Önbellekleme, yeniden deneme mantığı ve hata sınırı desteği ile dinamik modül yükleyici. Mikro uygulama paketlerini talep üzerine getirir ve değerlendirir."
  icon="📦"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/loader
```

## Hızlı Başlangıç

```ts
import { createLoader } from '@tuvix.js/loader';

const app = await loadMicroApp('https://cdn.example.com/dashboard.js');
await app.mount(container, props);
```

## API

### `loadMicroApp(entry, options?)`

URL ile bir mikro uygulama paketi yükler. Dışa aktarılan `MicroApp` nesnesini döndürür.

```ts
interface LoadOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
}
```

### `createLoader(options?)`

Paylaşılan yapılandırma ile özel bir yükleyici örneği oluşturur.

### `loader.clear(url?)`

Yükleyici önbelleğini temizler.

## Hata Yönetimi

```ts
try {
  const app = await loadMicroApp('/my-app.js', { retries: 2 });
  await app.mount(container);
} catch (error) {
  if (error.code === 'LOAD_TIMEOUT') {
    // Zaman aşımı mesajı göster
  } else if (error.code === 'LOAD_FAILED') {
    // Yükleme hatası mesajı göster
  }
}
```
