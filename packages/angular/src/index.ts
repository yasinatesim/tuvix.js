import type { MicroAppModule, MountContext, UnmountContext, UpdateContext } from '@tuvix.js/loader';
import { createElement, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

// ─── Types ──────────────────────────────────────────

export interface AngularMicroAppConfig {
  /** Unique name for the micro app */
  name: string;

  /**
   * Angular NgModule class to bootstrap.
   * Must be decorated with @NgModule.
   *
   * @legacy Use `createSsrAngularMicroApp` for standalone components with SSR support.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: any;

  /**
   * The `platformBrowserDynamic` function from `@angular/platform-browser-dynamic`.
   * Must be passed by the consumer to ensure the correct Angular version is used.
   *
   * @example
   * ```ts
   * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
   * createAngularMicroApp({ ..., platform: platformBrowserDynamic });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  platform: () => any;

  /**
   * CSS selector of the bootstrap component (default: 'app-root').
   * Must match the selector in the @Component decorator.
   */
  selector?: string;

  /**
   * Optional Angular compiler options.
   */
  compilerOptions?: Record<string, unknown>;

  /** Optional one-time setup */
  bootstrap?: () => void | Promise<void>;
}

export interface AngularSsrOptions {
  /** Additional providers for SSR */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers?: any[];
  /** App ID for hydration matching (default: 'tuvix-app') */
  appId?: string;
  /** The HTML document template. Default: minimal HTML wrapping the selector */
  document?: string;
  /** Component selector (default: 'app-root') */
  selector?: string;
}

export interface AngularSsrMicroAppConfig {
  /** Unique name for the micro app */
  name: string;
  /** Standalone Angular component (Angular 17+) */
  component: unknown;
  /** Angular providers for the app */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers?: any[];
  /** Component selector (default: 'app-root') */
  selector?: string;
  /** Optional one-time setup */
  bootstrap?: () => void | Promise<void>;
}

// ─── createAngularMicroApp (NgModule / legacy) ──────

/**
 * Create a Tuvix.js micro app module from an Angular NgModule.
 *
 * Handles `platformBrowserDynamic().bootstrapModule()` and `appRef.destroy()`
 * lifecycle automatically.
 *
 * @legacy For Angular 17+ standalone components with SSR, use `createSsrAngularMicroApp`.
 *
 * @example
 * ```ts
 * import { createAngularMicroApp } from '@tuvix.js/angular';
 * import { AppModule } from './app.module';
 *
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 *
 * export default createAngularMicroApp({
 *   name: 'admin',
 *   module: AppModule,
 *   platform: platformBrowserDynamic,
 * });
 * ```
 */
export function createAngularMicroApp(config: AngularMicroAppConfig): MicroAppModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let appRef: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let platformRef: any = null;

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container }: MountContext) {
      // Create a root element for Angular to bootstrap into
      const selector = config.selector ?? 'app-root';
      const appRoot = document.createElement(selector);
      container.appendChild(appRoot);

      platformRef = config.platform();
      appRef = await platformRef.bootstrapModule(
        config.module,
        config.compilerOptions
      );
    },

    async unmount({ container }: UnmountContext) {
      if (appRef) {
        appRef.destroy();
        appRef = null;
      }
      if (platformRef) {
        platformRef.destroy();
        platformRef = null;
      }
      container.innerHTML = '';
    },

    async update({ props }: UpdateContext) {
      // Angular doesn't have a direct "update props" mechanism.
      // Emit an event via the event bus instead, or use a shared service.
      if (appRef && typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if (win.__TUVIX_ANGULAR_PROPS__) {
          win.__TUVIX_ANGULAR_PROPS__[config.name] = props;
        }
      }
    },
  };

  // Register in global module registry
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    win.__TUVIX_MODULES__ = win.__TUVIX_MODULES__ ?? {};
    win.__TUVIX_MODULES__[config.name] = module;
  }

  return module;
}

// ─── renderAngularToString ──────────────────────────

