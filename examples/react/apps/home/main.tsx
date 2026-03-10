import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineMicroApp } from '@tuvix.js/react';

function HomeApp() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the Home micro frontend (React).</p>
    </div>
  );
}

let root: ReturnType<typeof createRoot> | null = null;

export default defineMicroApp({
  name: 'home',

  bootstrap() {
    console.log('[home] bootstrapped');
  },

  mount({ container }) {
    root = createRoot(container);
    root.render(<HomeApp />);
  },

  unmount() {
    root?.unmount();
    root = null;
  },
});
