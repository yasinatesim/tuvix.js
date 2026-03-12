---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Sunucu"
  description="Tuvix.js için sunucu tarafı kompozisyon. Mikro uygulama HTML'ini sunucuda önceden işler ve istemciye göndermeden önce birleştirir."
  icon="🖥️"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/server
```

## Kullanım

```ts
import { createServerOrchestrator } from '@tuvix.js/server';

const orchestrator = createServerOrchestrator();

orchestrator.register('header', {
  entry: 'https://cdn.example.com/header.js',
});

const { html, scripts } = await orchestrator.render({
  apps: ['header', 'main'],
  props: {
    header: { user: req.user },
    main: { pageId: req.params.id },
  },
});
```

## Express Middleware

```ts
import express from 'express';
import { tuvixMiddleware } from '@tuvix.js/server';

const app = express();
app.use(tuvixMiddleware({ orchestrator, template: './index.html' }));
```

## Hidrasyon

İlk HTML gönderildikten sonra, istemci tarafı Tuvix.js shell'i önceden işlenmiş markup'ı sıfırdan yeniden işlemeden hidrate eder.
