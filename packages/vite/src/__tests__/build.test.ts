// @vitest-environment node
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { tuvix } from '../index';
import { CLIENT_BUILD_INFO_FILE } from '../manifest';
import type { TuvixAssets } from '../types';
import { buildFixture, fixturesDir, type FixtureBuild } from './fixture';

const root = path.join(fixturesDir, 'basic');
const BASE = '/static/';

type GetAssets = (entries: string[]) => Promise<TuvixAssets>;

describe('production build', () => {
  let fixture: FixtureBuild;
  let getAssets: GetAssets;
  let renderAssetTags: (assets: TuvixAssets) => string;
  let renderCard: () => string;

  beforeAll(async () => {
    fixture = await buildFixture({
      root,
      base: BASE,
      input: {
        card: 'src/islands/card/index.ts',
        badge: 'src/islands/badge/index.ts',
      },
      ssrEntry: 'src/server.ts',
    });
    getAssets = fixture.server.getAssets as GetAssets;
    renderAssetTags = fixture.server.renderAssetTags as typeof renderAssetTags;
    renderCard = fixture.server.renderCard as typeof renderCard;
  });

  afterAll(() => fixture?.cleanup());

  const fileOnDisk = (href: string): string => {
    expect(href.startsWith(BASE)).toBe(true);
    return path.join(fixture.clientDir, href.slice(BASE.length));
  };
  const readCss = (assets: TuvixAssets): string =>
    assets.css
      .map((href) => readFileSync(fileOnDisk(href), 'utf-8'))
      .join('\n');

  it('turns on the client manifest without user config', () => {
    expect(
      existsSync(path.join(fixture.clientDir, '.vite/manifest.json'))
    ).toBe(true);
  });

  it('returns hashed CSS files that exist on disk and style the server-rendered markup', async () => {
    const assets = await getAssets(['src/islands/card/index.ts']);

    expect(assets.css.length).toBe(2);
    for (const href of [...assets.css, ...assets.modulepreload]) {
      expect(existsSync(fileOnDisk(href))).toBe(true);
    }
    for (const href of assets.css)
      expect(href).toMatch(/^\/static\/assets\/.+-[\w-]{8}\.css$/);

    // Every class the SSR markup uses must be defined by the linked CSS, or the
    // first paint is unstyled.
    const html = renderCard();
    const classes = [...html.matchAll(/class="([^"]+)"/g)].flatMap((match) =>
      match[1]!.split(' ')
    );
    expect(classes.some((name) => /^_title_/.test(name))).toBe(true);
    const css = readCss(assets);
    for (const name of classes) expect(css).toContain(`.${name}`);
    expect(css).toContain('.card-plain-marker');
  });

  it('puts CSS of imported shared chunks before the entry CSS', async () => {
    const card = await getAssets(['src/islands/card/index.ts']);
    const badge = await getAssets(['src/islands/badge/index.ts']);

    const sharedCss = card.css[0]!;
    expect(badge.css[0]).toBe(sharedCss);
    expect(readFileSync(fileOnDisk(sharedCss), 'utf-8')).toContain(
      '.tuvix-base'
    );
    expect(readFileSync(fileOnDisk(card.css[1]!), 'utf-8')).not.toContain(
      '.tuvix-base'
    );
  });

  it('lists the entry chunk and its static imports for modulepreload', async () => {
    const { modulepreload } = await getAssets(['src/islands/card/index.ts']);
    const manifest = JSON.parse(
      readFileSync(path.join(fixture.clientDir, '.vite/manifest.json'), 'utf-8')
    ) as Record<string, { file: string; imports?: string[] }>;
    const entry = manifest['src/islands/card/index.ts']!;

    expect(modulepreload[0]).toBe(`${BASE}${entry.file}`);
    for (const imported of entry.imports ?? []) {
      expect(modulepreload).toContain(`${BASE}${manifest[imported]!.file}`);
    }
    const details = manifest['src/islands/card/details.ts']!;
    expect(modulepreload).not.toContain(`${BASE}${details.file}`);
  });

  it('leaves out CSS that only loads through import()', async () => {
    const card = readCss(await getAssets(['src/islands/card/index.ts']));
    expect(card).not.toContain('.card-details');
    expect(card).not.toContain('.card-deeper');

    const details = readCss(await getAssets(['src/islands/card/details.ts']));
    expect(details).toContain('.card-details');
    expect(details).toContain('.tuvix-base');
    expect(details).not.toContain('.card-deeper');

    const deeper = readCss(await getAssets(['./src/islands/card/deeper.ts']));
    expect(deeper).toContain('.card-deeper');
  });

  it('merges several entries without duplicates', async () => {
    const card = await getAssets(['src/islands/card/index.ts']);
    const both = await getAssets([
      'src/islands/card/index.ts',
      '/src/islands/badge/index.ts',
    ]);

    expect(both.css.slice(0, card.css.length)).toEqual(card.css);
    expect(new Set(both.css).size).toBe(both.css.length);
    expect(new Set(both.modulepreload).size).toBe(both.modulepreload.length);
    expect(readCss(both)).toContain('.badge');
  });

  it('rejects an entry the client manifest does not know', async () => {
    await expect(getAssets(['src/islands/missing.ts'])).rejects.toThrow(
      /"src\/islands\/missing\.ts" is not an entry or a dynamically imported module/
    );
  });

  it('renders stylesheet links before modulepreload links and escapes attributes', () => {
    expect(
      renderAssetTags({ css: ['/a.css?x="1"&y=<2>'], modulepreload: ['/a.js'] })
    ).toBe(
      '<link rel="stylesheet" href="/a.css?x=&quot;1&quot;&amp;y=&lt;2&gt;">' +
        '<link rel="modulepreload" crossorigin href="/a.js">'
    );
    expect(renderAssetTags({ css: [], modulepreload: [] })).toBe('');
  });
});

