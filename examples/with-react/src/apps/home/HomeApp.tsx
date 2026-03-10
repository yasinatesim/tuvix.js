interface Props {
  theme?: string;
  user?: string;
  [key: string]: unknown;
}

export default function HomeApp({ theme = 'light', user = 'Guest' }: Props) {
  return (
    <div
      style={{
        padding: '32px',
        background: theme === 'dark' ? '#1a1a2e' : '#fff',
        color: theme === 'dark' ? '#e0e0e0' : '#111',
        borderRadius: '12px',
        minHeight: '200px',
      }}
    >
      <h1 style={{ margin: '0 0 16px', fontSize: '28px' }}>🏠 Home</h1>
      <p>
        Welcome, <strong>{user}</strong>! This React micro app is loaded and
        managed by the Tuvix.js orchestrator.
      </p>
      <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '24px' }}>
        Props received from shell: <code>theme="{theme}"</code>{' '}
        <code>user="{user}"</code>
      </p>
    </div>
  );
}
