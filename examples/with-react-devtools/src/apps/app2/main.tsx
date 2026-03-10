import { createReactMicroApp } from '@tuvix.js/react';

function App2({ title }: { title?: string; [key: string]: unknown }) {
  return (
    <div style={{ padding: '24px', background: '#222831', borderRadius: '12px', minHeight: '200px' }}>
      <h2 style={{ margin: '0 0 16px', color: '#f2a365' }}>{title || 'App 2'}</h2>
      <p style={{ color: '#aaa' }}>The DevTools panel gives you a real-time view into the orchestrator's registry and loaded modules.</p>
      
      <button 
        onClick={() => { throw new Error('Simulated crash from App 2'); }}
        style={{ marginTop: '16px', padding: '8px 16px', background: '#f05454', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Simulate Error
      </button>
    </div>
  );
}

export default createReactMicroApp({ name: 'app2', App: App2 });
