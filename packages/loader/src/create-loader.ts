import { ModuleLoader } from './module-loader';
import type { LoaderOptions } from './types';

/**
 * Create a new ModuleLoader instance.
 *
 * @example
 * ```ts
 * import { createLoader } from '@tuvix.js/loader';
 *
 * const loader = createLoader({
 *   timeout: 15000,
 *   retries: 3,
 * });
 * ```
 */
export function createLoader(options?: LoaderOptions): ModuleLoader {
  return new ModuleLoader(options);
}
