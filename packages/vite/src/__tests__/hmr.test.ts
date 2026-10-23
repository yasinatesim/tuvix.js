// @vitest-environment node
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { createServer as createHttpServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, type HotPayload, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { tuvix } from '../index';
import type { TuvixAssets } from '../types';

const ISLAND = `import styles from './card.module.css';
import './plain.css';

export function render(): string {
  return \`<p class="\${styles.title} plain">Card</p>\`;
}

// Like a React Fast Refresh or Vue component module.
if (import.meta.hot) import.meta.hot.accept();
`;
const moduleCss = (color: string) => `.title {\n  color: ${color};\n}\n`;
const plainCss = (color: string) => `.plain {\n  border-color: ${color};\n}\n`;

describe('dev HMR with server-rendered stylesheet links', () => {
  let projectDir: string;
  let vite: ViteDevServer;
  let http: Server;
  let origin: string;
  let sent: HotPayload[];
  let onUpdate: ((payload: HotPayload) => void) | undefined;

  beforeAll(async () => {
    // A throwaway project, because the tests edit its files.
    projectDir = await realpath(
      await mkdtemp(path.join(tmpdir(), 'tuvix-vite-hmr-'))
    );
    await mkdir(path.join(projectDir, 'src'));
    await writeFile(path.join(projectDir, 'src/island.ts'), ISLAND);
    await writeFile(
      path.join(projectDir, 'src/card.module.css'),
      moduleCss('rgb(1, 2, 3)')
    );
    await writeFile(
      path.join(projectDir, 'src/plain.css'),
      plainCss('rgb(4, 5, 6)')
    );
    await writeFile(
      path.join(projectDir, 'src/server.ts'),
      "export { getAssets } from 'virtual:tuvix/assets';\n"
    );

    http = createHttpServer();
    vite = await createServer({
      root: projectDir,
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      cacheDir: path.join(projectDir, '.vite-cache'),
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, hmr: { server: http } },
      plugins: [tuvix()],
    });
    http.on('request', vite.middlewares);
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;

    const hot = vite.environments.client.hot;
    const send = hot.send.bind(hot);
    hot.send = ((payload: HotPayload) => {
      sent.push(payload);
      send(payload);
      if (payload.type === 'update' || payload.type === 'full-reload')
        onUpdate?.(payload);
    }) as typeof hot.send;

    // What a browser does with the server-rendered page: request the <link>
    // stylesheets, then the island and the CSS modules it imports.
    const { getAssets } = (await vite.ssrLoadModule('/src/server.ts')) as {
      getAssets: (entries: string[]) => Promise<TuvixAssets>;
    };
    const { css } = await getAssets(['src/island.ts']);
    expect(css).toEqual([
      '/src/card.module.css?direct',
      '/src/plain.css?direct',
    ]);
    for (const url of [
      ...css,
      '/src/island.ts',
      '/src/card.module.css',
      '/src/plain.css',
    ]) {
      expect((await fetch(origin + url)).status).toBe(200);
    }
  });

  afterAll(async () => {
    await new Promise((resolve) => http?.close(resolve));
    await vite?.close();
    await rm(projectDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    sent = [];
  });

  /**
   * Writes a file and waits for the HMR message Vite sends for it. The real
   * file watcher can deliver a late event for an earlier edit, so only a
   * payload that names this file (or a full reload) counts as the answer.
   */
  async function edit(file: string, content: string): Promise<HotPayload[]> {
    const absolute = path.join(projectDir, file);
    const target = `/${file}`;
    const arrived = new Promise<void>((resolve) => {
      onUpdate = (payload) => {
        if (
          payload.type === 'full-reload' ||
          (payload.type === 'update' &&
            payload.updates.some(
              (u) => u.path === target || u.acceptedPath === target
            )) ||
          (payload.type === 'update' && file.endsWith('.module.css'))
        ) {
          onUpdate = undefined;
          resolve();
        }
      };
    });
    await writeFile(absolute, content);
    vite.watcher.emit('change', absolute);
    await arrived;
    return sent;
  }

  it('hot-updates a CSS module through its importer instead of reloading the page', async () => {
    const payloads = await edit(
      'src/card.module.css',
      moduleCss('rgb(200, 0, 0)')
    );

    expect(payloads.map((p) => p.type)).not.toContain('full-reload');
    const updates = payloads.flatMap((p) =>
      p.type === 'update' ? p.updates : []
    );
    expect(updates.map((u) => [u.type, u.path])).toContainEqual([
      'js-update',
      '/src/island.ts',
    ]);
    expect(updates.some((u) => u.path.includes('direct'))).toBe(false);

    // The JS wrapper the browser re-imports carries the edit.
    const wrapper = await (
      await fetch(`${origin}/src/card.module.css?t=1`)
    ).text();
    expect(wrapper).toContain('rgb(200, 0, 0)');
  });

  it('hot-updates a plain stylesheet without swapping the server-rendered link', async () => {
    const payloads = await edit('src/plain.css', plainCss('rgb(0, 200, 0)'));

    expect(payloads.map((p) => p.type)).not.toContain('full-reload');
    const updates = payloads.flatMap((p) =>
      p.type === 'update' ? p.updates : []
    );
    // Vite's client replaces <link> elements on `css-update`; a `js-update`
    // re-runs the wrapper, which rewrites Vite's <style>.
    expect(updates.map((u) => [u.type, u.path])).toEqual(
      expect.arrayContaining([['js-update', '/src/plain.css']])
    );
    expect(updates.some((u) => u.type === 'css-update')).toBe(false);

    const wrapper = await (await fetch(`${origin}/src/plain.css?t=2`)).text();
    expect(wrapper).toContain('rgb(0, 200, 0)');
  });
});
