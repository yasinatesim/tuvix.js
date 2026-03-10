export default function AboutApp() {
  return (
    <div
      style={{
        padding: '32px',
        background: '#0f3460',
        color: '#e0e0e0',
        borderRadius: '12px',
        minHeight: '200px',
      }}
    >
      <h1 style={{ margin: '0 0 16px', fontSize: '28px' }}>ℹ️ About</h1>
      <p>
        This is the <strong>About</strong> micro frontend — a completely
        independent React app running under the Tuvix.js orchestrator.
      </p>
      <ul style={{ marginTop: '16px', lineHeight: '2' }}>
        <li>Independently deployable</li>
        <li>Lifecycle-managed (bootstrap → mount → unmount)</li>
        <li>Receives props from the shell orchestrator</li>
      </ul>
    </div>
  );
}
