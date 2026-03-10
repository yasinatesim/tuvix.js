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
 * export default createAngularMicroApp({
 *   name: 'admin',
 *   module: AppModule,
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
      const appRoot = document.createElement('app-root');
      container.appendChild(appRoot);

      // Dynamic import to avoid requiring Angular at definition time
      const { platformBrowserDynamic } = await import(
        '@angular/platform-browser-dynamic'
      );

      platformRef = platformBrowserDynamic();
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
