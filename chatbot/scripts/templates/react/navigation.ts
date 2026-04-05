import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'breadcrumb',
    description: 'Breadcrumb navigation with separator icons',
    tags: ['navigation', 'breadcrumb', 'trail'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function BreadcrumbNav() {
  const crumbs = [{ label: 'Home', href: '#home' }, { label: 'Products', href: '#products' }, { label: 'Widgets', href: '#widgets' }, { label: 'Pro Model' }];
  return (
    <nav style={{ padding: '12px 0', fontSize: '14px' }}>
      {crumbs.map((crumb, i) => (
        <span key={crumb.label}>
          {i > 0 && <span style={{ margin: '0 8px', color: '#9ca3af' }}>/</span>}
          {crumb.href ? <a href={crumb.href} style={{ color: '#6366f1', textDecoration: 'none' }}>{crumb.label}</a> : <span style={{ color: '#6b7280' }}>{crumb.label}</span>}
        </span>
      ))}
    </nav>
  );
}
export default createReactMicroApp({ name: 'breadcrumb-nav', App: BreadcrumbNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'tabs',
    description: 'Tab navigation with underline active indicator',
    tags: ['navigation', 'tabs', 'panel'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function TabsNav() {
  const tabs = ['Overview', 'Features', 'Pricing', 'FAQ'];
  const [active, setActive] = useState('Overview');
  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActive(tab)} style={{ padding: '12px 20px', border: 'none', borderBottom: active === tab ? '2px solid #6366f1' : '2px solid transparent', marginBottom: '-2px', background: 'none', cursor: 'pointer', fontWeight: active === tab ? 600 : 400, color: active === tab ? '#6366f1' : '#6b7280', fontSize: '14px' }}>{tab}</button>
        ))}
      </div>
      <div style={{ padding: '20px 0', fontSize: '14px', color: '#374151' }}>Content for: {active}</div>
    </div>
  );
}
export default createReactMicroApp({ name: 'tabs-nav', App: TabsNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'stepper',
    description: 'Step-by-step progress navigation with numbered steps',
    tags: ['navigation', 'stepper', 'progress'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function StepperNav() {
  const steps = ['Account', 'Profile', 'Preferences', 'Review'];
  const [current, setCurrent] = useState(1);
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            {i > 0 && <div style={{ width: '40px', height: '2px', backgroundColor: i <= current ? '#6366f1' : '#e5e7eb' }} />}
            <div onClick={() => setCurrent(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '4px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: i <= current ? '#6366f1' : '#e5e7eb', color: i <= current ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>{i < current ? '\\u2713' : i + 1}</div>
              <span style={{ fontSize: '12px', color: i <= current ? '#6366f1' : '#9ca3af' }}>{step}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: '14px', color: '#374151' }}>Step {current + 1}: {steps[current]}</div>
    </div>
  );
}
export default createReactMicroApp({ name: 'stepper-nav', App: StepperNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'pagination',
    description: 'Pagination navigation with page numbers and prev/next',
    tags: ['navigation', 'pagination', 'pages'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function PaginationNav() {
  const totalPages = 10;
  const [page, setPage] = useState(1);
  const range = Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return start + i;
  });
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
      {range.map((p) => (
        <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', backgroundColor: p === page ? '#6366f1' : 'transparent', color: p === page ? '#fff' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>{p}</button>
      ))}
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
    </nav>
  );
}
export default createReactMicroApp({ name: 'pagination-nav', App: PaginationNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'menu',
    description: 'Dropdown context menu with nested items',
    tags: ['navigation', 'menu', 'dropdown'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function MenuNav() {
  const [open, setOpen] = useState(false);
  const items = ['New File', 'Open...', 'Save', 'Save As...', 'Export', 'Close'];
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' }}>File \\u25BC</button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '160px', zIndex: 10, padding: '4px 0' }}>
          {items.map((item, i) => (
            <button key={item} onClick={() => setOpen(false)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', borderTop: i === 4 ? '1px solid #e5e7eb' : 'none' }}>{item}</button>
          ))}
        </div>
      )}
    </div>
  );
}
export default createReactMicroApp({ name: 'menu-nav', App: MenuNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'navbar',
    description: 'Horizontal navbar with logo and nav links',
    tags: ['navigation', 'navbar', 'horizontal'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function NavbarNav() {
  const [active, setActive] = useState('home');
  const links = ['Home', 'Products', 'About', 'Blog', 'Contact'];
  return (
    <nav style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      <span style={{ fontSize: '18px', fontWeight: 700, marginRight: '32px' }}>Brand</span>
      {links.map((link) => {
        const key = link.toLowerCase();
        return <a key={key} href={'#' + key} onClick={() => setActive(key)} style={{ padding: '8px 14px', textDecoration: 'none', color: active === key ? '#6366f1' : '#6b7280', fontWeight: active === key ? 600 : 400, fontSize: '14px', borderRadius: '6px', backgroundColor: active === key ? '#ede9fe' : 'transparent' }}>{link}</a>;
      })}
    </nav>
  );
}
export default createReactMicroApp({ name: 'navbar-nav', App: NavbarNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'drawer',
    description: 'Navigation drawer that slides in from the side',
    tags: ['navigation', 'drawer', 'mobile'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function DrawerNav() {
  const [open, setOpen] = useState(false);
  const links = ['Dashboard', 'Profile', 'Settings', 'Help', 'Logout'];
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>\\u2630 Menu</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <nav style={{ width: '260px', backgroundColor: '#fff', boxShadow: '4px 0 16px rgba(0,0,0,0.1)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>Navigation</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>\\u2715</button>
            </div>
            {links.map((link) => (
              <a key={link} href={'#' + link.toLowerCase()} onClick={() => setOpen(false)} style={{ padding: '12px 8px', textDecoration: 'none', color: link === 'Logout' ? '#ef4444' : '#374151', fontSize: '15px', borderRadius: '6px' }}>{link}</a>
            ))}
          </nav>
          <div onClick={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        </div>
      )}
    </>
  );
}
export default createReactMicroApp({ name: 'drawer-nav', App: DrawerNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'mega-menu',
    description: 'Mega menu with multiple columns of categorized links',
    tags: ['navigation', 'mega-menu', 'enterprise'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function MegaMenuNav() {
  const [open, setOpen] = useState(false);
  const columns: Record<string, string[]> = {
    Products: ['Widget Pro', 'Widget Lite', 'Enterprise Suite'],
    Solutions: ['Startups', 'Agencies', 'Enterprise'],
    Resources: ['Documentation', 'Blog', 'Community'],
  };
  return (
    <nav style={{ position: 'relative', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', gap: '24px' }}>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>Corp</span>
        <button onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Products \\u25BC</button>
        <a href="#pricing" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px' }}>Pricing</a>
      </div>
      {open && (
        <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: '24px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', zIndex: 20 }}>
          {Object.entries(columns).map(([title, links]) => (
            <div key={title}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>{title}</h4>
              {links.map((l) => <a key={l} href="#" style={{ display: 'block', padding: '6px 0', textDecoration: 'none', color: '#6b7280', fontSize: '14px' }}>{l}</a>)}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
export default createReactMicroApp({ name: 'mega-menu-nav', App: MegaMenuNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'bottom-bar',
    description: 'Mobile bottom navigation bar with icon buttons',
    tags: ['navigation', 'bottom-bar', 'mobile'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function BottomBarNav() {
  const [active, setActive] = useState('home');
  const items = [
    { id: 'home', icon: '\\u2302', label: 'Home' },
    { id: 'search', icon: '\\u2315', label: 'Search' },
    { id: 'add', icon: '\\u271A', label: 'Create' },
    { id: 'notifications', icon: '\\u2709', label: 'Alerts' },
    { id: 'profile', icon: '\\u263A', label: 'Profile' },
  ];
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', padding: '6px 0' }}>
      {items.map((item) => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: active === item.id ? '#6366f1' : '#9ca3af' }}>
          <span style={{ fontSize: '20px' }}>{item.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: active === item.id ? 600 : 400 }}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
export default createReactMicroApp({ name: 'bottom-bar-nav', App: BottomBarNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'side-menu',
    description: 'Vertical side menu with active state highlighting',
    tags: ['navigation', 'side-menu', 'vertical'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SideMenuNav() {
  const [active, setActive] = useState('overview');
  const items = ['Overview', 'Accounts', 'Transactions', 'Reports', 'Settings'];
  return (
    <nav style={{ width: '200px', padding: '16px 8px' }}>
      {items.map((item) => {
        const key = item.toLowerCase();
        return (
          <button key={key} onClick={() => setActive(key)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: active === key ? '#ede9fe' : 'transparent', color: active === key ? '#6366f1' : '#374151', cursor: 'pointer', fontSize: '14px', fontWeight: active === key ? 600 : 400, marginBottom: '2px' }}>{item}</button>
        );
      })}
    </nav>
  );
}
export default createReactMicroApp({ name: 'side-menu-nav', App: SideMenuNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'wizard',
    description: 'Wizard navigation with labeled steps and completion status',
    tags: ['navigation', 'wizard', 'multi-step'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function WizardNav() {
  const steps = ['Select Plan', 'Account Details', 'Payment', 'Confirmation'];
  const [current, setCurrent] = useState(0);
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', marginBottom: '32px' }}>
        {steps.map((step, i) => (
          <div key={step} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', top: '14px', left: '-50%', right: '50%', height: '2px', backgroundColor: i <= current ? '#6366f1' : '#e5e7eb' }} />}
            <div onClick={() => i < current && setCurrent(i)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: i < current ? '#10b981' : i === current ? '#6366f1' : '#e5e7eb', color: i <= current ? '#fff' : '#9ca3af', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, cursor: i < current ? 'pointer' : 'default', position: 'relative', zIndex: 1 }}>{i < current ? '\\u2713' : i + 1}</div>
            <div style={{ fontSize: '12px', marginTop: '6px', color: i <= current ? '#374151' : '#9ca3af' }}>{step}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: current === 0 ? 'default' : 'pointer', opacity: current === 0 ? 0.4 : 1 }}>Back</button>
        <button onClick={() => setCurrent(Math.min(steps.length - 1, current + 1))} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{current === steps.length - 1 ? 'Finish' : 'Next'}</button>
      </div>
    </div>
  );
}
export default createReactMicroApp({ name: 'wizard-nav', App: WizardNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'segmented-control',
    description: 'Segmented control for switching between views',
    tags: ['navigation', 'segmented', 'toggle'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SegmentedControlNav() {
  const options = ['Day', 'Week', 'Month', 'Year'];
  const [selected, setSelected] = useState('Week');
  return (
    <div style={{ display: 'inline-flex', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '3px' }}>
      {options.map((opt) => (
        <button key={opt} onClick={() => setSelected(opt)} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: selected === opt ? '#fff' : 'transparent', color: selected === opt ? '#111827' : '#6b7280', cursor: 'pointer', fontWeight: selected === opt ? 600 : 400, fontSize: '14px', boxShadow: selected === opt ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>{opt}</button>
      ))}
    </div>
  );
}
export default createReactMicroApp({ name: 'segmented-control-nav', App: SegmentedControlNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'anchor-nav',
    description: 'Anchor navigation that scrolls to page sections',
    tags: ['navigation', 'anchor', 'scroll'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function AnchorNav() {
  const [active, setActive] = useState('intro');
  const sections = ['Introduction', 'Features', 'Pricing', 'FAQ', 'Contact'];
  return (
    <nav style={{ position: 'sticky', top: 0, backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', zIndex: 10 }}>
      <div style={{ display: 'flex', gap: '4px', maxWidth: '800px', margin: '0 auto' }}>
        {sections.map((section) => {
          const key = section.toLowerCase();
          return (
            <a key={key} href={'#' + key} onClick={() => setActive(key)} style={{ padding: '14px 16px', textDecoration: 'none', color: active === key ? '#6366f1' : '#6b7280', borderBottom: active === key ? '2px solid #6366f1' : '2px solid transparent', fontSize: '14px', fontWeight: active === key ? 600 : 400 }}>{section}</a>
          );
        })}
      </div>
    </nav>
  );
}
export default createReactMicroApp({ name: 'anchor-nav', App: AnchorNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'tag-nav',
    description: 'Tag-based navigation with toggleable filter chips',
    tags: ['navigation', 'tags', 'filter'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function TagNav() {
  const allTags = ['React', 'Vue', 'Svelte', 'Angular', 'TypeScript', 'JavaScript', 'CSS', 'Node.js'];
  const [selected, setSelected] = useState<Set<string>>(new Set(['React']));
  const toggle = (tag: string) => { const s = new Set(selected); if (s.has(tag)) s.delete(tag); else s.add(tag); setSelected(s); };
  return (
    <div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Filter by tag:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {allTags.map((tag) => (
          <button key={tag} onClick={() => toggle(tag)} style={{ padding: '6px 14px', borderRadius: '16px', border: selected.has(tag) ? '2px solid #6366f1' : '1px solid #d1d5db', backgroundColor: selected.has(tag) ? '#ede9fe' : '#fff', color: selected.has(tag) ? '#6366f1' : '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: selected.has(tag) ? 600 : 400 }}>{tag}</button>
        ))}
      </div>
      <div style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af' }}>{selected.size} tag{selected.size !== 1 ? 's' : ''} selected</div>
    </div>
  );
}
export default createReactMicroApp({ name: 'tag-nav', App: TagNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'dot-nav',
    description: 'Dot navigation for carousel/slideshow indicators',
    tags: ['navigation', 'dots', 'carousel'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function DotNav() {
  const total = 7;
  const [active, setActive] = useState(0);
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ padding: '40px', backgroundColor: '#f9fafb', borderRadius: '10px', marginBottom: '16px', fontSize: '18px', fontWeight: 600, color: '#374151' }}>Slide {active + 1} of {total}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => setActive(Math.max(0, active - 1))} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}>\\u25C0</button>
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: active === i ? '24px' : '10px', height: '10px', borderRadius: '5px', border: 'none', backgroundColor: active === i ? '#6366f1' : '#d1d5db', cursor: 'pointer', transition: 'width 0.2s', padding: 0 }} />
        ))}
        <button onClick={() => setActive(Math.min(total - 1, active + 1))} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}>\\u25B6</button>
      </div>
    </div>
  );
}
export default createReactMicroApp({ name: 'dot-nav', App: DotNav });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
