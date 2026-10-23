import type { JSX, ReactElement, ReactNode } from 'react';
import {
  Fragment,
  createElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { MicroAppModule } from '@tuvix.js/loader';
import { shallowEqual, useIsHydrating } from './internal';

export interface TuvixIslandProps {
  /** Micro app name, written to `data-tuvix-app` and passed to `mount`. */
  name: string;
  /**
   * The module to mount: anything `createVueMicroApp`, `createSvelteMicroApp`,
   * `createAngularMicroApp`, `createReactMicroApp` returns, or a hand-written
   * `{ mount, unmount, update? }` object.
   */
  app: MicroAppModule;
  /**
   * Props for the module. Compared shallowly on every render; a change calls
   * `app.update({ props, container })`, or unmounts and mounts again when the
   * module has no `update`.
   */
  props?: Record<string, unknown>;
  /**
   * Server-rendered HTML of the island, from `renderVueToString`,
   * `renderSvelteToString`, `renderAngularToString` or similar. Pass it on the
   * server. During hydration the island reads its HTML back from the page,
   * so you do not need to send the string to the client a second time.
   */
  ssrHtml?: string;
  /** Rendered instead of the island when `mount` or `update` rejects. */
  fallback?: ReactNode;
  /** Wrapper element tag. @default 'div' */
  as?: keyof JSX.IntrinsicElements;
  /** Class name for the wrapper element. */
  className?: string;
}

const NO_PROPS: Record<string, unknown> = {};
const EMPTY_HTML = { __html: '' };

interface Session {
  container: HTMLElement;
  /** Props the module last received. */
  sent: Record<string, unknown>;
  /** Props to send next. */
  props: Record<string, unknown>;
  active: boolean;
  mounted: boolean;
}

/** Inner HTML of this island's server-rendered element, if the page has it. */
function readServerHtml(islandId: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  for (const el of Array.from(
    document.querySelectorAll('[data-tuvix-island]')
  )) {
    if (el.getAttribute('data-tuvix-island') === islandId) return el.innerHTML;
  }
  return undefined;
}

/**
 * Host any Tuvix micro app (Vue, Svelte, Angular, React or vanilla) inside a
 * React tree, with SSR hydration.
 *
 * On the server it renders `<div data-tuvix-app={name}>` with `ssrHtml` as
 * its inner HTML. On the client it hydrates that element without touching
 * its children, then calls `app.mount({ container, props, name })`; an
 * adapter created with `ssr: true` adopts the server DOM there.
 *
 * - React never rewrites the island's inner HTML after the first render, so
 *   parent re-renders keep the DOM and listeners the module attached.
 * - Shallow prop changes call `app.update`; a new `name` or `app` unmounts
 *   the old module and mounts the new one; leaving the tree calls
 *   `app.unmount`. Calls run one after another, so an unmount that arrives
 *   during `mount` waits for it.
 * - If `mount` or `update` rejects, the island renders `fallback`. Adapters
 *   dispatch `tuvix:error` themselves; the island adds no event. When `app`
 *   or `name` changes after that, the new module mounts into an empty
 *   element; it never adopts the failed app's server HTML.
 * - When React removes the island, the module reports `tuvix:unmounted`
 *   after the element is detached. `emitLifecycle` dispatches it on
 *   `document` with `detail.container` set, so `document` listeners and
 *   `onLifecycle` receive it; listeners on the element or its ancestors
 *   do not.
 *
 * It does not load modules by URL; import the module or use the orchestrator.
 * A client-only render (no hydration) uses `ssrHtml` when given, else starts
 * empty.
 *
 * @example
 * ```tsx
 * import { TuvixIsland } from '@tuvix.js/react';
 * import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
 * import Footer from './Footer.svelte';
 *
 * const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
 *
 * // `footerHtml` comes from `renderSvelteToString` in a server function.
 * export function Layout({ footerHtml }: { footerHtml?: string }) {
 *   return (
 *     <TuvixIsland
 *       name="footer"
 *       app={footer}
 *       props={{ year: 2026 }}
 *       ssrHtml={footerHtml}
 *       fallback={<footer>© 2026</footer>}
 *     />
 *   );
 * }
 * ```
 */
export function TuvixIsland({
  name,
  app,
  props = NO_PROPS,
  ssrHtml,
  fallback = null,
  as = 'div',
  className,
}: TuvixIslandProps): ReactElement {
  const islandId = useId();
  const hydrating = useIsHydrating();
  // Created once. A new `{ __html }` object on a later render would make
  // React assign innerHTML again and destroy the module's DOM. It changes
  // only after a failure, while the element is out of the tree.
  const [innerHtml, setInnerHtml] = useState(() => ({
    __html: (hydrating ? readServerHtml(islandId) : undefined) ?? ssrHtml ?? '',
  }));

  const containerRef = useRef<HTMLElement>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const sessionRef = useRef<Session | null>(null);
  const propsRef = useRef(props);
  const [failure, setFailure] = useState<{
    app: MicroAppModule;
    name: string;
  } | null>(null);
  const failed =
    failure !== null && failure.app === app && failure.name === name;

  // Shows `fallback` and drops the server HTML: the element React creates
  // when `app` or `name` changes must start empty, or the next module would
  // adopt the failed app's markup.
  const fail = (): void => {
    setFailure({ app, name });
    setInnerHtml(EMPTY_HTML);
  };

  // Runs `task` after every earlier mount/update/unmount has settled.
  const enqueue = (task: () => Promise<void>): Promise<void> => {
    const run = queueRef.current.then(task);
    queueRef.current = run.catch(() => undefined);
    return run;
  };

  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (failed || !container) return;

    const session: Session = {
      container,
      sent: propsRef.current,
      props: propsRef.current,
      active: true,
      mounted: false,
    };
    sessionRef.current = session;

    enqueue(async () => {
      if (!session.active) return;
      session.sent = session.props;
      await app.mount({ container, props: session.sent, name });
      session.mounted = true;
    }).catch(() => {
      if (session.active) fail();
    });

    return () => {
      session.active = false;
      if (sessionRef.current === session) sessionRef.current = null;
      enqueue(async () => {
        if (!session.mounted) return;
        session.mounted = false;
        await app.unmount({ container });
        // Hand-written modules may leave DOM behind; the next mount must
        // not mistake it for server markup.
        container.replaceChildren();
      }).catch(() => undefined);
    };
  }, [app, name, failed]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session || shallowEqual(session.props, props)) return;
    session.props = props;

    enqueue(async () => {
      if (!session.active || !session.mounted) return;
      if (shallowEqual(session.sent, session.props)) return;
      const next = session.props;
      session.sent = next;
      if (app.update) {
        await app.update({ props: next, container: session.container });
        return;
      }
      session.mounted = false;
      await app.unmount({ container: session.container });
      session.container.replaceChildren();
      await app.mount({ container: session.container, props: next, name });
      session.mounted = true;
    }).catch(() => {
      if (session.active) fail();
    });
  });

  if (failed) return createElement(Fragment, null, fallback);
  return createElement(as, {
    ref: containerRef,
    className,
    'data-tuvix-app': name,
    'data-tuvix-island': islandId,
    dangerouslySetInnerHTML: innerHtml,
  });
}
