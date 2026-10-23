import { getGlobalBus } from '@tuvix.js/event-bus';
import { createReactMicroApp } from '@tuvix.js/react';

function App1({ title }: { title?: string }) {
  return (
    <div
      style={{
        padding: '24px',
        background: '#30475e',
        borderRadius: '12px',
        minHeight: '200px',
      }}
    >
      <h2 style={{ margin: '0 0 16px', color: '#f05454' }}>
        {title || 'App 1'}
      </h2>
      <p style={{ color: '#e0e0e0' }}>
        Open the Tuvix.js DevTools panel (bottom right) to see which apps are
        mounted and the events on the bus.
      </p>
      <button
        type="button"
        onClick={() => getGlobalBus().emit('app1:ping', { at: Date.now() })}
        style={{
          marginTop: '16px',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Emit app1:ping
      </button>
    </div>
  );
}

export default createReactMicroApp({ name: 'app1', App: App1 });
