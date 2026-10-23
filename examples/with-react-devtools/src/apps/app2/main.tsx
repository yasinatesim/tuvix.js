import { createReactMicroApp } from '@tuvix.js/react';

function App2({ title }: { title?: string }) {
  return (
    <div
      style={{
        padding: '24px',
        background: '#222831',
        borderRadius: '12px',
        minHeight: '200px',
      }}
    >
      <h2 style={{ margin: '0 0 16px', color: '#f2a365' }}>
        {title || 'App 2'}
      </h2>
      <p style={{ color: '#aaa' }}>
        The panel lists every registered app and marks the mounted ones with a
        green dot.
      </p>
    </div>
  );
}

export default createReactMicroApp({ name: 'app2', App: App2 });
