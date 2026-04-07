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

  let timeoutId!: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([fn(), timeoutPromise]).finally(() => {
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
