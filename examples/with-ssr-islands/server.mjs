// Express server for both modes:
//   node server.mjs         dev: Vite in middleware mode, modules loaded with ssrLoadModule
//   node server.mjs --prod  production: serves dist/client, renders with dist/server
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const root = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.argv.includes('--prod');
const port = Number(process.env.PORT ?? (isProduction ? 5185 : 5186));

const app = express();

/** @type {(url: string) => Promise<{ status: number, html: string }>} */
let renderPage;
/** @type {(error: Error) => void} */
let fixStacktrace = () => {};

if (isProduction) {
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(root, 'dist/client/.vite/manifest.json'),
      'utf8'
    )
  );
  const clientEntryUrl = `/${manifest['src/entry-client.tsx'].file}`;
  const { render } = await import('./dist/server/entry-server.js');

  // Hashed file names never change content, so browsers may cache them for a year.
  app.use(
    '/assets',
    express.static(path.join(root, 'dist/client/assets'), {
      immutable: true,
      maxAge: '1y',
    })
  );
  renderPage = (url) => render(url, { clientEntryUrl });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  renderPage = async (url) => {
    const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
    const result = await render(url, {
      clientEntryUrl: '/src/entry-client.tsx',
    });
    // Adds the Vite client and the React Fast Refresh preamble.
    return { ...result, html: await vite.transformIndexHtml(url, result.html) };
  };
  fixStacktrace = (error) => vite.ssrFixStacktrace(error);
}

app.get('*', async (req, res, next) => {
  try {
    const { status, html } = await renderPage(req.originalUrl);
    res
      .status(status)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(html);
  } catch (error) {
    fixStacktrace(error);
    next(error);
  }
});

app.listen(port, () => {
  console.log(
    `with-ssr-islands (${isProduction ? 'production' : 'dev'}) on http://localhost:${port}`
  );
});
