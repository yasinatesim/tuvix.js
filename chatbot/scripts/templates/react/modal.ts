import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'confirmation',
    description: 'Confirmation modal with yes/no action buttons',
    tags: ['modal', 'confirmation', 'dialog'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ConfirmationModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Delete Item</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }}>
          <div style={{ width: '400px', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>Confirm Delete</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>Are you sure you want to delete this item? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setOpen(false)} style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setOpen(false); console.log('Deleted'); }} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'confirmation-modal', App: ConfirmationModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'form',
    description: 'Modal containing a form with input fields and submit',
    tags: ['modal', 'form', 'input'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function FormModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => { console.log('Submit:', { name, email }); setOpen(false); setName(''); setEmail(''); };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Add User</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }}>
          <div style={{ width: '440px', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Add New User</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>\\u2715</button>
            </div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '24px', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setOpen(false)} style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'form-modal', App: FormModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'lightbox',
    description: 'Lightbox modal for viewing images full screen',
    tags: ['modal', 'lightbox', 'image'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function LightboxModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} style={{ width: '200px', height: '150px', backgroundColor: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>Click to enlarge</div>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, cursor: 'zoom-out' }}>
          <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' }}>\\u2715</button>
          <div style={{ width: '80vw', maxWidth: '900px', height: '60vh', backgroundColor: '#1f2937', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Full-size Image</div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'lightbox-modal', App: LightboxModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'video',
    description: 'Video player modal with overlay and close button',
    tags: ['modal', 'video', 'media'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function VideoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', border: 'none', borderRadius: '8px', backgroundColor: '#111827', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
        <span style={{ fontSize: '20px' }}>\\u25B6</span> Watch Demo
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100 }}>
          <div style={{ position: 'relative', width: '80vw', maxWidth: '800px' }}>
            <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>\\u2715</button>
            <div style={{ width: '100%', paddingBottom: '56.25%', backgroundColor: '#000', borderRadius: '10px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '16px' }}>Video Player Placeholder</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'video-modal', App: VideoModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'settings',
    description: 'Settings modal with tabbed sections and save/cancel',
    tags: ['modal', 'settings', 'tabs'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('general');
  const tabs = ['general', 'notifications', 'privacy'];

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>Settings</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }}>
          <div style={{ width: '520px', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Settings</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>\\u2715</button>
            </div>
            <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid #e5e7eb' }}>
              {tabs.map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 16px', border: 'none', borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent', background: 'none', color: tab === t ? '#6366f1' : '#6b7280', cursor: 'pointer', fontWeight: 500, fontSize: '14px', textTransform: 'capitalize' }}>{t}</button>
              ))}
            </div>
            <div style={{ padding: '24px', minHeight: '120px' }}>
              {tab === 'general' && <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>General settings: language, timezone, theme preferences.</p>}
              {tab === 'notifications' && <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>Configure email, push, and in-app notification preferences.</p>}
              {tab === 'privacy' && <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>Manage data sharing, visibility, and account privacy options.</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setOpen(false)} style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setOpen(false)} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'settings-modal', App: SettingsModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'side-panel',
    description: 'Side panel modal that slides in from the right',
    tags: ['modal', 'side-panel', 'drawer'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SidePanelModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>View Details</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <div style={{ width: '400px', backgroundColor: '#fff', boxShadow: '-4px 0 16px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Details</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>\\u2715</button>
            </div>
            <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>NAME</label>
                <div style={{ fontSize: '15px', color: '#111827', marginTop: '4px' }}>Sample Item</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>STATUS</label>
                <div style={{ marginTop: '4px' }}><span style={{ padding: '4px 10px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Active</span></div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>DESCRIPTION</label>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5, marginTop: '4px' }}>Detailed information about this item displayed in a sliding side panel.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'side-panel-modal', App: SidePanelModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'image-gallery',
    description: 'Image gallery modal with navigation between images',
    tags: ['modal', 'gallery', 'images'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function GalleryModal() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const images = ['Image 1', 'Image 2', 'Image 3', 'Image 4', 'Image 5'];

  return (
    <>
      <button onClick={() => { setIndex(0); setOpen(true); }} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>Open Gallery</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>\\u2715</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} style={{ background: 'none', border: 'none', color: index === 0 ? '#4b5563' : '#fff', fontSize: '32px', cursor: index === 0 ? 'default' : 'pointer' }}>\\u25C0</button>
            <div style={{ width: '600px', height: '400px', backgroundColor: '#1f2937', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '18px' }}>{images[index]}</div>
            <button onClick={() => setIndex(Math.min(images.length - 1, index + 1))} disabled={index === images.length - 1} style={{ background: 'none', border: 'none', color: index === images.length - 1 ? '#4b5563' : '#fff', fontSize: '32px', cursor: index === images.length - 1 ? 'default' : 'pointer' }}>\\u25B6</button>
          </div>
          <div style={{ marginTop: '16px', color: '#9ca3af', fontSize: '14px' }}>{index + 1} / {images.length}</div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'gallery-modal', App: GalleryModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'terms',
    description: 'Terms and conditions modal with scroll-to-accept',
    tags: ['modal', 'terms', 'legal'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useRef, useEffect } from 'react';

function TermsModal() {
  const [open, setOpen] = useState(false);
  const [canAccept, setCanAccept] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setCanAccept(false); return; }
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => { if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setCanAccept(true); };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>View Terms</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }}>
          <div style={{ width: '500px', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}><h3 style={{ margin: 0, fontSize: '18px' }}>Terms &amp; Conditions</h3></div>
            <div ref={contentRef} style={{ padding: '20px 24px', maxHeight: '300px', overflow: 'auto', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
              {Array.from({ length: 10 }).map((_, i) => <p key={i}>Section {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus mi quis viverra ornare.</p>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setOpen(false)} style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' }}>Decline</button>
              <button onClick={() => setOpen(false)} disabled={!canAccept} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: canAccept ? '#6366f1' : '#d1d5db', color: '#fff', cursor: canAccept ? 'pointer' : 'default', fontWeight: 600 }}>Accept</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'terms-modal', App: TermsModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'alert',
    description: 'Alert modal with severity indicator and single action',
    tags: ['modal', 'alert', 'warning'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function AlertModal() {
  const [open, setOpen] = useState(true);

  if (!open) return <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#f59e0b', color: '#fff', cursor: 'pointer' }}>Show Alert</button>;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }}>
      <div style={{ width: '380px', padding: '28px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>\\u26A0</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>Session Expiring</h3>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>Your session will expire in 5 minutes. Please save your work or extend your session.</p>
        <button onClick={() => setOpen(false)} style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '6px', backgroundColor: '#f59e0b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Extend Session</button>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'alert-modal', App: AlertModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'fullscreen',
    description: 'Fullscreen modal taking up entire viewport',
    tags: ['modal', 'fullscreen', 'overlay'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function FullscreenModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>Open Fullscreen</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#fff', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Full Editor</h2>
            <button onClick={() => setOpen(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Close</button>
          </header>
          <main style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: '16px' }}>Fullscreen workspace area</p>
              <p style={{ fontSize: '14px' }}>Use this for editors, previews, or immersive experiences</p>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'fullscreen-modal', App: FullscreenModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'drawer',
    description: 'Drawer modal sliding from bottom',
    tags: ['modal', 'drawer', 'bottom'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function DrawerModal() {
  const [open, setOpen] = useState(false);
  const options = ['Share via Email', 'Copy Link', 'Download PDF', 'Print', 'Report Issue'];

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>Share</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <div style={{ backgroundColor: '#fff', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '8px 0 16px' }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '2px', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', padding: '0 24px', fontSize: '18px', fontWeight: 700 }}>Share Options</h3>
            {options.map((opt) => (
              <button key={opt} onClick={() => setOpen(false)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px', color: '#374151', borderTop: '1px solid #f3f4f6' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'drawer-modal', App: DrawerModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'bottom-sheet',
    description: 'Bottom sheet modal with drag handle for mobile UIs',
    tags: ['modal', 'bottom-sheet', 'mobile'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function BottomSheetModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>Show Sheet</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '2px' }} />
            </div>
            <div style={{ padding: '0 24px 24px', overflow: 'auto' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700 }}>Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Name: Sample Item', 'Category: Widget', 'Status: Active', 'Created: March 2025', 'Updated: April 2025'].map((info) => (
                  <div key={info} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '14px', color: '#374151' }}>{info}</div>
                ))}
              </div>
              <button onClick={() => setOpen(false)} style={{ width: '100%', marginTop: '20px', padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'bottom-sheet-modal', App: BottomSheetModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'cookie-consent',
    description: 'Cookie consent modal with accept/reject and preferences',
    tags: ['modal', 'cookie', 'consent'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function CookieConsentModal() {
  const [visible, setVisible] = useState(true);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ necessary: true, analytics: false, marketing: false });

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '480px', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Cookie Preferences</h3>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>We use cookies to enhance your experience. You can customize your preferences below.</p>
      {showPrefs && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          {Object.entries(prefs).map(([key, val]) => (
            <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '14px', textTransform: 'capitalize' }}>
              {key}
              <input type="checkbox" checked={val} disabled={key === 'necessary'} onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))} />
            </label>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setVisible(false)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Accept All</button>
        <button onClick={() => setShowPrefs(!showPrefs)} style={{ padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' }}>Customize</button>
        <button onClick={() => setVisible(false)} style={{ padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' }}>Reject</button>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'cookie-consent-modal', App: CookieConsentModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'search',
    description: 'Search modal with keyboard shortcut hint and results',
    tags: ['modal', 'search', 'spotlight'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useEffect } from 'react';

function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const allItems = ['Dashboard', 'Settings', 'Profile', 'Analytics', 'Users', 'Billing', 'Support', 'Docs'];
  const results = query ? allItems.filter((i) => i.toLowerCase().includes(query.toLowerCase())) : [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}>
        Search... <kbd style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px' }}>Ctrl+K</kbd>
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '120px', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }}>
          <div style={{ width: '500px', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search..." style={{ width: '100%', padding: '16px 20px', border: 'none', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
            {results.length > 0 && (
              <div style={{ borderTop: '1px solid #e5e7eb', maxHeight: '300px', overflow: 'auto' }}>
                {results.map((r) => (
                  <button key={r} onClick={() => { setOpen(false); setQuery(''); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{r}</button>
                ))}
              </div>
            )}
            {query && results.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', borderTop: '1px solid #e5e7eb' }}>No results found</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'search-modal', App: SearchModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'command-palette',
    description: 'Command palette modal with grouped actions and keyboard nav',
    tags: ['modal', 'command-palette', 'keyboard'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useEffect } from 'react';

function CommandPaletteModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const groups: Record<string, { label: string; shortcut: string }[]> = {
    Actions: [
      { label: 'New File', shortcut: 'Ctrl+N' },
      { label: 'Save', shortcut: 'Ctrl+S' },
      { label: 'Undo', shortcut: 'Ctrl+Z' },
    ],
    Navigation: [
      { label: 'Go to Dashboard', shortcut: 'G D' },
      { label: 'Go to Settings', shortcut: 'G S' },
      { label: 'Go to Profile', shortcut: 'G P' },
    ],
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen((o) => !o); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>Command Palette</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '100px', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}>
          <div style={{ width: '520px', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="> Type a command..." style={{ width: '100%', padding: '14px 20px', border: 'none', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
            <div style={{ maxHeight: '320px', overflow: 'auto' }}>
              {Object.entries(groups).map(([group, items]) => {
                const filtered = items.filter((i) => !query || i.label.toLowerCase().includes(query.toLowerCase()));
                if (filtered.length === 0) return null;
                return (
                  <div key={group}>
                    <div style={{ padding: '8px 20px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', backgroundColor: '#f9fafb' }}>{group}</div>
                    {filtered.map((item) => (
                      <button key={item.label} onClick={() => { setOpen(false); setQuery(''); }} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left' }}>
                        <span>{item.label}</span>
                        <kbd style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px', color: '#6b7280' }}>{item.shortcut}</kbd>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'command-palette-modal', App: CommandPaletteModal });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
