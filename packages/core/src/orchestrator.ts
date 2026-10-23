import { EventBus, getGlobalBus, type IEventBus } from '@tuvix.js/event-bus';
import {
  ModuleLoader,
  type Entry,
  type MountContext,
  type UpdateContext,
} from '@tuvix.js/loader';
import {
  Router,
  matchPath,
  normalizePath,
  resolveLink,
  type IRouter,
  type NavigationEvent,
} from '@tuvix.js/router';
import { CssSandbox } from '@tuvix.js/sandbox';
import type {
  AppErrorEvent,
  AppErrorPhase,
  AppSandboxOption,
  MicroAppConfig,
  RegisteredApp,
  RouterSource,
  OrchestratorConfig,
  AppStatus,
} from './types';
import { OrchestratorEvent } from './types';

/** Marks the element an isolated app renders into inside its shadow root. */
const SANDBOX_ROOT_ATTR = 'data-tuvix-sandbox-root';

/** Orchestrator-internal bookkeeping on top of the public app record. */
interface AppRecord extends RegisteredApp {
  /** Desired state, set by reconciles and by mountApp/unmountApp. */
  wantMounted: boolean;
  /** In-flight lifecycle work. At most one runs per app. */
  op: Promise<void> | null;
  /** In-flight `update()` call; unmount waits for it. */
  updating: Promise<void> | null;
  /** Element passed to mount/unmount/update (inside the shadow root when sandboxed). */
  target: HTMLElement | null;
  /** Entry handed to the loader (styles removed when the app is CSS-isolated). */
  loadEntry: Entry;
  /** Set by `unregister()`; reconciles and lookups ignore the app from then on. */
  removed: boolean;
}

function isCssIsolated(option: AppSandboxOption | undefined): boolean {
  if (option === true) return true;
  if (option && typeof option === 'object') return option.css !== false;
  return false;
}

