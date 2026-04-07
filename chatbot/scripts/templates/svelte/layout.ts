import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'dashboard',
    description: 'Dashboard layout with sidebar, header, and main content area',
    tags: ['layout', 'dashboard', 'admin'],
    code: `<script>
  let sidebarOpen = true;
  let activePage = 'overview';
  let pages = ['overview', 'analytics', 'users', 'settings'];

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function navigate(page) {
    activePage = page;
  }
</script>

<div class="layout">
  {#if sidebarOpen}
    <aside class="sidebar">
      <div class="brand">Dashboard</div>
      {#each pages as page}
        <button class="nav-item" class:active={activePage === page} on:click={() => navigate(page)}>
          {page.charAt(0).toUpperCase() + page.slice(1)}
        </button>
      {/each}
    </aside>
  {/if}
  <div class="main">
    <header class="header">
      <button on:click={toggleSidebar} class="menu-btn">\u2630</button>
      <span class="page-title">{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</span>
    </header>
    <main class="content">
      <p>Content for {activePage}</p>
    </main>
  </div>
</div>

<style>
  .layout { display: flex; height: 100vh; }
  .sidebar { width: 220px; background-color: #1f2937; padding: 20px 12px; display: flex; flex-direction: column; gap: 2px; }
  .brand { color: #fff; font-size: 18px; font-weight: 700; padding: 0 12px 20px; }
  .nav-item { display: block; width: 100%; text-align: left; padding: 10px 12px; background: none; border: none; color: #9ca3af; border-radius: 6px; cursor: pointer; font-size: 14px; }
  .nav-item.active { background-color: #374151; color: #fff; }
  .main { flex: 1; display: flex; flex-direction: column; }
  .header { display: flex; align-items: center; gap: 16px; padding: 12px 24px; border-bottom: 1px solid #e5e7eb; }
  .menu-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
  .page-title { font-size: 18px; font-weight: 600; }
  .content { flex: 1; padding: 24px; background-color: #f9fafb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'blog',
    description: 'Blog layout with article content and sidebar widgets',
    tags: ['layout', 'blog', 'content'],
    code: `<script>
  let categories = ['Technology', 'Design', 'Business', 'Lifestyle'];
  let recentPosts = ['Getting Started', 'Advanced Patterns', 'Best Practices'];
</script>

