import type { ComponentType, ReactElement } from 'react';
import { Suspense, createElement } from 'react';
import type { Root } from 'react-dom/client';
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
import { CommitSignal, TuvixErrorBoundary } from './internal';

// ─── Types ──────────────────────────────────────────

export interface ReactMicroAppConfig<
  P extends object = Record<string, unknown>,
> {
  /** Unique name for the micro app */
  name: string;

  /**
   * Root React component to render. It receives the orchestrator's props
   * as its own props, so a component with required props is accepted.
   */
  App: ComponentType<P>;

  /** Optional one-time setup */
  bootstrap?: () => void | Promise<void>;

  /**
   * Enable SSR hydration mode.
   *
   * When `true`, `mount()` calls `hydrateRoot()` instead of `createRoot()` if
   * the container holds server-rendered markup (elements or non-whitespace
   * text). Use this when a framework such as TanStack Start, Next.js or Remix
   * pre-renders the micro app, for example through `TuvixReactApp`.
   *
   * @default false
   */
  ssr?: boolean;
}

interface Instance {
  root: Root | null;
  hydrated: boolean;
  /** Set by `unmount`; a pending mount checks it before touching the DOM. */
  cancelled: boolean;
  /** True once the first render committed and `mounted` was emitted. */
  mounted: boolean;
  /** Settles when the root exists, or when mount gave up before creating it. */
  ready: Promise<void>;
  /** Resolves the wait for the first commit (also used to abort it). */
  committed: () => void;
  /** Called by the error boundary. */
  failed: (error: unknown) => void;
}

// ─── createReactMicroApp ────────────────────────────

/**
 * Create a Tuvix.js micro app module from a React component.
 *
 * Each container gets its own React root, so the same module can be mounted
 * in several places at once. The module registers itself under
 * `config.name` and dispatches `tuvix:mounted`, `tuvix:unmounted` and
 * `tuvix:error` on the container.
 *
 * - `mount` resolves after the first render has committed. With `ssr: true`
 *   and server markup in the container it hydrates instead of rendering.
 * - `mount` on a container this module already holds unmounts the old root
 *   (emitting `tuvix:unmounted`) and renders fresh. Component state resets.
 * - A render error during the first render rejects `mount` and clears the
 *   container. A render error later replaces the app with nothing and emits
 *   `tuvix:error`; the app stays blank until it is remounted.
 * - `unmount` called while `mount` is still loading `react-dom/client` waits
 *   for it, so no orphan root is left behind.
 * - `update({ props, container })` re-renders one container, or every
 *   mounted container when `container` is omitted. Component state survives.
 *
 * @example
 * ```tsx
 * import { createReactMicroApp } from '@tuvix.js/react';
 *
 * function Dashboard({ userId }: { userId: string }) {
 *   return <h1>Dashboard for {userId}</h1>;
 * }
 *
 * export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
 * ```
 */
export function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule {
  const instances = new WeakMap<HTMLElement, Instance>();
  // WeakMap is not iterable; `update` without a container needs the live set.
  const live = new Set<HTMLElement>();

  const render = (
    instance: Instance,
    props: Record<string, unknown>
  ): ReactElement =>
    createElement(
      TuvixErrorBoundary,
      { fallback: null, onError: instance.failed },
      createElement(
        Suspense,
        { fallback: null },
        createElement(config.App, props as P),
        createElement(CommitSignal, { onCommit: instance.committed })
      )
    );

  const forget = (container: HTMLElement, instance: Instance): void => {
    if (instances.get(container) === instance) {
      instances.delete(container);
      live.delete(container);
    }
  };

  const module: MicroAppModule = {
    async bootstrap() {
      await config.bootstrap?.();
    },

    async mount({ container, props = {} }: MountContext) {
      // Like the Vue, Svelte and Angular adapters: a second mount into the
      // same container tears the old root down (emitting `unmounted`) and
      // renders fresh with the new props.
      if (instances.has(container)) await module.unmount({ container });

      let resolveCommit!: () => void;
      let rejectCommit!: (error: unknown) => void;
      const firstCommit = new Promise<void>((resolve, reject) => {
        resolveCommit = resolve;
        rejectCommit = reject;
      });

      const instance: Instance = {
        root: null,
        hydrated: false,
        cancelled: false,
        mounted: false,
        ready: Promise.resolve(),
        committed: () => resolveCommit(),
        failed: (error) => {
          if (instance.mounted) {
            emitLifecycle('error', {
              name: config.name,
              container,
              hydrated: instance.hydrated,
              error,
            });
          } else {
            rejectCommit(error);
          }
        },
      };

      instances.set(container, instance);
      live.add(container);

      // Loaded lazily so server bundles that import this module for
      // `TuvixReactApp` never pull in react-dom/client.
      instance.ready = import('react-dom/client').then(
        ({ createRoot, hydrateRoot }) => {
          if (instance.cancelled) return;
          instance.hydrated = config.ssr === true && hasServerMarkup(container);
          const element = render(instance, props);
          if (instance.hydrated) {
            instance.root = hydrateRoot(container, element);
          } else {
            instance.root = createRoot(container);
            instance.root.render(element);
          }
        }
      );

      try {
        await instance.ready;
        if (instance.cancelled) return;
        await firstCommit;
      } catch (error) {
        forget(container, instance);
        instance.cancelled = true;
        if (instance.root) {
          instance.root.unmount();
          instance.root = null;
          container.replaceChildren();
        }
        emitLifecycle('error', {
          name: config.name,
          container,
          hydrated: instance.hydrated,
          error,
        });
        throw error;
      }

      if (instance.cancelled) return;
      instance.mounted = true;
      emitLifecycle('mounted', {
        name: config.name,
        container,
        hydrated: instance.hydrated,
      });
    },

    async unmount({ container }: UnmountContext) {
      const instance = instances.get(container);
      if (!instance) return;

      forget(container, instance);
      instance.cancelled = true;
      // Release a mount that is still waiting for its first commit.
      instance.committed();
      await instance.ready.catch(() => undefined);

      instance.root?.unmount();
      instance.root = null;
      container.replaceChildren();

      if (instance.mounted) {
        instance.mounted = false;
        emitLifecycle('unmounted', {
          name: config.name,
          container,
          hydrated: instance.hydrated,
        });
      }
    },

    async update({ props, container }: UpdateContext) {
      const targets = container ? [container] : Array.from(live);
      await Promise.all(
        targets.map(async (target) => {
          const instance = instances.get(target);
          if (!instance) return;
          await instance.ready.catch(() => undefined);
          if (instance.cancelled || !instance.root) return;
          instance.root.render(render(instance, props));
        })
      );
    },
  };

  registerModule(config.name, module);

  return module;
}

/**
 * `createReactMicroApp` with `ssr: true`.
 *
 * Use it when the container already holds server-rendered HTML that React
 * should hydrate instead of replacing.
 *
 * @example
 * ```tsx
 * import { createSsrReactMicroApp } from '@tuvix.js/react';
 *
 * function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
 *   return <article>{page}</article>;
 * }
 *
 * export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
 * ```
 */
export function createSsrReactMicroApp<
  P extends object = Record<string, unknown>,
>(config: Omit<ReactMicroAppConfig<P>, 'ssr'>): MicroAppModule {
  return createReactMicroApp<P>({ ...config, ssr: true });
}
