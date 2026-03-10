import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  bootstrap() {
    console.log('[home] bootstrapped');
  },

  mount({ container }) {
    container.innerHTML = `
      <div>
        <h1>Home</h1>
        <p>Welcome to the Home micro frontend (Vanilla JS).</p>
      </div>
    `;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },
});
