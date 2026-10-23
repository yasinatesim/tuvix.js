import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

/**
 * An island that always fails, to show that one broken island degrades on
 * its own. `TuvixIsland` renders its `fallback` when `mount` rejects; the
 * rest of the page keeps working.
 *
 * Adapter-made modules emit `tuvix:error` themselves. A hand-written module
 * has to do it, so the page runtime can react to the failure.
 */
export const ticker: MicroAppModule = {
  async mount({ container, name }) {
    const error = new Error('Ticker feed unavailable');
    emitLifecycle('error', {
      name: name ?? 'ticker',
      container,
      hydrated: false,
      error,
    });
    throw error;
  },
  async unmount() {},
};
