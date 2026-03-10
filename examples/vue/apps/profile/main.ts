import { createApp, defineComponent, h, ref, onMounted, onUnmounted } from 'vue';
import { defineMicroApp } from '@tuvix.js/vue';
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

const ProfileApp = defineComponent({
  name: 'ProfileApp',
  props: {
    user: { type: String, default: 'Guest' },
  },
  setup(props) {
    const loggedIn = ref(false);
    let off: (() => void) | undefined;

    onMounted(() => {
      off = bus.on('user:login', (data) => {
        loggedIn.value = true;
        console.log(`[profile] ${data.name} logged in`);
      });
    });

    onUnmounted(() => off?.());

    return () =>
      h('div', [
        h('h1', 'Profile'),
        h('p', `Hello, ${props.user}!`),
        loggedIn.value ? h('p', 'You are logged in.') : null,
        h('button', { onClick: () => bus.emit('user:login', { name: props.user }) }, 'Simulate Login'),
      ]);
  },
});

let app: ReturnType<typeof createApp> | null = null;

export default defineMicroApp({
  name: 'profile',

  bootstrap() {
    console.log('[profile] bootstrapped');
  },

  mount({ container, props }) {
    app = createApp(ProfileApp, { user: props?.user });
    app.mount(container);
  },

  unmount() {
    app?.unmount();
    app = null;
  },
});
