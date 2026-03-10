import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defineMicroApp } from '@tuvix.js/react';
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

function ProfileApp({ user }: { user?: string }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const off = bus.on('user:login', (data) => {
      setLoggedIn(true);
      console.log(`[profile] ${data.name} logged in`);
    });
    return off;
  }, []);

  return (
    <div>
      <h1>Profile</h1>
      <p>Hello, {user ?? 'Guest'}!</p>
      {loggedIn && <p>You are logged in.</p>}
      <button onClick={() => bus.emit('user:login', { name: user ?? 'Guest' })}>
        Simulate Login
      </button>
    </div>
  );
}

let root: ReturnType<typeof createRoot> | null = null;

export default defineMicroApp({
  name: 'profile',

  bootstrap() {
    console.log('[profile] bootstrapped');
  },

  mount({ container, props }) {
    root = createRoot(container);
    root.render(<ProfileApp user={props?.user} />);
  },

  unmount() {
    root?.unmount();
    root = null;
  },

  update({ props }) {
    root?.render(<ProfileApp user={props?.user} />);
  },
});
