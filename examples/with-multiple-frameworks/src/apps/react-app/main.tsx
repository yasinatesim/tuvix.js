import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/core';
import { createReactMicroApp } from '@tuvix.js/react';

function ReactApp() {
  const [sent, setSent] = useState(0);

  const send = () => {
    const next = sent + 1;
    setSent(next);
    // The Vue app listens on the same global bus.
    getGlobalBus().emit('react:clicked', { count: next });
  };

  return (
    <div
      style={{ padding: '24px', background: '#30475e', borderRadius: '12px' }}
    >
      <h2 style={{ margin: '0 0 16px', color: '#61dafb' }}>React Micro App</h2>
      <p style={{ color: '#e0e0e0', lineHeight: 1.6 }}>
        A React component wrapped in <code>createReactMicroApp</code>.
      </p>
      <button type="button" onClick={send} data-testid="react-send">
        Send click to Vue ({sent})
      </button>
    </div>
  );
}

export default createReactMicroApp({ name: 'react-app', App: ReactApp });
