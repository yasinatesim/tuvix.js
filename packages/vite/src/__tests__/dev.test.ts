// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { devStylesheetHandoff } from '../dev';
import { tuvix } from '../index';
import type { TuvixAssets } from '../types';
import { fixturesDir } from './fixture';

const root = path.join(fixturesDir, 'basic');

interface ServerEntry {
  getAssets: (entries: string[]) => Promise<TuvixAssets>;
  renderCard: () => string;
}

describe('dev server', () => {
  let vite: ViteDevServer;
  let http: Server;
  let origin: string;
  let cacheDir: string;

  beforeAll(async () => {
    cacheDir = await mkdtemp(path.join(tmpdir(), 'tuvix-vite-cache-'));
    vite = await createServer({
      root,
      base: '/app/',
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      cacheDir,
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, hmr: false, ws: false },
      plugins: [tuvix()],
    });
    http = createHttpServer(vite.middlewares);
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => http?.close(resolve));
    await vite?.close();
    await rm(cacheDir, { recursive: true, force: true });
  });

  it('returns stylesheet URLs the dev server serves as CSS, in import order', async () => {
    const entry = (await vite.ssrLoadModule('/src/server.ts')) as ServerEntry;
    const assets = await entry.getAssets(['src/islands/card/index.ts']);

    expect(assets).toEqual({
      css: [
        '/app/src/shared/base.css?direct',
        '/app/src/islands/card/card.module.css?direct',
        '/app/src/islands/card/card-plain.css?direct',
      ],
      modulepreload: [],
    });

    const bodies: string[] = [];
    for (const href of assets.css) {
      const response = await fetch(origin + href);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toMatch(/^text\/css/);
      bodies.push(await response.text());
    }

    // The CSS module classes the server rendered are the ones the linked CSS defines.
    const css = bodies.join('\n');
    const classes = [
      ...entry.renderCard().matchAll(/class="([^"]+)"/g),
    ].flatMap((match) => match[1]!.split(' '));
    expect(classes.some((name) => /^_title_/.test(name))).toBe(true);
    for (const name of classes) expect(css).toContain(`.${name}`);
  });

  it('skips CSS behind import(), like the production manifest', async () => {
    const entry = (await vite.ssrLoadModule('/src/server.ts')) as ServerEntry;
    const card = await entry.getAssets(['/src/islands/card/index.ts']);
    expect(card.css.join()).not.toMatch(/details|deeper/);

    const details = await entry.getAssets(['./src/islands/card/details.ts']);
    expect(details.css).toEqual([
      '/app/src/shared/base.css?direct',
      '/app/src/islands/card/details.css?direct',
    ]);
  });

  it('rejects an entry that does not exist', async () => {
    const entry = (await vite.ssrLoadModule('/src/server.ts')) as ServerEntry;
    await expect(entry.getAssets(['src/islands/missing.ts'])).rejects.toThrow(
      'Failed to load url /src/islands/missing.ts (resolved id: /src/islands/missing.ts). Does the file exist?'
    );
  });

  it('makes the browser copy of each CSS module disable the server-rendered link', async () => {
    const entry = (await vite.ssrLoadModule('/src/server.ts')) as ServerEntry;
    const [, cardCss] = (await entry.getAssets(['src/islands/card/index.ts']))
      .css;

    const response = await fetch(
      `${origin}/app/src/islands/card/card.module.css`
    );
    expect(response.status).toBe(200);
    const js = await response.text();
    expect(js).toContain('__vite__updateStyle(');
    // The handoff runs after Vite's own style injection and targets the exact href getAssets returned.
    expect(js.indexOf(devStylesheetHandoff(cardCss!))).toBeGreaterThan(
      js.indexOf('__vite__updateStyle(')
    );
  });

  it('gives the browser a getAssets that rejects and a working renderAssetTags', async () => {
    const response = await fetch(
      `${origin}/app/@id/__x00__virtual:tuvix/assets`
    );
    expect(response.status).toBe(200);
    // Run the module exactly as the browser received it.
    const browserModule = (await import(
      `data:text/javascript,${encodeURIComponent(await response.text())}`
    )) as {
      getAssets: ServerEntry['getAssets'];
      renderAssetTags: (assets: TuvixAssets) => string;
    };
    await expect(
      browserModule.getAssets(['src/islands/card/index.ts'])
    ).rejects.toThrow(/runs during server rendering only/);
    expect(
      browserModule.renderAssetTags({ css: ['/a.css'], modulepreload: [] })
    ).toBe('<link rel="stylesheet" href="/a.css">');
  });
});

describe('dev server lifecycle', () => {
  const devServer = (cacheDir: string) =>
    createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      cacheDir,
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, hmr: false, ws: false },
      plugins: [tuvix()],
    });

  it('keeps getAssets working after server.restart() with an inline plugin', async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), 'tuvix-vite-cache-'));
    const vite = await devServer(cacheDir);
    try {
      // restart() builds the new server from the same plugin object, then
      // closes the old one.
      await vite.restart();
      const entry = (await vite.ssrLoadModule('/src/server.ts')) as ServerEntry;
      const assets = await entry.getAssets(['src/islands/card/index.ts']);
      expect(assets.css).toHaveLength(3);
    } finally {
      await vite.close();
      await rm(cacheDir, { recursive: true, force: true });
    }
  });

  it('rejects once the dev server has closed', async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), 'tuvix-vite-cache-'));
    const vite = await devServer(cacheDir);
    const entry = (await vite.ssrLoadModule('/src/server.ts')) as ServerEntry;
    await vite.close();
    await rm(cacheDir, { recursive: true, force: true });
    await expect(
      entry.getAssets(['src/islands/card/index.ts'])
    ).rejects.toThrow(
      '[tuvix] getAssets() found no running Vite dev server with the tuvix() plugin in this process.'
    );
  });
});
