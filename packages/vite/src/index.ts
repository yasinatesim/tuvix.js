import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { EnvironmentModuleNode, Plugin } from 'vite';
import {
  collectDevCss,
  devStylesheetHandoff,
  devStylesheetHref,
  isInjectedCss,
} from './dev';
import {
  CLIENT_BUILD_INFO_FILE,
  VITE_CSS_BUNDLE_NAME,
  buildAssetMap,
  clientBuildInfoFromManifest,
  type ClientBuildInfo,
  type Manifest,
} from './manifest';
import type { TuvixAssets, TuvixViteOptions } from './types';
import {
  CLIENT_MODULE,
  DEV_REGISTRY_KEY,
  RESOLVED_VIRTUAL_ASSETS_ID,
  VIRTUAL_ASSETS_ID,
  buildModule,
  devModule,
} from './virtual';

export type { TuvixAssets, TuvixViteOptions } from './types';

type DevCollector = (entries: string[]) => Promise<TuvixAssets>;

function devRegistry(): Map<string, DevCollector> {
  const scope = globalThis as unknown as Record<
    symbol,
    Map<string, DevCollector> | undefined
  >;
  const key = Symbol.for(DEV_REGISTRY_KEY);
  return (scope[key] ??= new Map());
}

let instanceCount = 0;

/**
 * Vite plugin that tells a server renderer which stylesheets and JS chunks a
 * micro-app island needs, so the SSR `<head>` can link them and the island is
 * styled on first paint.
 *
 * It provides `virtual:tuvix/assets` (types: `@tuvix.js/vite/client`):
 * - `getAssets(entries)` resolves to `{ css, modulepreload }` for island entry
 *   modules given relative to the Vite root, such as `'src/islands/footer/index.ts'`.
 * - `renderAssetTags(assets)` returns the matching `<link>` tags as HTML.
 *
 * In a production SSR build the asset map comes from the client build's
 * manifest. In dev it comes from the dev server's module graph.
 *
 * @example
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { tuvix } from '@tuvix.js/vite';
 *
 * export default defineConfig({
 *   plugins: [tuvix({ clientOutDir: 'dist/client' })],
 * });
 */
