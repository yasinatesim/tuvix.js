import { createContext, useContext } from 'react';

/**
 * Server-rendered island HTML, keyed by island name. The server fills it from
 * `src/server/render-islands.ts`; the client passes `{}` because
 * `TuvixIsland` reads its HTML back from the page during hydration.
 */
export const IslandHtmlContext = createContext<Record<string, string>>({});

export function useIslandHtml(name: string): string | undefined {
  return useContext(IslandHtmlContext)[name];
}
