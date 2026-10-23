import { createReactMicroApp } from '@tuvix.js/react';

function App1() {
  return (
    <div
      style={{ padding: '24px', background: '#30475e', borderRadius: '12px' }}
    >
      <style>{`
        /* Both rules stay inside app1's shadow root. */
        p { color: #f05454; font-weight: bold; }
        .global-card { outline: 2px dashed #f05454; }
      `}</style>
      <h2 style={{ margin: '0 0 16px' }}>App 1 (sandboxed)</h2>
      <p data-testid="app1-paragraph">
        My <code>p</code> rule is red, and the shell paragraph above stays blue.
      </p>
      <div className="global-card" data-testid="app1-card">
        This box has the class <code>global-card</code>, but the shell rule for
        that class cannot reach it.
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'app1', App: App1 });
