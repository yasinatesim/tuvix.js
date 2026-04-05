import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'collapsible',
    description: 'Sidebar that collapses to icon-only mode',
    tags: ['sidebar', 'collapsible', 'toggle'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const items = [
    { icon: '\\u2302', label: 'Home' },
    { icon: '\\u2709', label: 'Messages' },
    { icon: '\\u2699', label: 'Settings' },
    { icon: '\\u2753', label: 'Help' },
  ];

  return (
    <aside style={{ width: collapsed ? '60px' : '240px', height: '100vh', backgroundColor: '#1f2937', color: '#d1d5db', padding: '16px 8px', transition: 'width 0.2s', display: 'flex', flexDirection: 'column' }}>
      <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', marginBottom: '24px', textAlign: 'left', padding: '4px 8px' }}>
        {collapsed ? '\\u25B6' : '\\u25C0'}
      </button>
      {items.map((item) => (
        <a key={item.label} href={'#' + item.label.toLowerCase()} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', textDecoration: 'none', color: '#d1d5db', borderRadius: '6px', fontSize: '14px' }}>
          <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
          {!collapsed && <span>{item.label}</span>}
        </a>
      ))}
    </aside>
  );
}

export default createReactMicroApp({ name: 'collapsible-sidebar', App: CollapsibleSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-icons',
    description: 'Sidebar with icon-labeled navigation items',
    tags: ['sidebar', 'icons', 'navigation'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function IconSidebar() {
  const [active, setActive] = useState('dashboard');
  const items = [
    { id: 'dashboard', icon: '\\u25A3', label: 'Dashboard' },
    { id: 'users', icon: '\\u263A', label: 'Users' },
    { id: 'analytics', icon: '\\u2261', label: 'Analytics' },
    { id: 'files', icon: '\\u2750', label: 'Files' },
    { id: 'settings', icon: '\\u2699', label: 'Settings' },
  ];

  return (
    <aside style={{ width: '220px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '20px 12px' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, padding: '0 8px 20px', borderBottom: '1px solid #e5e7eb', marginBottom: '12px' }}>Admin</div>
      {items.map((item) => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 8px', border: 'none', borderRadius: '6px', backgroundColor: active === item.id ? '#ede9fe' : 'transparent', color: active === item.id ? '#6366f1' : '#374151', cursor: 'pointer', fontSize: '14px', textAlign: 'left' }}>
          <span style={{ fontSize: '16px' }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}

export default createReactMicroApp({ name: 'icon-sidebar', App: IconSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'nested',
    description: 'Sidebar with expandable nested sub-menu items',
    tags: ['sidebar', 'nested', 'submenu'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function NestedSidebar() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Products: true });
  const menus: Record<string, string[]> = {
    Products: ['All Products', 'Categories', 'Inventory'],
    Orders: ['Pending', 'Shipped', 'Returns'],
    Customers: ['List', 'Segments', 'Reviews'],
  };

  return (
    <aside style={{ width: '240px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '16px 0' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, padding: '0 16px 16px' }}>Store</div>
      {Object.entries(menus).map(([section, children]) => (
        <div key={section}>
          <button onClick={() => setExpanded((e) => ({ ...e, [section]: !e[section] }))} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
            {section}
            <span>{expanded[section] ? '\\u25BC' : '\\u25B6'}</span>
          </button>
          {expanded[section] && children.map((child) => (
            <a key={child} href={'#' + child.toLowerCase().replace(/\\s/g, '-')} style={{ display: 'block', padding: '8px 16px 8px 32px', textDecoration: 'none', color: '#6b7280', fontSize: '13px' }}>{child}</a>
          ))}
        </div>
      ))}
    </aside>
  );
}

export default createReactMicroApp({ name: 'nested-sidebar', App: NestedSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'mini',
    description: 'Mini icon-only sidebar with tooltips on hover',
    tags: ['sidebar', 'mini', 'icons'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function MiniSidebar() {
  const [hovered, setHovered] = useState<string | null>(null);
  const items = [
    { id: 'home', icon: '\\u2302' },
    { id: 'search', icon: '\\u2315' },
    { id: 'notifications', icon: '\\u2709' },
    { id: 'profile', icon: '\\u263A' },
    { id: 'settings', icon: '\\u2699' },
  ];

  return (
    <aside style={{ width: '56px', height: '100vh', backgroundColor: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', gap: '8px' }}>
      {items.map((item) => (
        <div key={item.id} style={{ position: 'relative' }}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}>
          <button style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', backgroundColor: hovered === item.id ? '#374151' : 'transparent', color: '#d1d5db', cursor: 'pointer', fontSize: '18px' }}>{item.icon}</button>
          {hovered === item.id && (
            <div style={{ position: 'absolute', left: '52px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#1f2937', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', zIndex: 10 }}>{item.id}</div>
          )}
        </div>
      ))}
    </aside>
  );
}

export default createReactMicroApp({ name: 'mini-sidebar', App: MiniSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark themed sidebar with highlighted active section',
    tags: ['sidebar', 'dark', 'theme'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function DarkSidebar() {
  const [active, setActive] = useState('overview');
  const items = ['Overview', 'Projects', 'Team', 'Calendar', 'Reports', 'Settings'];

  return (
    <aside style={{ width: '240px', height: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', padding: '24px 12px' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#818cf8', padding: '0 8px 20px' }}>DarkPanel</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map((item) => {
          const key = item.toLowerCase();
          return (
            <button key={key} onClick={() => setActive(key)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: active === key ? '#1e293b' : 'transparent', color: active === key ? '#818cf8' : '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: active === key ? 600 : 400 }}>
              {item}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default createReactMicroApp({ name: 'dark-sidebar', App: DarkSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-search',
    description: 'Sidebar with a search/filter input at the top',
    tags: ['sidebar', 'search', 'filter'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SearchSidebar() {
  const allItems = ['Dashboard', 'Users', 'Products', 'Orders', 'Analytics', 'Reports', 'Settings', 'Billing', 'Logs'];
  const [filter, setFilter] = useState('');
  const filtered = allItems.filter((i) => i.toLowerCase().includes(filter.toLowerCase()));

  return (
    <aside style={{ width: '240px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '16px 12px' }}>
      <input
        type="text"
        placeholder="Search menu..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '16px', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
      />
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filtered.map((item) => (
          <a key={item} href={'#' + item.toLowerCase()} style={{ padding: '8px 12px', textDecoration: 'none', color: '#374151', borderRadius: '4px', fontSize: '14px' }}>{item}</a>
        ))}
        {filtered.length === 0 && <span style={{ color: '#9ca3af', fontSize: '13px', padding: '8px 12px' }}>No results</span>}
      </nav>
    </aside>
  );
}

export default createReactMicroApp({ name: 'search-sidebar', App: SearchSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-user-profile',
    description: 'Sidebar with user profile section at the top',
    tags: ['sidebar', 'profile', 'user'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function ProfileSidebar() {
  const links = ['Dashboard', 'Projects', 'Messages', 'Settings'];

  return (
    <aside style={{ width: '240px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 700 }}>JD</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>Jane Doe</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>jane@example.com</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {links.map((link) => (
          <a key={link} href={'#' + link.toLowerCase()} style={{ padding: '10px 12px', textDecoration: 'none', color: '#374151', borderRadius: '6px', fontSize: '14px' }}>{link}</a>
        ))}
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
        <button style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '13px' }}>Sign Out</button>
      </div>
    </aside>
  );
}

export default createReactMicroApp({ name: 'profile-sidebar', App: ProfileSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-badge',
    description: 'Sidebar with notification badges next to menu items',
    tags: ['sidebar', 'badge', 'notifications'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function BadgeSidebar() {
  const items = [
    { label: 'Inbox', badge: 12 },
    { label: 'Tasks', badge: 3 },
    { label: 'Projects', badge: 0 },
    { label: 'Issues', badge: 7 },
    { label: 'Settings', badge: 0 },
  ];

  return (
    <aside style={{ width: '230px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '20px 12px' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, padding: '0 8px 16px' }}>Workspace</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map((item) => (
          <a key={item.label} href={'#' + item.label.toLowerCase()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', textDecoration: 'none', color: '#374151', borderRadius: '6px', fontSize: '14px' }}>
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 600, borderRadius: '10px', padding: '2px 7px', minWidth: '20px', textAlign: 'center' }}>{item.badge}</span>
            )}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default createReactMicroApp({ name: 'badge-sidebar', App: BadgeSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Sidebar that auto-hides on narrow viewports with toggle',
    tags: ['sidebar', 'responsive', 'mobile'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ResponsiveSidebar() {
  const [visible, setVisible] = useState(true);
  const links = ['Home', 'Explore', 'Library', 'History', 'Subscriptions'];

  return (
    <>
      {!visible && (
        <button onClick={() => setVisible(true)} style={{ position: 'fixed', top: '12px', left: '12px', zIndex: 60, padding: '8px 12px', border: 'none', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>\\u2630</button>
      )}
      {visible && (
        <aside style={{ width: '240px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '16px 12px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
            <span style={{ fontWeight: 700, fontSize: '18px' }}>Menu</span>
            <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>\\u2715</button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {links.map((link) => (
              <a key={link} href={'#' + link.toLowerCase()} style={{ padding: '10px 12px', textDecoration: 'none', color: '#374151', borderRadius: '6px', fontSize: '14px' }}>{link}</a>
            ))}
          </nav>
        </aside>
      )}
    </>
  );
}

export default createReactMicroApp({ name: 'responsive-sidebar', App: ResponsiveSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'multi-level',
    description: 'Multi-level sidebar with deep nesting support',
    tags: ['sidebar', 'multi-level', 'deep-nesting'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

interface MenuItem { label: string; children?: MenuItem[] }

const menuData: MenuItem[] = [
  { label: 'Dashboard' },
  { label: 'E-Commerce', children: [
    { label: 'Products', children: [{ label: 'Active' }, { label: 'Draft' }] },
    { label: 'Orders' },
  ]},
  { label: 'Content', children: [
    { label: 'Pages' },
    { label: 'Blog Posts' },
  ]},
  { label: 'Settings' },
];

function MenuNode({ item, depth }: { item: MenuItem; depth: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  return (
    <div>
      <button onClick={() => hasChildren && setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '8px 12px', paddingLeft: 12 + depth * 16 + 'px', border: 'none', background: 'none', cursor: 'pointer', color: '#374151', fontSize: '13px', textAlign: 'left' }}>
        {item.label}
        {hasChildren && <span>{open ? '\\u25BC' : '\\u25B6'}</span>}
      </button>
      {open && item.children?.map((child) => <MenuNode key={child.label} item={child} depth={depth + 1} />)}
    </div>
  );
}

function MultiLevelSidebar() {
  return (
    <aside style={{ width: '250px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '16px 0' }}>
      <div style={{ fontWeight: 700, fontSize: '18px', padding: '0 16px 16px' }}>Admin</div>
      {menuData.map((item) => <MenuNode key={item.label} item={item} depth={0} />)}
    </aside>
  );
}

export default createReactMicroApp({ name: 'multi-level-sidebar', App: MultiLevelSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-footer',
    description: 'Sidebar with a footer section containing links and version info',
    tags: ['sidebar', 'footer', 'info'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function FooterSidebar() {
  const mainLinks = ['Dashboard', 'Projects', 'Team', 'Calendar'];
  const footerLinks = ['Help Center', 'Privacy Policy'];

  return (
    <aside style={{ width: '240px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 16px', fontWeight: 700, fontSize: '18px' }}>App</div>
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {mainLinks.map((link) => (
          <a key={link} href={'#' + link.toLowerCase()} style={{ padding: '10px 12px', textDecoration: 'none', color: '#374151', borderRadius: '6px', fontSize: '14px' }}>{link}</a>
        ))}
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
        {footerLinks.map((link) => (
          <a key={link} href={'#' + link.toLowerCase().replace(/\\s/g, '-')} style={{ display: 'block', padding: '4px 0', textDecoration: 'none', color: '#9ca3af', fontSize: '12px' }}>{link}</a>
        ))}
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#d1d5db' }}>v2.4.1</div>
      </div>
    </aside>
  );
}

export default createReactMicroApp({ name: 'footer-sidebar', App: FooterSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'sticky',
    description: 'Sticky sidebar that stays in view while content scrolls',
    tags: ['sidebar', 'sticky', 'scroll'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function StickySidebar() {
  const [active, setActive] = useState('intro');
  const sections = ['Introduction', 'Getting Started', 'API Reference', 'Examples', 'FAQ', 'Changelog'];

  return (
    <aside style={{ position: 'sticky', top: '20px', width: '220px', padding: '16px 12px', alignSelf: 'flex-start' }}>
      <div style={{ fontWeight: 700, fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', padding: '0 8px' }}>On this page</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sections.map((section) => {
          const key = section.toLowerCase().replace(/\\s/g, '-');
          return (
            <button key={key} onClick={() => setActive(key)} style={{ textAlign: 'left', padding: '6px 8px', border: 'none', borderLeft: active === key ? '2px solid #6366f1' : '2px solid transparent', background: 'none', color: active === key ? '#6366f1' : '#6b7280', cursor: 'pointer', fontSize: '13px' }}>
              {section}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default createReactMicroApp({ name: 'sticky-sidebar', App: StickySidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-groups',
    description: 'Sidebar with items organized into labeled groups',
    tags: ['sidebar', 'groups', 'organized'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function GroupedSidebar() {
  const groups: Record<string, string[]> = {
    Main: ['Dashboard', 'Feed', 'Discover'],
    Management: ['Users', 'Roles', 'Permissions'],
    Support: ['Tickets', 'Knowledge Base', 'Chat'],
  };

  return (
    <aside style={{ width: '240px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '20px 12px' }}>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: '6px' }}>{group}</div>
          {items.map((item) => (
            <a key={item} href={'#' + item.toLowerCase().replace(/\\s/g, '-')} style={{ display: 'block', padding: '8px 12px', textDecoration: 'none', color: '#374151', borderRadius: '6px', fontSize: '14px' }}>{item}</a>
          ))}
        </div>
      ))}
    </aside>
  );
}

export default createReactMicroApp({ name: 'grouped-sidebar', App: GroupedSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'overlay',
    description: 'Overlay sidebar that slides in over content with backdrop',
    tags: ['sidebar', 'overlay', 'modal'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function OverlaySidebar() {
  const [open, setOpen] = useState(false);
  const links = ['Profile', 'Notifications', 'Messages', 'Bookmarks', 'Settings', 'Logout'];

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 18px', border: 'none', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', cursor: 'pointer' }}>Open Menu</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <aside style={{ width: '280px', backgroundColor: '#fff', boxShadow: '4px 0 16px rgba(0,0,0,0.1)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>Menu</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>\\u2715</button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {links.map((link) => (
                <a key={link} href={'#' + link.toLowerCase()} onClick={() => setOpen(false)} style={{ padding: '12px 8px', textDecoration: 'none', color: '#374151', borderRadius: '6px', fontSize: '15px' }}>{link}</a>
              ))}
            </nav>
          </aside>
          <div onClick={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        </div>
      )}
    </>
  );
}

export default createReactMicroApp({ name: 'overlay-sidebar', App: OverlaySidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-toggle',
    description: 'Sidebar with toggle switches for feature flags',
    tags: ['sidebar', 'toggle', 'switches'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ToggleSidebar() {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    'Dark Mode': false,
    'Notifications': true,
    'Auto-save': true,
    'Compact View': false,
    'Beta Features': false,
  });

  const toggle = (key: string) => setFlags((f) => ({ ...f, [key]: !f[key] }));

  return (
    <aside style={{ width: '260px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '20px 16px' }}>
      <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '20px' }}>Preferences</div>
      {Object.entries(flags).map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
          <button onClick={() => toggle(label)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', backgroundColor: value ? '#6366f1' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s' }}>
            <span style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
      ))}
    </aside>
  );
}

export default createReactMicroApp({ name: 'toggle-sidebar', App: ToggleSidebar });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