describe('production build options', () => {
  it('prefixes URLs with the base option instead of Vite base', async () => {
    const fixture = await buildFixture({
      root,
      input: { card: 'src/islands/card/index.ts' },
      ssrEntry: 'src/server.ts',
    });
    try {
      // Same client output, second SSR build with an explicit CDN base.
      await build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [
          tuvix({
            clientOutDir: fixture.clientDir,
            base: 'https://cdn.example.com/app',
          }),
        ],
        build: {
          ssr: path.join(root, 'src/server.ts'),
          outDir: fixture.serverDir,
          emptyOutDir: true,
          rollupOptions: { output: { entryFileNames: 'cdn.mjs' } },
        },
      });
      const { getAssets } = (await import(
        pathToFileURL(path.join(fixture.serverDir, 'cdn.mjs')).href
      )) as { getAssets: GetAssets };
      const assets = await getAssets(['src/islands/card/index.ts']);

      expect(assets.css.length).toBeGreaterThan(0);
      for (const href of assets.css) {
        expect(href.startsWith('https://cdn.example.com/app/assets/')).toBe(
          true
        );
        const file = path.join(
          fixture.clientDir,
          href.slice('https://cdn.example.com/app/'.length)
        );
        expect(existsSync(file)).toBe(true);
      }
    } finally {
      await fixture.cleanup();
    }
  });

  it('fails the SSR build when the client manifest is missing', async () => {
    await expect(
      build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [tuvix({ clientOutDir: path.join(root, 'does-not-exist') })],
        build: { ssr: path.join(root, 'src/server.ts'), write: false },
      })
    ).rejects.toThrow(/No client manifest in .*does-not-exist/);
  });
});

describe('build.cssCodeSplit: false', () => {
  /** Builds with one CSS file for the whole app and checks every entry links it. */
  async function expectSharedStylesheet(
    afterClientBuild?: (clientDir: string) => void
  ): Promise<void> {
    const fixture = await buildFixture({
      root,
      input: {
        card: 'src/islands/card/index.ts',
        badge: 'src/islands/badge/index.ts',
      },
      ssrEntry: 'src/server.ts',
      cssCodeSplit: false,
      afterClientBuild,
    });
    try {
      const getAssets = fixture.server.getAssets as GetAssets;
      const card = await getAssets(['src/islands/card/index.ts']);
      const badge = await getAssets(['src/islands/badge/index.ts']);
      const deeper = await getAssets(['src/islands/card/deeper.ts']);

      expect(card.css).toHaveLength(1);
      expect(card.css[0]).toMatch(/^\/assets\/style-[\w-]{8}\.css$/);
      expect(badge.css).toEqual(card.css);
      expect(deeper.css).toEqual(card.css);
      const css = readFileSync(
        path.join(fixture.clientDir, card.css[0]!),
        'utf-8'
      );
      expect(css).toContain('.badge');
      expect(css).toContain('.card-deeper');
      expect(css).toMatch(/\._title_/);
    } finally {
      await fixture.cleanup();
    }
  }

  it('links the single stylesheet for every entry', async () => {
    await expectSharedStylesheet();
  });

  it('finds the stylesheet in the manifest when the client build ran without tuvix()', async () => {
    await expectSharedStylesheet((clientDir) =>
      rmSync(path.join(clientDir, '.vite', CLIENT_BUILD_INFO_FILE))
    );
  });
});
