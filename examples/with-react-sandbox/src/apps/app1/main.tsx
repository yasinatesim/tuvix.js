import { createReactMicroApp } from '@tuvix.js/react';

function App1() {
  return (
    <div style={{ padding: '24px', background: '#30475e', borderRadius: '12px' }}>
      <style>{`
        /* This p tag styling is ISOLATED by the Shadow DOM boundary */
        p {
          color: #f05454;
          font-weight: bold;
          font-size: 18px;
        }
      `}</style>
      <h2 style={{ margin: '0 0 16px' }}>App 1 (Sandboxed)</h2>
      <p>I am inside a Shadow DOM sandbox. My CSS (`color: #f05454`) does NOT leak out to the shell!</p>
      <p>I also don't inherit the global Shell paragraph styling.</p>
    </div>
  );
}

export default createReactMicroApp({ name: 'app1', App: App1 });
