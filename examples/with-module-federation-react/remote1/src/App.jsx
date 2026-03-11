import React from 'react';
import { createReactMicroApp } from '@tuvix.js/react';

function App1() {
  return (
    <div style={{ padding: '24px', background: '#30475e', borderRadius: '12px', minHeight: '200px' }}>
      <h2 style={{ margin: '0 0 16px', color: '#f05454' }}>Remote 1</h2>
      <p style={{ color: '#e0e0e0' }}>This is a React Webpack App exposed via Module Federation from <code>localhost:3001</code>.</p>
    </div>
  );
}

// Named export for standalone rendering (e.g. index.js)
export { App1 };

// Default export: Tuvix.js compatible module for MF consumption
export default createReactMicroApp({ name: 'remote1', App: App1 });
