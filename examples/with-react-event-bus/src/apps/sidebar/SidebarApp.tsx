import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import type { IEventBus } from '@tuvix.js/event-bus';
import type { UserLoginEvent } from '../header/HeaderApp';

interface Props {
  bus: IEventBus;
  [key: string]: unknown;
}

export default function SidebarApp({ bus }: Props) {
  const [events, setEvents] = useState<Array<UserLoginEvent & { ts: string }>>([]);

  useTuvixBus<UserLoginEvent>(bus, 'user:login', (data) => {
    setEvents((prev) => [
      { ...data, ts: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  });

  return (
    <div
      style={{
        padding: '24px',
        background: '#16213e',
        color: '#e0e0e0',
        minHeight: '100%',
        borderRight: '1px solid #0f3460',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '14px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>
        Sidebar — 📡 listens to user:login
      </h3>
      {events.length === 0 && (
        <p style={{ opacity: 0.4, fontSize: '13px' }}>No events yet — click "Login as…" in the header</p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {events.map((ev, i) => (
          <li
            key={i}
            style={{
              padding: '10px 12px',
              marginBottom: '8px',
              background: '#0f3460',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <span style={{ fontSize: '20px', marginRight: '8px' }}>{ev.avatar}</span>
            <strong>{ev.username}</strong>
            <span style={{ opacity: 0.5, marginLeft: '8px', fontSize: '11px' }}>{ev.ts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
