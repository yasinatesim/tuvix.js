import type { ErrorInfo, ReactNode } from 'react';
import {
  Component,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from 'react';

// ─── Error boundary ─────────────────────────────────

interface BoundaryProps {
  fallback: ReactNode;
  onError: (error: unknown) => void;
  children?: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

/**
 * Catches render errors of one micro app, shows `fallback` and reports the
 * error. Client only: React does not run error boundaries during SSR, so
 * callers pair it with a `<Suspense>` that turns a server error into a
 * client render of that boundary alone.
 */
export class TuvixErrorBoundary extends Component<
  BoundaryProps,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown, _info: ErrorInfo): void {
    this.props.onError(error);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// ─── Commit signal ──────────────────────────────────

// useLayoutEffect warns during SSR on React 18; it never runs there anyway.
const useClientLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Renders nothing. Placed after the app inside the same `<Suspense>`, its
 * passive effect fires once the app's first render (or hydration) has
 * committed, so `mounted` is never reported before the DOM exists, and
 * parent refs are attached by then.
 *
 * `onUnmount` runs from a layout cleanup, which React calls before it
 * detaches deleted DOM, so events dispatched there still bubble to
 * `document`. When a shown `<Suspense>` boundary suspends again, React runs
 * that cleanup and, once the content is back, the layout effect again; the
 * app then reports `unmounted` and `mounted` once more.
 */
export function CommitSignal({
  onCommit,
  onUnmount,
}: {
  onCommit: () => void;
  onUnmount?: () => void;
}): null {
  const handlers = useRef({ onCommit, onUnmount });
  handlers.current = { onCommit, onUnmount };
  const committed = useRef(false);

  useEffect(() => {
    committed.current = true;
    handlers.current.onCommit();
  }, []);

  useClientLayoutEffect(() => {
    // Skipped on the first commit (the passive effect reports it); runs when
    // Suspense shows the content again.
    if (committed.current) handlers.current.onCommit();
    return () => handlers.current.onUnmount?.();
  }, []);

  return null;
}

// ─── Hydration detection ────────────────────────────

const subscribeNothing = (): (() => void) => () => {};
const onClient = (): boolean => false;
const onServerOrHydration = (): boolean => true;

/**
 * True during server rendering and during the hydration render on the
 * client, false for a plain client render. React picks the server snapshot
 * exactly in those two cases.
 */
export function useIsHydrating(): boolean {
  return useSyncExternalStore(subscribeNothing, onClient, onServerOrHydration);
}

// ─── Utilities ──────────────────────────────────────

/** Shallow equality on own enumerable keys, `Object.is` per value. */
export function shallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (a === b) return true;
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) && Object.is(a[key], b[key])
  );
}
