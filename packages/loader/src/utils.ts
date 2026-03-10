import type { Entry, EntryConfig } from './types';

/**
 * Normalize entry to EntryConfig format
 */
export function normalizeEntry(entry: Entry): EntryConfig {
  if (typeof entry === 'string') {
    return { scripts: [entry] };
  }
  return entry;
}

/**
 * Create a deferred promise
 */
export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Wait for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  if (timeoutMs <= 0) {
    return fn();
  }

  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeoutMs)
    ),
  ]);
}

/**
 * Retry an async function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  retryDelay: number
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(retryDelay);
      }
    }
  }

  throw lastError;
}
