import { mount, unmount } from 'svelte';
import { defineMicroApp } from '@tuvix.js/svelte';
import HomeApp from './HomeApp.svelte';

type SvelteInstance = ReturnType<typeof mount>;
let instance: SvelteInstance | null = null;

export default defineMicroApp({
  name: 'home',

  bootstrap() {
    console.log('[home] bootstrapped');
  },

  mount({ container }) {
    instance = mount(HomeApp, { target: container });
  },

  unmount() {
    if (instance) {
      unmount(instance);
      instance = null;
    }
  },
});
