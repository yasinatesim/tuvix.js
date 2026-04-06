import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'dashboard',
    description: 'Dashboard layout with sidebar, header and main content area',
    tags: ['layout', 'dashboard', 'admin'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-dashboard-layout',
  template: \`

    <div class="layout">
      <aside class="sidebar">
        <div class="brand">Dashboard</div>
        <nav><a *ngFor="let item of navItems" [href]="'#' + item.toLowerCase()">{{ item }}</a></nav>
      </aside>
      <div class="main">
        <header class="header">
          <h1 class="page-title">Overview</h1>
          <div class="avatar">AD</div>
        </header>
        <div class="content">
          <div class="card" *ngFor="let stat of stats">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>
      </div>
    </div>
  
  \`,
})
export class DashboardLayoutComponent {
navItems = ['Overview', 'Analytics', 'Customers', 'Products', 'Settings'];
  stats = [
    { label: 'Total Users', value: '12,847' },
    { label: 'Revenue', value: '$48.2k' },
    { label: 'Orders', value: '1,234' },
    { label: 'Conversion', value: '3.2%' },
  ];
}

const app = defineMicroApp({
  name: 'dashboard-layout',
  async mount({ container }) {
    const el = document.createElement('app-dashboard-layout');
    container.appendChild(el);
    await bootstrapApplication(DashboardLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'blog',
    description: 'Blog layout with article content area and aside widget column',
    tags: ['layout', 'blog', 'content'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-blog-layout',
  template: \`

    <div class="layout">
      <header class="header"><span class="brand">MyBlog</span><nav class="nav"><a href="#posts">Posts</a><a href="#about">About</a></nav></header>
      <div class="body">
        <main class="content">
          <article class="post" *ngFor="let post of posts">
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-date">{{ post.date }}</p>
            <p class="post-excerpt">{{ post.excerpt }}</p>
          </article>
        </main>
        <aside class="sidebar">
          <div class="widget"><h3 class="widget-title">Categories</h3><a *ngFor="let c of categories" href="#">{{ c }}</a></div>
        </aside>
      </div>
    </div>
  
  \`,
})
export class BlogLayoutComponent {
posts = [
    { title: 'Getting Started with Angular', date: 'Mar 10, 2024', excerpt: 'Learn the fundamentals of Angular framework...' },
    { title: 'State Management Patterns', date: 'Mar 8, 2024', excerpt: 'Explore different approaches to managing state...' },
  ];
  categories = ['Angular', 'TypeScript', 'RxJS', 'Testing'];
}

const app = defineMicroApp({
  name: 'blog-layout',
  async mount({ container }) {
    const el = document.createElement('app-blog-layout');
    container.appendChild(el);
    await bootstrapApplication(BlogLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'portfolio',
    description: 'Portfolio layout with hero section and project grid',
    tags: ['layout', 'portfolio', 'showcase'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-portfolio-layout',
  template: \`

    <div class="layout">
      <header class="header"><span class="name">Jane Doe</span><nav><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>
      <section class="hero">
        <h1 class="hero-title">Frontend Developer & Designer</h1>
        <p class="hero-sub">Building beautiful, performant web experiences</p>
      </section>
      <section class="projects">
        <div class="project" *ngFor="let p of projects">
          <div class="project-thumb" [style.background]="p.color"></div>
          <h3 class="project-title">{{ p.name }}</h3>
          <p class="project-desc">{{ p.desc }}</p>
        </div>
      </section>
    </div>
  
  \`,
})
export class PortfolioLayoutComponent {
projects = [
    { name: 'E-commerce App', desc: 'Full-stack shopping platform', color: 'linear-gradient(135deg, #a78bfa, #6366f1)' },
    { name: 'Dashboard UI', desc: 'Analytics dashboard for SaaS', color: 'linear-gradient(135deg, #34d399, #10b981)' },
    { name: 'Mobile App', desc: 'Cross-platform mobile experience', color: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
  ];
}

const app = defineMicroApp({
  name: 'portfolio-layout',
  async mount({ container }) {
    const el = document.createElement('app-portfolio-layout');
    container.appendChild(el);
    await bootstrapApplication(PortfolioLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'landing',
    description: 'Landing page layout with hero, features and CTA sections',
    tags: ['layout', 'landing', 'marketing'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-landing-layout',
  template: \`

    <div class="layout">
      <header class="header"><span class="brand">Product</span><button class="cta-btn">Get Started</button></header>
      <section class="hero">
        <h1>Build faster with micro frontends</h1>
        <p>Modular architecture for modern web applications</p>
        <button class="hero-btn">Start Free Trial</button>
      </section>
      <section class="features">
        <div class="feature" *ngFor="let f of features">
          <div class="feature-icon">{{ f.icon }}</div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </section>
    </div>
  
  \`,
})
export class LandingLayoutComponent {
features = [
    { icon: '\\u26A1', title: 'Fast', desc: 'Optimized for speed with lazy loading' },
    { icon: '\\u{1F6E1}', title: 'Secure', desc: 'Built-in security best practices' },
    { icon: '\\u{1F527}', title: 'Modular', desc: 'Compose from independent micro apps' },
  ];
}

const app = defineMicroApp({
  name: 'landing-layout',
  async mount({ container }) {
    const el = document.createElement('app-landing-layout');
    container.appendChild(el);
    await bootstrapApplication(LandingLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'admin',
    description: 'Admin panel layout with top bar, sidebar and tabbed content',
    tags: ['layout', 'admin', 'panel'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  template: \`

    <div class="layout">
      <header class="topbar">
        <span class="brand">Admin</span>
        <div class="topbar-actions"><span class="user">admin@example.com</span></div>
      </header>
      <div class="body">
        <aside class="sidebar">
          <a *ngFor="let item of menuItems" [href]="'#' + item.toLowerCase()" class="menu-item" [class.active]="active===item" (click)="active=item">{{ item }}</a>
        </aside>
        <main class="content">
          <h2>{{ active }}</h2>
          <p class="placeholder">Content area for {{ active }} management.</p>
        </main>
      </div>
    </div>
  
  \`,
})
export class AdminLayoutComponent {
active = 'Users';
  menuItems = ['Users', 'Roles', 'Content', 'Media', 'Analytics', 'Settings'];
}

const app = defineMicroApp({
  name: 'admin-layout',
  async mount({ container }) {
    const el = document.createElement('app-admin-layout');
    container.appendChild(el);
    await bootstrapApplication(AdminLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'e-commerce',
    description: 'E-commerce layout with product grid and filter sidebar',
    tags: ['layout', 'e-commerce', 'shop'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-ecommerce-layout',
  template: \`

    <div class="layout">
      <header class="header"><span class="brand">Shop</span><div class="cart">Cart ({{ cartCount }})</div></header>
      <div class="body">
        <aside class="filters">
          <h3 class="filter-title">Categories</h3>
          <a *ngFor="let c of categories" href="#" class="filter-item">{{ c }}</a>
        </aside>
        <main class="products">
          <div class="product" *ngFor="let p of products">
            <div class="product-img" [style.background]="p.color"></div>
            <div class="product-name">{{ p.name }}</div>
            <div class="product-price">{{ p.price }}</div>
          </div>
        </main>
      </div>
    </div>
  
  \`,
})
export class EcommerceLayoutComponent {
cartCount = 2;
  categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home'];
  products = [
    { name: 'Headphones', price: '$79', color: 'linear-gradient(135deg, #c7d2fe, #a78bfa)' },
    { name: 'Keyboard', price: '$129', color: 'linear-gradient(135deg, #99f6e4, #14b8a6)' },
    { name: 'Monitor', price: '$349', color: 'linear-gradient(135deg, #fde68a, #f59e0b)' },
    { name: 'Mouse', price: '$49', color: 'linear-gradient(135deg, #fca5a5, #ef4444)' },
  ];
}

const app = defineMicroApp({
  name: 'e-commerce-layout',
  async mount({ container }) {
    const el = document.createElement('app-ecommerce-layout');
    container.appendChild(el);
    await bootstrapApplication(EcommerceLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'docs',
    description: 'Documentation layout with navigation sidebar and content area',
    tags: ['layout', 'docs', 'documentation'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-docs-layout',
  template: \`

    <div class="layout">
      <header class="header"><span class="brand">Docs</span><input class="search" placeholder="Search docs..." /></header>
      <div class="body">
        <aside class="sidebar">
          <div *ngFor="let section of sections" class="section">
            <div class="section-title">{{ section.title }}</div>
            <a *ngFor="let link of section.links" href="#" class="doc-link">{{ link }}</a>
          </div>
        </aside>
        <main class="content">
          <h1 class="doc-title">Getting Started</h1>
          <p class="doc-text">Welcome to the documentation. Follow the guide below to set up your project.</p>
        </main>
      </div>
    </div>
  
  \`,
})
export class DocsLayoutComponent {
sections = [
    { title: 'Getting Started', links: ['Installation', 'Quick Start', 'Configuration'] },
    { title: 'Core Concepts', links: ['Components', 'Modules', 'Services'] },
    { title: 'API Reference', links: ['CLI', 'SDK', 'Hooks'] },
  ];
}

const app = defineMicroApp({
  name: 'docs-layout',
  async mount({ container }) {
    const el = document.createElement('app-docs-layout');
    container.appendChild(el);
    await bootstrapApplication(DocsLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'saas-app',
    description: 'SaaS app layout with top navigation and card-based content',
    tags: ['layout', 'saas', 'application'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-saas-layout',
  template: \`

    <div class="layout">
      <header class="topnav">
        <span class="brand">SaaSApp</span>
        <nav class="nav"><a *ngFor="let tab of tabs" href="#" [class.active]="activeTab===tab" (click)="activeTab=tab">{{ tab }}</a></nav>
        <div class="user">JD</div>
      </header>
      <main class="content">
        <h2 class="page-title">{{ activeTab }}</h2>
        <div class="grid">
          <div class="card" *ngFor="let i of [1,2,3,4,5,6]">
            <div class="card-header">Item {{ i }}</div>
            <div class="card-body">Content placeholder for item {{ i }}.</div>
          </div>
        </div>
      </main>
    </div>
  
  \`,
})
export class SaasLayoutComponent {
activeTab = 'Projects';
  tabs = ['Projects', 'Team', 'Billing', 'Settings'];
}

const app = defineMicroApp({
  name: 'saas-app-layout',
  async mount({ container }) {
    const el = document.createElement('app-saas-layout');
    container.appendChild(el);
    await bootstrapApplication(SaasLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'split',
    description: 'Split layout with two equal panels side by side',
    tags: ['layout', 'split', 'two-panel'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-split-layout',
  template: \`

    <div class="layout">
      <div class="panel left">
        <h2 class="panel-title">Editor</h2>
        <textarea class="editor" placeholder="Write your code here..." [value]="code" (input)="code=$any($event.target).value"></textarea>
      </div>
      <div class="panel right">
        <h2 class="panel-title">Preview</h2>
        <div class="preview">{{ code || 'Preview will appear here...' }}</div>
      </div>
    </div>
  
  \`,
})
export class SplitLayoutComponent {
code = '';
}

const app = defineMicroApp({
  name: 'split-layout',
  async mount({ container }) {
    const el = document.createElement('app-split-layout');
    container.appendChild(el);
    await bootstrapApplication(SplitLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'three-column',
    description: 'Three-column layout with left nav, content and right sidebar',
    tags: ['layout', 'three-column', 'complex'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-three-col-layout',
  template: \`

    <div class="layout">
      <aside class="left">
        <div class="brand">App</div>
        <a *ngFor="let item of navItems" href="#" class="nav-link">{{ item }}</a>
      </aside>
      <main class="center">
        <h1 class="title">Feed</h1>
        <div class="post" *ngFor="let i of [1,2,3]">
          <div class="post-header">Post {{ i }}</div>
          <div class="post-body">Content for post {{ i }}...</div>
        </div>
      </main>
      <aside class="right">
        <div class="widget">
          <h3 class="widget-title">Trending</h3>
          <div class="trend" *ngFor="let t of trending">{{ t }}</div>
        </div>
      </aside>
    </div>
  
  \`,
})
export class ThreeColLayoutComponent {
navItems = ['Home', 'Explore', 'Notifications', 'Messages', 'Profile'];
  trending = ['#Angular', '#TypeScript', '#MicroFrontends', '#WebDev'];
}

const app = defineMicroApp({
  name: 'three-column-layout',
  async mount({ container }) {
    const el = document.createElement('app-three-col-layout');
    container.appendChild(el);
    await bootstrapApplication(ThreeColLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'two-column',
    description: 'Two-column layout with sidebar navigation and main content',
    tags: ['layout', 'two-column', 'standard'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-two-col-layout',
  template: \`

    <div class="layout">
      <aside class="sidebar">
        <div class="brand">TwoCol</div>
        <nav><a *ngFor="let item of items" href="#" class="nav-link">{{ item }}</a></nav>
      </aside>
      <main class="content">
        <h1>Welcome</h1>
        <p class="text">This is a standard two-column layout with sidebar navigation and a main content area.</p>
      </main>
    </div>
  
  \`,
})
export class TwoColLayoutComponent {
items = ['Dashboard', 'Projects', 'Tasks', 'Calendar', 'Reports'];
}

const app = defineMicroApp({
  name: 'two-column-layout',
  async mount({ container }) {
    const el = document.createElement('app-two-col-layout');
    container.appendChild(el);
    await bootstrapApplication(TwoColLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'full-width',
    description: 'Full-width layout with centered content and no sidebar',
    tags: ['layout', 'full-width', 'centered'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-fullwidth-layout',
  template: \`

    <div class="layout">
      <header class="header"><span class="brand">FullWidth</span><nav class="nav"><a href="#home">Home</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>
      <main class="content">
        <section class="section">
          <h1 class="title">Full Width Layout</h1>
          <p class="text">Content stretches across the entire viewport width with a centered max-width container.</p>
        </section>
      </main>
      <footer class="footer">
        <p>&copy; 2024 FullWidth App</p>
      </footer>
    </div>
  
  \`,
})
export class FullWidthLayoutComponent {
}

const app = defineMicroApp({
  name: 'full-width-layout',
  async mount({ container }) {
    const el = document.createElement('app-fullwidth-layout');
    container.appendChild(el);
    await bootstrapApplication(FullWidthLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'sticky-header',
    description: 'Layout with sticky header and scrollable content below',
    tags: ['layout', 'sticky-header', 'scroll'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-sticky-header-layout',
  template: \`

    <div class="layout">
      <header class="header">
        <span class="brand">StickyLayout</span>
        <nav class="nav"><a href="#home">Home</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
      </header>
      <main class="content">
        <div class="section" *ngFor="let s of sections">
          <h2>{{ s.title }}</h2>
          <p>{{ s.content }}</p>
        </div>
      </main>
    </div>
  
  \`,
})
export class StickyHeaderLayoutComponent {
sections = [
    { title: 'Introduction', content: 'This layout features a sticky header that stays at the top as you scroll.' },
    { title: 'Features', content: 'The header uses position: sticky for a smooth scrolling experience.' },
    { title: 'Benefits', content: 'Users always have access to navigation regardless of scroll position.' },
  ];
}

const app = defineMicroApp({
  name: 'sticky-header-layout',
  async mount({ container }) {
    const el = document.createElement('app-sticky-header-layout');
    container.appendChild(el);
    await bootstrapApplication(StickyHeaderLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'sticky-sidebar',
    description: 'Layout with sticky sidebar and scrollable main content',
    tags: ['layout', 'sticky-sidebar', 'fixed'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-sticky-sidebar-layout',
  template: \`

    <div class="layout">
      <aside class="sidebar">
        <div class="brand">StickySide</div>
        <nav><a *ngFor="let item of navItems" href="#" class="nav-link">{{ item }}</a></nav>
      </aside>
      <main class="content">
        <h1>Main Content</h1>
        <p *ngFor="let i of [1,2,3,4,5]" class="paragraph">Paragraph {{ i }}: Lorem ipsum content to demonstrate scrollable main area alongside the sticky sidebar.</p>
      </main>
    </div>
  
  \`,
})
export class StickySidebarLayoutComponent {
navItems = ['Overview', 'Components', 'Modules', 'Services', 'Routing', 'Testing'];
}

const app = defineMicroApp({
  name: 'sticky-sidebar-layout',
  async mount({ container }) {
    const el = document.createElement('app-sticky-sidebar-layout');
    container.appendChild(el);
    await bootstrapApplication(StickySidebarLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'grid',
    description: 'Grid-based layout with responsive card grid and header',
    tags: ['layout', 'grid', 'responsive'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-grid-layout',
  template: \`

    <div class="layout">
      <header class="header"><span class="brand">GridApp</span></header>
      <main class="grid">
        <div class="cell" *ngFor="let item of items" [style.gridColumn]="item.span">
          <h3 class="cell-title">{{ item.title }}</h3>
          <p class="cell-text">{{ item.desc }}</p>
        </div>
      </main>
    </div>
  
  \`,
})
export class GridLayoutComponent {
items = [
    { title: 'Overview', desc: 'Summary of key metrics', span: 'span 2' },
    { title: 'Revenue', desc: 'Monthly revenue chart', span: 'span 2' },
    { title: 'Users', desc: 'Active user count', span: 'span 1' },
    { title: 'Orders', desc: 'Recent orders', span: 'span 1' },
    { title: 'Tasks', desc: 'Pending tasks', span: 'span 1' },
    { title: 'Alerts', desc: 'System alerts', span: 'span 1' },
  ];
}

const app = defineMicroApp({
  name: 'grid-layout',
  async mount({ container }) {
    const el = document.createElement('app-grid-layout');
    container.appendChild(el);
    await bootstrapApplication(GridLayoutComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
];

export default templates;
