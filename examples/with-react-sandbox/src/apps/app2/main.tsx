import { createReactMicroApp } from '@tuvix.js/react';

function App2() {
  return (
    <div
      style={{ padding: '24px', background: '#222831', borderRadius: '12px' }}
    >
      <style>{`
        /* No sandbox: this rule lands in the page and restyles the shell. */
        .shell-note { color: #f2a365; }
      `}</style>
      <h2 style={{ margin: '0 0 16px' }}>App 2 (no sandbox)</h2>
      <p>
        My <code>.shell-note</code> rule turned the shell note above orange.
      </p>
    </div>
  );
}

export default createReactMicroApp({ name: 'app2', App: App2 });
