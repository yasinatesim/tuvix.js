import { createReactMicroApp } from '@tuvix.js/react';

function ReactApp() {
  return (
    <div style={{ padding: '24px', background: '#30475e', borderRadius: '12px' }}>
      <h2 style={{ margin: '0 0 16px', color: '#61dafb' }}>⚛️ React Micro App</h2>
      <p style={{ color: '#e0e0e0', lineHeight: 1.6 }}>
        I'm a standard React component wrapped in <code>createReactMicroApp</code>.
      </p>
    </div>
  );
}

export default createReactMicroApp({ name: 'react-app', App: ReactApp });
