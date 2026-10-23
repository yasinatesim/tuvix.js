import { onLifecycle } from '@tuvix.js/loader';
import type { LifecycleDetail, LifecycleType } from '@tuvix.js/loader';

export interface LifecycleRecorder {
  events: Array<{ type: LifecycleType } & LifecycleDetail>;
  stop: () => void;
}

/** Collects every `tuvix:<type>` event dispatched on the document. */
export function recordLifecycle(): LifecycleRecorder {
  const events: Array<{ type: LifecycleType } & LifecycleDetail> = [];
  const stops = (['mounted', 'unmounted', 'error'] as const).map((type) =>
    onLifecycle(type, (detail) => events.push({ type, ...detail }))
  );
  return { events, stop: () => stops.forEach((stop) => stop()) };
}

/** Puts server HTML into a fresh element attached to the document. */
export function attachHtml(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

/** Lets React's scheduler and pending promises run. */
export function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
