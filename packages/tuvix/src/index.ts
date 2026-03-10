/**
 * Tuvix.js - A lightweight microfrontend framework
 *
 * This is the umbrella package that re-exports all core functionality.
 * For smaller bundle size, install individual packages instead:
 *   - @tuvix.js/core
 *   - @tuvix.js/router
 *   - @tuvix.js/event-bus
 *   - @tuvix.js/loader
 *
 * @example
 * ```ts
 * import { createOrchestrator, defineMicroApp, createEventBus } from 'tuvix.js';
 * ```
 *
 * @packageDocumentation
 */

// ─── Core (Orchestrator + Lifecycle) ─────────────
export {
  Orchestrator,
  createOrchestrator,
  defineMicroApp,
  OrchestratorEvent,
} from '@tuvix.js/core';

export type {
  AppStatus,
  MicroAppConfig,
  RegisteredApp,
  OrchestratorConfig,
  MicroAppDefinition,
} from '@tuvix.js/core';

// ─── Event Bus ───────────────────────────────────
export {
  EventBus,
  createEventBus,
  getGlobalBus,
  resetGlobalBus,
} from '@tuvix.js/event-bus';

export type {
  IEventBus,
  EventHandler,
  WildcardHandler,
  Unsubscribe,
  EventBusOptions,
} from '@tuvix.js/event-bus';

// ─── Router ──────────────────────────────────────
export {
  Router,
  createRouter,
  matchRoute,
  normalizePath,
} from '@tuvix.js/router';

export type {
  IRouter,
  RouterConfig,
  RouterMode,
  RouteConfig,
  MatchedRoute,
  NavigationEvent,
  NavigationGuard,
  RouteChangeHandler,
} from '@tuvix.js/router';

// ─── Loader ──────────────────────────────────────
export { ModuleLoader, createLoader } from '@tuvix.js/loader';

export type {
  Entry,
  EntryConfig,
  MicroAppModule,
  MountContext,
  UnmountContext,
  UpdateContext,
  LoaderOptions,
  LoadResult,
  LoadStatus,
  PrefetchStrategy,
} from '@tuvix.js/loader';

// ─── Sandbox ─────────────────────────────────────
export {
  Sandbox,
  CssSandbox,
  JsSandbox,
  createSandbox,
} from '@tuvix.js/sandbox';

export type {
  SandboxOptions,
  ISandbox,
  ICssSandbox,
  IJsSandbox,
} from '@tuvix.js/sandbox';
