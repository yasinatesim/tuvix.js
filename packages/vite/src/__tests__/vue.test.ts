// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';
import { tuvix } from '../index';
import type { TuvixAssets } from '../types';
import { buildFixture, fixturesDir } from './fixture';

const root = path.join(fixturesDir, 'vue');

interface ServerEntry {
  getAssets: (entries: string[]) => Promise<TuvixAssets>;
  renderIsland: () => Promise<string>;
}

/** Asserts the SSR markup's scoped attribute and CSS module class are defined in `css`. */
function expectStyled(html: string, css: string): void {
  const scopeId = html.match(/data-v-[\w]+/)?.[0];
  const moduleClass = html.match(/class="[^"]*\b(_panel_\w+)/)?.[1];
  expect(scopeId).toBeTruthy();
  expect(moduleClass).toBeTruthy();
  expect(css).toContain(`[${scopeId}]`);
  expect(css).toContain(`.${moduleClass}`);
}

describe('Vue single-file components', () => {
  it('links the SFC <style> blocks in a production build', async () => {
    const fixture = await buildFixture({
      root,
      input: { island: 'src/island.ts' },
      ssrEntry: 'src/server.ts',
      plugins: [vue()],
      bundleDependencies: true,
    });
    try {
      const entry = fixture.server as unknown as ServerEntry;
      const assets = await entry.getAssets(['src/island.ts']);

      expect(assets.css.length).toBe(1);
      const files = assets.css.map((href) =>
        path.join(fixture.clientDir, href.slice(1))
      );
      for (const file of files) expect(existsSync(file)).toBe(true);
      expectStyled(
        await entry.renderIsland(),
        files.map((file) => readFileSync(file, 'utf-8')).join('\n')
      );
    } finally {
      await fixture.cleanup();
    }
  });

  it('serves the SFC <style> blocks as CSS in dev', async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), 'tuvix-vite-cache-'));
    const vite = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      cacheDir,
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, hmr: false, ws: false },
      plugins: [vue(), tuvix()],
    });
    const http = createHttpServer(vite.middlewares);
    try {
      await new Promise<void>((resolve) =>
        http.listen(0, '127.0.0.1', resolve)
      );
      const origin = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
      const entry = (await vite.ssrLoadModule('/src/server.ts')) as ServerEntry;
      const assets = await entry.getAssets(['src/island.ts']);

      // One scoped block and one module block.
      expect(assets.css).toHaveLength(2);
      const bodies: string[] = [];
      for (const href of assets.css) {
        expect(href).toMatch(
          /^\/src\/App\.vue\?direct&vue&type=style&index=\d&/
        );
        const response = await fetch(origin + href);
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toMatch(/^text\/css/);
        bodies.push(await response.text());
      }
      expectStyled(await entry.renderIsland(), bodies.join('\n'));
    } finally {
      await new Promise((resolve) => http.close(resolve));
      await vite.close();
      await rm(cacheDir, { recursive: true, force: true });
    }
  });
});
