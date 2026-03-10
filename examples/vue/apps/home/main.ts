import { createApp, defineComponent, h } from 'vue';
import { defineMicroApp } from '@tuvix.js/vue';

const HomeApp = defineComponent({
  name: 'HomeApp',
  render() {
    return h('div', [
      h('h1', 'Home'),
      h('p', 'Welcome to the Home micro frontend (Vue 3).'),
    ]);
  },
});

let app: ReturnType<typeof createApp> | null = null;

export default defineMicroApp({
  name: 'home',

  bootstrap() {
    console.log('[home] bootstrapped');
  },

  mount({ container }) {
    app = createApp(HomeApp);
    app.mount(container);
  },

  unmount() {
    app?.unmount();
    app = null;
  },
});
