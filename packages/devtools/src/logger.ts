import type { IEventBus, Unsubscribe } from '@tuvix.js/event-bus';

// ─── Types ──────────────────────────────────────────

interface EventLogEntry {
  timestamp: number;
  event: string;
  data: unknown;
}

/**
 * Collects event history and performance metrics from the Tuvix.js event bus.
 */
export class EventLogger {
  private log: EventLogEntry[];
  private maxEntries: number;
  private unsubscribe: Unsubscribe | null;

  constructor(maxEntries = 200) {
    this.log = [];
    this.maxEntries = maxEntries;
    this.unsubscribe = null;
  }

  /**
   * Start recording all events from the bus.
   */
  attach(bus: IEventBus): void {
    this.unsubscribe = bus.onAny((event: string, data: unknown) => {
      this.log.push({
        timestamp: Date.now(),
        event,
        data,
      });

      // Trim old entries
      if (this.log.length > this.maxEntries) {
        this.log = this.log.slice(-this.maxEntries);
      }
    });
  }

  /**
   * Stop recording events.
   */
  detach(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /**
   * Get all recorded events.
   */
  getEntries(): ReadonlyArray<EventLogEntry> {
    return this.log;
  }

  /**
   * Get the most recent N events.
   */
  getRecent(count = 20): ReadonlyArray<EventLogEntry> {
    return this.log.slice(-count);
  }

  /**
   * Clear all recorded events.
   */
  clear(): void {
    this.log = [];
  }
}
