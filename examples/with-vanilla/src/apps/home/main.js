import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'home',

  bootstrap() {
    console.log('[home] bootstrapped');
  },

  mount({ container, props }) {
    container.innerHTML = `
      <div style="font-family: system-ui; color: #e0e0e0;">
        <h1 style="color: #93c5fd;">🏠 Home</h1>
        <p>Welcome, <strong>${props?.user ?? 'Guest'}</strong>!</p>
        <p>Theme: <code>${props?.theme ?? 'default'}</code></p>
        <p>This micro app is built with plain Vanilla JS — no framework required.</p>
      </div>
    `;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('[home] props updated:', props);
  },
});
