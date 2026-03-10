import { createReactMicroApp } from '@tuvix.js/react';

function DashboardApp() {
  return (
    <div style={{ padding: '32px', background: '#16213e', borderRadius: '12px', minHeight: '300px' }}>
      <h1 style={{ color: '#e0e0e0', marginBottom: '16px' }}>📊 Dashboard</h1>
      <p style={{ color: '#aaa' }}>This micro app is active at <code style={{ background: '#0f3460', padding: '2px 6px', borderRadius: '4px' }}>/dashboard</code></p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
        {['Users', 'Revenue', 'Sessions'].map((label, i) => (
          <div key={label} style={{ background: '#0f3460', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <div style={{ color: '#e0e0e0', fontSize: '28px', fontWeight: 700 }}>{(i + 1) * 1234}</div>
            <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'dashboard', App: DashboardApp });
