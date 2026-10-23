import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

/** Hydrates the HTML that `renderSvelteToString(Counter, props)` produced on the server. */
export const svelteCounter = createSsrSvelteMicroApp({
  name: 'svelte-counter',
  App: Counter,
});

export { Counter };
