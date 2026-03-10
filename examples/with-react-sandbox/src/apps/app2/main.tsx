import { createReactMicroApp } from '@tuvix.js/react';

function App2() {
  return (
    <div style={{ padding: '24px', background: '#222831', borderRadius: '12px' }}>
      <style>{`
        /* This p tag styling BLEEDS OUT because this app is not sandboxed */
        /* It will override the global paragraph color if specific enough */
        .global-card p {
          color: #f2a365 !important;
        }
      `}</style>
      <h2 style={{ margin: '0 0 16px' }}>App 2 (Unsandboxed)</h2>
      <p>I am NOT in a sandbox. My injected CSS just turned the shell's paragraph orange!</p>
    </div>
  );
}

export default createReactMicroApp({ name: 'app2', App: App2 });
