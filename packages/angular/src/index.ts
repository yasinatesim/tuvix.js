import type { ApplicationRef, ComponentRef, Type } from '@angular/core';
import {
  emitLifecycle,
  hasServerMarkup,
  registerModule,
} from '@tuvix.js/loader';
import type {
  MicroAppModule,
  MountContext,
  UnmountContext,
  UpdateContext,
} from '@tuvix.js/loader';
import {
  applyInputs,
  bootstrapInto,
  changeDetectionProviders,
  ensureCompiler,
  hostTagName,
  inputNames,
  type AngularCore,
  type AngularProviders,
  type Props,
} from './shared';

export type { AngularProviders } from './shared';

// ─── Types ──────────────────────────────────────────

export interface AngularMicroAppConfig<C = unknown> {
  /** Unique name for the micro app. */
  name: string;

  /**
   * Root component. Standalone components work on their own. A component
   * declared in an NgModule also needs that module in `module`.
   */
  component: Type<C>;

  /**
   * NgModule that declares `component`. The adapter imports its providers
   * through `importProvidersFrom`.
   */
  module?: Type<unknown>;

  /** Environment providers for the app, such as `provideHttpClient()`. */
  providers?: AngularProviders;

  /**
   * Tag name of the host element the adapter creates inside the container.
   * Default: the element part of the component selector, or `div` when the
   * selector has no element part.
   */
  selector?: string;

  /**
   * Run change detection through zone.js. Default `false`: the app runs
   * zoneless and the adapter never loads zone.js.
   *
   * Set `true` only after your client entry imported `zone.js`; mount throws
   * otherwise. On Angular 15-17 without zone.js, nothing runs change
   * detection after DOM events, so call `ChangeDetectorRef.detectChanges()`
   * in your handlers. Angular 18+ schedules it for you.
   */
  zone?: boolean;

  /**
   * Adopt markup from `renderAngularToString` when the container holds it.
   * Angular re-renders into the server-rendered host element and drops the
   * inlined server `<style>` tags once its own styles are in `<head>`. This
   * is not Angular's non-destructive hydration.
   */
  ssr?: boolean;

  /** Optional one-time setup. */
  bootstrap?: () => void | Promise<void>;
}

/** Config for {@link createSsrAngularMicroApp}; `ssr` is always on. */
export type AngularSsrMicroAppConfig<C = unknown> = Omit<
  AngularMicroAppConfig<C>,
  'ssr'
>;

export interface AngularSsrOptions {
  /** Environment providers for the server render. */
  providers?: AngularProviders;
  /**
   * Angular `APP_ID` for the server render. Angular puts it in the
   * `ng-app-id` attribute of the style tags. Default: Angular's `ng`.
   */
  appId?: string;
  /**
   * HTML document to render into. It must contain the component's host
   * element. Default: an empty document with the host element in `<body>`.
   */
  document?: string;
  /** Host element tag name. Default: the element part of the component selector. */
  selector?: string;
  /**
   * Values for the component inputs, keyed by input name (or alias). The
   * server sets them before the first change detection, the same way the
   * client adapter does on mount, so pass the same object to both sides.
   * Keys that are not inputs are skipped.
   */
  props?: Record<string, unknown>;
}

// ─── Internals ──────────────────────────────────────

interface AngularInstance {
  container: HTMLElement;
  hydrated: boolean;
  /** Latest props; a pending mount reads them when it bootstraps. */
  props: Props;
  appRef: ApplicationRef | null;
  componentRef: ComponentRef<unknown> | null;
  core: AngularCore | null;
  inputs: ReadonlySet<string>;
  /** Set by `unmount` while the mount is still awaiting imports. */
  cancelled: boolean;
  /** Settles when the mount finished, failed or was cancelled. */
  ready: Promise<void>;
}

/**
 * Reuse the server-rendered host element when it is a direct child of the
 * container; otherwise replace the container content with a fresh one.
 */
function resolveHost(
  container: HTMLElement,
  tag: string,
  adopt: boolean
): HTMLElement {
  if (adopt) {
    for (const child of Array.from(container.children)) {
      if (child.localName === tag) return child as HTMLElement;
    }
  }
  const host = container.ownerDocument.createElement(tag);
  container.replaceChildren(host);
  return host;
}

