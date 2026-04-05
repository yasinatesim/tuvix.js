import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'toast',
    description: 'Toast notification with auto-dismiss timer',
    tags: ['notification', 'toast', 'temporary'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useEffect } from 'react';

function ToastNotification() {
  const [visible, setVisible] = useState(true);
  useEffect(() => { if (visible) { const t = setTimeout(() => setVisible(false), 4000); return () => clearTimeout(t); } }, [visible]);
  if (!visible) return <button onClick={() => setVisible(true)} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>Show Toast</button>;
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, minWidth: '300px', padding: '14px 20px', backgroundColor: '#111827', color: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px' }}>Changes saved successfully</span>
      <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px', marginLeft: '12px' }}>\\u2715</button>
    </div>
  );
}
export default createReactMicroApp({ name: 'toast-notification', App: ToastNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'alert',
    description: 'Alert notification with severity levels and icon',
    tags: ['notification', 'alert', 'severity'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function AlertNotification() {
  const alerts = [
    { type: 'success', icon: '\\u2713', msg: 'Operation completed successfully.', bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
    { type: 'warning', icon: '\\u26A0', msg: 'Your storage is almost full.', bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    { type: 'error', icon: '\\u2717', msg: 'Failed to save changes. Please retry.', bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    { type: 'info', icon: '\\u2139', msg: 'A new update is available.', bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
      {alerts.map((a) => (
        <div key={a.type} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: a.bg, border: '1px solid ' + a.border, borderRadius: '8px' }}>
          <span style={{ fontSize: '16px', color: a.text }}>{a.icon}</span>
          <span style={{ fontSize: '14px', color: a.text }}>{a.msg}</span>
        </div>
      ))}
    </div>
  );
}
export default createReactMicroApp({ name: 'alert-notification', App: AlertNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'badge',
    description: 'Badge notification counter for icons and buttons',
    tags: ['notification', 'badge', 'counter'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function BadgeNotification() {
  const [count, setCount] = useState(5);
  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button style={{ padding: '10px', background: 'none', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '20px' }}>\\u2709</button>
        {count > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>}
      </div>
      <button onClick={() => setCount(count + 1)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Add</button>
      <button onClick={() => setCount(0)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Clear</button>
    </div>
  );
}
export default createReactMicroApp({ name: 'badge-notification', App: BadgeNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'banner',
    description: 'Full-width banner notification with dismiss',
    tags: ['notification', 'banner', 'full-width'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function BannerNotification() {
  const [visible, setVisible] = useState(true);
  if (!visible) return <button onClick={() => setVisible(true)} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>Show Banner</button>;
  return (
    <div style={{ padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', position: 'relative' }}>
      <span style={{ fontSize: '14px' }}>New feature: Dark mode is now available! <a href="#settings" style={{ color: '#c7d2fe', fontWeight: 600 }}>Try it now</a></span>
      <button onClick={() => setVisible(false)} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '16px' }}>\\u2715</button>
    </div>
  );
}
export default createReactMicroApp({ name: 'banner-notification', App: BannerNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'snackbar',
    description: 'Snackbar notification at screen bottom with undo action',
    tags: ['notification', 'snackbar', 'action'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useEffect } from 'react';

function SnackbarNotification() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const show = (msg: string) => { setMessage(msg); setVisible(true); };
  useEffect(() => { if (visible) { const t = setTimeout(() => setVisible(false), 5000); return () => clearTimeout(t); } }, [visible]);
  return (
    <div>
      <button onClick={() => show('Item deleted')} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer' }}>Delete Item</button>
      {visible && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <span style={{ fontSize: '14px' }}>{message}</span>
          <button onClick={() => { setVisible(false); console.log('Undo'); }} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Undo</button>
        </div>
      )}
    </div>
  );
}
export default createReactMicroApp({ name: 'snackbar-notification', App: SnackbarNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'progress-bar',
    description: 'Progress bar notification showing operation completion',
    tags: ['notification', 'progress', 'loading'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useEffect } from 'react';

function ProgressBarNotification() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (progress >= 100) { setRunning(false); return; }
    const t = setTimeout(() => setProgress((p) => Math.min(100, p + Math.random() * 15)), 300);
    return () => clearTimeout(t);
  }, [running, progress]);
  return (
    <div style={{ maxWidth: '400px' }}>
      <button onClick={() => { setProgress(0); setRunning(true); }} disabled={running} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: running ? '#d1d5db' : '#6366f1', color: '#fff', cursor: running ? 'default' : 'pointer', marginBottom: '16px' }}>{running ? 'Uploading...' : 'Start Upload'}</button>
      <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: progress + '%', backgroundColor: progress >= 100 ? '#10b981' : '#6366f1', transition: 'width 0.3s', borderRadius: '4px' }} />
      </div>
      <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>{Math.round(progress)}% {progress >= 100 ? '- Complete!' : ''}</div>
    </div>
  );
}
export default createReactMicroApp({ name: 'progress-notification', App: ProgressBarNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'skeleton',
    description: 'Skeleton loading placeholder notification',
    tags: ['notification', 'skeleton', 'loading'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function SkeletonNotification() {
  const shimmer = { background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'none', borderRadius: '4px' };
  return (
    <div style={{ maxWidth: '400px', padding: '20px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ ...shimmer, width: '40px', height: '40px', borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...shimmer, height: '14px', width: '60%', marginBottom: '8px' }} />
          <div style={{ ...shimmer, height: '12px', width: '40%' }} />
        </div>
      </div>
      <div style={{ ...shimmer, height: '12px', width: '100%', marginBottom: '8px' }} />
      <div style={{ ...shimmer, height: '12px', width: '80%', marginBottom: '8px' }} />
      <div style={{ ...shimmer, height: '12px', width: '90%' }} />
    </div>
  );
}
export default createReactMicroApp({ name: 'skeleton-notification', App: SkeletonNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'empty-state',
    description: 'Empty state notification with illustration and CTA',
    tags: ['notification', 'empty-state', 'placeholder'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function EmptyStateNotification() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px' }}>\\u2750</div>
      <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#111827' }}>No items yet</h3>
      <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>Get started by creating your first item. It only takes a minute.</p>
      <button style={{ padding: '10px 24px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Create Item</button>
    </div>
  );
}
export default createReactMicroApp({ name: 'empty-state-notification', App: EmptyStateNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'error-boundary',
    description: 'Error boundary notification with retry button',
    tags: ['notification', 'error', 'boundary'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ErrorBoundaryNotification() {
  const [hasError, setHasError] = useState(true);
  if (!hasError) return <div style={{ padding: '20px', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>Content loaded successfully!</div>;
  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', color: '#dc2626' }}>!</div>
      <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>Something went wrong</h3>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6b7280' }}>An unexpected error occurred while loading this content. Please try again.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        <button onClick={() => setHasError(false)} style={{ padding: '10px 24px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
        <button style={{ padding: '10px 24px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' }}>Go Back</button>
      </div>
    </div>
  );
}
export default createReactMicroApp({ name: 'error-boundary-notification', App: ErrorBoundaryNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'spinner',
    description: 'Loading spinner notification with optional text',
    tags: ['notification', 'spinner', 'loading'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function SpinnerNotification() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>Loading data...</p>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}
export default createReactMicroApp({ name: 'spinner-notification', App: SpinnerNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'countdown',
    description: 'Countdown timer notification with expiry warning',
    tags: ['notification', 'countdown', 'timer'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useEffect } from 'react';

function CountdownNotification() {
  const [seconds, setSeconds] = useState(120);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const urgent = seconds < 30;
  return (
    <div style={{ maxWidth: '400px', padding: '16px 20px', backgroundColor: urgent ? '#fef2f2' : '#fffbeb', border: '1px solid ' + (urgent ? '#fecaca' : '#fde68a'), borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'monospace', color: urgent ? '#dc2626' : '#d97706', minWidth: '60px' }}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '14px', color: urgent ? '#dc2626' : '#92400e' }}>{seconds <= 0 ? 'Session Expired' : 'Session Expiring'}</div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>{seconds > 0 ? 'Please save your work' : 'Please log in again'}</div>
      </div>
      {seconds <= 0 && <button onClick={() => setSeconds(120)} style={{ marginLeft: 'auto', padding: '6px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Renew</button>}
    </div>
  );
}
export default createReactMicroApp({ name: 'countdown-notification', App: CountdownNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'status-chip',
    description: 'Small status chip indicators for inline use',
    tags: ['notification', 'status', 'chip'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function StatusChipNotification() {
  const statuses = [
    { label: 'Online', color: '#10b981', bg: '#dcfce7' },
    { label: 'Away', color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Busy', color: '#ef4444', bg: '#fee2e2' },
    { label: 'Offline', color: '#6b7280', bg: '#f3f4f6' },
  ];
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {statuses.map((s) => (
        <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '16px', backgroundColor: s.bg, fontSize: '13px', fontWeight: 500, color: s.color }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
export default createReactMicroApp({ name: 'status-chip-notification', App: StatusChipNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'inline-alert',
    description: 'Inline alert notification embedded within content flow',
    tags: ['notification', 'inline', 'contextual'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function InlineAlertNotification() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', maxWidth: '500px' }}>
      <span style={{ color: '#3b82f6', fontSize: '18px', flexShrink: 0 }}>\\u2139</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e40af', marginBottom: '2px' }}>Tip</div>
        <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>You can customize your notification preferences in Settings &gt; Notifications to reduce email volume.</p>
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>\\u2715</button>
    </div>
  );
}
export default createReactMicroApp({ name: 'inline-alert-notification', App: InlineAlertNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'floating-notification',
    description: 'Floating notification panel with stacked messages',
    tags: ['notification', 'floating', 'stack'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function FloatingNotification() {
  const [notifications, setNotifications] = useState([
    { id: 1, msg: 'New comment on your post', time: '2m ago' },
    { id: 2, msg: 'Alice sent you a message', time: '5m ago' },
    { id: 3, msg: 'Your export is ready', time: '10m ago' },
  ]);
  const dismiss = (id: number) => setNotifications((ns) => ns.filter((n) => n.id !== id));
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px', width: '320px' }}>
      {notifications.map((n) => (
        <div key={n.id} style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>{n.msg}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{n.time}</div>
          </div>
          <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '14px', flexShrink: 0, marginLeft: '8px' }}>\\u2715</button>
        </div>
      ))}
    </div>
  );
}
export default createReactMicroApp({ name: 'floating-notification', App: FloatingNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'announcement',
    description: 'Announcement notification with rich content and CTA',
    tags: ['notification', 'announcement', 'feature'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function AnnouncementNotification() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{ maxWidth: '480px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ padding: '4px 10px', backgroundColor: '#ede9fe', color: '#6366f1', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>New</span>
        <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}>\\u2715</button>
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700 }}>Introducing Dark Mode</h3>
      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>We have added dark mode support across the entire application. Switch in Settings or let it follow your system preference.</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Try it now</button>
        <button onClick={() => setVisible(false)} style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' }}>Maybe later</button>
      </div>
    </div>
  );
}
export default createReactMicroApp({ name: 'announcement-notification', App: AnnouncementNotification });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
