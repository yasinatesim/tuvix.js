import type { MicroAppModule, MountContext, UnmountContext, UpdateContext } from '@tuvix.js/loader';

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

// ─── createSsrAngularMicroApp ───────────────────────

/**
 * Create a Tuvix.js micro app module from a standalone Angular component (Angular 17+).
 *
 * Supports SSR via `@angular/platform-server` and client hydration via
 * `provideClientHydration`. Intended for use alongside `renderAngularToString`
 * and a `data-tuvix-app` container div with the SSR HTML injected.
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
