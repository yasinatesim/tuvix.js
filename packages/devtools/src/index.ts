import type { IEventBus } from '@tuvix.js/event-bus';
import { EventLogger } from './logger';
import { DevToolsPanel } from './panel';

// ─── Types ──────────────────────────────────────────

export interface DevToolsOptions {
  /** Maximum event log entries (default: 200) */
  maxLogEntries?: number;

  /** Auto-open panel on install (default: true) */
  autoOpen?: boolean;

  /** Update interval in ms (default: 1000) */
  updateInterval?: number;
}

interface OrchestratorLike {
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): { currentPath: string } | null;
}

// ─── installDevTools ────────────────────────────────

/**
 * Install the Tuvix.js DevTools panel.
 *
 * Attaches to an orchestrator instance and shows a real-time
 * debug overlay with app statuses, current route, and event log.
 *
 * @example
 * ```ts
 * import { installDevTools } from '@tuvix.js/devtools';
 *
 * const orchestrator = createOrchestrator({ ... });
 * installDevTools(orchestrator);
 * ```
 */
export function installDevTools(
  orchestrator: OrchestratorLike,
  options: DevToolsOptions = {}
): () => void {
  const { maxLogEntries = 200, updateInterval = 1000, autoOpen = true } = options;

  const panel = new DevToolsPanel();
  const logger = new EventLogger(maxLogEntries);

  // Attach event logger
  const bus = orchestrator.getEventBus();
  logger.attach(bus);

  // Mount the panel (auto-open based on option)
  panel.mount();
  if (!autoOpen) {
    panel.toggle();
  }

  // Periodic update loop
  const intervalId = setInterval(() => {
    const router = orchestrator.getRouter();
    const events = logger.getRecent(20);

    panel.update({
      registeredApps: orchestrator.getRegisteredApps(),
      mountedApps: orchestrator.getMountedApps(),
      currentRoute: router?.currentPath ?? '/',
      events: events.map((e) => ({
        timestamp: e.timestamp,
        event: e.event,
      })),
    });
  }, updateInterval);

  // Expose globally for external tools
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__TUVIX_DEVTOOLS__ = {
      panel,
      logger,
      orchestrator,
    };
  }

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    logger.detach();
    panel.unmount();

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__TUVIX_DEVTOOLS__;
    }
  };
}

// ─── Re-exports ─────────────────────────────────────

export { EventLogger } from './logger';
export { DevToolsPanel } from './panel';
