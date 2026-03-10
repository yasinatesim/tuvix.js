import { useState } from 'react';
import type { IEventBus } from '@tuvix.js/event-bus';

interface Props {
  bus: IEventBus;
  [key: string]: unknown;
}

export interface UserLoginEvent {
  userId: number;
  username: string;
  avatar: string;
}

export default function HeaderApp({ bus }: Props) {
  const [lastEmitted, setLastEmitted] = useState<string | null>(null);

  const users: UserLoginEvent[] = [
    { userId: 1, username: 'Alice', avatar: '👩' },
    { userId: 2, username: 'Bob', avatar: '👨' },
    { userId: 3, username: 'Charlie', avatar: '🧑' },
  ];

  const handleLogin = (user: UserLoginEvent) => {
    bus.emit<UserLoginEvent>('user:login', user);
    setLastEmitted(user.username);
  };

  return (
    <div
      style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: '18px' }}>⬡ Tuvix.js</span>
      <span style={{ opacity: 0.5, fontSize: '12px' }}>Header App → publishes user:login</span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
        {users.map((u) => (
          <button
            key={u.userId}
            onClick={() => handleLogin(u)}
            style={{
              padding: '6px 14px',
              background: lastEmitted === u.username ? '#0f3460' : '#533483',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {u.avatar} Login as {u.username}
          </button>
        ))}
      </div>
    </div>
  );
}
