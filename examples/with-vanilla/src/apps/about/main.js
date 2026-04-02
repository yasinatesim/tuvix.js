import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'about',

  bootstrap() {
    console.log('[about] bootstrapped');
  },

  mount({ container }) {
    container.innerHTML = `
      <div style="font-family: system-ui; color: #e0e0e0;">
        <h1 style="color: #a5b4fc;">ℹ️ About</h1>
        <p>This is the <strong>About</strong> micro app.</p>
        <p>Built with Vanilla JS and powered by <strong>Tuvix.js</strong> micro frontend orchestration.</p>
        <ul>
          <li>Zero framework dependencies</li>
          <li>Lightweight and fast</li>
          <li>Full lifecycle management (bootstrap, mount, unmount, update)</li>
        </ul>
      </div>
    `;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },
});