/**
 * Server-side render a standalone Angular component to an HTML string.
 *
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
 * import { renderAngularToString } from '@tuvix.js/angular';
 * import { AboutComponent } from '~/micro-apps/about/about.component';
 *
 * export const Route = createFileRoute('/hakkimda')({
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

  const providers = [
    provideServerRendering(),
    ...(options?.providers ?? []),
  ];

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

// ─── createSsrAngularMicroApp ───────────────────────

/**
 * Create a Tuvix.js micro app module from a standalone Angular component (Angular 17+).
 *
 * Supports SSR via `@angular/platform-server` and client hydration via
 * `provideClientHydration`. Intended for use alongside `renderAngularToString`
 * and `TuvixAngularApp`.
 *
 * @example
 * ```ts
 * import { createSsrAngularMicroApp } from '@tuvix.js/angular';
 * import { AboutComponent } from './about.component';
 *
 * export default createSsrAngularMicroApp({
 *   name: 'about-angular-app',
 *   component: AboutComponent,
 * });
 * ```
 */
export function createSsrAngularMicroApp(config: AngularSsrMicroAppConfig): MicroAppModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let appRef: any = null;

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container }: MountContext) {
      const { bootstrapApplication } = await import('@angular/platform-browser');
      const { provideClientHydration } = await import('@angular/platform-browser');

      const selector = config.selector ?? 'app-root';

      // Ensure selector element exists; reuse SSR-rendered node if present
      let appRoot = container.querySelector(selector);
      if (!appRoot) {
        appRoot = document.createElement(selector);
        container.appendChild(appRoot);
      }

      const providers = [
        provideClientHydration(),
        ...(config.providers ?? []),
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      appRef = await bootstrapApplication(config.component as any, { providers });
    },

    async unmount({ container }: UnmountContext) {
      if (appRef) {
        appRef.destroy();
        appRef = null;
      }
      container.innerHTML = '';
    },

    async update({ props }: UpdateContext) {
      if (appRef && typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if (win.__TUVIX_ANGULAR_PROPS__) {
          win.__TUVIX_ANGULAR_PROPS__[config.name] = props;
        }
      }
    },
  };

  // Register in global module registry
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    win.__TUVIX_MODULES__ = win.__TUVIX_MODULES__ ?? {};
    win.__TUVIX_MODULES__[config.name] = module;
  }

  return module;
}

// ─── TuvixAngularApp ────────────────────────────────

/**
 * React wrapper component that mounts a standalone Angular component with
 * client-side hydration. Designed for use in TanStack Start route files
 * alongside `renderAngularToString`.
 *
 * Pass `ssrHtml` from the route loader to enable seamless SSR hydration.
 * The component uses `suppressHydrationWarning` to avoid React/Angular
 * innerHTML mismatch warnings.
 *
 * @example
 * ```tsx
 * // routes/hakkimda.tsx
 * export const Route = createFileRoute('/hakkimda')({
 *   loader: async () => {
 *     const { renderAngularToString } = await import('@tuvix.js/angular');
 *     const { AboutComponent } = await import('~/micro-apps/about-angular/about.component');
 *     return { ssrHtml: await renderAngularToString(AboutComponent) };
 *   },
 *   component: function HakkimdaPage() {
 *     const { ssrHtml } = Route.useLoaderData();
 *     return (
 *       <TuvixAngularApp
 *         name="about-angular-app"
 *         component={AboutComponent}
 *         ssrHtml={ssrHtml}
 *       />
 *     );
 *   },
 * });
 * ```
 */
export function TuvixAngularApp({
  name,
  component,
  ssrHtml = '',
  providers,
  selector = 'app-root',
  ...props
}: {
  name: string;
  component: unknown;
  ssrHtml?: string;
  providers?: unknown[];
  selector?: string;
  [key: string]: unknown;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let appRef: any = null;

    void (async () => {
      const { bootstrapApplication } = await import('@angular/platform-browser');
      const { provideClientHydration } = await import('@angular/platform-browser');

      if (destroyed) return;

      // Reuse SSR-rendered element if present, otherwise create a fresh one
      let appRoot = container.querySelector(selector);
      if (!appRoot) {
        appRoot = document.createElement(selector);
        container.appendChild(appRoot);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      appRef = await bootstrapApplication(component as any, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        providers: [provideClientHydration(), ...((providers ?? []) as any[])],
      });
    })();

    return () => {
      destroyed = true;
      if (appRef) {
        appRef.destroy();
      }
    };
  // Intentionally omit providers/component from deps — stable references expected
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector]);

  return createElement('div', {
    'data-tuvix-app': name,
    ref,
    suppressHydrationWarning: true,
    ...(ssrHtml ? { dangerouslySetInnerHTML: { __html: ssrHtml } } : {}),
    ...props,
  });
}
