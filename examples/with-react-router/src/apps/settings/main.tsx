import { createReactMicroApp } from '@tuvix.js/react';
import { useState } from 'react';

function SettingsApp() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notifs, setNotifs] = useState(true);

  return (
    <div style={{ padding: '32px', background: '#16213e', borderRadius: '12px', minHeight: '300px' }}>
      <h1 style={{ color: '#e0e0e0', marginBottom: '24px' }}>⚙️ Settings</h1>
      <p style={{ color: '#aaa', marginBottom: '24px' }}>Active at <code style={{ background: '#0f3460', padding: '2px 6px', borderRadius: '4px' }}>/settings</code></p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { label: 'Theme', value: theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') },
          { label: 'Notifications', value: notifs ? 'On' : 'Off', toggle: () => setNotifs(n => !n) },
        ].map(({ label, value, toggle }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#0f3460', borderRadius: '8px' }}>
            <span style={{ color: '#e0e0e0' }}>{label}</span>
            <button onClick={toggle} style={{ padding: '6px 14px', background: '#533483', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {value}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'settings', App: SettingsApp });
