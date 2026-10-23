/**
 * jsdom never fetches `<script>`/`<link>` resources. This fakes a server:
 * on the next tick after a script or stylesheet tag joins <head>, its route
 * runs (the script "executes") and the tag gets `load` or `error` in the same
 * callback, the way a browser runs a script and fires its load event in one task.
 */
export type RouteResult = void | 'error' | 'hang';
export type Route = (element: HTMLElement) => RouteResult;

export interface FakeResources {
  /** URLs in the order their tags were appended */
  requests: string[];
  /**
   * Finish a request whose route returned 'hang'. A function runs as the
   * script body right before `load` fires.
   */
  release(url: string, outcome?: 'load' | 'error' | (() => void)): void;
  stop(): void;
}

export function fakeResources(
  routes: Record<string, Route> = {}
): FakeResources {
  const requests: string[] = [];
  const hanging = new Map<string, HTMLElement>();

  const fire = (element: HTMLElement, type: 'load' | 'error'): void => {
    if (element.isConnected) element.dispatchEvent(new Event(type));
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        let url: string | null = null;
        if (node instanceof HTMLScriptElement) url = node.getAttribute('src');
        if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
          url = node.getAttribute('href');
        }
        if (!url) continue;
        const resourceUrl = url;
        requests.push(resourceUrl);
        const element = node as HTMLElement;
        setTimeout(() => {
          if (!element.isConnected) return;
          const result = routes[resourceUrl]?.(element);
          if (result === 'hang') hanging.set(resourceUrl, element);
          else fire(element, result === 'error' ? 'error' : 'load');
        }, 0);
      }
    }
  });
  observer.observe(document.head, { childList: true });

  return {
    requests,
    release(url, outcome = 'load') {
      const element = hanging.get(url);
      if (!element) throw new Error(`No hanging request for ${url}`);
      hanging.delete(url);
      if (typeof outcome === 'function') {
        outcome();
        fire(element, 'load');
      } else {
        fire(element, outcome);
      }
    },
    stop() {
      observer.disconnect();
    },
  };
}

/**
 * Resolve once tags appended before the call have run their routes.
 * The observer schedules routes from a microtask, so this waits two timer turns.
 */
export async function tick(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}
