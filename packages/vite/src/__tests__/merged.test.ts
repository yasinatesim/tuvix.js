// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CLIENT_BUILD_INFO_FILE,
  type ClientBuildInfo,
  type Manifest,
} from '../manifest';
import type { TuvixAssets } from '../types';
import { buildFixture, fixturesDir, type FixtureBuild } from './fixture';

const root = path.join(fixturesDir, 'merged');

describe('dynamic entries Rollup merges into one chunk', () => {
  let fixture: FixtureBuild;
  let getAssets: (entries: string[]) => Promise<TuvixAssets>;
  let manifest: Manifest;

  beforeAll(async () => {
    fixture = await buildFixture({
      root,
      input: { main: 'src/main.ts' },
      ssrEntry: 'src/server.ts',
    });
    getAssets = fixture.server.getAssets as typeof getAssets;
    manifest = JSON.parse(
      readFileSync(path.join(fixture.clientDir, '.vite/manifest.json'), 'utf-8')
    ) as Manifest;
  });

  afterAll(() => fixture?.cleanup());

  const readCss = (assets: TuvixAssets): string =>
    assets.css
      .map((href) => readFileSync(path.join(fixture.clientDir, href), 'utf-8'))
      .join('\n');

  it('reproduces the merged chunk: the manifest has no key for the page', () => {
    // If Rollup stops merging here, this fixture no longer covers the bug.
    expect(manifest['src/page.ts']).toBeUndefined();
    expect(manifest['src/lib.ts']).toBeUndefined();
    const merged = Object.keys(manifest).find(
      (key) => key.startsWith('_page-') && key.endsWith('.js')
    );
    expect(merged).toBeDefined();
    expect(manifest[merged!]!.isDynamicEntry).toBe(true);
  });

  it('resolves the page through the chunk Rollup put it in', async () => {
    const assets = await getAssets(['src/page.ts']);
    const merged = Object.values(manifest).find(
      (chunk) => chunk.name === 'page' && chunk.file.endsWith('.js')
    )!;

    expect(assets.modulepreload[0]).toBe(`/${merged.file}`);
    for (const href of [...assets.css, ...assets.modulepreload]) {
      expect(existsSync(path.join(fixture.clientDir, href))).toBe(true);
    }
    const css = readCss(assets);
    expect(css).toContain('.merged-page');
    expect(css).toContain('.merged-lib');
    // `other` stays behind its import().
    expect(css).not.toContain('.merged-other');
  });

  it('resolves the other module merged into the same chunk', async () => {
    const page = await getAssets(['src/page.ts']);
    expect(await getAssets(['src/lib.ts'])).toEqual(page);
  });

  it('keeps resolving modules that have their own manifest key', async () => {
    const other = readCss(await getAssets(['src/other.ts']));
    expect(other).toContain('.merged-other');
    expect(other).toContain('.merged-lib');
  });

  it('writes the module map next to the manifest, outside the manifest', () => {
    const { modules, sharedCss } = JSON.parse(
      readFileSync(
        path.join(fixture.clientDir, '.vite', CLIENT_BUILD_INFO_FILE),
        'utf-8'
      )
    ) as ClientBuildInfo;

    expect(modules['src/page.ts']).toBe(modules['src/lib.ts']);
    expect(modules['src/main.ts']).toBe(manifest['src/main.ts']!.file);
    // Plain static imports are not islands and stay out of the map.
    expect(modules['src/adapter.ts']).toBeUndefined();
    expect(sharedCss).toEqual([]);
    expect(
      Object.values(manifest).some((chunk) =>
        chunk.file.includes(CLIENT_BUILD_INFO_FILE)
      )
    ).toBe(false);
  });
});
