---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Server"
  description="Server-side composition for Tuvix.js. Pre-render micro app HTML on the server and stitch it together before sending to the client."
  icon="🖥️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/server
```

## Usage

```ts
import { createServerRenderer } from '@tuvix.js/server';

const renderer = createServerRenderer({
  apps: {
    header: { entry: 'https://cdn.example.com/header.js' },
    main: { entry: 'https://cdn.example.com/main.js' },
  },
});

// Render all apps to HTML strings
const result = await renderer.render({
  apps: ['header', 'main'],
  props: {
    header: { user: req.user },
    main: { pageId: req.params.id },
  },
});

res.send(`
  <!DOCTYPE html>
  <html>
    <body>
      ${result.html}
    </body>
  </html>
`);
```

## Express Middleware

```ts
import express from 'express';
import { createMiddleware } from '@tuvix.js/server';

const app = express();

app.use(createMiddleware({
  template: './index.html',
}));
```

## Hydration

After the initial HTML is sent, the client-side Tuvix.js shell hydrates the pre-rendered markup without re-rendering from scratch:

```ts
// client/main.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  container: '#app',
  hydrate: true, // skip initial render, attach to existing DOM
});
```