export function tuvix(options: TuvixViteOptions = {}): Plugin[] {
  const clientOutDir = options.clientOutDir ?? 'dist/client';
  const instanceId = `${process.pid}-${++instanceCount}`;
  // Collector each dev server registered, keyed by its client environment.
  const ownCollectors = new WeakMap<object, DevCollector>();

  const assetsPlugin: Plugin = {
    name: 'tuvix:assets',

    config(userConfig, env) {
      // The SSR build reads the client manifest, so the client build must write one.
      if (env.command !== 'build' || env.isSsrBuild || userConfig.build?.ssr)
        return;
      if (userConfig.build?.manifest !== undefined) return;
      return { build: { manifest: true } };
    },

    configureServer(server) {
      const client = server.environments.client;
      const collect: DevCollector = async (entries) => ({
        css: await collectDevCss(
          client,
          entries,
          options.base ?? server.config.base
        ),
        modulepreload: [],
      });
      ownCollectors.set(client, collect);
      devRegistry().set(instanceId, collect);
    },

    closeBundle() {
      // Runs when a dev server closes, too. On server.restart() with an inline
      // config, the new server registers under the same id before the old one
      // closes, so only remove the collector this server registered.
      const registry = devRegistry();
      const own = ownCollectors.get(this.environment);
      if (own && registry.get(instanceId) === own) registry.delete(instanceId);
    },

    resolveId(id) {
      return id === VIRTUAL_ASSETS_ID ? RESOLVED_VIRTUAL_ASSETS_ID : undefined;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_ASSETS_ID) return undefined;
      const { config, mode } = this.environment;
      if (config.consumer !== 'server') return CLIENT_MODULE;
      if (mode !== 'build') return devModule(instanceId);

      const outDir = path.resolve(config.root, clientOutDir);
      const manifestPath = [
        path.join(outDir, '.vite/manifest.json'),
        path.join(outDir, 'manifest.json'),
      ].find((candidate) => existsSync(candidate));
      if (!manifestPath) {
        this.error(
          `[tuvix] No client manifest in ${outDir}. Build the client with the tuvix() plugin before the SSR build, or set clientOutDir.`
        );
      }
      this.addWatchFile(manifestPath);
      const manifest = JSON.parse(
        readFileSync(manifestPath, 'utf-8')
      ) as Manifest;
      const infoPath = path.join(
        path.dirname(manifestPath),
        CLIENT_BUILD_INFO_FILE
      );
      const info = existsSync(infoPath)
        ? (JSON.parse(readFileSync(infoPath, 'utf-8')) as ClientBuildInfo)
        : clientBuildInfoFromManifest(manifest);
      return buildModule(
        buildAssetMap(manifest, options.base ?? config.base, info),
        manifestPath
      );
    },
  };

  const clientBuildInfoPlugin: Plugin = {
    name: 'tuvix:client-build-info',
    apply: 'build',
    // Post, so Vite's CSS plugin has emitted the single CSS bundle of
    // `cssCodeSplit: false` before this hook reads the bundle.
    enforce: 'post',

    generateBundle(_output, bundle) {
      const { config } = this.environment;
      const { manifest } = config.build;
      if (config.consumer !== 'client' || !manifest) return;
      const info: ClientBuildInfo = { modules: {}, sharedCss: [] };
      for (const output of Object.values(bundle)) {
        if (output.type === 'asset') {
          if (
            config.build.cssCodeSplit === false &&
            output.fileName.endsWith('.css') &&
            output.names.includes(VITE_CSS_BUNDLE_NAME)
          )
            info.sharedCss.push(output.fileName);
          continue;
        }
        for (const id of output.moduleIds) {
          if (id.startsWith('\0')) continue;
          const moduleInfo = this.getModuleInfo(id);
          if (
            !moduleInfo ||
            (!moduleInfo.isEntry && moduleInfo.dynamicImporters.length === 0)
          )
            continue;
          // Same key shape as Vite's manifest: root-relative, forward slashes.
          const key = path.relative(config.root, id).split(path.sep).join('/');
          info.modules[key] = output.fileName;
        }
      }
      const manifestName =
        typeof manifest === 'string' ? manifest : '.vite/manifest.json';
      this.emitFile({
        type: 'asset',
        fileName: path.posix.join(
          path.posix.dirname(manifestName),
          CLIENT_BUILD_INFO_FILE
        ),
        source: JSON.stringify(info),
      });
    },
  };

  const devCssHandoffPlugin: Plugin = {
    name: 'tuvix:dev-css-handoff',
    apply: 'serve',
    enforce: 'post',

    transform(code, id) {
      const env = this.environment;
      if (
        !('moduleGraph' in env) ||
        env.config.consumer !== 'client' ||
        !isInjectedCss(id)
      )
        return undefined;
      if (!code.includes('__vite__updateStyle')) return undefined;
      const url = env.moduleGraph.getModuleById(id)?.url;
      if (!url) return undefined;
      const href = devStylesheetHref(url, options.base ?? env.config.base);
      return { code: code + devStylesheetHandoff(href), map: null };
    },

    hotUpdate({ modules }) {
      if (this.environment.config.consumer !== 'client') return undefined;
      // A server-rendered <link> requests `x.css?direct`, which Vite tracks as
      // its own module with no importers. Left in the update, it turns a
      // `.module.css` edit into a full reload and makes Vite swap the <link>
      // of a plain `.css` file. Once the island's JS has imported the CSS
      // module, Vite's <style> carries the edit and the link stays disabled.
      const isOrphanLink = (mod: EnvironmentModuleNode): boolean =>
        mod.type === 'css' && mod.importers.size === 0;
      const kept = modules.filter((mod) => !isOrphanLink(mod));
      if (kept.length === modules.length || kept.length === 0) return undefined;
      return kept;
    },
  };

  return [assetsPlugin, clientBuildInfoPlugin, devCssHandoffPlugin];
}
