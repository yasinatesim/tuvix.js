import { EventBus, type IEventBus } from '@tuvix.js/event-bus';
import { ModuleLoader } from '@tuvix.js/loader';
import { Router, type IRouter, type NavigationEvent } from '@tuvix.js/router';
import type {
  MicroAppConfig,
  RegisteredApp,
  OrchestratorConfig,
  AppStatus,
} from './types';
import { OrchestratorEvent } from './types';

/**
 * The Orchestrator is the central coordinator of Tuvix.js.
 * It manages the lifecycle of micro apps, routing, and inter-app communication.
 *
 * @example
 * ```ts
 * const orchestrator = new Orchestrator({
 *   router: {
 *     mode: 'history',
 *     routes: [
 *       { path: '/dashboard/*', app: 'dashboard' },
 *     ],
 *   },
 * });
 *
 * orchestrator.register({
 *   name: 'dashboard',
 *   entry: 'https://cdn.example.com/dashboard/main.js',
 *   container: '#main',
 *   activeWhen: '/dashboard/*',
 * });
 *
 * orchestrator.start();
 * ```
 */
export class Orchestrator {
  private apps: Map<string, RegisteredApp>;
  private eventBus: IEventBus;
  private loader: ModuleLoader;
  private router: IRouter | null;
  private config: OrchestratorConfig;
  private started: boolean;
  private destroyed: boolean;
  private routerUnsubscribe: (() => void) | null;

  constructor(config: OrchestratorConfig = {}) {
    this.config = config;
    this.apps = new Map();
    this.eventBus = new EventBus(config.eventBus);
    this.loader = new ModuleLoader();
    this.router = null;
    this.started = false;
    this.destroyed = false;
    this.routerUnsubscribe = null;

    if (config.router) {
      this.router = new Router(config.router);
    }
  }

  /**
   * Register a micro app with the orchestrator.
   * Does not load or mount the app — just registers its configuration.
   */
  register(appConfig: MicroAppConfig): void {
    this.ensureAlive();

    if (this.apps.has(appConfig.name)) {
      throw new Error(
        `[Tuvix] App "${appConfig.name}" is already registered.`
      );
    }

    if (!appConfig.name || appConfig.name.trim().length === 0) {
      throw new Error('[Tuvix] App name is required.');
    }

    if (!appConfig.entry) {
      throw new Error(`[Tuvix] App "${appConfig.name}" requires an entry.`);
    }

    if (!appConfig.container) {
      throw new Error(
        `[Tuvix] App "${appConfig.name}" requires a container.`
      );
    }

    const registeredApp: RegisteredApp = {
      config: appConfig,
      status: 'registered',
      module: null,
      container: null,
      error: null,
      lastUpdated: Date.now(),
    };

    this.apps.set(appConfig.name, registeredApp);

    this.emitEvent(OrchestratorEvent.APP_REGISTERED, {
      name: appConfig.name,
    });
  }

  /**
   * Unregister a micro app. Will unmount if currently mounted.
   */
  async unregister(name: string): Promise<void> {
    this.ensureAlive();

    const app = this.apps.get(name);
    if (!app) {
      throw new Error(`[Tuvix] App "${name}" is not registered.`);
    }

    if (app.status === 'mounted') {
      await this.unmountApp(name);
    }

    this.loader.unload(name);
    this.apps.delete(name);
  }

  /**
   * Start the orchestrator.
   * This will:
   * 1. Listen for route changes
   * 2. Mount apps that match the current route
   * 3. Begin prefetching if configured
   */
  async start(): Promise<void> {
    this.ensureAlive();

    if (this.started) {
      console.warn('[Tuvix] Orchestrator is already started.');
      return;
    }

    this.started = true;

    if (this.router) {
      this.routerUnsubscribe = this.router.onChange(
        this.handleRouteChange.bind(this)
      );
    }

    await this.reconcileApps();
    this.setupPrefetching();

    this.emitEvent(OrchestratorEvent.STARTED, {});
  }

  /**
   * Manually mount a specific app
   */
  async mountApp(name: string): Promise<void> {
    this.ensureAlive();

    const app = this.apps.get(name);
    if (!app) {
      throw new Error(`[Tuvix] App "${name}" is not registered.`);
    }

    if (app.status === 'mounted') {
      return;
    }

    try {
      app.container = this.resolveContainer(app.config.container);

      if (!app.module) {
        this.setAppStatus(app, 'bootstrapping');

        const result = await this.loader.load(name, app.config.entry);

        if (result.status === 'error' || !result.module) {
          throw result.error ?? new Error(`Failed to load app "${name}"`);
        }

        app.module = result.module;

        if (app.module.bootstrap) {
          await app.module.bootstrap();
        }

        this.setAppStatus(app, 'bootstrapped');
        this.emitEvent(OrchestratorEvent.APP_BOOTSTRAP, { name });
      }

      this.setAppStatus(app, 'mounting');

      await app.module.mount({
        container: app.container,
        props: app.config.props,
      });

      this.setAppStatus(app, 'mounted');
      this.emitEvent(OrchestratorEvent.APP_MOUNT, { name });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      app.error = err;
      this.setAppStatus(app, 'error');

      this.emitEvent(OrchestratorEvent.APP_ERROR, { name, error: err });
      this.config.onError?.(err, name);

      throw err;
    }
  }

  /**
   * Manually unmount a specific app
   */
  async unmountApp(name: string): Promise<void> {
    const app = this.apps.get(name);
    if (!app) {
      throw new Error(`[Tuvix] App "${name}" is not registered.`);
    }

    if (app.status !== 'mounted') {
      return;
    }

    try {
      this.setAppStatus(app, 'unmounting');

      if (app.module && app.container) {
        await app.module.unmount({ container: app.container });
      }

      this.setAppStatus(app, 'unmounted');
      this.emitEvent(OrchestratorEvent.APP_UNMOUNT, { name });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      app.error = err;
      this.setAppStatus(app, 'error');

      this.config.onError?.(err, name);
      throw err;
    }
  }

