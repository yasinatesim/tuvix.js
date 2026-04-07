import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal header with logo and navigation links',
    tags: ['header', 'minimal', 'navigation'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function MinimalHeader() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
      <span style={{ fontSize: '20px', fontWeight: 700 }}>Logo</span>
      <nav style={{ display: 'flex', gap: '24px' }}>
        <a href="#home" style={{ textDecoration: 'none', color: '#374151' }}>Home</a>
        <a href="#about" style={{ textDecoration: 'none', color: '#374151' }}>About</a>
        <a href="#contact" style={{ textDecoration: 'none', color: '#374151' }}>Contact</a>
      </nav>
    </header>
  );
}

const app = createReactMicroApp({ name: 'minimal-header', App: MinimalHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-search',
    description: 'Header with integrated search bar and suggestions',
    tags: ['header', 'search', 'interactive'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SearchHeader() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const suggestions = ['Dashboard', 'Settings', 'Profile', 'Help'].filter(s => s.toLowerCase().includes(query.toLowerCase()));

  return (
    <header style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <span style={{ fontSize: '20px', fontWeight: 700, marginRight: '32px' }}>Brand</span>
      <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
        />
        {focused && query && suggestions.length > 0 && (
          <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', listStyle: 'none', padding: '4px 0', margin: '4px 0 0', zIndex: 10 }}>
            {suggestions.map((s) => (
              <li key={s} style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => setQuery(s)}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}

const app = createReactMicroApp({ name: 'search-header', App: SearchHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-auth',
    description: 'Header with authentication buttons and user avatar',
    tags: ['header', 'auth', 'user'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function AuthHeader() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      <span style={{ fontSize: '20px', fontWeight: 700 }}>AppName</span>
      <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <a href="#features" style={{ textDecoration: 'none', color: '#6b7280' }}>Features</a>
        <a href="#pricing" style={{ textDecoration: 'none', color: '#6b7280' }}>Pricing</a>
        {loggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }}>JD</div>
            <button onClick={() => setLoggedIn(false)} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}>Log out</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setLoggedIn(true)} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}>Log in</button>
            <button onClick={() => setLoggedIn(true)} style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', background: '#6366f1', color: '#fff', cursor: 'pointer' }}>Sign up</button>
          </div>
        )}
      </nav>
    </header>
  );
}

const app = createReactMicroApp({ name: 'auth-header', App: AuthHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive header with hamburger menu toggle for mobile',
    tags: ['header', 'responsive', 'mobile'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ResponsiveHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = ['Home', 'Products', 'About', 'Contact'];

  return (
    <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>Brand</span>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', display: 'block' }}>
          {menuOpen ? '\\u2715' : '\\u2630'}
        </button>
      </div>
      {menuOpen && (
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 24px 16px' }}>
          {links.map((link) => (
            <a key={link} href={'#' + link.toLowerCase()} onClick={() => setMenuOpen(false)} style={{ padding: '10px 0', textDecoration: 'none', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{link}</a>
          ))}
        </nav>
      )}
    </header>
  );
}

const app = createReactMicroApp({ name: 'responsive-header', App: ResponsiveHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed header with contrasting text and accent colors',
    tags: ['header', 'dark', 'theme'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function DarkHeader() {
  const links = ['Dashboard', 'Analytics', 'Reports', 'Settings'];

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', backgroundColor: '#111827', color: '#f9fafb' }}>
      <span style={{ fontSize: '20px', fontWeight: 700, color: '#818cf8' }}>DarkApp</span>
      <nav style={{ display: 'flex', gap: '24px' }}>
        {links.map((link) => (
          <a key={link} href={'#' + link.toLowerCase()} style={{ textDecoration: 'none', color: '#d1d5db', fontSize: '14px' }}>{link}</a>
        ))}
      </nav>
      <button style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', backgroundColor: '#818cf8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Upgrade</button>
    </header>
  );
}

const app = createReactMicroApp({ name: 'dark-header', App: DarkHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'sticky',
    description: 'Sticky header that remains at top on scroll with shadow',
    tags: ['header', 'sticky', 'scroll'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useEffect } from 'react';

function StickyHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 24px',
      backgroundColor: '#fff',
      boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      <span style={{ fontSize: '20px', fontWeight: 700 }}>StickyBrand</span>
      <nav style={{ display: 'flex', gap: '20px' }}>
        <a href="#home" style={{ textDecoration: 'none', color: '#374151' }}>Home</a>
        <a href="#services" style={{ textDecoration: 'none', color: '#374151' }}>Services</a>
        <a href="#contact" style={{ textDecoration: 'none', color: '#374151' }}>Contact</a>
      </nav>
    </header>
  );
}

const app = createReactMicroApp({ name: 'sticky-header', App: StickyHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-logo',
    description: 'Header with image logo placeholder and centered navigation',
    tags: ['header', 'logo', 'centered'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function LogoHeader() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '2px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>T</div>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>Tuvix</span>
      </div>
      <nav style={{ display: 'flex', gap: '28px' }}>
        <a href="#docs" style={{ textDecoration: 'none', color: '#374151', fontWeight: 500 }}>Docs</a>
        <a href="#api" style={{ textDecoration: 'none', color: '#374151', fontWeight: 500 }}>API</a>
        <a href="#blog" style={{ textDecoration: 'none', color: '#374151', fontWeight: 500 }}>Blog</a>
        <a href="#github" style={{ textDecoration: 'none', color: '#374151', fontWeight: 500 }}>GitHub</a>
      </nav>
    </header>
  );
}

const app = createReactMicroApp({ name: 'logo-header', App: LogoHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-dropdown',
    description: 'Header with dropdown menus for nested navigation',
    tags: ['header', 'dropdown', 'nested'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function DropdownHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menus: Record<string, string[]> = {
    Products: ['Widget A', 'Widget B', 'Widget C'],
    Solutions: ['Enterprise', 'Startup', 'Agency'],
    Resources: ['Docs', 'Tutorials', 'Community'],
  };

  return (
    <header style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
      <span style={{ fontSize: '20px', fontWeight: 700, marginRight: '40px' }}>Brand</span>
      <nav style={{ display: 'flex', gap: '4px' }}>
        {Object.entries(menus).map(([label, items]) => (
          <div key={label} style={{ position: 'relative' }}
            onMouseEnter={() => setOpenMenu(label)}
            onMouseLeave={() => setOpenMenu(null)}>
            <button style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, color: '#374151' }}>{label}</button>
            {openMenu === label && (
              <ul style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', listStyle: 'none', padding: '8px 0', margin: 0, minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20 }}>
                {items.map((item) => (
                  <li key={item}><a href={'#' + item.toLowerCase().replace(/\\s/g, '-')} style={{ display: 'block', padding: '8px 16px', textDecoration: 'none', color: '#374151' }}>{item}</a></li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}

const app = createReactMicroApp({ name: 'dropdown-header', App: DropdownHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-breadcrumb',
    description: 'Header that includes a breadcrumb trail below the main nav',
    tags: ['header', 'breadcrumb', 'navigation'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function BreadcrumbHeader() {
  const crumbs = [
    { label: 'Home', href: '#home' },
    { label: 'Products', href: '#products' },
    { label: 'Widget Pro', href: '#widget-pro' },
  ];

  return (
    <header style={{ borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>Store</span>
        <nav style={{ display: 'flex', gap: '20px' }}>
          <a href="#shop" style={{ textDecoration: 'none', color: '#374151' }}>Shop</a>
          <a href="#deals" style={{ textDecoration: 'none', color: '#374151' }}>Deals</a>
          <a href="#cart" style={{ textDecoration: 'none', color: '#374151' }}>Cart (0)</a>
        </nav>
      </div>
      <div style={{ padding: '8px 24px', backgroundColor: '#f9fafb', fontSize: '13px' }}>
        {crumbs.map((crumb, i) => (
          <span key={crumb.label}>
            {i > 0 && <span style={{ margin: '0 8px', color: '#9ca3af' }}>/</span>}
            {i < crumbs.length - 1
              ? <a href={crumb.href} style={{ textDecoration: 'none', color: '#6366f1' }}>{crumb.label}</a>
              : <span style={{ color: '#6b7280' }}>{crumb.label}</span>}
          </span>
        ))}
      </div>
    </header>
  );
}

const app = createReactMicroApp({ name: 'breadcrumb-header', App: BreadcrumbHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-actions',
    description: 'Header with action buttons like notifications and settings',
    tags: ['header', 'actions', 'icons'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ActionsHeader() {
  const [notifCount] = useState(3);

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      <span style={{ fontSize: '20px', fontWeight: 700 }}>Platform</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
          &#x1F514;
          {notifCount > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-6px', backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifCount}</span>
          )}
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>&#x2699;</button>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 700 }}>AB</div>
      </div>
    </header>
  );
}

const app = createReactMicroApp({ name: 'actions-header', App: ActionsHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'transparent',
    description: 'Transparent header designed for hero sections with overlay text',
    tags: ['header', 'transparent', 'hero'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function TransparentHeader() {
  return (
    <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', background: 'transparent' }}>
      <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Overlay</span>
      <nav style={{ display: 'flex', gap: '24px' }}>
        {['Home', 'Gallery', 'About', 'Contact'].map((link) => (
          <a key={link} href={'#' + link.toLowerCase()} style={{ textDecoration: 'none', color: '#fff', fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{link}</a>
        ))}
      </nav>
    </header>
  );
}

const app = createReactMicroApp({ name: 'transparent-header', App: TransparentHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'fixed',
    description: 'Fixed position header that stays at viewport top',
    tags: ['header', 'fixed', 'position'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function FixedHeader() {
  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', backgroundColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
      <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>FixedNav</span>
      <nav style={{ display: 'flex', gap: '24px' }}>
        <a href="#overview" style={{ textDecoration: 'none', color: '#4b5563' }}>Overview</a>
        <a href="#pricing" style={{ textDecoration: 'none', color: '#4b5563' }}>Pricing</a>
        <a href="#faq" style={{ textDecoration: 'none', color: '#4b5563' }}>FAQ</a>
      </nav>
      <button style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Get Started</button>
    </header>
  );
}

const app = createReactMicroApp({ name: 'fixed-header', App: FixedHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-banner',
    description: 'Header with a promotional banner above the main nav',
    tags: ['header', 'banner', 'promotion'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function BannerHeader() {
  const [bannerVisible, setBannerVisible] = useState(true);

  return (
    <header>
      {bannerVisible && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 16px', backgroundColor: '#6366f1', color: '#fff', fontSize: '14px', position: 'relative' }}>
          <span>New release! Check out v2.0 features</span>
          <button onClick={() => setBannerVisible(false)} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>\\u2715</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>Product</span>
        <nav style={{ display: 'flex', gap: '20px' }}>
          <a href="#features" style={{ textDecoration: 'none', color: '#374151' }}>Features</a>
          <a href="#changelog" style={{ textDecoration: 'none', color: '#374151' }}>Changelog</a>
          <a href="#docs" style={{ textDecoration: 'none', color: '#374151' }}>Docs</a>
        </nav>
      </div>
    </header>
  );
}

const app = createReactMicroApp({ name: 'banner-header', App: BannerHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'mobile-menu',
    description: 'Header with slide-in mobile menu panel',
    tags: ['header', 'mobile', 'slide-menu'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function MobileMenuHeader() {
  const [open, setOpen] = useState(false);
  const links = ['Home', 'Explore', 'Bookmarks', 'Profile', 'Settings'];

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>MobileApp</span>
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>\\u2630</button>
      </header>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div onClick={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          <nav style={{ width: '280px', backgroundColor: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button onClick={() => setOpen(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', marginBottom: '16px' }}>\\u2715</button>
            {links.map((link) => (
              <a key={link} href={'#' + link.toLowerCase()} onClick={() => setOpen(false)} style={{ padding: '12px 8px', textDecoration: 'none', color: '#374151', borderRadius: '6px', fontSize: '16px' }}>{link}</a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

const app = createReactMicroApp({ name: 'mobile-menu-header', App: MobileMenuHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-progress',
    description: 'Header with a progress bar indicating page scroll position',
    tags: ['header', 'progress', 'scroll'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useEffect } from 'react';

function ProgressHeader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>Reader</span>
        <nav style={{ display: 'flex', gap: '20px' }}>
          <a href="#article" style={{ textDecoration: 'none', color: '#374151' }}>Article</a>
          <a href="#comments" style={{ textDecoration: 'none', color: '#374151' }}>Comments</a>
        </nav>
      </div>
      <div style={{ height: '3px', backgroundColor: '#e5e7eb' }}>
        <div style={{ height: '100%', width: progress + '%', backgroundColor: '#6366f1', transition: 'width 0.1s' }} />
      </div>
    </header>
  );
}

const app = createReactMicroApp({ name: 'progress-header', App: ProgressHeader });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
