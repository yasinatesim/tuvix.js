// Server only. entry-server.tsx imports this file; no client module does, so
// the server renderers never reach the browser bundle.
import { renderAngularToString } from '@tuvix.js/angular/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { render } from 'svelte/server';
import {
  aboutVueCard,
  homeSvelteCounter,
  homeVueCard,
  labContact,
  labSvelteCounter,
} from '../content';
import { ContactComponent } from '../islands/angular-contact/contact.component';
import Counter from '../islands/svelte-counter/Counter.svelte';
import VueCard from '../islands/vue-card/VueCard.vue';
import type { Route } from '../routes';

type IslandHtml = Record<string, string>;

const renderers: Record<Route['id'], () => Promise<IslandHtml>> = {
  home: async () => ({
    // `hostRenders` starts at 0 in the browser too, so hydration matches.
    'vue-card': await renderVueToString(VueCard, {
      ...homeVueCard,
      hostRenders: 0,
    }),
    // Passing `render` makes the adapter use this bundle's Svelte copy.
    'svelte-counter': await renderSvelteToString(Counter, homeSvelteCounter, {
      render,
    }),
    // The ticker has no server renderer. This placeholder shows until its
    // mount fails in the browser and the island swaps in its fallback.
    ticker: '<p>Loading live prices…</p>',
  }),
  lab: async () => ({
    // Same props as the client island, so both sides render the same heading.
    'angular-contact': await renderAngularToString(ContactComponent, {
      appId: 'contact',
      props: labContact,
    }),
    'svelte-counter': await renderSvelteToString(Counter, labSvelteCounter, {
      render,
    }),
  }),
  about: async () => ({
    'vue-card': await renderVueToString(VueCard, {
      ...aboutVueCard,
      hostRenders: 0,
    }),
  }),
  'not-found': async () => ({}),
};

/** HTML for every island on the page, keyed by island name. */
export function renderIslands(route: Route): Promise<IslandHtml> {
  return renderers[route.id]();
}
