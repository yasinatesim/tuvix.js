import type { MicroAppModule, MountContext, UnmountContext, UpdateContext } from '@tuvix.js/loader';

// ─── Types ──────────────────────────────────────────

export interface AngularMicroAppConfig {
  /** Unique name for the micro app */
  name: string;

  /**
   * Angular NgModule class to bootstrap.
   * Must be decorated with @NgModule.
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

// ─── createAngularMicroApp ──────────────────────────

/**
 * Create a Tuvix.js micro app module from an Angular NgModule.
 *
 * Handles `platformBrowserDynamic().bootstrapModule()` and `appRef.destroy()`
 * lifecycle automatically.
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
