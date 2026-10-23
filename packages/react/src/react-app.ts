import type { ComponentType, ReactElement, ReactNode } from 'react';
import { Suspense, createElement, useRef, useState } from 'react';
import { emitLifecycle } from '@tuvix.js/loader';
import type { LifecycleDetail } from '@tuvix.js/loader';
import { CommitSignal, TuvixErrorBoundary, useIsHydrating } from './internal';

export type TuvixReactAppProps<P extends object> = {
  /** Micro app name; must match the name passed to `createReactMicroApp`. */
  name: string;
  /** React component to render. */
  App: ComponentType<P>;
  /**
   * Shown while `App` suspends and after it throws. On the server a throw
   * inside `App` renders this fallback for this app only; React then retries
   * the app on the client.
   */
  fallback?: ReactNode;
} & P;

/**
 * Render a React micro app inline, inside the host's React tree.
 *
 * Use it in SSR frameworks (TanStack Start, Next.js, Remix) so the micro
 * app's HTML is server-rendered. The `<div data-tuvix-app={name}>` wrapper
 * tells the orchestrator which container belongs to which app.
 *
 * - `App` sits inside its own `<Suspense>`. A server render error inside it
 *   replaces only this app with `fallback`, not the whole page.
 * - On the client an error boundary catches render errors, shows `fallback`
 *   and dispatches `tuvix:error` on the wrapper.
 * - After the first commit it dispatches `tuvix:mounted` with
 *   `hydrated: true` when the wrapper came from server HTML. It dispatches
 *   `tuvix:unmounted` when it leaves the tree.
 *
 * Every prop other than `name`, `App` and `fallback` goes to `App`.
 * `createSsrReactMicroApp` renders the same tree, so an orchestrator can
 * hydrate this markup with the app's module.
 *
 * To host a Vue, Svelte, Angular or vanilla micro app, use `TuvixIsland`.
 *
 * @example
 * ```tsx
 * import { TuvixReactApp } from '@tuvix.js/react';
 *
 * function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
 *   return <article>{page}</article>;
 * }
 *
 * export function PrivacyRoute() {
 *   return (
 *     <TuvixReactApp
 *       name="legal-app"
 *       App={LegalPage}
 *       page="privacy"
 *       fallback={<p>This section failed to load.</p>}
 *     />
 *   );
 * }
 * ```
 */
export function TuvixReactApp<P extends object>({
  name,
  App,
  fallback = null,
  ...props
}: TuvixReactAppProps<P>): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  // React detaches `containerRef` before unmount effects run, so the
  // `unmounted` event reuses the detail captured at commit.
  const mountedRef = useRef<LifecycleDetail | null>(null);
  const hydrating = useIsHydrating();
  // Captured on the first render only; React re-renders with `false` once
  // hydration finishes.
  const [hydrated] = useState(hydrating);

  return createElement(
    'div',
    { 'data-tuvix-app': name, ref: containerRef },
    createElement(
      TuvixErrorBoundary,
      {
        fallback,
        onError: (error: unknown) => {
          // React calls componentDidCatch before it attaches the wrapper's
          // ref when the first render throws; the ref is set once the
          // commit finishes.
          queueMicrotask(() => {
            const container = containerRef.current;
            if (container) {
              emitLifecycle('error', { name, container, hydrated, error });
            }
          });
        },
      },
      createElement(
        Suspense,
        { fallback },
        createElement(App, props as unknown as P),
        createElement(CommitSignal, {
          onCommit: () => {
            const container = containerRef.current;
            if (!container) return;
            mountedRef.current = { name, container, hydrated };
            emitLifecycle('mounted', mountedRef.current);
          },
          onUnmount: () => {
            const detail = mountedRef.current;
            mountedRef.current = null;
            if (detail) emitLifecycle('unmounted', detail);
          },
        })
      )
    )
  );
}