function createAngularModule(
  config: AngularMicroAppConfig,
  ssr: boolean
): MicroAppModule {
  const { name } = config;
  const instances = new WeakMap<HTMLElement, AngularInstance>();
  // A WeakMap cannot be iterated; `update` without a container reaches every live instance.
  const live = new Set<AngularInstance>();

  async function start(instance: AngularInstance): Promise<void> {
    const { container } = instance;
    await ensureCompiler([
      { type: config.component, key: 'ɵcmp' },
      ...(config.module ? [{ type: config.module, key: 'ɵmod' as const }] : []),
    ]);
    // Dynamic on purpose: `@angular/platform-browser` loads `@angular/common`,
    // which needs the compiler from `ensureCompiler` when the code is JIT.
    const core = await import('@angular/core');
    const { createApplication } = await import('@angular/platform-browser');

    const providers: AngularProviders = [
      ...changeDetectionProviders(core, config.zone === true, name),
      ...(config.module ? [core.importProvidersFrom(config.module)] : []),
      ...(config.providers ?? []),
    ];
    const appRef = await createApplication({ providers });
    if (instance.cancelled) {
      appRef.destroy();
      return;
    }

    try {
      const tag =
        config.selector ?? hostTagName(core, config.component) ?? 'div';
      const host = resolveHost(container, tag, instance.hydrated);
      const inputs = inputNames(core, config.component);
      const zone = appRef.injector.get(core.NgZone);
      // Bootstrap inside the zone so template listeners trigger change
      // detection when `zone: true`. NoopNgZone runs the callback directly.
      const componentRef = zone.run(() =>
        bootstrapInto(
          core,
          appRef,
          config.component,
          host,
          inputs,
          instance.props
        )
      );
      // The component styles are in <head> now; drop the inlined server
      // styles and any other server leftovers next to the host.
      if (instance.hydrated) container.replaceChildren(host);

      instance.core = core;
      instance.appRef = appRef;
      instance.componentRef = componentRef;
      instance.inputs = inputs;
    } catch (error) {
      appRef.destroy();
      throw error;
    }
  }

  function teardown(instance: AngularInstance): void {
    const { container, appRef, hydrated } = instance;
    instance.appRef = null;
    instance.componentRef = null;
    try {
      if (appRef && !appRef.destroyed) appRef.destroy();
    } catch (error) {
      emitLifecycle('error', { name, container, hydrated, error });
      throw error;
    } finally {
      // The app is gone either way; report it so `isMounted` turns false.
      container.replaceChildren();
      emitLifecycle('unmounted', { name, container, hydrated });
    }
  }

  // The synchronous part removes the instance from the maps right away, so a
  // later mount or unmount on the same container never sees it.
  async function stop(container: HTMLElement): Promise<void> {
    const instance = instances.get(container);
    if (!instance) return;
    instances.delete(container);
    live.delete(instance);
    instance.cancelled = true;
    // Wait for an in-flight mount so it cannot leave an orphan app behind.
    await instance.ready.catch(() => undefined);
    // A mount cancelled before bootstrap destroyed its own app already.
    if (instance.appRef) teardown(instance);
  }

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container, props }: MountContext) {
      const stopping = stop(container);

      const instance: AngularInstance = {
        container,
        hydrated: false,
        props: { ...props },
        appRef: null,
        componentRef: null,
        core: null,
        inputs: new Set(),
        cancelled: false,
        ready: Promise.resolve(),
      };
      // Register before the first await so an unmount that arrives while
      // this mount is pending finds the instance and cancels it.
      instances.set(container, instance);
      live.add(instance);
      instance.ready = (async () => {
        await stopping;
        if (instance.cancelled) return;
        instance.hydrated = ssr && hasServerMarkup(container);
        await start(instance);
      })();

      try {
        await instance.ready;
      } catch (error) {
        if (instances.get(container) === instance) {
          instances.delete(container);
          live.delete(instance);
        }
        emitLifecycle('error', {
          name,
          container,
          hydrated: instance.hydrated,
          error,
        });
        throw error;
      }

      // A mount cancelled before bootstrap has no app; one cancelled after
      // reports `mounted` here and `unmounted` from the pending `stop`.
      if (instance.appRef) {
        emitLifecycle('mounted', {
          name,
          container,
          hydrated: instance.hydrated,
        });
      }
    },

    async unmount({ container }: UnmountContext) {
      await stop(container);
    },

    async update({ props, container }: UpdateContext) {
      let targets: AngularInstance[];
      if (container) {
        const instance = instances.get(container);
        targets = instance ? [instance] : [];
      } else {
        targets = Array.from(live);
      }
      for (const instance of targets) {
        const previous = instance.props;
        instance.props = { ...props };
        const { appRef, componentRef, core } = instance;
        // Still mounting: the bootstrap picks up `instance.props`.
        if (!appRef || !componentRef || !core) continue;
        appRef.injector.get(core.NgZone).run(() => {
          applyInputs(componentRef, instance.inputs, instance.props, previous);
          appRef.tick();
        });
      }
    },
  };

  registerModule(name, module);

  return module;
}

// ─── createAngularMicroApp ──────────────────────────

/**
 * Create a Tuvix.js micro app module from an Angular component.
 *
 * Each `mount` creates its own application with `createApplication` and
 * bootstraps the component into a host element inside the container, so two
 * apps on one page never share an `app-root`. Props reach the component
 * through `ComponentRef.setInput`, at mount and on `update`. The app runs
 * without zone.js unless you pass `zone: true`. JIT components get
 * `@angular/compiler` loaded before `@angular/platform-browser`.
 *
 * @example
 * ```ts
 * import { createAngularMicroApp } from '@tuvix.js/angular';
 * import { provideHttpClient } from '@angular/common/http';
 * import { AdminComponent } from './admin.component';
 *
 * export default createAngularMicroApp({
 *   name: 'admin',
 *   component: AdminComponent,
 *   providers: [provideHttpClient()],
 * });
 * ```
 */
export function createAngularMicroApp<C>(
  config: AngularMicroAppConfig<C>
): MicroAppModule {
  return createAngularModule(
    config as AngularMicroAppConfig,
    config.ssr === true
  );
}

// ─── createSsrAngularMicroApp ───────────────────────

/**
 * Create a Tuvix.js micro app module that adopts markup from
 * `renderAngularToString`.
 *
 * Same as `createAngularMicroApp({ ...config, ssr: true })`. When the
 * container holds server markup, Angular renders into the server's host
 * element and the `mounted` event reports `hydrated: true`. An empty
 * container gets a normal client render.
 *
 * @example
 * ```ts
 * import { createSsrAngularMicroApp } from '@tuvix.js/angular';
 * import { AboutComponent } from './about.component';
 *
 * export default createSsrAngularMicroApp({
 *   name: 'about-angular-app',
 *   component: AboutComponent,
 * });
 * ```
 */
export function createSsrAngularMicroApp<C>(
  config: AngularSsrMicroAppConfig<C>
): MicroAppModule {
  return createAngularModule(config as AngularMicroAppConfig, true);
}
