import type { MicroAppModule } from './types';

/**
 * Lifecycle event types that adapters dispatch on a micro app's container.
 *
 * The DOM event name is `tuvix:<type>`, for example `tuvix:mounted`.
 * Events bubble, so you can listen on `document`.
 */
export type LifecycleType = 'mounted' | 'unmounted' | 'error';

export interface LifecycleDetail {
  /** Micro app name, as passed to `create*MicroApp` or `TuvixIsland`. */
  name: string;
  /** Element the app rendered into. */
  container: HTMLElement;
  /** True when the adapter adopted server-rendered markup instead of rendering fresh. */
  hydrated: boolean;
  /** The thrown value, set only for `error` events. */
  error?: unknown;
}

export type LifecycleEvent = CustomEvent<LifecycleDetail>;

interface Waiter {
  resolve: (detail: LifecycleDetail) => void;
  reject: (reason: unknown) => void;
}

interface RuntimeState {
  modules: Record<string, MicroAppModule>;
  /** Mounted containers per app name, in mount order. */
  mounted: Map<string, Map<HTMLElement, LifecycleDetail>>;
  waiters: Map<string, Set<Waiter>>;
}

// Separately bundled micro apps each get their own copy of this module.
// Keeping state on `window` lets every copy see the same registry.
const STATE_KEY = '__TUVIX_RUNTIME__';
const MODULES_KEY = '__TUVIX_MODULES__';

type TuvixWindow = Window & {
  [STATE_KEY]?: RuntimeState;
  [MODULES_KEY]?: Record<string, MicroAppModule>;
};

const serverState: RuntimeState = {
  modules: {},
  mounted: new Map(),
  waiters: new Map(),
};

function state(): RuntimeState {
  if (typeof window === 'undefined') return serverState;
  const win = window as TuvixWindow;
  if (!win[STATE_KEY]) {
    win[MODULES_KEY] = win[MODULES_KEY] ?? {};
    win[STATE_KEY] = {
      modules: win[MODULES_KEY],
      mounted: new Map(),
      waiters: new Map(),
    };
  }
  return win[STATE_KEY];
}

/**
 * Publish a micro app module so the orchestrator's loader can find it by name.
 * Every adapter calls this; app code rarely needs to.
 */
export function registerModule(name: string, module: MicroAppModule): void {
  state().modules[name] = module;
}

/** Remove a module from the registry so the next load fetches it again. */
export function unregisterModule(name: string): void {
  delete state().modules[name];
}

/** Look up a module published with {@link registerModule}. */
export function getRegisteredModule(name: string): MicroAppModule | undefined {
  return state().modules[name];
}

/**
 * Record a lifecycle change and dispatch `tuvix:<type>` on the container.
 * Adapters call this after mount and unmount finish, and when either throws.
 */
export function emitLifecycle(
  type: LifecycleType,
  detail: LifecycleDetail
): void {
  const s = state();

  if (type === 'mounted') {
    let containers = s.mounted.get(detail.name);
    if (!containers) {
      containers = new Map();
      s.mounted.set(detail.name, containers);
    }
    containers.set(detail.container, detail);
    const waiters = s.waiters.get(detail.name);
    if (waiters) {
      s.waiters.delete(detail.name);
      for (const waiter of waiters) waiter.resolve(detail);
    }
  } else if (type === 'unmounted') {
    const containers = s.mounted.get(detail.name);
    containers?.delete(detail.container);
    if (containers?.size === 0) s.mounted.delete(detail.name);
  }

  if (typeof CustomEvent !== 'undefined') {
    // A host framework may remove the container before the adapter reports
    // `unmounted`. Events on a detached element never reach `document`, so
    // dispatch there directly; `detail.container` still names the element.
    const target: EventTarget =
      detail.container.isConnected || typeof document === 'undefined'
        ? detail.container
        : document;
    target.dispatchEvent(
      new CustomEvent<LifecycleDetail>(`tuvix:${type}`, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }
}

/**
 * True while the named app is mounted in at least one container. One module
 * can mount into several containers; unmounting one leaves the others counted.
 */
export function isMounted(name: string): boolean {
  return state().mounted.has(name);
}

/**
 * Resolve once the named app has mounted in any container. Resolves
 * immediately, with its earliest still-mounted container, if it already is.
 * Pass an `AbortSignal` to stop waiting; the promise then rejects with the signal's reason.
 */
export function whenMounted(
  name: string,
  options: { signal?: AbortSignal } = {}
): Promise<LifecycleDetail> {
  const s = state();
  const containers = s.mounted.get(name);
  if (containers) {
    for (const detail of containers.values()) return Promise.resolve(detail);
  }

  const { signal } = options;
  if (signal?.aborted) return Promise.reject(signal.reason);

  return new Promise<LifecycleDetail>((resolve, reject) => {
    const waiters = s.waiters.get(name) ?? new Set<Waiter>();
    s.waiters.set(name, waiters);

    const onAbort = (): void => {
      waiters.delete(waiter);
      if (waiters.size === 0) s.waiters.delete(name);
      reject(signal?.reason);
    };

    const waiter: Waiter = {
      resolve: (detail) => {
        signal?.removeEventListener('abort', onAbort);
        resolve(detail);
      },
      reject,
    };

    waiters.add(waiter);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Listen for a lifecycle event from any micro app on the page.
 * With the default `document` target you also receive events for containers
 * that a host framework already removed from the DOM.
 * Returns a function that removes the listener.
 */
export function onLifecycle(
  type: LifecycleType,
  handler: (detail: LifecycleDetail) => void,
  target: EventTarget = document
): () => void {
  const listener = (event: Event): void =>
    handler((event as LifecycleEvent).detail);
  target.addEventListener(`tuvix:${type}`, listener);
  return () => target.removeEventListener(`tuvix:${type}`, listener);
}

/**
 * True when the element holds server-rendered markup worth hydrating.
 * Whitespace-only text and comments do not count.
 */
export function hasServerMarkup(container: Element): boolean {
  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === 1) return true;
    if (node.nodeType === 3 && node.textContent?.trim()) return true;
  }
  return false;
}
