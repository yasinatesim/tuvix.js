import type { Entry, MicroAppModule } from '@tuvix.js/loader';

// ─── Types ──────────────────────────────────────────

export interface RemoteConfig {
  /** Unique remote name (must match Webpack config) */
  name: string;

  /** URL to the remoteEntry.js file */
  url: string;

  /** Optional subresource integrity hash */
  integrity?: string;

  /** Scope name (default: same as name) */
  scope?: string;
}

export interface FederatedLoaderConfig {
  /** Remote containers to load from */
  remotes: RemoteConfig[];

  /** Shared modules for __webpack_init_sharing__ */
  shared?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebpackContainer = any;

// ─── Federated Loader ───────────────────────────────

/**
 * Create a loader that integrates with Webpack Module Federation.
 *
 * Loads remote containers via `remoteEntry.js`, initializes shared
 * scope, and resolves individual modules from remote containers.
 *
 * @example
 * ```ts
 * import { createFederatedLoader } from '@tuvix.js/module-federation';
 *
 * const loader = createFederatedLoader({
 *   remotes: [
 *     { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
 *     { name: 'settings',  url: 'https://cdn.example.com/settings/remoteEntry.js' },
 *   ],
 * });
 *
 * const DashboardApp = await loader.loadModule('dashboard', './App');
 * ```
 */
export function createFederatedLoader(config: FederatedLoaderConfig) {
  const containers: Map<string, WebpackContainer> = new Map();
  const loadedScripts: Set<string> = new Set();

  /**
   * Load a remote container via script tag.
   */
  async function loadRemoteContainer(remote: RemoteConfig): Promise<WebpackContainer> {
    const existing = containers.get(remote.name);
    if (existing) return existing;

    // Load the remoteEntry.js script
    if (!loadedScripts.has(remote.url)) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = remote.url;
        script.type = 'text/javascript';
        script.crossOrigin = 'anonymous';
        if (remote.integrity) {
          script.integrity = remote.integrity;
        }
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error(`[Tuvix MF] Failed to load remote entry: ${remote.url}`));
        document.head.appendChild(script);
      });
      loadedScripts.add(remote.url);
    }

    // Get the container from the global scope
    const scope = remote.scope ?? remote.name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const container = (window as any)[scope];

    if (!container) {
      throw new Error(
        `[Tuvix MF] Remote container "${scope}" not found on window after loading ${remote.url}`
      );
    }

    // Initialize sharing scope
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webpackShareScopes = (window as any).__webpack_share_scopes__;
    if (webpackShareScopes) {
      await container.init(webpackShareScopes.default);
    } else {
      // If no shared scope exists, create minimal one
      await container.init({});
    }

    containers.set(remote.name, container);
    return container;
  }

  /**
   * Load a specific module from a remote container.
   */
  async function loadModule(remoteName: string, modulePath: string): Promise<unknown> {
    const remote = config.remotes.find((r) => r.name === remoteName);
    if (!remote) {
      throw new Error(
        `[Tuvix MF] Remote "${remoteName}" is not configured. Available: ${config.remotes.map((r) => r.name).join(', ')}`
      );
    }

    const container = await loadRemoteContainer(remote);

    // Get the module from the container
    const factory = await container.get(modulePath);
    if (!factory) {
      throw new Error(
        `[Tuvix MF] Module "${modulePath}" not found in remote "${remoteName}"`
      );
    }

    const mod = factory();
    return mod.default ?? mod;
  }

  /**
   * Create a Tuvix.js Entry from a federated remote module.
   * This allows using Module Federation apps with the standard Tuvix loader.
   */
  function createFederatedEntry(remoteName: string): Entry {
    // Return an entry config that the standard loader can work with
    const remote = config.remotes.find((r) => r.name === remoteName);
    if (!remote) {
      throw new Error(`[Tuvix MF] Remote "${remoteName}" is not configured.`);
    }

    return {
      scripts: [remote.url],
    };
  }

  /**
   * Create a complete MicroAppModule from a federated remote.
   */
  async function createFederatedApp(
    remoteName: string,
    modulePath = './App'
  ): Promise<MicroAppModule> {
    const appModule = (await loadModule(remoteName, modulePath)) as MicroAppModule;

    if (!appModule || typeof appModule.mount !== 'function') {
      throw new Error(
        `[Tuvix MF] Module "${modulePath}" from remote "${remoteName}" does not export mount/unmount.`
      );
    }

    return appModule;
  }

  return {
    loadRemoteContainer,
    loadModule,
    createFederatedEntry,
    createFederatedApp,
  };
}

/**
 * Convenience: create a Tuvix.js micro app module from a Module Federation remote.
 *
 * @example
 * ```ts
 * import { federatedEntry } from '@tuvix.js/module-federation';
 *
 * orchestrator.register({
 *   name: 'dashboard',
 *   entry: 'https://cdn.example.com/dashboard/remoteEntry.js',
 *   container: '#main',
 *   activeWhen: '/dashboard/*',
 * });
 * ```
 */
export function federatedEntry(remote: RemoteConfig): Entry {
  return { scripts: [remote.url] };
}
