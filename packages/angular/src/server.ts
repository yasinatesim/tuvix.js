import type { AngularSsrOptions } from './index';

// ─── renderAngularToString ──────────────────────────

/**
 * Server-side render a standalone Angular component to an HTML string.
 *
 * Import from `@tuvix.js/angular/server` to keep this out of the browser bundle.
 * Only runs on the server (returns `''` in browser environments).
 * Requires `@angular/platform-server` to be installed.
 *
 * @param component - Standalone Angular component decorated with `@Component`
 * @param options   - Optional SSR configuration
 * @returns The rendered inner HTML of the `<body>` element
 *
 * @example
 * ```ts
 * // In a TanStack Start route loader:
 * import { renderAngularToString } from '@tuvix.js/angular/server';
 * import { AboutComponent } from '~/micro-apps/about/about.component';
 *
 * export const Route = createFileRoute('/hakkimda')(({
 *   loader: async () => ({
 *     ssrHtml: await renderAngularToString(AboutComponent),
 *   }),
 * });
 * ```
 */
export async function renderAngularToString(
  component: unknown,
  options?: AngularSsrOptions
): Promise<string> {
  if (typeof window !== 'undefined') return '';

  const { renderApplication } = await import('@angular/platform-server');
  const { bootstrapApplication } = await import('@angular/platform-browser');
  const { provideServerRendering } = await import('@angular/platform-server');

  const selector = options?.selector ?? 'app-root';
  const document =
    options?.document ??
    `<!DOCTYPE html><html><head></head><body><${selector}></${selector}></body></html>`;

  const providers = [provideServerRendering(), ...(options?.providers ?? [])];

  const html = await renderApplication(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => bootstrapApplication(component as any, { providers }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { document } as any
  );

  // Extract just the body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? (bodyMatch[1] ?? html) : html;
}
