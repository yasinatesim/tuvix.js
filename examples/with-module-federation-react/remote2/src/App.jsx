import React from 'react';
import { createReactMicroApp } from '@tuvix.js/react';

function App2() {
  return (
    <div style={{ padding: '24px', background: '#222831', borderRadius: '12px', minHeight: '200px' }}>
      <h2 style={{ margin: '0 0 16px', color: '#f2a365' }}>Remote 2</h2>
      <p style={{ color: '#aaa' }}>This is another React Webpack App exposed via Module Federation from <code>localhost:3002</code>.</p>
    </div>
  );
}

// Export the Tuvix.js compatible module
export default createReactMicroApp({ name: 'remote2', App: App2 });
