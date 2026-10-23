import type { EntryConfig } from './types';

/**
 * Turn a URL entry into an {@link EntryConfig}. Configs pass through unchanged.
 * Loader-function entries have no URLs; check `typeof entry === 'function'` first.
 *
 * @example
 * ```ts
 * import { normalizeEntry } from '@tuvix.js/loader';
 *
 * normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
 * ```
 */
export function normalizeEntry(entry: string | EntryConfig): EntryConfig {
  if (typeof entry === 'string') {
    return { scripts: [entry] };
  }
  return entry;
}

/**
 * Wait for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run `fn` with a time limit. On timeout the returned promise rejects with
 * `message` and the signal passed to `fn` aborts with the same error, so `fn`
 * can stop its work.
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  const controller = new AbortController();
  if (timeoutMs <= 0) {
    return fn(controller.signal);
  }

  let timeoutId!: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(message);
      reject(error);
      controller.abort(error);
    }, timeoutMs);
  });

  return Promise.race([fn(controller.signal), timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Retry an async function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  retryDelay: number
): Promise<T> {
  // Ensure at least one attempt even if retries is 0 or negative
  const maxAttempts = Math.max(1, retries + 1);
  let lastError: unknown = new Error(
    '[Tuvix Loader] withRetry: all attempts failed'
  );

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await delay(retryDelay);
      }
    }
  }

  throw lastError;
}
