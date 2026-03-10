import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import type { IEventBus } from '@tuvix.js/event-bus';
import type { UserLoginEvent } from '../header/HeaderApp';

interface Props {
  bus: IEventBus;
  [key: string]: unknown;
}

export default function ContentApp({ bus }: Props) {
  const [user, setUser] = useState<UserLoginEvent | null>(null);

  useTuvixBus<UserLoginEvent>(bus, 'user:login', (data) => {
    setUser(data);
  });

  return (
    <div
      style={{
        padding: '32px',
        background: '#0f0f1a',
        color: '#e0e0e0',
        minHeight: '100%',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '14px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>
        Content — 📡 listens to user:login
      </h3>
      {user ? (
        <div
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #533483, #0f3460)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '12px' }}>{user.avatar}</div>
          <h2 style={{ margin: '0 0 8px' }}>Welcome, {user.username}!</h2>
          <p style={{ opacity: 0.7, margin: 0 }}>User ID: {user.userId}</p>
        </div>
      ) : (
        <div
          style={{
            padding: '40px',
            background: '#1a1a2e',
            borderRadius: '12px',
            textAlign: 'center',
            opacity: 0.5,
          }}
        >
          <p>Pick a user from the header to see cross-app event broadcasting in action.</p>
        </div>
      )}
    </div>
  );
}
