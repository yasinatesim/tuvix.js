import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'dashboard',
    description: 'Dashboard layout with sidebar, topbar, and main content area with grid widgets',
    tags: ['layout', 'dashboard', 'admin'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DashboardLayout = defineComponent({
  setup() {
  const active = ref('Overview');
      const navItems = ['Overview', 'Analytics', 'Users', 'Reports', 'Settings'];
      const widgets = ['Revenue', 'Users', 'Orders', 'Conversion'];
      return { active, navItems, widgets };
  },
  template: \`
    <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">Dashboard</div>
      <nav class="sidebar-nav">
        <a v-for="item in navItems" :key="item" href="#"
           :class="{ active: active === item }" @click.prevent="active = item">{{ item }}</a>
      </nav>
    </aside>
    <div class="main-area">
      <header class="topbar">
        <h2 class="page-title">{{ active }}</h2>
        <div class="topbar-actions">
          <span class="user-name">Admin</span>
        </div>
      </header>
      <main class="content-grid">
        <div v-for="widget in widgets" :key="widget" class="widget">{{ widget }}</div>
      </main>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'dashboard-layout',
  App: DashboardLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'blog',
    description: 'Blog layout with header, article content area, and right sidebar',
    tags: ['layout', 'blog', 'content'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BlogLayout = defineComponent({
  setup() {
  const blogName = ref('DevBlog');
      const navLinks = ['Home', 'Articles', 'About'];
      const articleTitle = ref('Getting Started with Micro-Frontends');
      const author = ref('Jane Doe');
      const date = ref('March 15, 2024');
      const excerpt = ref('Micro-frontends extend the concept of microservices to the frontend world, allowing teams to build and deploy independently.');
      const categories = ['Frontend', 'Architecture', 'DevOps', 'Design'];
      return { blogName, navLinks, articleTitle, author, date, excerpt, categories };
  },
  template: \`
    <div class="blog-layout">
    <header class="blog-header">
      <span class="blog-name">{{ blogName }}</span>
      <nav class="header-nav">
        <a v-for="link in navLinks" :key="link" href="#">{{ link }}</a>
      </nav>
    </header>
    <div class="blog-content">
      <main class="article-area">
        <article class="article">
          <h1 class="article-title">{{ articleTitle }}</h1>
          <p class="article-meta">By {{ author }} &middot; {{ date }}</p>
          <div class="article-body">
            <p>{{ excerpt }}</p>
          </div>
        </article>
      </main>
      <aside class="blog-sidebar">
        <div class="sidebar-section">
          <h3>Categories</h3>
          <a v-for="cat in categories" :key="cat" href="#">{{ cat }}</a>
        </div>
      </aside>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'blog-layout',
  App: BlogLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'portfolio',
    description: 'Portfolio layout with hero section and project grid',
    tags: ['layout', 'portfolio', 'showcase'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const PortfolioLayout = defineComponent({
  setup() {
  const heroTitle = ref('Creative Developer');
      const heroSubtitle = ref('I build beautiful, interactive web experiences.');
      const selectedProject = ref('');
      const projects = [
        { title: 'E-Commerce Platform', type: 'Web App', color: '#dbeafe' },
        { title: 'Analytics Dashboard', type: 'SaaS', color: '#fce7f3' },
        { title: 'Mobile Banking', type: 'Mobile', color: '#d1fae5' },
        { title: 'Social Network', type: 'Web App', color: '#fef3c7' },
        { title: 'Design System', type: 'Library', color: '#ede9fe' },
        { title: 'AI Assistant', type: 'Product', color: '#fee2e2' },
      ];
      return { heroTitle, heroSubtitle, selectedProject, projects };
  },
  template: \`
    <div class="portfolio-layout">
    <header class="portfolio-header">
      <span class="logo">Portfolio</span>
      <nav class="nav-links">
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
    <section class="hero">
      <h1 class="hero-title">{{ heroTitle }}</h1>
      <p class="hero-subtitle">{{ heroSubtitle }}</p>
    </section>
    <section class="projects-grid">
      <div v-for="project in projects" :key="project.title" class="project-card"
           @click="selectedProject = project.title">
        <div class="project-thumb" :style="{ background: project.color }"></div>
        <h3 class="project-title">{{ project.title }}</h3>
        <p class="project-type">{{ project.type }}</p>
      </div>
    </section>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'portfolio-layout',
  App: PortfolioLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'landing',
    description: 'Landing page layout with hero, features, and CTA sections',
    tags: ['layout', 'landing', 'marketing'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const LandingLayout = defineComponent({
  setup() {
  const headline = ref('Build Faster, Ship Smarter');
      const subheadline = ref('The modern platform for building scalable micro-frontend applications.');
      const features = [
        { icon: '\\u26A1', title: 'Fast Builds', desc: 'Sub-second hot reload with optimized bundling.' },
        { icon: '\\u{1F512}', title: 'Secure', desc: 'Built-in security policies and sandboxing.' },
        { icon: '\\u{1F4E6}', title: 'Modular', desc: 'Compose apps from independent micro-frontends.' },
      ];
      return { headline, subheadline, features };
  },
  template: \`
    <div class="landing-layout">
    <header class="landing-header">
      <span class="brand">Product</span>
      <button class="cta-header-btn">Get Started</button>
    </header>
    <section class="hero-section">
      <h1>{{ headline }}</h1>
      <p>{{ subheadline }}</p>
      <div class="hero-actions">
        <button class="primary-btn">Start Free Trial</button>
        <button class="secondary-btn">Watch Demo</button>
      </div>
    </section>
    <section class="features-section">
      <div v-for="feat in features" :key="feat.title" class="feature-item">
        <span class="feat-icon">{{ feat.icon }}</span>
        <h3>{{ feat.title }}</h3>
        <p>{{ feat.desc }}</p>
      </div>
    </section>
    <section class="cta-section">
      <h2>Ready to get started?</h2>
      <button class="primary-btn">Sign Up Free</button>
    </section>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'landing-layout',
  App: LandingLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'admin',
    description: 'Admin panel layout with collapsible sidebar, breadcrumb, and content area',
    tags: ['layout', 'admin', 'panel'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const AdminLayout = defineComponent({
  setup() {
  const sidebarCollapsed = ref(false);
      const navItems = ['Dashboard', 'Users', 'Content', 'Analytics', 'Settings'];
      const breadcrumbs = ['Admin', 'Dashboard', 'Overview'];
      return { sidebarCollapsed, navItems, breadcrumbs };
  },
  template: \`
    <div class="admin-layout">
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-top">
        <span v-if="!sidebarCollapsed" class="brand">Admin</span>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '\\u00BB' : '\\u00AB' }}
        </button>
      </div>
      <nav class="admin-nav">
        <a v-for="item in navItems" :key="item" href="#">
          <span v-if="!sidebarCollapsed">{{ item }}</span>
          <span v-else>{{ item[0] }}</span>
        </a>
      </nav>
    </aside>
    <div class="admin-main">
      <div class="breadcrumb">
        <span v-for="(crumb, i) in breadcrumbs" :key="crumb">
          {{ crumb }}<span v-if="i < breadcrumbs.length - 1"> / </span>
        </span>
      </div>
      <div class="admin-content">
        <slot>
          <div class="content-placeholder">Admin content area</div>
        </slot>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'admin-layout',
  App: AdminLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'e-commerce',
    description: 'E-commerce layout with category sidebar, product grid, and cart summary',
    tags: ['layout', 'e-commerce', 'shop'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const EcommerceLayout = defineComponent({
  setup() {
  const selectedCategory = ref('All');
      const categories = ['All', 'Electronics', 'Clothing', 'Home', 'Books'];
      const cartCount = ref(0);
      const cartOpen = ref(false);
      const products = [
        { name: 'Laptop', price: 999, color: '#dbeafe' },
        { name: 'Headphones', price: 79, color: '#fce7f3' },
        { name: 'Keyboard', price: 129, color: '#d1fae5' },
        { name: 'Monitor', price: 449, color: '#fef3c7' },
      ];
      return { selectedCategory, categories, cartCount, cartOpen, products };
  },
  template: \`
    <div class="ecommerce-layout">
    <header class="shop-header">
      <span class="shop-name">ShopVue</span>
      <div class="cart-icon" @click="cartOpen = !cartOpen">
        Cart ({{ cartCount }})
      </div>
    </header>
    <div class="shop-body">
      <aside class="category-sidebar">
        <h3>Categories</h3>
        <a v-for="cat in categories" :key="cat" href="#"
           :class="{ active: selectedCategory === cat }"
           @click.prevent="selectedCategory = cat">{{ cat }}</a>
      </aside>
      <main class="product-grid">
        <div v-for="p in products" :key="p.name" class="product-item">
          <div class="product-img" :style="{ background: p.color }"></div>
          <div class="product-info">
            <span class="product-name">{{ p.name }}</span>
            <span class="product-price">\${{ p.price }}</span>
          </div>
          <button class="add-btn" @click="cartCount++">Add</button>
        </div>
      </main>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'ecommerce-layout',
  App: EcommerceLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'docs',
    description: 'Documentation layout with left nav, content area, and table of contents',
    tags: ['layout', 'docs', 'documentation'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DocsLayout = defineComponent({
  setup() {
  const activePage = ref('Getting Started');
      const sections = [
        { title: 'Guide', pages: ['Getting Started', 'Installation', 'Configuration'] },
        { title: 'API', pages: ['Core', 'Plugins', 'CLI'] },
        { title: 'Advanced', pages: ['Custom Modules', 'Performance'] },
      ];
      const tocItems = ['Overview', 'Prerequisites', 'Quick Start', 'Next Steps'];
      return { activePage, sections, tocItems };
  },
  template: \`
    <div class="docs-layout">
    <aside class="docs-nav">
      <div class="docs-brand">Docs</div>
      <div v-for="section in sections" :key="section.title" class="nav-section">
        <h4>{{ section.title }}</h4>
        <a v-for="page in section.pages" :key="page" href="#"
           :class="{ active: activePage === page }"
           @click.prevent="activePage = page">{{ page }}</a>
      </div>
    </aside>
    <main class="docs-content">
      <h1>{{ activePage }}</h1>
      <p class="docs-intro">Documentation for {{ activePage.toLowerCase() }}.</p>
      <div class="docs-body">
        <div class="placeholder-block"></div>
        <div class="placeholder-block short"></div>
      </div>
    </main>
    <aside class="toc">
      <h4>On this page</h4>
      <a v-for="item in tocItems" :key="item" href="#">{{ item }}</a>
    </aside>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'docs-layout',
  App: DocsLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'saas-app',
    description: 'SaaS application layout with top nav, sidebar, and main workspace',
    tags: ['layout', 'saas', 'app'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SaasLayout = defineComponent({
  setup() {
  const activeMenu = ref('Projects');
      const menuItems = [
        { icon: '\\u{1F4C1}', label: 'Projects' },
        { icon: '\\u{1F4CB}', label: 'Tasks' },
        { icon: '\\u{1F465}', label: 'Team' },
        { icon: '\\u{1F4CA}', label: 'Reports' },
        { icon: '\\u2699', label: 'Settings' },
      ];
      return { activeMenu, menuItems };
  },
  template: \`
    <div class="saas-layout">
    <header class="saas-topbar">
      <span class="app-name">SaaSApp</span>
      <div class="topbar-right">
        <span class="plan-badge">Pro Plan</span>
        <div class="user-avatar">A</div>
      </div>
    </header>
    <div class="saas-body">
      <aside class="saas-sidebar">
        <a v-for="item in menuItems" :key="item.label" href="#"
           :class="{ active: activeMenu === item.label }"
           @click.prevent="activeMenu = item.label">
          <span class="menu-icon">{{ item.icon }}</span>
          {{ item.label }}
        </a>
      </aside>
      <main class="saas-workspace">
        <div class="workspace-header">
          <h2>{{ activeMenu }}</h2>
          <button class="action-btn">+ New</button>
        </div>
        <div class="workspace-content">
          <div class="empty-state">Select or create an item to get started</div>
        </div>
      </main>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'saas-layout',
  App: SaasLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'split',
    description: 'Split layout with resizable left and right panels',
    tags: ['layout', 'split', 'panels'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, onUnmounted } from 'vue';

const SplitLayout = defineComponent({
  setup() {
  const leftWidth = ref(50);
      const editorContent = ref('');
      let resizing = false;
      const onMouseMove = (e: MouseEvent) => {
        if (!resizing) return;
        const pct = (e.clientX / window.innerWidth) * 100;
        leftWidth.value = Math.max(20, Math.min(80, pct));
      };
      const onMouseUp = () => { resizing = false; };
      const startResize = () => {
        resizing = true;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp, { once: true });
      };
      onUnmounted(() => {
        document.removeEventListener('mousemove', onMouseMove);
      });
      return { leftWidth, editorContent, startResize };
  },
  template: \`
    <div class="split-layout">
    <div class="panel left-panel" :style="{ width: leftWidth + '%' }">
      <div class="panel-header">Editor</div>
      <div class="panel-body">
        <textarea v-model="editorContent" class="editor-textarea" placeholder="Type here..."></textarea>
      </div>
    </div>
    <div class="divider" @mousedown="startResize"></div>
    <div class="panel right-panel" :style="{ width: (100 - leftWidth) + '%' }">
      <div class="panel-header">Preview</div>
      <div class="panel-body">
        <div class="preview-content">{{ editorContent || 'Preview will appear here...' }}</div>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'split-layout',
  App: SplitLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'three-column',
    description: 'Three-column layout with navigation, content, and detail panels',
    tags: ['layout', 'three-column', 'master-detail'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const ThreeColumnLayout = defineComponent({
  setup() {
  const selected = ref<number | null>(null);
      const items = [
        { id: 1, title: 'Welcome', preview: 'Getting started...', body: 'Welcome to the platform! Here is how to get started.', from: 'Team', date: 'Today' },
        { id: 2, title: 'Update v2.1', preview: 'New features...', body: 'Version 2.1 includes new dashboard widgets and performance improvements.', from: 'Release Bot', date: 'Yesterday' },
        { id: 3, title: 'Reminder', preview: 'Meeting at 3pm...', body: "Don't forget the standup meeting at 3pm today.", from: 'Calendar', date: 'Mar 12' },
      ];
      const selectedItem = computed(() => items.find(i => i.id === selected.value) || null);
      return { selected, items, selectedItem };
  },
  template: \`
    <div class="three-col-layout">
    <aside class="col-nav">
      <h3>Inbox</h3>
      <div v-for="item in items" :key="item.id" class="list-item"
           :class="{ active: selected === item.id }" @click="selected = item.id">
        <span class="item-title">{{ item.title }}</span>
        <span class="item-preview">{{ item.preview }}</span>
      </div>
    </aside>
    <main class="col-content">
      <template v-if="selectedItem">
        <h2>{{ selectedItem.title }}</h2>
        <p>{{ selectedItem.body }}</p>
  \`,
});

const app = createVueMicroApp({
  name: 'three-column-layout',
  App: ThreeColumnLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'two-column',
    description: 'Simple two-column layout with main content and sidebar',
    tags: ['layout', 'two-column', 'sidebar'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const TwoColumnLayout = defineComponent({
  setup() {
  const pageTitle = ref('Content Page');
      const quickLinks = ['Getting Started', 'API Reference', 'Tutorials', 'Community'];
      const tags = ['Vue', 'TypeScript', 'Frontend', 'Components', 'Design'];
      return { pageTitle, quickLinks, tags };
  },
  template: \`
    <div class="two-col-layout">
    <main class="main-column">
      <h1>{{ pageTitle }}</h1>
      <div class="content-block" v-for="n in 3" :key="n">
        <h3>Section {{ n }}</h3>
        <p>Content for section {{ n }} goes here with relevant information.</p>
      </div>
    </main>
    <aside class="side-column">
      <div class="side-widget">
        <h3>Quick Links</h3>
        <a v-for="link in quickLinks" :key="link" href="#">{{ link }}</a>
      </div>
      <div class="side-widget">
        <h3>Tags</h3>
        <div class="tag-cloud">
          <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </aside>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'two-column-layout',
  App: TwoColumnLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'full-width',
    description: 'Full-width layout with centered content sections',
    tags: ['layout', 'full-width', 'centered'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const FullWidthLayout = defineComponent({
  setup() {
  const sections = ref([
        { title: 'Welcome', content: 'A full-width layout for impactful content presentation.', theme: 'light' },
        { title: 'Features', content: 'Showcase your product features with alternating sections.', theme: 'dark' },
        { title: 'Testimonials', content: 'What users are saying about the platform.', theme: 'light' },
        { title: 'Get Started', content: 'Ready to build something amazing?', theme: 'accent' },
      ]);
      return { sections };
  },
  template: \`
    <div class="fullwidth-layout">
    <section v-for="section in sections" :key="section.title"
             class="fw-section" :class="section.theme">
      <div class="section-inner">
        <h2>{{ section.title }}</h2>
        <p>{{ section.content }}</p>
      </div>
    </section>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'full-width-layout',
  App: FullWidthLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sticky-header',
    description: 'Layout with sticky header, scrollable content, and fixed footer',
    tags: ['layout', 'sticky-header', 'fixed-footer'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const StickyHeaderLayout = defineComponent({
  setup() {
  const navItems = ref(['Home', 'About', 'Blog', 'Contact']);
      return { navItems };
  },
  template: \`
    <div class="sticky-layout">
    <header class="sticky-header">
      <span class="logo">StickyLayout</span>
      <nav class="header-nav">
        <a v-for="item in navItems" :key="item" href="#">{{ item }}</a>
      </nav>
    </header>
    <main class="scroll-content">
      <div v-for="n in 8" :key="n" class="content-block">
        <h3>Section {{ n }}</h3>
        <p>Scroll to see the sticky header and footer behavior.</p>
      </div>
    </main>
    <footer class="sticky-footer">
      <span>&copy; 2024 StickyLayout</span>
      <span>All rights reserved</span>
    </footer>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'sticky-header-layout',
  App: StickyHeaderLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sticky-sidebar',
    description: 'Layout with sticky sidebar and scrollable main content area',
    tags: ['layout', 'sticky-sidebar', 'scroll'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const StickySidebarLayout = defineComponent({
  setup() {
  const activeItem = ref('Dashboard');
      const navItems = ['Dashboard', 'Projects', 'Tasks', 'Messages', 'Settings'];
      return { activeItem, navItems };
  },
  template: \`
    <div class="sticky-sidebar-layout">
    <aside class="sticky-side">
      <div class="side-brand">App</div>
      <nav class="side-nav">
        <a v-for="item in navItems" :key="item" href="#"
           :class="{ active: activeItem === item }" @click.prevent="activeItem = item">
          {{ item }}
        </a>
      </nav>
    </aside>
    <main class="scrollable-main">
      <h1>{{ activeItem }}</h1>
      <div v-for="n in 10" :key="n" class="content-section">
        <p>Content block {{ n }} for {{ activeItem }}.</p>
      </div>
    </main>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'sticky-sidebar-layout',
  App: StickySidebarLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'grid',
    description: 'CSS grid layout with configurable rows and columns for widget placement',
    tags: ['layout', 'grid', 'widgets'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const GridLayout = defineComponent({
  setup() {
  const cols = ref(3);
      const widgetList = ref([
        { id: 1, title: 'Sales', content: '$12,450', span: 1 },
        { id: 2, title: 'Users', content: '3,280', span: 1 },
        { id: 3, title: 'Revenue Chart', content: 'Chart placeholder', span: 2 },
        { id: 4, title: 'Orders', content: '156 pending', span: 1 },
        { id: 5, title: 'Activity Feed', content: 'Recent activities', span: 1 },
        { id: 6, title: 'Top Products', content: 'Product rankings', span: 1 },
      ]);
      return { cols, widgetList };
  },
  template: \`
    <div class="grid-layout">
    <header class="grid-header">
      <h2>Grid Dashboard</h2>
      <div class="col-controls">
        <button @click="cols = Math.max(2, cols - 1)">-</button>
        <span>{{ cols }} columns</span>
        <button @click="cols = Math.min(5, cols + 1)">+</button>
      </div>
    </header>
    <div class="widget-grid" :style="{ gridTemplateColumns: 'repeat(' + cols + ', 1fr)' }">
      <div v-for="widget in widgetList" :key="widget.id" class="grid-widget"
           :style="{ gridColumn: 'span ' + widget.span }">
        <h4>{{ widget.title }}</h4>
        <p>{{ widget.content }}</p>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'grid-layout',
  App: GridLayout,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