  /**
   * Update props for a mounted app
   */
  async updateAppProps(
    name: string,
    props: Record<string, unknown>
  ): Promise<void> {
    const app = this.apps.get(name);
    if (!app) {
      throw new Error(`[Tuvix] App "${name}" is not registered.`);
    }

    app.config.props = { ...app.config.props, ...props };

    if (app.status === 'mounted' && app.module?.update) {
      this.setAppStatus(app, 'updating');
      await app.module.update({ props: app.config.props });
      this.setAppStatus(app, 'mounted');
    }
  }

  /**
   * Get the status of a registered app
   */
  getAppStatus(name: string): AppStatus | null {
    return this.apps.get(name)?.status ?? null;
  }

  /**
   * Get all registered app names
   */
  getRegisteredApps(): string[] {
    return Array.from(this.apps.keys());
  }

  /**
   * Get names of currently mounted apps
   */
  getMountedApps(): string[] {
    const mounted: string[] = [];
    for (const [name, app] of this.apps) {
      if (app.status === 'mounted') {
        mounted.push(name);
      }
    }
    return mounted;
  }

  /**
   * Get the event bus instance for inter-app communication
   */
  getEventBus(): IEventBus {
    return this.eventBus;
  }

  /**
   * Get the router instance
   */
  getRouter(): IRouter | null {
    return this.router;
  }

  /**
   * Navigate to a path (convenience method)
   */
  async navigateTo(path: string): Promise<void> {
    if (!this.router) {
      throw new Error('[Tuvix] No router configured.');
    }
    await this.router.push(path);
  }

  /**
   * Destroy the orchestrator, unmount all apps, clean up
   */
  async destroy(): Promise<void> {
    const mountedApps = this.getMountedApps();
    for (const name of mountedApps) {
      try {
        await this.unmountApp(name);
      } catch {
        // Ignore errors during cleanup
      }
    }

    if (this.routerUnsubscribe) {
      this.routerUnsubscribe();
      this.routerUnsubscribe = null;
    }

    this.router?.destroy();
    this.loader.clearCache();
    this.eventBus.emit(OrchestratorEvent.DESTROYED, {});
    this.eventBus.destroy();
    this.apps.clear();

    this.started = false;
    this.destroyed = true;
  }

  private async handleRouteChange(event: NavigationEvent): Promise<void> {
    this.emitEvent(OrchestratorEvent.ROUTE_CHANGE, event);
    await this.reconcileApps();
  }

  private async reconcileApps(): Promise<void> {
    const currentPath = this.router?.currentPath ?? '/';
    const mountPromises: Promise<void>[] = [];
    const unmountPromises: Promise<void>[] = [];

    for (const [name, app] of this.apps) {
      const shouldBeActive = this.shouldAppBeActive(app, currentPath);

      if (
        shouldBeActive &&
        app.status !== 'mounted' &&
        app.status !== 'mounting'
      ) {
        mountPromises.push(
          this.mountApp(name).catch((error) => {
            console.error(`[Tuvix] Failed to mount "${name}":`, error);
          })
        );
      } else if (!shouldBeActive && app.status === 'mounted') {
        unmountPromises.push(
          this.unmountApp(name).catch((error) => {
            console.error(`[Tuvix] Failed to unmount "${name}":`, error);
          })
        );
      }
    }

    await Promise.all(unmountPromises);
    await Promise.all(mountPromises);
  }

  private shouldAppBeActive(app: RegisteredApp, path: string): boolean {
    const { activeWhen } = app.config;

    if (activeWhen === undefined) {
      return false;
    }

    if (typeof activeWhen === 'string') {
      if (activeWhen === '/') {
        return true;
      }

      const normalizedPattern = activeWhen.replace(/\/\*$/, '');
      return (
        path === normalizedPattern ||
        path.startsWith(normalizedPattern + '/')
      );
    }

    if (typeof activeWhen === 'function') {
      return activeWhen(path);
    }

    return false;
  }

  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === 'string') {
      const element = document.querySelector<HTMLElement>(container);
      if (!element) {
        throw new Error(
          `[Tuvix] Container "${container}" not found in DOM.`
        );
      }
      return element;
    }
    return container;
  }

  private setAppStatus(app: RegisteredApp, status: AppStatus): void {
    app.status = status;
    app.lastUpdated = Date.now();

    this.config.onStatusChange?.(app.config.name, status);
    this.emitEvent(OrchestratorEvent.APP_STATUS_CHANGE, {
      name: app.config.name,
      status,
    });
  }

  private emitEvent(event: string, data: unknown): void {
    try {
      this.eventBus.emit(event, data);
    } catch {
      // Ignore errors from destroyed event bus
    }
  }

  private setupPrefetching(): void {
    const strategy = this.config.prefetch?.strategy ?? 'none';

    if (strategy === 'none') return;

    const prefetchAll = () => {
      for (const [name, app] of this.apps) {
        if (!this.loader.isLoaded(name)) {
          this.loader.prefetch(app.config.entry);
        }
      }
    };

    switch (strategy) {
      case 'immediate':
        prefetchAll();
        break;

      case 'idle':
        if ('requestIdleCallback' in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).requestIdleCallback(prefetchAll);
        } else {
          setTimeout(prefetchAll, 200);
        }
        break;

      case 'hover':
        setTimeout(prefetchAll, 2000);
        break;
    }
  }

  private ensureAlive(): void {
    if (this.destroyed) {
      throw new Error(
        '[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.'
      );
    }
  }
}
