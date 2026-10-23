import type { ApplicationConfig, ApplicationRef, Type } from '@angular/core';
import type { AngularSsrOptions } from './index';
import {
  bootstrapInto,
  changeDetectionProviders,
  ensureCompiler,
  hostTagName,
  inputNames,
  type AngularProviders,
} from './shared';

// ─── renderAngularToString ──────────────────────────

/**
 * Pull the `<style>` tags out of the rendered `<head>` and the inner HTML of
 * `<body>`, and return them as one fragment.
 */
function extractIsland(html: string): string {
  const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? '';
  const styles = head.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  return styles.join('') + body;
}

/**
 * Server-side render a standalone Angular component to an HTML string.
 *
 * Import it from `@tuvix.js/angular/server` and call it from a server
 * function, not an isomorphic loader: in a browser it returns `''`.
 * Requires Angular 16+ with `@angular/platform-server` installed.
 *
 * The returned fragment holds the component's `<style>` tags followed by the
 * host element, so the island has its styles on first paint. Put it in the
 * container that `createSsrAngularMicroApp` mounts into.
 *
 * The render runs without zone.js and never patches the global `Promise`.
 * It does not wait for HTTP requests or timers the component starts: load
 * data before the call and pass it in through `providers`.
 *
 * @param component - Standalone Angular component
 * @param options   - Optional SSR configuration
 * @returns The component styles plus the rendered `<body>` content
 *
 * @example
 * ```ts
 * import { renderAngularToString } from '@tuvix.js/angular/server';
 * import { AboutComponent } from './micro-apps/about/about.component';
 *
 * export async function loadAboutHtml(): Promise<string> {
 *   return renderAngularToString(AboutComponent, { appId: 'about' });
 * }
 * ```
 */
export async function renderAngularToString(
  component: unknown,
  options?: AngularSsrOptions
): Promise<string> {
  if (typeof window !== 'undefined') return '';

  // Node loads the unlinked Angular packages, which need the JIT compiler
  // before `@angular/common` evaluates. The imports below stay dynamic so the
  // compiler loads first.
  await ensureCompiler([{ type: component, key: 'ɵcmp' }], true);
  const core = await import('@angular/core');
  const { bootstrapApplication } = await import('@angular/platform-browser');
  const { renderApplication, provideServerRendering } =
    await import('@angular/platform-server');

  const root = component as Type<unknown>;
  const selector = options?.selector ?? hostTagName(core, root) ?? 'app-root';
  const document =
    options?.document ??
    `<!DOCTYPE html><html><head></head><body><${selector}></${selector}></body></html>`;

  const providers: AngularProviders = [
    provideServerRendering(),
    ...changeDetectionProviders(core, false, 'renderAngularToString'),
    ...(options?.appId
      ? [{ provide: core.APP_ID, useValue: options.appId }]
      : []),
    ...(options?.providers ?? []),
  ];

  // Angular 18.2.21+, 19.2.15+ and 20.3+ (CVE-2025-59052) pass a
  // BootstrapContext to this callback, and server-side bootstrapApplication
  // throws NG0401 without it. Older versions pass nothing and ignore the
  // extra argument. Their typings lack the argument and require a root
  // component, hence the widened signature.
  const bootstrap = bootstrapApplication as (
    rootComponent: Type<unknown> | undefined,
    options: ApplicationConfig,
    context?: unknown
  ) => Promise<ApplicationRef>;
  const inputs = inputNames(core, root);
  const props = options?.props ?? {};
  const html = await renderApplication(
    async (context?: unknown) => {
      // Without a root component Angular only creates the application, like
      // `createApplication`. The component is bootstrapped here instead, so
      // its inputs are set before the first change detection, as on the client.
      const appRef = await bootstrap(undefined, { providers }, context);
      bootstrapInto(core, appRef, root, options?.selector, inputs, props);
      return appRef;
    },
    { document }
  );

  return extractIsland(html);
}
