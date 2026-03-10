import { mount, unmount } from 'svelte';
import { defineMicroApp } from '@tuvix.js/svelte';
import { createEventBus } from 'tuvix.js';
import ProfileApp from './ProfileApp.svelte';

// Module-level bus so it can be shared across apps loaded in the same context
const bus = createEventBus();

type SvelteInstance = ReturnType<typeof mount>;
let instance: SvelteInstance | null = null;
let mountTarget: Element | null = null;

export default defineMicroApp({
  name: 'profile',

  bootstrap() {
    console.log('[profile] bootstrapped');
  },

  mount({ container, props }) {
    mountTarget = container;
    instance = mount(ProfileApp, {
      target: container,
      props: { bus, user: props?.user ?? 'Guest' },
    });
  },

  unmount() {
    if (instance) {
      unmount(instance);
      instance = null;
    }
    mountTarget = null;
  },

  update({ props }) {
    if (instance && mountTarget) {
      unmount(instance);
      instance = mount(ProfileApp, {
        target: mountTarget,
        props: { bus, user: props?.user ?? 'Guest' },
      });
    }
  },
});
