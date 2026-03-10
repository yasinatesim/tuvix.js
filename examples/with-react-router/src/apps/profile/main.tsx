import { createReactMicroApp } from '@tuvix.js/react';

function ProfileApp() {
  return (
    <div style={{ padding: '32px', background: '#16213e', borderRadius: '12px', minHeight: '300px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #533483, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0 }}>👤</div>
      <div>
        <h1 style={{ color: '#e0e0e0', marginBottom: '8px' }}>Profile</h1>
        <p style={{ color: '#aaa' }}>Active at <code style={{ background: '#0f3460', padding: '2px 6px', borderRadius: '4px' }}>/profile</code></p>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[['Name', 'Alice Tuvix'], ['Role', 'Frontend Engineer'], ['Team', 'Microfrontends']].map(([k, v]) => (
            <div key={k} style={{ color: '#ccc', fontSize: '14px' }}><span style={{ color: '#666', width: '80px', display: 'inline-block' }}>{k}</span> {v}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'profile', App: ProfileApp });
