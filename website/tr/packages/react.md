---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React Bağlamaları"
  description="Tuvix.js için React 18+ bağlamaları. createMicroApp sarmalayıcı, useMicroApp hook, useTuvixEvent hook."
  icon="⚛️"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/react react react-dom
```

## API

### `createMicroApp(Component)`

Bir React bileşenini Tuvix.js mikro uygulaması olarak sarar. Mount/unmount/update'i otomatik olarak yönetir.

```tsx
import { createMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

### `useMicroApp()`

Mevcut mikro uygulama bağlamına erişir.

### `useTuvixEvent(event, handler)`

Event bus olaylarına otomatik temizleme ile abone olur.

[React Rehberi](/tr/guide/react) sayfasına bakın.
