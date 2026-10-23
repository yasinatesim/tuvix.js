import { defineMicroApp } from '@tuvix.js/core';

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => `&#${char.charCodeAt(0)};`
  );
}

function render(container, props = {}) {
  container.innerHTML = `
    <div style="font-family: system-ui; color: #e0e0e0;">
      <h1 style="color: #93c5fd;">🏠 Home</h1>
      <p>Welcome, <strong data-testid="home-user">${escapeHtml(props.user ?? 'Guest')}</strong>!</p>
      <p>Theme: <code>${escapeHtml(props.theme ?? 'default')}</code></p>
      <p>This micro app is built with plain Vanilla JS — no framework required.</p>
    </div>
  `;
}

let mounted = null;

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    mounted = container;
    render(container, props);
  },

  unmount({ container }) {
    container.replaceChildren();
    mounted = null;
  },

  update({ props, container }) {
    const target = container ?? mounted;
    if (target) render(target, props);
  },
});
