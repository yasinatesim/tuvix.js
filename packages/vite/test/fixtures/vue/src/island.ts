import { createSSRApp } from 'vue';
import App from './App.vue';

export function createIsland() {
  return createSSRApp(App);
}

// Stands in for an adapter's registerModule() call.
(globalThis as Record<string, unknown>).__fixtureVueIsland = createIsland;
