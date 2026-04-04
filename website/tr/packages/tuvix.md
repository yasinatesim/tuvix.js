---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (Hepsi Bir Arada)"
  description="Hepsi bir arada paket. Kolaylık için @tuvix.js/core, router, event-bus, loader ve sandbox'ı yeniden dışa aktarır."
  icon="🎁"
  github="tuvix"
/>

## Kurulum

```bash
npm install tuvix.js
```

## Kullanım

```ts
import { createOrchestrator, createRouter, getGlobalBus } from 'tuvix.js';
```

## Dahil Olanlar

| Dışa Aktarım | Kaynak |
|---------------|--------|
| `createOrchestrator` | `@tuvix.js/core` |
| `createRouter` | `@tuvix.js/router` |
| `eventBus`, `createEventBus` | `@tuvix.js/event-bus` |
| `loadMicroApp`, `createLoader` | `@tuvix.js/loader` |
| `createSandbox` | `@tuvix.js/sandbox` |

## Ne Zaman Bireysel Paketler Kullanmalı

Hepsi bir arada `tuvix.js`'i kullanın:
- Başlangıçtaysanız ve her şeyin kullanılabilir olmasını istiyorsanız
- Bundle boyutu endişe kaynağı değilse

Bireysel paketleri kullanın:
- Bağımlılıklar konusunda açık olmak istiyorsanız
- Büyük bir monorepo'da tree-shaking kontrolüne ihtiyacınız varsa
