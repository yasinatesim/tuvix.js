import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build, type PluginOption } from 'vite';
import { tuvix } from '../index';

export const fixturesDir = fileURLToPath(
  new URL('../../test/fixtures/', import.meta.url)
);

export interface FixtureBuild {
  clientDir: string;
  serverDir: string;
  /** The built server entry, imported with Node's native ESM loader. */
  server: Record<string, unknown>;
  cleanup: () => Promise<void>;
}

/**
 * Runs `vite build` for the client, then `vite build --ssr` for the server,
 * both with the tuvix() plugin, into a fresh temp directory.
 */
export async function buildFixture(options: {
  root: string;
  input: Record<string, string>;
  ssrEntry: string;
  base?: string;
  plugins?: PluginOption[];
  bundleDependencies?: boolean;
  cssCodeSplit?: boolean;
  /** Runs between the client and the SSR build. */
  afterClientBuild?: (clientDir: string) => void | Promise<void>;
}): Promise<FixtureBuild> {
  const outRoot = await mkdtemp(path.join(tmpdir(), 'tuvix-vite-'));
  const clientDir = path.join(outRoot, 'client');
  const serverDir = path.join(outRoot, 'server');
  const shared = {
    root: options.root,
    base: options.base ?? '/',
    configFile: false as const,
    logLevel: 'silent' as const,
    plugins: [...(options.plugins ?? []), tuvix({ clientOutDir: clientDir })],
  };

  await build({
    ...shared,
    build: {
      outDir: clientDir,
      emptyOutDir: true,
      cssCodeSplit: options.cssCodeSplit,
      rollupOptions: {
        input: Object.fromEntries(
          Object.entries(options.input).map(([name, file]) => [
            name,
            path.resolve(options.root, file),
          ])
        ),
      },
    },
  });
  await options.afterClientBuild?.(clientDir);

  await build({
    ...shared,
    ssr: options.bundleDependencies ? { noExternal: true } : undefined,
    build: {
      ssr: path.resolve(options.root, options.ssrEntry),
      outDir: serverDir,
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: '[name].mjs' } },
    },
  });

  const entryName = path.basename(options.ssrEntry).replace(/\.[^.]+$/, '');
  const server = (await import(
    pathToFileURL(path.join(serverDir, `${entryName}.mjs`)).href
  )) as Record<string, unknown>;

  return {
    clientDir,
    serverDir,
    server,
    cleanup: () => rm(outRoot, { recursive: true, force: true }),
  };
}
