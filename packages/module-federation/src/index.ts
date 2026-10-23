import { loadScript } from '@tuvix.js/loader';
import type { EntryLoader, MicroAppModule } from '@tuvix.js/loader';

// ─── Types ──────────────────────────────────────────

/**
 * A share scope object passed to a container's `init`.
 * Webpack hosts use `__webpack_share_scopes__.default`.
 */
export type ShareScope = Record<string, unknown>;

/**
 * The global a Module Federation `remoteEntry.js` defines (`library: { type: 'var' }`).
 */
export interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}

export interface RemoteConfig {
  /** Unique remote name (must match Webpack config) */
  name: string;

  /** URL to the remoteEntry.js file */
  url: string;

  /** Optional subresource integrity hash for remoteEntry.js */
  integrity?: string;

  /** Name of the global the remote entry defines (default: same as name) */
  scope?: string;
}

export interface FederatedLoaderConfig {
  /** Remote containers to load from */
  remotes: RemoteConfig[];

  /**
   * Share scope passed to every container's `init`. When omitted, a webpack host
   * uses its own `default` scope (after `__webpack_init_sharing__('default')`);
   * other hosts get one scope object that all remotes on the page share, so
   * remotes can still share dependencies with each other.
   */
  shareScope?: ShareScope;
}

/** Options for {@link federatedEntry}. */
export interface FederatedEntryOptions {
  /** See {@link FederatedLoaderConfig.shareScope}. */
  shareScope?: ShareScope;
}

// Webpack replaces these free variables in every module it bundles, including
// this package. In other bundlers `typeof` reports 'undefined'.
declare const __webpack_init_sharing__:
  ((scope: string) => Promise<void>) | undefined;
declare const __webpack_share_scopes__: Record<string, ShareScope> | undefined;

// Shared by every remote outside webpack, so remotes negotiate with each other.
const fallbackShareScope: ShareScope = {};

// A container must be initialised once, even when several loaders use it.
const initialised = new WeakMap<FederatedContainer, Promise<void>>();

async function resolveShareScope(explicit?: ShareScope): Promise<ShareScope> {
  if (explicit) return explicit;
  if (typeof __webpack_init_sharing__ === 'function') {
    await __webpack_init_sharing__('default');
    if (
      typeof __webpack_share_scopes__ === 'object' &&
      __webpack_share_scopes__
    ) {
      return __webpack_share_scopes__.default ?? fallbackShareScope;
    }
  }
  return fallbackShareScope;
}

function isContainer(value: unknown): value is FederatedContainer {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FederatedContainer).init === 'function' &&
    typeof (value as FederatedContainer).get === 'function'
  );
}

function isModule(value: unknown): value is MicroAppModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as MicroAppModule).mount === 'function'
  );
}

// ─── Federated Loader ───────────────────────────────

