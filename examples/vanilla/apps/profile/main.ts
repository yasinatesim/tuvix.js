import { defineMicroApp, createEventBus } from 'tuvix.js';

// Module-level bus so it can be shared across apps loaded in the same context
const bus = createEventBus();
let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'profile',

  bootstrap() {
    console.log('[profile] bootstrapped');
  },

  mount({ container, props }) {
    const user = props?.user ?? 'Guest';

    container.innerHTML = `
      <div>
        <h1>Profile</h1>
        <p>Hello, ${user}!</p>
        <p class="login-status" style="display:none">You are logged in.</p>
        <button id="login-btn">Simulate Login</button>
      </div>
    `;

    const btn = container.querySelector<HTMLButtonElement>('#login-btn')!;
    const status = container.querySelector<HTMLParagraphElement>('.login-status')!;

    btn.addEventListener('click', () => {
      bus.emit('user:login', { name: user });
    });

    off = bus.on('user:login', () => {
      status.style.display = 'block';
    });
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.innerHTML = '';
  },
});
