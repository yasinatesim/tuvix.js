import { createReactMicroApp } from '@tuvix.js/react';

function App1({ title }: { title?: string; [key: string]: unknown }) {
  return (
    <div style={{ padding: '24px', background: '#30475e', borderRadius: '12px', minHeight: '200px' }}>
      <h2 style={{ margin: '0 0 16px', color: '#f05454' }}>{title || 'App 1'}</h2>
      <p style={{ color: '#e0e0e0' }}>This app is running. Open the Tuvix.js DevTools panel (bottom right) to see its status, mount time, and current props.</p>
    </div>
  );
}

export default createReactMicroApp({ name: 'app1', App: App1 });
