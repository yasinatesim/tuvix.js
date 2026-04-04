# @tuvix.js/server

> Server-side composition and streaming SSR for Tuvix.js

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/server
```

## Quick Start

```ts
import express from 'express';
import { createMiddleware } from '@tuvix.js/server';

const app = express();

app.use(createMiddleware({
  apps: {
    header: { url: 'http://localhost:3001/header' },
    main: { url: 'http://localhost:3002/main' },
  },
  template: '<html><body><tuvix-slot name="header"></tuvix-slot><tuvix-slot name="main"></tuvix-slot></body></html>',
}));

app.listen(3000);
```

## API

- **`createServerRenderer(config)`** — SSR orchestrator for composing micro app HTML
- **`createStreamingRenderer(config)`** — BigPipe-style streaming for minimal TTFB
- **`createMiddleware(config)`** — Express/Connect middleware for SSR
- **`createStreamingMiddleware(config)`** — Express/Connect middleware for streaming SSR
- **`composeHTML(template, fragments)`** — Manual HTML composition
- **`compileShellTemplate(template)`** — Pre-compile slot patterns for performance
- **`createMetricsCollector()`** — Prometheus-compatible metrics collector

## License

MIT