/**
 * Create a loader that integrates with Webpack Module Federation.
 *
 * Loads remote containers via `remoteEntry.js`, initializes the share
 * scope once per container, and resolves exposed modules from them.
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
  const containers = new Map<string, FederatedContainer>();

  function findRemote(remoteName: string): RemoteConfig {
    const remote = config.remotes.find((r) => r.name === remoteName);
    if (!remote) {
      throw new Error(
        `[Tuvix MF] Remote "${remoteName}" is not configured. Available: ${config.remotes.map((r) => r.name).join(', ')}`
      );
    }
    return remote;
  }

  /**
   * Load a remote container via script tag and initialise its share scope.
   * `signal` stops waiting for remoteEntry.js and removes its tag.
   */
  async function loadRemoteContainer(
    remote: RemoteConfig,
    signal?: AbortSignal
  ): Promise<FederatedContainer> {
    const existing = containers.get(remote.name);
    if (existing) return existing;

    await loadScript(remote.url, {
      type: 'classic',
      integrity: remote.integrity,
      signal,
    }).catch((error: unknown) => {
      if (signal?.aborted) throw error;
      throw new Error(
        `[Tuvix MF] Failed to load remote entry: ${remote.url} (${String(error)})`
      );
    });

    const scope = remote.scope ?? remote.name;
    const container: unknown = (window as unknown as Record<string, unknown>)[
      scope
    ];
    if (!isContainer(container)) {
      throw new Error(
        `[Tuvix MF] Remote container "${scope}" not found on window after loading ${remote.url}`
      );
    }

    let init = initialised.get(container);
    if (!init) {
      init = (async () => {
        await container.init(await resolveShareScope(config.shareScope));
      })();
      initialised.set(container, init);
      // A failed init may be retried on the next load.
      init.catch(() => initialised.delete(container));
    }
    await init;

    containers.set(remote.name, container);
    return container;
  }

  async function getExposed(
    remoteName: string,
    modulePath: string,
    signal?: AbortSignal
  ): Promise<unknown> {
    const container = await loadRemoteContainer(findRemote(remoteName), signal);
    const missing = `[Tuvix MF] Module "${modulePath}" not found in remote "${remoteName}"`;
    let factory: unknown;
    try {
      factory = await container.get(modulePath);
    } catch (error) {
      throw new Error(`${missing}: ${String(error)}`);
    }
    if (typeof factory !== 'function') throw new Error(missing);
    return factory();
  }

  /**
   * Load a specific module from a remote container.
   * Returns the module's `default` export when it has one.
   */
  async function loadModule(
    remoteName: string,
    modulePath: string,
    signal?: AbortSignal
  ): Promise<unknown> {
    const mod = await getExposed(remoteName, modulePath, signal);
    if (typeof mod === 'object' && mod !== null && 'default' in mod) {
      return mod.default ?? mod;
    }
    return mod;
  }

  /**
   * Load a micro app module from a remote. The exposed module may export
   * mount/unmount itself or as its `default` export.
   */
  async function createFederatedApp(
    remoteName: string,
    modulePath = './App',
    signal?: AbortSignal
  ): Promise<MicroAppModule> {
    const mod = await getExposed(remoteName, modulePath, signal);
    if (isModule(mod)) return mod;
    if (
      typeof mod === 'object' &&
      mod !== null &&
      'default' in mod &&
      isModule(mod.default)
    ) {
      return mod.default;
    }
    throw new Error(
      `[Tuvix MF] Module "${modulePath}" from remote "${remoteName}" does not export mount/unmount.`
    );
  }

  /**
   * Create a Tuvix.js entry for an exposed module. The orchestrator's loader
   * calls it on first mount: it loads remoteEntry.js, initialises the container
   * and returns the micro app.
   */
  function createFederatedEntry(
    remoteName: string,
    modulePath = './App'
  ): EntryLoader {
    findRemote(remoteName);
    return ({ signal }) => createFederatedApp(remoteName, modulePath, signal);
  }

  return {
    loadRemoteContainer,
    loadModule,
    createFederatedEntry,
    createFederatedApp,
  };
}

/**
 * Create a Tuvix.js entry that loads a micro app from a Module Federation remote.
 * Pass it as `entry` when registering the app.
 *
 * @example
 * ```ts
 * import { createOrchestrator } from '@tuvix.js/core';
 * import { federatedEntry } from '@tuvix.js/module-federation';
 *
 * const orchestrator = createOrchestrator({});
 *
 * orchestrator.register({
 *   name: 'dashboard',
 *   entry: federatedEntry(
 *     { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
 *     './App'
 *   ),
 *   container: '#main',
 *   activeWhen: '/dashboard/*',
 * });
 * ```
 */
export function federatedEntry(
  remote: RemoteConfig,
  modulePath = './App',
  options: FederatedEntryOptions = {}
): EntryLoader {
  return createFederatedLoader({
    remotes: [remote],
    shareScope: options.shareScope,
  }).createFederatedEntry(remote.name, modulePath);
}