<div class="layout">
  <header class="header">
    <span class="brand">MyBlog</span>
    <nav class="nav">
      <a href="#home">Home</a>
      <a href="#archive">Archive</a>
      <a href="#about">About</a>
    </nav>
  </header>
  <div class="body">
    <main class="content">
      <article>
        <h1>Article Title</h1>
        <p class="meta">Published Mar 15, 2026 by Author</p>
        <p>Main article content goes here with detailed paragraphs about the topic.</p>
      </article>
    </main>
    <aside class="sidebar">
      <div class="widget">
        <h3>Categories</h3>
        {#each categories as cat}
          <a href={'#' + cat.toLowerCase()}>{cat}</a>
        {/each}
      </div>
      <div class="widget">
        <h3>Recent Posts</h3>
        {#each recentPosts as post}
          <a href={'#' + post.toLowerCase().replace(/\\s/g, '-')}>{post}</a>
        {/each}
      </div>
    </aside>
  </div>
</div>

<style>
  .layout { max-width: 1100px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .nav { display: flex; gap: 20px; }
  .nav a { text-decoration: none; color: #374151; }
  .body { display: flex; gap: 32px; padding: 32px 24px; }
  .content { flex: 1; }
  .content h1 { margin: 0 0 8px; font-size: 28px; }
  .meta { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
  .sidebar { width: 260px; }
  .widget { margin-bottom: 24px; }
  .widget h3 { margin: 0 0 8px; font-size: 16px; }
  .widget a { display: block; padding: 4px 0; text-decoration: none; color: #6366f1; font-size: 14px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'portfolio',
    description: 'Portfolio layout with project grid and hero section',
    tags: ['layout', 'portfolio', 'showcase'],
    code: `<script>
  let projects = [
    { title: 'Project Alpha', category: 'Web' },
    { title: 'Project Beta', category: 'Mobile' },
    { title: 'Project Gamma', category: 'Desktop' },
    { title: 'Project Delta', category: 'Web' },
    { title: 'Project Epsilon', category: 'Mobile' },
    { title: 'Project Zeta', category: 'Desktop' },
  ];
</script>

<div class="layout">
  <section class="hero">
    <h1>My Portfolio</h1>
    <p>Frontend developer crafting micro-frontend experiences.</p>
  </section>
  <section class="projects">
    <h2>Projects</h2>
    <div class="grid">
      {#each projects as project}
        <div class="project-card">
          <div class="thumbnail">{project.title[0]}</div>
          <h3>{project.title}</h3>
          <span class="category">{project.category}</span>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .layout { max-width: 900px; margin: 0 auto; padding: 0 24px; }
  .hero { text-align: center; padding: 60px 0 40px; }
  .hero h1 { margin: 0 0 8px; font-size: 36px; }
  .hero p { color: #6b7280; font-size: 16px; }
  .projects h2 { font-size: 24px; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .project-card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .thumbnail { height: 120px; background-color: #ede9fe; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #6366f1; font-weight: 700; }
  .project-card h3 { margin: 12px 16px 4px; font-size: 15px; }
  .category { padding: 0 16px 12px; display: block; font-size: 13px; color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'landing',
    description: 'Landing page layout with hero, features, and CTA sections',
    tags: ['layout', 'landing', 'marketing'],
    code: `<script>
  let features = [
    { icon: '\u26A1', title: 'Fast', desc: 'Sub-second load times' },
    { icon: '\u{1F512}', title: 'Secure', desc: 'Built-in security' },
    { icon: '\u{1F4E6}', title: 'Modular', desc: 'Compose freely' },
  ];
</script>

<div class="layout">
  <header class="header">
    <span class="brand">Product</span>
    <nav><a href="#features">Features</a> <a href="#pricing">Pricing</a></nav>
  </header>
  <section class="hero">
    <h1>Build Faster with Micro-Frontends</h1>
    <p>Ship independent UI modules that scale with your team.</p>
    <button class="cta-btn">Get Started</button>
  </section>
  <section class="features-section">
    {#each features as f}
      <div class="feature">
        <span class="icon">{f.icon}</span>
        <h3>{f.title}</h3>
        <p>{f.desc}</p>
      </div>
    {/each}
  </section>
</div>

<style>
  .layout { max-width: 960px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; }
  .brand { font-size: 20px; font-weight: 700; }
  .header nav a { text-decoration: none; color: #374151; margin-left: 20px; }
  .hero { text-align: center; padding: 80px 24px 60px; }
  .hero h1 { font-size: 40px; margin: 0 0 12px; }
  .hero p { font-size: 18px; color: #6b7280; margin: 0 0 24px; }
  .cta-btn { padding: 12px 32px; border: none; border-radius: 8px; background-color: #6366f1; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
  .features-section { display: flex; gap: 24px; padding: 0 24px 60px; }
  .feature { flex: 1; text-align: center; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .icon { font-size: 32px; }
  .feature h3 { margin: 12px 0 8px; }
  .feature p { margin: 0; font-size: 14px; color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'admin',
    description: 'Admin panel layout with data table area and controls',
    tags: ['layout', 'admin', 'panel'],
    code: `<script>
  let activeTab = 'users';
  let tabs = ['users', 'roles', 'logs'];
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="brand">Admin</div>
    {#each tabs as tab}
      <button class="nav-item" class:active={activeTab === tab} on:click={() => activeTab = tab}>
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    {/each}
  </aside>
  <div class="main">
    <header class="header">
      <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h2>
      <button class="add-btn">+ Add New</button>
    </header>
    <main class="content">
      <div class="toolbar">
        <input type="text" placeholder="Search..." class="search-input" />
      </div>
      <div class="table-area">Table for {activeTab} goes here</div>
    </main>
  </div>
</div>

<style>
  .layout { display: flex; height: 100vh; }
  .sidebar { width: 200px; background-color: #111827; padding: 20px 12px; }
  .brand { color: #fff; font-size: 18px; font-weight: 700; padding: 0 12px 20px; }
  .nav-item { display: block; width: 100%; text-align: left; padding: 10px 12px; background: none; border: none; color: #9ca3af; border-radius: 6px; cursor: pointer; font-size: 14px; }
  .nav-item.active { background-color: #374151; color: #fff; }
  .main { flex: 1; display: flex; flex-direction: column; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
  .header h2 { margin: 0; font-size: 20px; }
  .add-btn { padding: 8px 16px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; cursor: pointer; font-weight: 600; }
  .content { flex: 1; padding: 24px; background-color: #f9fafb; }
  .toolbar { margin-bottom: 16px; }
  .search-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; width: 300px; }
  .table-area { padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'e-commerce',
    description: 'E-commerce layout with product grid and filter sidebar',
    tags: ['layout', 'e-commerce', 'shop'],
    code: `<script>
  let products = [
    { name: 'Product A', price: 29 },
    { name: 'Product B', price: 49 },
    { name: 'Product C', price: 19 },
    { name: 'Product D', price: 89 },
  ];
  let sortBy = 'name';
</script>

<div class="layout">
  <header class="header">
    <span class="brand">Shop</span>
    <a href="#cart">Cart (0)</a>
  </header>
  <div class="body">
    <aside class="filters">
      <h3>Sort By</h3>
      <select bind:value={sortBy}>
        <option value="name">Name</option>
        <option value="price">Price</option>
      </select>
    </aside>
    <main class="products">
      {#each products as product}
        <div class="product-card">
          <div class="thumb">{product.name[0]}</div>
          <div class="info">
            <div class="pname">{product.name}</div>
            <div class="pprice">\${product.price}</div>
          </div>
        </div>
      {/each}
    </main>
  </div>
</div>

<style>
  .layout { max-width: 1000px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .header a { text-decoration: none; color: #6366f1; }
  .body { display: flex; gap: 24px; padding: 24px; }
  .filters { width: 200px; }
  .filters h3 { margin: 0 0 8px; font-size: 14px; }
  .filters select { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; }
  .products { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .product-card { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  .thumb { height: 120px; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #9ca3af; }
  .info { padding: 12px; }
  .pname { font-weight: 600; font-size: 14px; }
  .pprice { color: #16a34a; font-weight: 700; margin-top: 4px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'docs',
    description: 'Documentation layout with TOC sidebar and content area',
    tags: ['layout', 'docs', 'documentation'],
    code: `<script>
  let sections = ['Introduction', 'Installation', 'Quick Start', 'API Reference', 'Configuration', 'Plugins'];
  let activeSection = 'Introduction';

  function navigate(section) {
    activeSection = section;
  }
</script>

<div class="layout">
  <aside class="toc">
    <div class="toc-title">Documentation</div>
    {#each sections as section}
      <button class="toc-item" class:active={activeSection === section} on:click={() => navigate(section)}>
        {section}
      </button>
    {/each}
  </aside>
  <main class="content">
    <h1>{activeSection}</h1>
    <p>Content for the {activeSection} section. This area contains detailed documentation text.</p>
  </main>
</div>

<style>
  .layout { display: flex; min-height: 100vh; }
  .toc { width: 240px; border-right: 1px solid #e5e7eb; padding: 24px 12px; background-color: #f9fafb; }
  .toc-title { font-size: 16px; font-weight: 700; padding: 0 12px 16px; color: #111827; }
  .toc-item { display: block; width: 100%; text-align: left; padding: 8px 12px; background: none; border: none; color: #6b7280; border-radius: 6px; cursor: pointer; font-size: 14px; }
  .toc-item.active { color: #6366f1; background-color: #ede9fe; font-weight: 600; }
  .content { flex: 1; padding: 32px 40px; max-width: 720px; }
  .content h1 { margin: 0 0 16px; font-size: 32px; }
  .content p { font-size: 16px; color: #374151; line-height: 1.7; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'saas-app',
    description: 'SaaS app layout with top nav, sidebar, and dashboard cards',
    tags: ['layout', 'saas', 'app'],
    code: `<script>
  let stats = [
    { label: 'Users', value: '1,234' },
    { label: 'Revenue', value: '$45K' },
    { label: 'Growth', value: '+12%' },
  ];
</script>

<div class="layout">
  <header class="topnav">
    <span class="brand">SaaS App</span>
    <div class="user-menu">
      <span class="user-name">Jane D.</span>
      <div class="avatar">JD</div>
    </div>
  </header>
  <div class="body">
    <aside class="sidebar">
      <a href="#dashboard" class="active">Dashboard</a>
      <a href="#billing">Billing</a>
      <a href="#team">Team</a>
      <a href="#settings">Settings</a>
    </aside>
    <main class="content">
      <div class="stats-row">
        {#each stats as stat}
          <div class="stat-card">
            <div class="stat-label">{stat.label}</div>
            <div class="stat-value">{stat.value}</div>
          </div>
        {/each}
      </div>
    </main>
  </div>
</div>

<style>
  .layout { height: 100vh; display: flex; flex-direction: column; }
  .topnav { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background-color: #111827; color: #fff; }
  .brand { font-size: 18px; font-weight: 700; }
  .user-menu { display: flex; align-items: center; gap: 8px; }
  .user-name { font-size: 14px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background-color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .body { display: flex; flex: 1; }
  .sidebar { width: 180px; border-right: 1px solid #e5e7eb; padding: 16px 8px; }
  .sidebar a { display: block; padding: 8px 12px; text-decoration: none; color: #6b7280; border-radius: 6px; font-size: 14px; margin-bottom: 2px; }
  .sidebar a.active { background-color: #ede9fe; color: #6366f1; font-weight: 600; }
  .content { flex: 1; padding: 24px; background-color: #f9fafb; }
  .stats-row { display: flex; gap: 16px; }
  .stat-card { flex: 1; padding: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; }
  .stat-label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
  .stat-value { font-size: 24px; font-weight: 700; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'split',
    description: 'Split layout with two equal panels side by side',
    tags: ['layout', 'split', 'two-panel'],
    code: `<script>
  let leftContent = 'Editor panel — write your code here.';
  let rightContent = 'Preview panel — see the result here.';
</script>

<div class="layout">
  <div class="panel left">
    <div class="panel-header">Editor</div>
    <div class="panel-body">{leftContent}</div>
  </div>
  <div class="divider"></div>
  <div class="panel right">
    <div class="panel-header">Preview</div>
    <div class="panel-body">{rightContent}</div>
  </div>
</div>

<style>
  .layout { display: flex; height: 100vh; }
  .panel { flex: 1; display: flex; flex-direction: column; }
  .panel-header { padding: 12px 20px; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb; }
  .panel-body { flex: 1; padding: 20px; font-size: 14px; color: #374151; }
  .left { background-color: #fff; }
  .right { background-color: #fafafa; }
  .divider { width: 1px; background-color: #e5e7eb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'three-column',
    description: 'Three-column layout with sidebar, content, and aside',
    tags: ['layout', 'three-column', 'complex'],
    code: `<script>
  let menuItems = ['Feed', 'Trending', 'Saved'];
  let widgets = ['Suggestions', 'Trending Topics', 'Who to Follow'];
</script>

<div class="layout">
  <aside class="left-sidebar">
    {#each menuItems as item}
      <a href={'#' + item.toLowerCase()}>{item}</a>
    {/each}
  </aside>
  <main class="center">
    <h2>Main Feed</h2>
    <p>Primary content area with the main feed or article.</p>
  </main>
  <aside class="right-sidebar">
    {#each widgets as widget}
      <div class="widget">
        <h4>{widget}</h4>
        <p>Widget content here.</p>
      </div>
    {/each}
  </aside>
</div>

<style>
  .layout { display: flex; max-width: 1100px; margin: 0 auto; min-height: 100vh; }
  .left-sidebar { width: 200px; padding: 24px 12px; border-right: 1px solid #e5e7eb; }
  .left-sidebar a { display: block; padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 15px; }
  .left-sidebar a:hover { background-color: #f3f4f6; }
  .center { flex: 1; padding: 24px 32px; }
  .center h2 { margin: 0 0 12px; }
  .right-sidebar { width: 260px; padding: 24px 16px; border-left: 1px solid #e5e7eb; }
  .widget { margin-bottom: 20px; padding: 16px; background-color: #f9fafb; border-radius: 10px; }
  .widget h4 { margin: 0 0 8px; font-size: 14px; }
  .widget p { margin: 0; font-size: 13px; color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'two-column',
    description: 'Two-column layout with sidebar and main content',
    tags: ['layout', 'two-column', 'sidebar'],
    code: `<script>
  let navItems = ['Dashboard', 'Projects', 'Tasks', 'Calendar'];
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="brand">App</div>
    {#each navItems as item}
      <a href={'#' + item.toLowerCase()}>{item}</a>
    {/each}
  </aside>
  <main class="content">
    <h1>Welcome</h1>
    <p>Main content area for the two-column layout. Build your application features here.</p>
  </main>
</div>

<style>
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; background-color: #f9fafb; border-right: 1px solid #e5e7eb; padding: 24px 12px; }
  .brand { font-size: 18px; font-weight: 700; padding: 0 12px 20px; }
  .sidebar a { display: block; padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .sidebar a:hover { background-color: #e5e7eb; }
  .content { flex: 1; padding: 32px; }
  .content h1 { margin: 0 0 16px; }
  .content p { color: #6b7280; line-height: 1.6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'full-width',
    description: 'Full-width layout with centered content and no sidebar',
    tags: ['layout', 'full-width', 'simple'],
    code: `<script>
  let sections = ['Hero', 'Features', 'Testimonials', 'CTA'];
</script>

<div class="layout">
  <header class="header">
    <span class="brand">FullWidth</span>
  </header>
  <main class="content">
    {#each sections as section}
      <section class="section">
        <h2>{section}</h2>
        <p>Content for {section} section. Full-width layout provides maximum space for content.</p>
      </section>
    {/each}
  </main>
  <footer class="footer">
    <p>&copy; 2026 FullWidth. All rights reserved.</p>
  </footer>
</div>

<style>
  .layout { min-height: 100vh; display: flex; flex-direction: column; }
  .header { padding: 16px 32px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .content { flex: 1; max-width: 800px; margin: 0 auto; width: 100%; padding: 0 24px; }
  .section { padding: 48px 0; border-bottom: 1px solid #f3f4f6; }
  .section h2 { margin: 0 0 12px; font-size: 28px; }
  .section p { color: #6b7280; font-size: 16px; line-height: 1.6; }
  .footer { padding: 24px 32px; text-align: center; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'sticky-header',
    description: 'Layout with sticky header and scrollable content below',
    tags: ['layout', 'sticky-header', 'scroll'],
    code: `<script>
  let items = Array.from({ length: 20 }, (_, i) => 'Item ' + (i + 1));
</script>

<div class="layout">
  <header class="header">
    <span class="brand">StickyLayout</span>
    <nav>
      <a href="#home">Home</a>
      <a href="#about">About</a>
    </nav>
  </header>
  <main class="content">
    {#each items as item}
      <div class="item">{item}</div>
    {/each}
  </main>
</div>

<style>
  .layout { height: 100vh; display: flex; flex-direction: column; }
  .header { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 18px; font-weight: 700; }
  .header nav a { text-decoration: none; color: #374151; margin-left: 16px; }
  .content { flex: 1; overflow-y: auto; padding: 24px; }
  .item { padding: 16px; margin-bottom: 8px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'sticky-sidebar',
    description: 'Layout with sticky sidebar and scrollable main content',
    tags: ['layout', 'sticky-sidebar', 'scroll'],
    code: `<script>
  let navItems = ['Section 1', 'Section 2', 'Section 3', 'Section 4'];
  let paragraphs = Array.from({ length: 8 }, (_, i) => 'Paragraph ' + (i + 1) + ': Lorem ipsum content for demonstration purposes.');
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="brand">Docs</div>
    {#each navItems as item}
      <a href={'#' + item.toLowerCase().replace(/\\s/g, '-')}>{item}</a>
    {/each}
  </aside>
  <main class="content">
    {#each paragraphs as para, i}
      <div class="block">
        <h3>Block {i + 1}</h3>
        <p>{para}</p>
      </div>
    {/each}
  </main>
</div>

<style>
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; position: sticky; top: 0; height: 100vh; overflow-y: auto; background-color: #f9fafb; border-right: 1px solid #e5e7eb; padding: 20px 12px; }
  .brand { font-size: 18px; font-weight: 700; padding: 0 12px 16px; }
  .sidebar a { display: block; padding: 8px 12px; text-decoration: none; color: #6b7280; border-radius: 6px; font-size: 14px; }
  .sidebar a:hover { background-color: #e5e7eb; }
  .content { flex: 1; padding: 32px; }
  .block { margin-bottom: 32px; }
  .block h3 { margin: 0 0 8px; }
  .block p { color: #6b7280; line-height: 1.6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'grid',
    description: 'CSS Grid layout with responsive card grid',
    tags: ['layout', 'grid', 'responsive'],
    code: `<script>
  let cards = Array.from({ length: 9 }, (_, i) => ({ title: 'Card ' + (i + 1), desc: 'Description for card ' + (i + 1) }));
</script>

<div class="layout">
  <header class="header">
    <span class="brand">GridLayout</span>
  </header>
  <main class="content">
    <div class="grid">
      {#each cards as card}
        <div class="card">
          <div class="card-thumb">{card.title[0]}{card.title.split(' ')[1]}</div>
          <div class="card-body">
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </div>
        </div>
      {/each}
    </div>
  </main>
</div>

<style>
  .layout { min-height: 100vh; }
  .header { padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .content { padding: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .card-thumb { height: 100px; background-color: #ede9fe; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #6366f1; font-weight: 700; }
  .card-body { padding: 16px; }
  .card-body h3 { margin: 0 0 6px; font-size: 16px; }
  .card-body p { margin: 0; font-size: 14px; color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
