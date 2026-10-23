import type * as AngularCoreModule from '@angular/core';
import type {
  ApplicationRef,
  ComponentRef,
  EnvironmentProviders,
  Provider,
  Type,
} from '@angular/core';

/**
 * Providers accepted by `createApplication` and `bootstrapApplication`.
 *
 * @example
 * ```ts
 * import { provideHttpClient } from '@angular/common/http';
 * import type { AngularProviders } from '@tuvix.js/angular';
 *
 * const providers: AngularProviders = [provideHttpClient()];
 * ```
 */
export type AngularProviders = Array<Provider | EnvironmentProviders>;

/** The `@angular/core` module namespace. */
export type AngularCore = typeof AngularCoreModule;

/** True once `@angular/compiler` has published its facade on `globalThis.ng`. */
function hasCompilerFacade(): boolean {
  const ng: unknown = Reflect.get(globalThis, 'ng');
  return (
    typeof ng === 'object' &&
    ng !== null &&
    'ɵcompilerFacade' in ng &&
    Boolean(ng.ɵcompilerFacade)
  );
}

/**
 * AOT output stores the definition as a static data property. A JIT class
 * gets a getter from the decorator that compiles on first access, and that
 * compile needs `@angular/compiler`.
 */
function isAotCompiled(type: unknown, key: 'ɵcmp' | 'ɵmod'): boolean {
  if (typeof type !== 'function') return false;
  const descriptor = Object.getOwnPropertyDescriptor(type, key);
  return descriptor !== undefined && 'value' in descriptor;
}

/**
 * Load `@angular/compiler` before anything imports `@angular/common` or
 * `@angular/platform-browser`. Those packages ship partial declarations that
 * call the JIT compiler facade while their modules evaluate, so the compiler
 * must be in place first.
 *
 * `always` loads it even for AOT components. The server uses this because
 * Node loads the unlinked Angular packages from node_modules.
 */
export async function ensureCompiler(
  types: Array<{ type: unknown; key: 'ɵcmp' | 'ɵmod' }>,
  always = false
): Promise<void> {
  if (hasCompilerFacade()) return;
  if (!always && types.every(({ type, key }) => isAotCompiled(type, key))) {
    return;
  }
  // Dynamic on purpose: a static import would be evaluated in whatever order
  // the bundler picks, and this one must finish before `@angular/common` loads.
  await import('@angular/compiler');
}

/**
 * Change detection providers that keep zone.js out of the page.
 *
 * - Angular 20+: `provideZonelessChangeDetection()`
 * - Angular 18-19: `provideExperimentalZonelessChangeDetection()`
 * - Angular 15-17: `NgZone` replaced by `ɵNoopNgZone`
 *
 * With `zone: true` Angular keeps its default `NgZone`, which requires zone.js
 * to be loaded already. The adapter never imports zone.js itself.
 */
export function changeDetectionProviders(
  core: AngularCore,
  zone: boolean,
  appName: string
): AngularProviders {
  if (zone) {
    if (!('Zone' in globalThis)) {
      throw new Error(
        `[tuvix.js/angular] "${appName}" sets zone: true, but zone.js is not loaded. ` +
          `Import 'zone.js' in your client entry before mounting, or drop zone: true.`
      );
    }
    return [];
  }
  const exports = core as unknown as Record<string, unknown>;
  const zoneless =
    exports['provideZonelessChangeDetection'] ??
    exports['provideExperimentalZonelessChangeDetection'];
  if (typeof zoneless === 'function') {
    return [zoneless() as EnvironmentProviders];
  }
  return [{ provide: core.NgZone, useClass: core.ɵNoopNgZone }];
}

/**
 * Tag name for the component host element: the element part of the first
 * selector (`app-card` for `'app-card, [card]'`). Returns `null` for
 * attribute or class selectors.
 */
export function hostTagName(
  core: AngularCore,
  component: Type<unknown>
): string | null {
  const selector = core.reflectComponentType(component)?.selector ?? '';
  const first = selector.split(',')[0]?.trim() ?? '';
  const match = /^[a-zA-Z][\w-]*/.exec(first);
  return match ? match[0].toLowerCase() : null;
}

/** Props keyed by component input name. */
export type Props = Record<string, unknown>;

/** Public input names (aliases) of a component. */
export function inputNames(
  core: AngularCore,
  component: Type<unknown>
): Set<string> {
  const mirror = core.reflectComponentType(component);
  return new Set(mirror?.inputs.map((input) => input.templateName) ?? []);
}

/**
 * Write props to component inputs. Keys that are not inputs are skipped, so a
 * host can pass extra props without Angular logging NG0303. Inputs present in
 * `previous` but missing from `next` reset to `undefined`.
 */
export function applyInputs(
  ref: ComponentRef<unknown>,
  inputs: ReadonlySet<string>,
  next: Props,
  previous?: Props
): void {
  for (const key of inputs) {
    if (key in next) ref.setInput(key, next[key]);
    else if (previous && key in previous) ref.setInput(key, undefined);
  }
}

/**
 * Bootstrap `component` into `host` (an element or a selector; default: the
 * component selector) with `props` on its inputs. `appRef.bootstrap` runs
 * change detection before it returns; wrapping the factory sets the inputs
 * between creation and that first pass, so `ngOnInit` already sees the props.
 * Angular versions without `ComponentFactoryResolver` get the inputs right
 * after bootstrap instead.
 */
export function bootstrapInto(
  core: AngularCore,
  appRef: ApplicationRef,
  component: Type<unknown>,
  host: string | Element | undefined,
  inputs: ReadonlySet<string>,
  props: Props
): ComponentRef<unknown> {
  const exports = core as unknown as Record<string, unknown>;
  if (typeof exports['ComponentFactoryResolver'] === 'function') {
    const resolver = appRef.injector.get(core.ComponentFactoryResolver);
    const factory = resolver.resolveComponentFactory(component);
    const withInputs = Object.create(factory) as typeof factory;
    withInputs.create = (...args: Parameters<typeof factory.create>) => {
      const ref = factory.create(...args);
      applyInputs(ref, inputs, props);
      return ref;
    };
    return appRef.bootstrap(withInputs, host);
  }
  const ref = appRef.bootstrap(component, host);
  applyInputs(ref, inputs, props);
  appRef.tick();
  return ref;
}
