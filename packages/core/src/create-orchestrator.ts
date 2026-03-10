import { Orchestrator } from './orchestrator';
import type { OrchestratorConfig } from './types';

/**
 * Create a new Orchestrator instance.
 *
 * @example
 * ```ts
 * import { createOrchestrator } from '@tuvix.js/core';
 *
 * const orchestrator = createOrchestrator({
 *   router: {
 *     mode: 'history',
 *     routes: [
 *       { path: '/dashboard/*', app: 'dashboard' },
 *       { path: '/settings/*', app: 'settings' },
 *     ],
 *   },
 * });
 *
 * orchestrator.register({
 *   name: 'dashboard',
 *   entry: 'https://cdn.example.com/dashboard/main.js',
 *   container: '#main',
 *   activeWhen: '/dashboard/*',
 * });
 *
 * orchestrator.start();
 * ```
 */
export function createOrchestrator(
  config?: OrchestratorConfig
): Orchestrator {
  return new Orchestrator(config);
}
