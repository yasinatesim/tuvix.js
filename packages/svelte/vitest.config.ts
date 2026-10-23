import { defineConfig, mergeConfig } from 'vitest/config';
import rootConfig from '../../vitest.config';

// Svelte 5 publishes a client and a server runtime under the same specifier.
// The `browser` condition selects the client runtime so `mount`/`hydrate`
// work under jsdom; svelte is inlined so Vite applies that condition.
export default mergeConfig(
  rootConfig,
  defineConfig({
    resolve: { conditions: ['browser'] },
    test: {
      server: { deps: { inline: [/svelte/] } },
    },
  })
);
