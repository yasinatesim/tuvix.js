// ─── Core ────────────────────────────────────────
export { Orchestrator } from './orchestrator';
export { createOrchestrator } from './create-orchestrator';
export { defineMicroApp } from './micro-app';

// ─── Types ───────────────────────────────────────
export type {
  AppStatus,
  AppErrorEvent,
  AppErrorPhase,
  AppSandboxOption,
  MicroAppConfig,
  RegisteredApp,
  RouterSource,
  OrchestratorConfig,
} from './types';
export { OrchestratorEvent } from './types';

export type { MicroAppDefinition } from './micro-app';

// ─── Re-exports from sub-packages ────────────────
export { createEventBus, getGlobalBus } from '@tuvix.js/event-bus';
export type { IEventBus, EventHandler, Unsubscribe } from '@tuvix.js/event-bus';

export { createRouter, matchPath, interceptLinks } from '@tuvix.js/router';
export type {
  RouterConfig,
  IRouter,
  RouteConfig,
  PathMatch,
  InterceptLinksOptions,
} from '@tuvix.js/router';

export { createLoader } from '@tuvix.js/loader';
export type { Entry, MicroAppModule } from '@tuvix.js/loader';
