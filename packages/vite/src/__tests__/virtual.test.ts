// @vitest-environment node
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, type Plugin } from 'vite';
import { describe, expect, it } from 'vitest';
import { tuvix } from '../index';
import type { TuvixAssets } from '../types';
import { buildFixture, fixturesDir } from './fixture';

const root = path.join(fixturesDir, 'virtual');
const WIDGET = 'virtual:fixture-widget';
const THEME = 'virtual:fixture-theme.css';

/** Serves the fixture's virtual modules. `load` ignores the query, so `?direct` works. */
function fixtureVirtualModules(): Plugin {
  return {
    name: 'fixture-virtual-modules',
    resolveId(id) {
      return id === WIDGET || id === THEME ? `\0${id}` : undefined;
    },
    load(id) {
      const [file] = id.split('?');
      if (file === `\0${WIDGET}`)
        return "import '/src/widget.css';\nexport const widgetClass = 'fixture-widget';\n";
      if (file === `\0${THEME}`)
        return '.fixture-theme {\n  border-color: rgb(31, 32, 33);\n}\n';
      return undefined;
    },
  };
}

interface ServerEntry {
  getAssets: (entries: string[]) => Promise<TuvixAssets>;
}

describe('CSS reached through virtual modules', () => {
  it('is linked in a production build', async () => {
    const fixture = await buildFixture({
      root,
      input: { island: 'src/island.ts' },
      ssrEntry: 'src/server.ts',
      plugins: [fixtureVirtualModules()],
    });
    try {
      const { getAssets } = fixture.server as unknown as ServerEntry;
      const css = (await getAssets(['src/island.ts'])).css
        .map((href) =>
          readFileSync(path.join(fixture.clientDir, href), 'utf-8')
        )
        .join('\n');
      expect(css).toContain('.fixture-widget');
      expect(css).toContain('.fixture-theme');
    } finally {
      await fixture.cleanup();
    }
  });

  it('is linked by the dev server too, with URLs it serves as CSS', async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), 'tuvix-vite-cache-'));
    const vite = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      cacheDir,
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, hmr: false, ws: false },
      plugins: [fixtureVirtualModules(), tuvix()],
    });
    const http = createHttpServer(vite.middlewares);
    try {
      await new Promise<void>((resolve) =>
        http.listen(0, '127.0.0.1', resolve)
      );
      const origin = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
      const { getAssets } = (await vite.ssrLoadModule(
        '/src/server.ts'
      )) as ServerEntry;
      const assets = await getAssets(['src/island.ts']);

      expect(assets.css).toEqual([
        '/src/widget.css?direct',
        '/@id/__x00__virtual:fixture-theme.css?direct',
      ]);
      const bodies: string[] = [];
      for (const href of assets.css) {
        const response = await fetch(origin + href);
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toMatch(/^text\/css/);
        bodies.push(await response.text());
      }
      expect(bodies[0]).toContain('.fixture-widget');
      expect(bodies[1]).toContain('.fixture-theme');
    } finally {
      await new Promise((resolve) => http.close(resolve));
      await vite.close();
      await rm(cacheDir, { recursive: true, force: true });
    }
  });
});
