---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angular Bağlamaları"
  description="Tuvix.js için Angular 15+ bağlamaları. NgModule, servis enjeksiyonu ve RxJS tabanlı event bus entegrasyonu."
  icon="🔺"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## API

### `createAngularMicroApp(config)`

Bir Angular NgModule'ü Tuvix.js mikro uygulaması olarak sarar.

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

export const app = createAngularMicroApp({
  name: 'my-angular-app',
  module: AppModule,
  platform: platformBrowserDynamic,
});
```

**Yapılandırma seçenekleri:**

| Seçenek | Tip | Zorunlu | Açıklama |
|---------|-----|---------|----------|
| `name` | `string` | Evet | Mikro uygulama için benzersiz ad |
| `module` | `any` | Evet | Bootstrap edilecek Angular NgModule sınıfı |
| `platform` | `() => any` | Evet | `platformBrowserDynamic` fonksiyonu |
| `selector` | `string` | Hayır | Bootstrap bileşeninin CSS seçicisi (varsayılan: `'app-root'`) |
| `compilerOptions` | `Record<string, unknown>` | Hayır | Angular derleyici seçenekleri |
| `bootstrap` | `() => void \| Promise<void>` | Hayır | İsteğe bağlı tek seferlik kurulum hook'u |

> **Not:** `platform` parametresi, doğru Angular sürümünün kullanıldığından emin olmak için gereklidir.

[Angular Rehberi](/guide/angular) sayfasına bakın.