function entryStyles(entry: Entry): string[] {
  if (typeof entry === 'object' && entry !== null && entry.styles) {
    return entry.styles;
  }
  return [];
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function noop(): void {}

/**
 * The Orchestrator is the central coordinator of Tuvix.js.
 * It manages the lifecycle of micro apps, routing, and inter-app communication.
 *
 * Route changes are reconciled one at a time. If several arrive while one
 * runs, only the newest path is reconciled next. Apps that should no longer
 * be active are unmounted before newly active apps mount, an app that turns
 * inactive while it loads or mounts is unmounted once that settles, and
 * `unmountApp` waits for an in-flight mount.
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
  private apps: Map<string, AppRecord>;
  private eventBus: IEventBus;
  private ownsEventBus: boolean;
  private loader: ModuleLoader;
  private router: IRouter | null;
  private config: OrchestratorConfig;
  private started: boolean;
  private destroyed: boolean;
  private destroying: Promise<void> | null;
  private routerUnsubscribe: (() => void) | null;
  private viewportObserver: IntersectionObserver | null;
  private cssSandbox: CssSandbox | null;
  private pathSource: RouterSource | null;
  private routerDisconnects: Set<() => void>;
  private pendingPath: string | null;
  private reconcileLoop: Promise<void> | null;
  private prefetchCleanup: (() => void) | null;
  private prefetched: Set<string>;

  constructor(config: OrchestratorConfig = {}) {
    this.config = config;
    this.apps = new Map();
    this.ownsEventBus = config.eventBus !== undefined;
    this.eventBus = this.ownsEventBus
      ? new EventBus(config.eventBus)
      : getGlobalBus();
    this.loader = new ModuleLoader(config.loader);
    this.router = null;
    this.started = false;
    this.destroyed = false;
    this.destroying = null;
    this.routerUnsubscribe = null;
    this.viewportObserver = null;
    this.cssSandbox = null;
    this.pathSource = null;
    this.routerDisconnects = new Set();
    this.pendingPath = null;
    this.reconcileLoop = null;
    this.prefetchCleanup = null;
    this.prefetched = new Set();

    if (config.router) {
      this.router = new Router(config.router);
    }
  }

  /**
   * Register a micro app with the orchestrator.
   * Before `start()`, this only stores the configuration. After `start()`,
   * a routed app that the current path activates mounts right away, and a
   * `mountWhenVisible` app's container is observed.
   */
  register(appConfig: MicroAppConfig): void {
    this.ensureAlive();

    if (!appConfig.name || appConfig.name.trim().length === 0) {
      throw new Error('[Tuvix] App name is required.');
    }

    if (this.apps.has(appConfig.name)) {
      throw new Error(`[Tuvix] App "${appConfig.name}" is already registered.`);
    }

    if (!appConfig.entry) {
      throw new Error(`[Tuvix] App "${appConfig.name}" requires an entry.`);
    }

    if (!appConfig.container) {
      throw new Error(`[Tuvix] App "${appConfig.name}" requires a container.`);
    }

    // CSS-isolated apps get their styles inside the shadow root, not in <head>.
    const { entry } = appConfig;
    const loadEntry: Entry =
      isCssIsolated(appConfig.sandbox) && typeof entry === 'object'
        ? { ...entry, styles: [] }
        : entry;

    const registeredApp: AppRecord = {
      config: appConfig,
      status: 'registered',
      module: null,
      container: null,
      error: null,
      lastUpdated: Date.now(),
      wantMounted: false,
      op: null,
      updating: null,
      target: null,
      loadEntry,
      removed: false,
    };

    this.apps.set(appConfig.name, registeredApp);

    this.emitEvent(OrchestratorEvent.APP_REGISTERED, {
      name: appConfig.name,
    });

    if (!this.started) return;

    // The orchestrator is already running: observe a viewport app's container
    // now, and mount a routed app if the current path activates it.
    if (appConfig.mountWhenVisible) {
      this.observeViewportApp(registeredApp);
    } else if (this.isRouteManaged(registeredApp)) {
      this.scheduleReconcile(this.getCurrentPath()).catch((error) => {
        console.error('[Tuvix] Reconcile after register failed:', error);
      });
    }
  }

  /**
   * Unregister a micro app. Unmounts it first, waiting for an in-flight mount.
   */
  async unregister(name: string): Promise<void> {
    this.ensureAlive();

    const app = this.getApp(name);
    // Flag first: a navigation during the unmount must not mount it again.
    app.removed = true;
    app.wantMounted = false;
    try {
      await this.converge(app);
    } finally {
      if (app.container) this.viewportObserver?.unobserve(app.container);
      this.loader.unload(name);
      this.prefetched.delete(name);
      if (this.apps.get(name) === app) this.apps.delete(name);
    }
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

    await this.scheduleReconcile(this.getCurrentPath());
    this.setupPrefetching();
    this.setupViewportObserver();

    this.emitEvent(OrchestratorEvent.STARTED, {});
  }

  /**
   * Manually mount a specific app. Waits for an in-flight unmount first.
   * Rejects with the load or mount error.
   */
  async mountApp(name: string): Promise<void> {
    this.ensureAlive();
    const app = this.getApp(name);
    app.wantMounted = true;
    await this.converge(app);
  }

  /**
   * Manually unmount a specific app. If the app is still loading or
   * mounting, this waits for that to finish and then unmounts it.
   */
  async unmountApp(name: string): Promise<void> {
    this.ensureAlive();
    const app = this.getApp(name);
    app.wantMounted = false;
    await this.converge(app);
  }

  /**
   * Update props for a mounted app. Props of an app that is not mounted are
   * stored and passed to its next mount.
   */
  async updateAppProps(
    name: string,
    props: Record<string, unknown>
  ): Promise<void> {
    const app = this.getApp(name);

    // Let a pending mount finish so the update reaches the new instance.
    if (app.op) await app.op.catch(noop);

    const mergedProps = { ...app.config.props, ...props };

    if (app.status !== 'mounted' || !app.module?.update) {
      app.config.props = mergedProps;
      return;
    }

    const update = app.module.update;
    this.setAppStatus(app, 'updating');
    const context: UpdateContext = { props: mergedProps };
    if (app.target) context.container = app.target;

    const run = (async () => {
      try {
        // Apply props to config only after a successful update to keep state consistent.
        await update(context);
        app.config.props = mergedProps;
        if (app.status === 'updating') this.setAppStatus(app, 'mounted');
      } catch (error) {
        throw this.reportError(app, error, 'update');
      }
    })();
    app.updating = run;
    try {
      await run;
    } finally {
      if (app.updating === run) app.updating = null;
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
   * Get the event bus instance for inter-app communication.
   * This is `getGlobalBus()` unless you passed `eventBus` options.
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
   * Follow an external router (TanStack Router, React Router, ...) instead
   * of the built-in one. After `start()`, every `subscribe` callback
   * reconciles apps against `getPath()`; `start()` itself also reads
   * `getPath()`. Connecting a started orchestrator reconciles right away.
   *
   * Returns a function that disconnects the router.
   *
   * @example
   * ```ts
   * import { createOrchestrator } from '@tuvix.js/core';
   *
   * declare const router: {
   *   subscribe(event: 'onResolved', cb: () => void): () => void;
   *   state: { location: { pathname: string } };
   * };
   *
   * const orchestrator = createOrchestrator();
   * const disconnect = orchestrator.connectRouter({
   *   subscribe: (callback) => router.subscribe('onResolved', callback),
   *   getPath: () => router.state.location.pathname,
   * });
   * await orchestrator.start();
   * // later: disconnect();
   * ```
   */
  connectRouter(source: RouterSource): () => void {
    this.ensureAlive();
    this.pathSource = source;

    const onNavigate = (): void => {
      if (!this.started || this.destroyed || this.destroying) return;
      this.scheduleReconcile(source.getPath()).catch((error) => {
        console.error('[Tuvix] Reconcile after navigation failed:', error);
      });
    };

    const unsubscribe = source.subscribe(onNavigate);
    let connected = true;
    const disconnect = (): void => {
      if (!connected) return;
      connected = false;
      unsubscribe();
      this.routerDisconnects.delete(disconnect);
      if (this.pathSource === source) this.pathSource = null;
    };
    this.routerDisconnects.add(disconnect);

    onNavigate();
    return disconnect;
  }

  /**
   * Destroy the orchestrator: wait for a running reconcile, unmount every
   * app, stop listening and prefetching. A shared global bus is left
   * alive; a private bus (from `eventBus` options) is destroyed.
   */
  async destroy(): Promise<void> {
    if (this.destroyed) return;
    if (this.destroying) return this.destroying;

    this.destroying = this.teardown();
    return this.destroying;
  }

  /**
   * Manually trigger app reconciliation for the given path (or the current
   * path if omitted). Prefer {@link Orchestrator.connectRouter} when an
   * external router handles navigation.
   *
   * Calls made while a reconcile runs are queued; only the newest path is
   * reconciled next, and every caller's promise resolves when the queue
   * drains.
   *
   * @example
   * ```ts
   * import { createOrchestrator } from '@tuvix.js/core';
   *
   * const orchestrator = createOrchestrator();
   * await orchestrator.reconcile('/dashboard?tab=stats');
   * ```
   */
  async reconcile(path?: string): Promise<void> {
    this.ensureAlive();
    await this.scheduleReconcile(path ?? this.getCurrentPath());
  }

  private async teardown(): Promise<void> {
    this.prefetchCleanup?.();
    this.prefetchCleanup = null;

    if (this.routerUnsubscribe) {
      this.routerUnsubscribe();
      this.routerUnsubscribe = null;
    }
    for (const disconnect of Array.from(this.routerDisconnects)) disconnect();

    this.pendingPath = null;
    if (this.reconcileLoop) await this.reconcileLoop.catch(noop);

    await Promise.all(
      Array.from(this.apps.values()).map((app) => {
        app.wantMounted = false;
        return this.converge(app).catch(noop);
      })
    );

    this.viewportObserver?.disconnect();
    this.viewportObserver = null;

    this.router?.destroy();
    this.loader.clearCache();
    this.emitEvent(OrchestratorEvent.DESTROYED, {});
    if (this.ownsEventBus) this.eventBus.destroy();
    this.apps.clear();

    this.started = false;
    this.destroyed = true;
  }

  private handleRouteChange(event: NavigationEvent): Promise<void> {
    this.emitEvent(OrchestratorEvent.ROUTE_CHANGE, event);
    return this.scheduleReconcile(event.to);
  }

  private getCurrentPath(): string {
    if (this.pathSource) return this.pathSource.getPath();
    if (this.router) return this.router.currentPath;
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  }

  private getApp(name: string): AppRecord {
    const app = this.apps.get(name);
    if (!app || app.removed) {
      throw new Error(`[Tuvix] App "${name}" is not registered.`);
    }
    return app;
  }

  // ─── Reconciliation ─────────────────────────────

  /**
   * Queue a reconcile. Desired state is updated right away so in-flight
   * loads and mounts see it; the actual work runs one path at a time.
   */
  private scheduleReconcile(path: string): Promise<void> {
    if (this.destroyed || this.destroying) return Promise.resolve();

    this.pendingPath = path;
    this.applyDesiredState(path);

    if (!this.reconcileLoop) {
      // The body awaits before `finally` can run, so the assignment below
      // always happens first; a new loop only starts after this one cleared.
      this.reconcileLoop = (async () => {
        try {
          while (this.pendingPath !== null) {
            const next = this.pendingPath;
            this.pendingPath = null;
            await this.reconcileOnce(next);
          }
        } finally {
          this.reconcileLoop = null;
        }
      })();
    }
    return this.reconcileLoop;
  }

  private applyDesiredState(path: string): void {
    const routed = this.routedAppsFor(path);
    for (const app of this.apps.values()) {
      if (this.isRouteManaged(app)) {
        app.wantMounted = this.shouldAppBeActive(app, path, routed);
      }
    }
  }

  private async reconcileOnce(path: string): Promise<void> {
    // Apply this path's desired state again: it may have been overwritten by
    // a path that was queued and then superseded by this one.
    this.applyDesiredState(path);

    const managed = Array.from(this.apps.values()).filter((app) =>
      this.isRouteManaged(app)
    );

    // Phase 1: everything that should go away goes away first, so apps that
    // share a container never overlap.
    await Promise.all(
      managed
        .filter(
          (app) => !app.wantMounted && (app.op || this.isMountedState(app))
        )
        .map((app) => this.convergeLogged(app, 'unmount'))
    );

    // A newer path arrived meanwhile; let the loop handle it from phase 1.
    if (this.pendingPath !== null || this.destroying) return;

    await Promise.all(
      managed
        .filter((app) => app.wantMounted)
        .map((app) => this.convergeLogged(app, 'mount'))
    );
  }

  private convergeLogged(app: AppRecord, action: string): Promise<void> {
    return this.converge(app).catch((error) => {
      console.error(`[Tuvix] Failed to ${action} "${app.config.name}":`, error);
    });
  }

  private isMountedState(app: AppRecord): boolean {
    return app.status === 'mounted' || app.status === 'updating';
  }

  /**
   * Drive an app toward `wantMounted`. Returns the in-flight work if there is
   * some; that work re-reads `wantMounted` after every step, so a change made
   * while it runs is honoured before it settles.
   */
  private converge(app: AppRecord): Promise<void> {
    if (app.op) return app.op;
    if (app.wantMounted === this.isMountedState(app)) return Promise.resolve();

    const op: Promise<void> = (async () => {
      // Yield once so `app.op` is assigned before any state check below.
      await undefined;
      try {
        for (;;) {
          const mounted = this.isMountedState(app);
          if (app.wantMounted && !mounted) {
            await this.performMount(app);
            if (!this.isMountedState(app)) return;
          } else if (!app.wantMounted && mounted) {
            await this.performUnmount(app);
          } else {
            return;
          }
        }
      } finally {
        app.op = null;
      }
    })();
    app.op = op;
    return op;
  }

  private async performMount(app: AppRecord): Promise<void> {
    const name = app.config.name;
    let phase: AppErrorPhase = 'load';

    try {
      const container = this.resolveContainer(app.config.container);
      app.container = container;
      app.target = null;

      const firstLoad = !app.module;
      if (firstLoad) this.setAppStatus(app, 'bootstrapping');

      // Also runs for cached modules: the loader re-adds styles that the
      // last unmount removed.
      const result = await this.loader.load(name, app.loadEntry);
      if (result.status === 'error' || !result.module) {
        throw result.error ?? new Error(`Failed to load app "${name}"`);
      }

      if (!app.module) {
        // Keep `app.module` unset until bootstrap succeeds, so a failed
        // bootstrap runs again on the next mount.
        phase = 'bootstrap';
        if (result.module.bootstrap) {
          await result.module.bootstrap();
        }
        app.module = result.module;
        this.setAppStatus(app, 'bootstrapped');
        this.emitEvent(OrchestratorEvent.APP_BOOTSTRAP, { name });
      }

      // The app turned inactive while it loaded: skip the mount.
      if (!app.wantMounted) {
        this.loader.removeStyles(name);
        return;
      }

      app.target = this.resolveMountTarget(app, container);
      await this.waitForSandboxStyles(app);

      phase = 'mount';
      this.setAppStatus(app, 'mounting');

      const context: MountContext = {
        container: app.target,
        props: app.config.props,
        name,
        bus: this.eventBus,
      };
      await app.module.mount(context);

      this.setAppStatus(app, 'mounted');
      this.emitEvent(OrchestratorEvent.APP_MOUNT, { name });
    } catch (error) {
      // Render fallback HTML into the container when the app fails to mount.
      const fallbackTarget = app.target ?? app.container;
      if (app.config.fallback != null && fallbackTarget) {
        fallbackTarget.innerHTML = app.config.fallback;
      }

      throw this.reportError(app, error, phase);
    }
  }

  private async performUnmount(app: AppRecord): Promise<void> {
    const name = app.config.name;

    if (app.updating) await app.updating.catch(noop);

    try {
      this.setAppStatus(app, 'unmounting');

      const target = app.target ?? app.container;
      if (app.module && target) {
        await app.module.unmount({ container: target });
      }
      this.loader.removeStyles(name);
      this.releaseSandbox(app);

      this.setAppStatus(app, 'unmounted');
      this.emitEvent(OrchestratorEvent.APP_UNMOUNT, { name });
    } catch (error) {
      throw this.reportError(app, error, 'unmount');
    }
  }

  /**
   * Record a lifecycle failure: status `error`, a `tuvix:app:error` bus
   * event and `onError`. Returns the error for the caller to rethrow.
   */
  private reportError(
    app: AppRecord,
    error: unknown,
    phase: AppErrorPhase
  ): Error {
    const err = toError(error);
    const name = app.config.name;
    app.error = err;
    this.setAppStatus(app, 'error');
    const payload: AppErrorEvent = { name, error: err, phase };
    this.emitEvent(OrchestratorEvent.APP_ERROR, payload);
    this.config.onError?.(err, name);
    return err;
  }

  private isRouteManaged(app: AppRecord): boolean {
    if (app.removed) return false;
    // Viewport apps are handled by IntersectionObserver, not route reconciliation.
    if (app.config.mountWhenVisible) return false;
    if (app.config.activeWhen !== undefined) return true;
    return (
      this.config.router?.routes.some(
        (route) => route.app === app.config.name
      ) ?? false
    );
  }

  /** Apps the built-in router's `routes` activate for `path`. */
  private routedAppsFor(path: string): Set<string> | null {
    return this.router ? new Set(this.router.getActiveApps(path)) : null;
  }

  private shouldAppBeActive(
    app: AppRecord,
    path: string,
    routed: Set<string> | null
  ): boolean {
    const { activeWhen } = app.config;

    if (typeof activeWhen === 'string') {
      return matchPath(activeWhen, path).matched;
    }

    if (typeof activeWhen === 'function') {
      return activeWhen(path);
    }

    return routed?.has(app.config.name) ?? false;
  }

  // ─── Containers and sandboxing ──────────────────

  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === 'string') {
      const element = document.querySelector<HTMLElement>(container);
      if (!element) {
        throw new Error(`[Tuvix] Container "${container}" not found in DOM.`);
      }
      return element;
    }
    return container;
  }

  /**
   * For CSS-isolated apps: wrap the container in a shadow root (reused on
   * remount) and return the element inside it that the app renders into.
   */
  private resolveMountTarget(
    app: AppRecord,
    container: HTMLElement
  ): HTMLElement {
    if (!isCssIsolated(app.config.sandbox)) return container;

    this.cssSandbox ??= new CssSandbox();
    const shadowRoot = this.cssSandbox.wrap(container);

    let root: HTMLElement | null = null;
    for (const child of Array.from(shadowRoot.children)) {
      if (
        child instanceof HTMLElement &&
        child.hasAttribute(SANDBOX_ROOT_ATTR)
      ) {
        root = child;
        break;
      }
    }

    if (!root) {
      root = document.createElement('div');
      root.setAttribute(SANDBOX_ROOT_ATTR, app.config.name);
      // Keep server-rendered markup that wrap() moved into the shadow root.
      for (const node of Array.from(shadowRoot.childNodes)) {
        const isStylesheet =
          node instanceof HTMLStyleElement ||
          (node instanceof HTMLLinkElement && node.rel === 'stylesheet');
        if (!isStylesheet) root.appendChild(node);
      }
      shadowRoot.appendChild(root);
    }

    return root;
  }

  /**
   * After a CSS-isolated app unmounts: drop its render root and turn the
   * shadow root back into a pass-through `<slot>`, so the next app in the
   * same container (sandboxed or not) renders visibly. The shadow root and
   * the app's stylesheets stay parked for the next sandboxed mount.
   */
  private releaseSandbox(app: AppRecord): void {
    const { container, target } = app;
    if (!this.cssSandbox || !container || !isCssIsolated(app.config.sandbox)) {
      return;
    }
    if (target && target !== container) target.remove();
    this.cssSandbox.unwrap(container);
    app.target = null;
  }

  /**
   * Put the entry's styles into the app's shadow root and wait until they
   * load (bounded by the loader timeout) so the app does not render unstyled.
   */
  private async waitForSandboxStyles(app: AppRecord): Promise<void> {
    const styles = entryStyles(app.config.entry);
    const shadowRoot = app.container?.shadowRoot;
    if (
      !isCssIsolated(app.config.sandbox) ||
      !this.cssSandbox ||
      !shadowRoot ||
      styles.length === 0
    ) {
      return;
    }

    const { ready } = this.cssSandbox.adoptStyles(shadowRoot, { urls: styles });
    const timeout = this.config.loader?.timeout ?? 10000;
    if (timeout <= 0) {
      await ready;
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      ready,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, timeout);
      }),
    ]);
    clearTimeout(timer);
  }

  // ─── Events ─────────────────────────────────────

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

  // ─── Prefetching ────────────────────────────────

  private prefetchApp(app: AppRecord): void {
    const name = app.config.name;
    if (this.prefetched.has(name) || this.loader.isLoaded(name)) return;
    this.prefetched.add(name);
    this.loader.prefetch(app.config.entry);
  }

  private setupPrefetching(): void {
    const strategy = this.config.prefetch?.strategy ?? 'none';

    if (strategy === 'none' || typeof window === 'undefined') return;

    const prefetchAll = (): void => {
      for (const app of this.apps.values()) this.prefetchApp(app);
    };

    switch (strategy) {
      case 'immediate':
        prefetchAll();
        break;

      case 'idle': {
        const win = window as Window & {
          requestIdleCallback?: (cb: () => void) => number;
          cancelIdleCallback?: (handle: number) => void;
        };
        if (win.requestIdleCallback && win.cancelIdleCallback) {
          const handle = win.requestIdleCallback(prefetchAll);
          const cancel = win.cancelIdleCallback;
          this.prefetchCleanup = () => cancel(handle);
        } else {
          const timer = setTimeout(prefetchAll, 200);
          this.prefetchCleanup = () => clearTimeout(timer);
        }
        break;
      }

      case 'hover':
        this.prefetchCleanup = this.setupHoverPrefetch();
        break;
    }
  }

  /**
   * Prefetch an app when the pointer enters (or focus lands on) a
   * same-origin link whose path would activate it.
   */
  private setupHoverPrefetch(): () => void {
    const routerConfig = this.config.router;
    const hashMode = routerConfig?.mode === 'hash';
    // Hash-mode links carry the app path in the hash, whatever the pathname.
    const resolveOptions = hashMode ? {} : { base: routerConfig?.base };

    const onIntent = (event: Event): void => {
      const link = resolveLink(event, resolveOptions);
      if (!link) return;
      const path = hashMode
        ? normalizePath(link.url.hash.slice(1) || '/')
        : link.path;

      const routed = this.routedAppsFor(path);
      for (const app of this.apps.values()) {
        if (
          this.isRouteManaged(app) &&
          !this.prefetched.has(app.config.name) &&
          this.shouldAppBeActive(app, path, routed)
        ) {
          this.prefetchApp(app);
        }
      }
    };

    // pointerenter does not bubble; capture sees it for every element entered.
    document.addEventListener('pointerenter', onIntent, true);
    document.addEventListener('focusin', onIntent);
    return () => {
      document.removeEventListener('pointerenter', onIntent, true);
      document.removeEventListener('focusin', onIntent);
    };
  }

  // ─── Viewport mounting ──────────────────────────

  private setupViewportObserver(): void {
    for (const app of this.apps.values()) {
      if (app.config.mountWhenVisible) this.observeViewportApp(app);
    }
  }

  /** Observe a viewport app's container, creating the observer on first use. */
  private observeViewportApp(app: AppRecord): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.viewportObserver ??= new IntersectionObserver(
      this.handleViewportIntersection.bind(this),
      { threshold: 0.1 }
    );
    try {
      const container = this.resolveContainer(app.config.container);
      app.container = container;
      this.viewportObserver.observe(container);
    } catch {
      // Container may not be in the DOM yet; ignore.
    }
  }

  private handleViewportIntersection(
    entries: IntersectionObserverEntry[]
  ): void {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      for (const [name, app] of this.apps) {
        if (
          app.config.mountWhenVisible &&
          !app.removed &&
          app.container === entry.target &&
          !app.op &&
          app.status !== 'mounted' &&
          app.status !== 'error'
        ) {
          // Stop observing — we are about to mount.
          this.viewportObserver?.unobserve(entry.target);
          this.mountApp(name).catch((err) => {
            console.error(`[Tuvix] Viewport mount failed for "${name}":`, err);
          });
          break;
        }
      }
    }
  }

  private ensureAlive(): void {
    if (this.destroyed || this.destroying) {
      throw new Error(
        '[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.'
      );
    }
  }
}
