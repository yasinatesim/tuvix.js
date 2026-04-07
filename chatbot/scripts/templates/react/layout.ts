import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'dashboard',
    description: 'Dashboard layout with sidebar, header, and main content area',
    tags: ['layout', 'dashboard', 'admin'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function DashboardLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '220px', backgroundColor: '#1f2937', color: '#d1d5db', padding: '20px 12px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', padding: '0 8px' }}>Dashboard</div>
        {['Overview', 'Analytics', 'Users', 'Settings'].map((item) => (
          <a key={item} href={'#' + item.toLowerCase()} style={{ display: 'block', padding: '10px 12px', color: '#d1d5db', textDecoration: 'none', borderRadius: '6px', fontSize: '14px' }}>{item}</a>
        ))}
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '14px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>Overview</h1>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px' }}>U</div>
        </header>
        <main style={{ flex: 1, padding: '24px', backgroundColor: '#f9fafb', overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {['Revenue', 'Users', 'Orders'].map((label) => (
              <div key={label} style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>0</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'dashboard-layout', App: DashboardLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'blog',
    description: 'Blog layout with article content area and sidebar',
    tags: ['layout', 'blog', 'content'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function BlogLayout() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', display: 'flex', gap: '32px' }}>
      <main style={{ flex: 1 }}>
        <article>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', lineHeight: 1.2 }}>Understanding Micro-Frontend Architecture</h1>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>March 15, 2025 &middot; 8 min read</div>
          <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#374151' }}>Micro-frontends extend the concept of microservices to the frontend world. Each feature can be developed, tested, and deployed independently.</p>
          <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#374151' }}>This architecture enables teams to work autonomously while maintaining a cohesive user experience across the application.</p>
        </article>
      </main>
      <aside style={{ width: '280px', flexShrink: 0 }}>
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700 }}>About Author</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>Jane Doe is a senior frontend architect specializing in distributed systems.</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '10px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700 }}>Related Posts</h3>
          {['Scaling Teams with MFEs', 'State Sharing Patterns'].map((t) => (
            <a key={t} href="#" style={{ display: 'block', fontSize: '14px', color: '#6366f1', textDecoration: 'none', marginBottom: '8px' }}>{t}</a>
          ))}
        </div>
      </aside>
    </div>
  );
}

const app = createReactMicroApp({ name: 'blog-layout', App: BlogLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'portfolio',
    description: 'Portfolio layout with project grid and hero section',
    tags: ['layout', 'portfolio', 'showcase'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function PortfolioLayout() {
  const projects = Array.from({ length: 6 }).map((_, i) => ({ id: i, title: 'Project ' + (i + 1), tag: ['Web', 'Mobile', 'Design'][i % 3] }));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: '#111827', color: '#fff' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 12px' }}>John Smith</h1>
        <p style={{ fontSize: '18px', color: '#9ca3af', margin: 0 }}>Frontend Developer & Designer</p>
      </section>
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Projects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {projects.map((p) => (
            <div key={p.id} style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ height: '160px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Preview</div>
              <div style={{ padding: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{p.title}</div>
                <span style={{ fontSize: '12px', color: '#6366f1' }}>{p.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const app = createReactMicroApp({ name: 'portfolio-layout', App: PortfolioLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'landing',
    description: 'Landing page layout with hero, features, and CTA sections',
    tags: ['layout', 'landing', 'marketing'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function LandingLayout() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>Product</span>
        <button style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>Get Started</button>
      </header>
      <section style={{ padding: '80px 32px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1 }}>Build Better Frontends</h1>
        <p style={{ fontSize: '18px', color: '#6b7280', maxWidth: '600px', margin: '0 auto 32px' }}>The modern micro-frontend framework that scales with your team</p>
        <button style={{ padding: '14px 32px', border: 'none', borderRadius: '8px', backgroundColor: '#6366f1', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>Start Free Trial</button>
      </section>
      <section style={{ padding: '60px 32px', maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
        {['Fast', 'Secure', 'Scalable'].map((f) => (
          <div key={f} style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>\\u2605</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>{f}</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Enterprise-grade {f.toLowerCase()} architecture for modern teams.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

const app = createReactMicroApp({ name: 'landing-layout', App: LandingLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'admin',
    description: 'Admin panel layout with top nav, sidebar, and data table area',
    tags: ['layout', 'admin', 'panel'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function AdminLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#111827', color: '#fff' }}>
        <span style={{ fontWeight: 700, fontSize: '18px' }}>Admin Panel</span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#d1d5db' }}>admin@example.com</span>
          <button style={{ padding: '6px 14px', border: '1px solid #4b5563', borderRadius: '6px', background: 'transparent', color: '#d1d5db', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </header>
      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: '200px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', padding: '16px 12px' }}>
          {['Users', 'Products', 'Orders', 'Analytics', 'Settings'].map((item) => (
            <a key={item} href={'#' + item.toLowerCase()} style={{ display: 'block', padding: '8px 10px', textDecoration: 'none', color: '#374151', fontSize: '14px', borderRadius: '4px' }}>{item}</a>
          ))}
        </aside>
        <main style={{ flex: 1, padding: '24px', backgroundColor: '#fff', overflow: 'auto' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>User Management</h2>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', padding: '10px 16px', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>
              <span>Name</span><span>Email</span><span>Role</span><span>Actions</span>
            </div>
            {['Alice', 'Bob', 'Charlie'].map((name) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', padding: '10px 16px', borderTop: '1px solid #e5e7eb', fontSize: '14px' }}>
                <span>{name}</span><span>{name.toLowerCase()}@mail.com</span><span>User</span><span><a href="#edit" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '13px' }}>Edit</a></span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'admin-layout', App: AdminLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'e-commerce',
    description: 'E-commerce layout with product grid and filter sidebar',
    tags: ['layout', 'ecommerce', 'shop'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function EcommerceLayout() {
  const products = Array.from({ length: 8 }).map((_, i) => ({ id: i, name: 'Product ' + (i + 1), price: (19.99 + i * 10).toFixed(2) }));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>Shop</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="#cart" style={{ textDecoration: 'none', color: '#374151' }}>Cart (0)</a>
          <a href="#account" style={{ textDecoration: 'none', color: '#374151' }}>Account</a>
        </div>
      </header>
      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '24px', gap: '24px' }}>
        <aside style={{ width: '220px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Categories</h3>
          {['All', 'Electronics', 'Clothing', 'Home'].map((c) => (
            <a key={c} href="#" style={{ display: 'block', padding: '6px 0', textDecoration: 'none', color: '#374151', fontSize: '14px' }}>{c}</a>
          ))}
        </aside>
        <main style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {products.map((p) => (
              <div key={p.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ height: '140px', backgroundColor: '#f3f4f6' }} />
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#6366f1', marginTop: '4px' }}>\${p.price}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'ecommerce-layout', App: EcommerceLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'docs',
    description: 'Documentation layout with left nav, content, and right TOC',
    tags: ['layout', 'docs', 'documentation'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function DocsLayout() {
  const navItems = ['Getting Started', 'Installation', 'Configuration', 'API Reference', 'Examples'];
  const toc = ['Overview', 'Prerequisites', 'Quick Start', 'Next Steps'];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '240px', borderRight: '1px solid #e5e7eb', padding: '20px 12px', overflow: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', padding: '0 8px 16px' }}>Docs</div>
        {navItems.map((item) => (
          <a key={item} href="#" style={{ display: 'block', padding: '8px 12px', textDecoration: 'none', color: '#374151', fontSize: '14px', borderRadius: '4px' }}>{item}</a>
        ))}
      </aside>
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Getting Started</h1>
        <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#374151' }}>Welcome to the documentation. This guide will help you set up your first micro-frontend application.</p>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px' }}>Prerequisites</h2>
        <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#374151' }}>You will need Node.js 18+ and a package manager like pnpm installed on your system.</p>
      </main>
      <aside style={{ width: '200px', borderLeft: '1px solid #e5e7eb', padding: '20px 12px', overflow: 'auto' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>On this page</div>
        {toc.map((item) => (
          <a key={item} href="#" style={{ display: 'block', padding: '4px 8px', textDecoration: 'none', color: '#6b7280', fontSize: '13px' }}>{item}</a>
        ))}
      </aside>
    </div>
  );
}

const app = createReactMicroApp({ name: 'docs-layout', App: DocsLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'saas-app',
    description: 'SaaS application layout with top bar, sidebar, and main workspace',
    tags: ['layout', 'saas', 'application'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function SaasLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#6366f1' }}>SaaS</span>
          <nav style={{ display: 'flex', gap: '16px' }}>{['Projects', 'Team', 'Billing'].map((l) => <a key={l} href="#" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '14px' }}>{l}</a>)}</nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input placeholder="Search..." style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>U</div>
        </div>
      </header>
      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: '56px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px', gap: '12px' }}>
          {['\\u2302', '\\u2709', '\\u2699'].map((icon, i) => <button key={i} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px' }}>{icon}</button>)}
        </aside>
        <main style={{ flex: 1, padding: '24px', backgroundColor: '#fff', overflow: 'auto' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700 }}>Workspace</h2>
          <div style={{ padding: '40px', backgroundColor: '#f9fafb', borderRadius: '10px', textAlign: 'center', color: '#9ca3af' }}>Main content area</div>
        </main>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'saas-layout', App: SaasLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'split',
    description: 'Split layout with two equal panels side by side',
    tags: ['layout', 'split', 'panels'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function SplitLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', color: '#fff', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>Welcome Back</h1>
          <p style={{ fontSize: '16px', color: '#9ca3af', lineHeight: 1.6 }}>Access your dashboard and manage your projects from one place.</p>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Sign In</h2>
          <input placeholder="Email" style={{ display: 'block', width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }} />
          <input type="password" placeholder="Password" style={{ display: 'block', width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '20px', outline: 'none', boxSizing: 'border-box' }} />
          <button style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Log In</button>
        </div>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'split-layout', App: SplitLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'three-column',
    description: 'Three-column layout with left nav, content, and right panel',
    tags: ['layout', 'three-column', 'complex'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function ThreeColumnLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: '200px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Navigation</h3>
        {['Feed', 'Messages', 'Groups', 'Events'].map((i) => <a key={i} href="#" style={{ display: 'block', padding: '6px 0', textDecoration: 'none', color: '#374151', fontSize: '14px' }}>{i}</a>)}
      </aside>
      <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700 }}>Feed</h2>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Post #{n}</div>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Content of the post goes here with enough text to be meaningful.</p>
          </div>
        ))}
      </main>
      <aside style={{ width: '260px', backgroundColor: '#f9fafb', borderLeft: '1px solid #e5e7eb', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Trending</h3>
        {['Topic A', 'Topic B', 'Topic C'].map((t) => <div key={t} style={{ padding: '8px 0', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{t}</div>)}
      </aside>
    </div>
  );
}

const app = createReactMicroApp({ name: 'three-column-layout', App: ThreeColumnLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'two-column',
    description: 'Simple two-column layout with sidebar and content',
    tags: ['layout', 'two-column', 'simple'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function TwoColumnLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '280px', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '24px' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>Menu</h2>
        {['Section A', 'Section B', 'Section C', 'Section D'].map((s) => (
          <a key={s} href="#" style={{ display: 'block', padding: '10px 12px', textDecoration: 'none', color: '#374151', fontSize: '14px', borderRadius: '6px', marginBottom: '2px' }}>{s}</a>
        ))}
      </aside>
      <main style={{ flex: 1, padding: '32px', backgroundColor: '#f9fafb' }}>
        <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 700 }}>Section A</h1>
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: '#374151' }}>Main content goes here. The two-column layout is ideal for settings pages, admin panels, and content management interfaces.</p>
        </div>
      </main>
    </div>
  );
}

const app = createReactMicroApp({ name: 'two-column-layout', App: TwoColumnLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'full-width',
    description: 'Full-width layout with no sidebar, centered content blocks',
    tags: ['layout', 'full-width', 'centered'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function FullWidthLayout() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ padding: '16px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>Brand</span>
        <nav style={{ display: 'flex', gap: '20px' }}>
          {['Home', 'About', 'Services', 'Contact'].map((l) => <a key={l} href="#" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px' }}>{l}</a>)}
        </nav>
      </header>
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', textAlign: 'center' }}>Welcome</h1>
        <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#374151', textAlign: 'center', marginBottom: '40px' }}>A clean, full-width reading experience without distractions.</p>
        <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '10px' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#374151' }}>Content blocks are centered and constrained for readability, while the header spans the full viewport width.</p>
        </div>
      </main>
    </div>
  );
}

const app = createReactMicroApp({ name: 'full-width-layout', App: FullWidthLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'sticky-header',
    description: 'Layout with sticky header and scrollable content area',
    tags: ['layout', 'sticky-header', 'scroll'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function StickyHeaderLayout() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, padding: '14px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>App</span>
        <nav style={{ display: 'flex', gap: '16px' }}>
          {['Home', 'Docs', 'Blog'].map((l) => <a key={l} href="#" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '14px' }}>{l}</a>)}
        </nav>
      </header>
      <main style={{ flex: 1, overflow: 'auto', padding: '32px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>Section {i + 1}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Content block demonstrating scrollable area under fixed header.</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const app = createReactMicroApp({ name: 'sticky-header-layout', App: StickyHeaderLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'sticky-sidebar',
    description: 'Layout with sticky sidebar and scrollable main content',
    tags: ['layout', 'sticky-sidebar', 'scroll'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function StickySidebarLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '220px', position: 'sticky', top: 0, height: '100vh', backgroundColor: '#1f2937', color: '#d1d5db', padding: '20px 12px', overflow: 'auto' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', padding: '0 8px' }}>Panel</div>
        {['Home', 'Projects', 'Tasks', 'Calendar', 'Reports', 'Settings'].map((item) => (
          <a key={item} href="#" style={{ display: 'block', padding: '8px 12px', textDecoration: 'none', color: '#d1d5db', fontSize: '14px', borderRadius: '4px' }}>{item}</a>
        ))}
      </aside>
      <main style={{ flex: 1, padding: '32px', backgroundColor: '#f9fafb' }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>Item {i + 1}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Scrollable content with sticky sidebar that stays visible.</p>
          </div>
        ))}
      </main>
    </div>
  );
}

const app = createReactMicroApp({ name: 'sticky-sidebar-layout', App: StickySidebarLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'grid',
    description: 'CSS Grid layout with configurable column count and gap',
    tags: ['layout', 'grid', 'responsive'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function GridLayout() {
  const [cols, setCols] = useState(3);
  const items = Array.from({ length: 12 }).map((_, i) => i + 1);

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Grid Layout</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[2, 3, 4].map((n) => (
            <button key={n} onClick={() => setCols(n)} style={{ padding: '6px 14px', border: cols === n ? '2px solid #6366f1' : '1px solid #d1d5db', borderRadius: '6px', backgroundColor: cols === n ? '#ede9fe' : '#fff', color: cols === n ? '#6366f1' : '#374151', cursor: 'pointer', fontWeight: 600 }}>{n} cols</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: '16px' }}>
        {items.map((n) => (
          <div key={n} style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#6366f1' }}>{n}</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Item</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'grid-layout', App: GridLayout });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
