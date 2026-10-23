import './base.css';

const registry: Record<string, unknown> =
  ((globalThis as Record<string, unknown>).__fixtureIslands as Record<
    string,
    unknown
  >) ?? {};
(globalThis as Record<string, unknown>).__fixtureIslands = registry;

export const baseClass = 'tuvix-base';

/** Registers an island the way an adapter's registerModule would. */
export function registerIsland(name: string, module: unknown): void {
  registry[name] = module;
}
