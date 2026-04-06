import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'collapsible',
    description: 'Sidebar that collapses to icons-only mode',
    tags: ['sidebar', 'collapsible', 'toggle'],
    code: `<script>
  let collapsed = false;
  let items = ['Dashboard', 'Analytics', 'Users', 'Settings'];

  function toggle() {
    collapsed = !collapsed;
  }
</script>

<aside class="sidebar" class:collapsed>
  <button on:click={toggle} class="toggle-btn">{collapsed ? '\u25B6' : '\u25C0'}</button>
  <nav class="nav">
    {#each items as item}
      <a href={'#' + item.toLowerCase()} class="nav-item">
        <span class="icon">{item[0]}</span>
        {#if !collapsed}
          <span class="label">{item}</span>
        {/if}
      </a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar { width: 240px; height: 100vh; background-color: #f9fafb; border-right: 1px solid #e5e7eb; padding: 16px; transition: width 0.2s; display: flex; flex-direction: column; }
  .sidebar.collapsed { width: 64px; }
  .toggle-btn { align-self: flex-end; background: none; border: none; cursor: pointer; font-size: 14px; margin-bottom: 16px; }
  .nav { display: flex; flex-direction: column; gap: 4px; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; }
  .nav-item:hover { background-color: #e5e7eb; }
  .icon { width: 24px; text-align: center; font-weight: 600; }
  .label { font-size: 14px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-icons',
    description: 'Sidebar with emoji icons beside each navigation item',
    tags: ['sidebar', 'icons', 'navigation'],
    code: `<script>
  let items = [
    { label: 'Home', icon: '\u{1F3E0}', href: '#home' },
    { label: 'Messages', icon: '\u{1F4E9}', href: '#messages' },
    { label: 'Calendar', icon: '\u{1F4C5}', href: '#calendar' },
    { label: 'Files', icon: '\u{1F4C1}', href: '#files' },
    { label: 'Settings', icon: '\u2699', href: '#settings' },
  ];
  let active = '#home';

  function setActive(href) {
    active = href;
  }
</script>

<aside class="sidebar">
  <div class="brand">MyApp</div>
  <nav class="nav">
    {#each items as item}
      <a
        href={item.href}
        class="nav-item"
        class:active={active === item.href}
        on:click={() => setActive(item.href)}
      >
        <span class="icon">{item.icon}</span>
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar { width: 220px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 20px 12px; }
  .brand { font-size: 18px; font-weight: 700; padding: 0 12px 20px; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px; }
  .nav { display: flex; flex-direction: column; gap: 2px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .nav-item:hover { background-color: #f3f4f6; }
  .nav-item.active { background-color: #ede9fe; color: #6366f1; font-weight: 600; }
  .icon { font-size: 18px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'nested',
    description: 'Sidebar with nested sub-menu items that expand on click',
    tags: ['sidebar', 'nested', 'submenu'],
    code: `<script>
  let sections = [
    { label: 'Products', children: ['All Products', 'Categories', 'Inventory'] },
    { label: 'Orders', children: ['Active', 'Completed', 'Refunds'] },
    { label: 'Customers', children: ['List', 'Segments', 'Reviews'] },
  ];
  let expanded = '';

  function toggleSection(label) {
    expanded = expanded === label ? '' : label;
  }
</script>

<aside class="sidebar">
  <div class="brand">Admin</div>
  <nav class="nav">
    {#each sections as section}
      <button class="section-btn" on:click={() => toggleSection(section.label)}>
        <span>{section.label}</span>
        <span>{expanded === section.label ? '\u25B2' : '\u25BC'}</span>
      </button>
      {#if expanded === section.label}
        <div class="children">
          {#each section.children as child}
            <a href={'#' + child.toLowerCase().replace(/\\s/g, '-')}>{child}</a>
          {/each}
        </div>
      {/if}
    {/each}
  </nav>
</aside>

<style>
  .sidebar { width: 240px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 20px 0; }
  .brand { font-size: 18px; font-weight: 700; padding: 0 20px 16px; }
  .nav { display: flex; flex-direction: column; }
  .section-btn { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 20px; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 600; color: #374151; text-align: left; }
  .section-btn:hover { background-color: #f9fafb; }
  .children { display: flex; flex-direction: column; }
  .children a { padding: 8px 20px 8px 36px; text-decoration: none; color: #6b7280; font-size: 13px; }
  .children a:hover { color: #6366f1; background-color: #f9fafb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'mini',
    description: 'Mini sidebar with only icons and tooltip labels on hover',
    tags: ['sidebar', 'mini', 'icons'],
    code: `<script>
  let items = [
    { label: 'Home', icon: '\u{1F3E0}' },
    { label: 'Search', icon: '\u{1F50D}' },
    { label: 'Inbox', icon: '\u{1F4E8}' },
    { label: 'Profile', icon: '\u{1F464}' },
    { label: 'Settings', icon: '\u2699' },
  ];
  let active = 'Home';

  function setActive(label) {
    active = label;
  }
</script>

<aside class="sidebar">
  {#each items as item}
    <button
      class="icon-btn"
      class:active={active === item.label}
      title={item.label}
      on:click={() => setActive(item.label)}
    >
      {item.icon}
    </button>
  {/each}
</aside>

<style>
  .sidebar { width: 56px; height: 100vh; background-color: #1f2937; display: flex; flex-direction: column; align-items: center; padding: 16px 0; gap: 8px; }
  .icon-btn { width: 40px; height: 40px; border: none; background: none; cursor: pointer; font-size: 20px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .icon-btn:hover { background-color: #374151; }
  .icon-btn.active { background-color: #4f46e5; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed sidebar with highlighted active item',
    tags: ['sidebar', 'dark', 'theme'],
    code: `<script>
  let items = ['Overview', 'Analytics', 'Reports', 'Team', 'Settings'];
  let active = 'Overview';

  function setActive(item) {
    active = item;
  }
</script>

<aside class="sidebar">
  <div class="brand">DarkPanel</div>
  <nav class="nav">
    {#each items as item}
      <a
        href={'#' + item.toLowerCase()}
        class="nav-item"
        class:active={active === item}
        on:click={() => setActive(item)}
      >
        {item}
      </a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar { width: 220px; height: 100vh; background-color: #111827; padding: 20px 12px; }
  .brand { font-size: 18px; font-weight: 700; color: #818cf8; padding: 0 12px 20px; }
  .nav { display: flex; flex-direction: column; gap: 2px; }
  .nav-item { padding: 10px 12px; text-decoration: none; color: #9ca3af; border-radius: 6px; font-size: 14px; }
  .nav-item:hover { color: #f9fafb; background-color: #1f2937; }
  .nav-item.active { color: #fff; background-color: #4f46e5; font-weight: 600; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-search',
    description: 'Sidebar with a search input to filter navigation items',
    tags: ['sidebar', 'search', 'filter'],
    code: `<script>
  let query = '';
  let allItems = ['Dashboard', 'Analytics', 'Users', 'Products', 'Orders', 'Reports', 'Settings', 'Help'];

  $: filteredItems = allItems.filter(item => item.toLowerCase().includes(query.toLowerCase()));
</script>

<aside class="sidebar">
  <div class="search-box">
    <input type="text" placeholder="Search..." bind:value={query} />
  </div>
  <nav class="nav">
    {#each filteredItems as item}
      <a href={'#' + item.toLowerCase()}>{item}</a>
    {/each}
    {#if filteredItems.length === 0}
      <span class="no-results">No results</span>
    {/if}
  </nav>
</aside>

<style>
  .sidebar { width: 220px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 16px 12px; }
  .search-box { margin-bottom: 12px; }
  .search-box input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .nav { display: flex; flex-direction: column; gap: 2px; }
  .nav a { padding: 8px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .nav a:hover { background-color: #f3f4f6; }
  .no-results { padding: 8px 12px; color: #9ca3af; font-size: 13px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-user-profile',
    description: 'Sidebar with a user profile section at the top',
    tags: ['sidebar', 'user', 'profile'],
    code: `<script>
  let user = { name: 'Jane Doe', email: 'jane@example.com', initials: 'JD' };
  let items = ['Dashboard', 'Projects', 'Calendar', 'Documents', 'Settings'];
</script>

<aside class="sidebar">
  <div class="profile">
    <div class="avatar">{user.initials}</div>
    <div class="info">
      <div class="name">{user.name}</div>
      <div class="email">{user.email}</div>
    </div>
  </div>
  <nav class="nav">
    {#each items as item}
      <a href={'#' + item.toLowerCase()}>{item}</a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar { width: 240px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 20px 12px; }
  .profile { display: flex; align-items: center; gap: 12px; padding: 0 12px 20px; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background-color: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
  .name { font-weight: 600; font-size: 14px; color: #111827; }
  .email { font-size: 12px; color: #6b7280; }
  .nav { display: flex; flex-direction: column; gap: 2px; }
  .nav a { padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .nav a:hover { background-color: #f3f4f6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-badge',
    description: 'Sidebar with notification badges on menu items',
    tags: ['sidebar', 'badge', 'notifications'],
    code: `<script>
  let items = [
    { label: 'Inbox', badge: 12 },
    { label: 'Tasks', badge: 3 },
    { label: 'Issues', badge: 7 },
    { label: 'Pull Requests', badge: 0 },
    { label: 'Releases', badge: 1 },
  ];
</script>

<aside class="sidebar">
  <div class="brand">Tracker</div>
  <nav class="nav">
    {#each items as item}
      <a href={'#' + item.label.toLowerCase().replace(/\\s/g, '-')} class="nav-item">
        <span>{item.label}</span>
        {#if item.badge > 0}
          <span class="badge">{item.badge}</span>
        {/if}
      </a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar { width: 220px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 20px 12px; }
  .brand { font-size: 18px; font-weight: 700; padding: 0 12px 16px; }
  .nav { display: flex; flex-direction: column; gap: 2px; }
  .nav-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .nav-item:hover { background-color: #f3f4f6; }
  .badge { background-color: #ef4444; color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive sidebar that transforms to overlay on small screens',
    tags: ['sidebar', 'responsive', 'overlay'],
    code: `<script>
  let open = false;
  let items = ['Home', 'Explore', 'Library', 'Favorites', 'Settings'];

  function toggleSidebar() {
    open = !open;
  }

  function closeSidebar() {
    open = false;
  }
</script>

<button on:click={toggleSidebar} class="trigger-btn">\u2630 Menu</button>

{#if open}
  <div class="overlay" on:click={closeSidebar}></div>
{/if}

<aside class="sidebar" class:open>
  <nav class="nav">
    {#each items as item}
      <a href={'#' + item.toLowerCase()} on:click={closeSidebar}>{item}</a>
    {/each}
  </nav>
</aside>

<style>
  .trigger-btn { position: fixed; top: 12px; left: 12px; z-index: 110; padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.3); z-index: 90; }
  .sidebar { position: fixed; top: 0; left: -260px; width: 250px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 60px 12px 20px; z-index: 100; transition: left 0.2s; }
  .sidebar.open { left: 0; }
  .nav { display: flex; flex-direction: column; gap: 2px; }
  .nav a { padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .nav a:hover { background-color: #f3f4f6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'multi-level',
    description: 'Multi-level sidebar with deeply nested navigation tree',
    tags: ['sidebar', 'multi-level', 'tree'],
    code: `<script>
  let tree = [
    { label: 'Components', children: [
      { label: 'Buttons', children: ['Primary', 'Secondary', 'Icon'] },
      { label: 'Inputs', children: ['Text', 'Select', 'Checkbox'] },
    ]},
    { label: 'Layout', children: [
      { label: 'Grid', children: ['12-col', 'Auto'] },
      { label: 'Flex', children: ['Row', 'Column'] },
    ]},
  ];
  let expandedL1 = '';
  let expandedL2 = '';

  function toggleL1(label) {
    expandedL1 = expandedL1 === label ? '' : label;
    expandedL2 = '';
  }

  function toggleL2(label) {
    expandedL2 = expandedL2 === label ? '' : label;
  }
</script>

<aside class="sidebar">
  <div class="brand">Docs</div>
  {#each tree as l1}
    <button class="l1-btn" on:click={() => toggleL1(l1.label)}>{l1.label}</button>
    {#if expandedL1 === l1.label}
      {#each l1.children as l2}
        <button class="l2-btn" on:click={() => toggleL2(l2.label)}>{l2.label}</button>
        {#if expandedL2 === l2.label}
          {#each l2.children as l3}
            <a href={'#' + l3.toLowerCase()} class="l3-link">{l3}</a>
          {/each}
        {/if}
      {/each}
    {/if}
  {/each}
</aside>

<style>
  .sidebar { width: 240px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 20px 0; overflow-y: auto; }
  .brand { font-size: 18px; font-weight: 700; padding: 0 20px 16px; }
  .l1-btn { display: block; width: 100%; text-align: left; padding: 8px 20px; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 14px; color: #111827; }
  .l2-btn { display: block; width: 100%; text-align: left; padding: 6px 20px 6px 32px; background: none; border: none; cursor: pointer; font-size: 13px; color: #374151; }
  .l3-link { display: block; padding: 4px 20px 4px 48px; text-decoration: none; color: #6b7280; font-size: 13px; }
  .l3-link:hover { color: #6366f1; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-footer',
    description: 'Sidebar with a footer section containing help and logout',
    tags: ['sidebar', 'footer', 'layout'],
    code: `<script>
  let items = ['Dashboard', 'Projects', 'Team', 'Reports'];
</script>

<aside class="sidebar">
  <div class="brand">WorkHub</div>
  <nav class="nav">
    {#each items as item}
      <a href={'#' + item.toLowerCase()}>{item}</a>
    {/each}
  </nav>
  <div class="footer">
    <a href="#help">Help & Support</a>
    <a href="#logout">Log out</a>
  </div>
</aside>

<style>
  .sidebar { width: 220px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 20px 12px; display: flex; flex-direction: column; }
  .brand { font-size: 18px; font-weight: 700; padding: 0 12px 20px; }
  .nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .nav a { padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .nav a:hover { background-color: #f3f4f6; }
  .footer { border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; flex-direction: column; gap: 2px; }
  .footer a { padding: 8px 12px; text-decoration: none; color: #6b7280; font-size: 13px; border-radius: 6px; }
  .footer a:hover { background-color: #f3f4f6; color: #374151; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'sticky',
    description: 'Sticky sidebar that scrolls independently of main content',
    tags: ['sidebar', 'sticky', 'scroll'],
    code: `<script>
  let items = ['Getting Started', 'Installation', 'Configuration', 'API Reference', 'Plugins', 'Themes', 'Deployment', 'FAQ'];
</script>

<aside class="sidebar">
  <div class="brand">Docs</div>
  <nav class="nav">
    {#each items as item}
      <a href={'#' + item.toLowerCase().replace(/\\s/g, '-')}>{item}</a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar { width: 220px; position: sticky; top: 0; height: 100vh; overflow-y: auto; background-color: #f9fafb; border-right: 1px solid #e5e7eb; padding: 20px 12px; }
  .brand { font-size: 16px; font-weight: 700; padding: 0 12px 16px; color: #111827; }
  .nav { display: flex; flex-direction: column; gap: 1px; }
  .nav a { padding: 8px 12px; text-decoration: none; color: #4b5563; border-radius: 6px; font-size: 14px; }
  .nav a:hover { background-color: #e5e7eb; color: #111827; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-groups',
    description: 'Sidebar with grouped sections and labels',
    tags: ['sidebar', 'groups', 'sections'],
    code: `<script>
  let groups = [
    { label: 'Main', items: ['Dashboard', 'Feed', 'Explore'] },
    { label: 'Management', items: ['Users', 'Roles', 'Permissions'] },
    { label: 'System', items: ['Settings', 'Logs', 'Health'] },
  ];
</script>

<aside class="sidebar">
  {#each groups as group}
    <div class="group">
      <div class="group-label">{group.label}</div>
      {#each group.items as item}
        <a href={'#' + item.toLowerCase()} class="nav-item">{item}</a>
      {/each}
    </div>
  {/each}
</aside>

<style>
  .sidebar { width: 220px; height: 100vh; background-color: #fff; border-right: 1px solid #e5e7eb; padding: 20px 12px; }
  .group { margin-bottom: 20px; }
  .group-label { padding: 0 12px 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; }
  .nav-item { display: block; padding: 8px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .nav-item:hover { background-color: #f3f4f6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'overlay',
    description: 'Overlay sidebar that slides over the content with a backdrop',
    tags: ['sidebar', 'overlay', 'slide'],
    code: `<script>
  let open = false;
  let items = ['Home', 'Profile', 'Messages', 'Notifications', 'Settings'];

  function openSidebar() {
    open = true;
  }

  function closeSidebar() {
    open = false;
  }
</script>

<button on:click={openSidebar} class="open-btn">\u2630</button>

{#if open}
  <div class="overlay-container">
    <div class="backdrop" on:click={closeSidebar}></div>
    <aside class="sidebar">
      <button on:click={closeSidebar} class="close-btn">\u2715</button>
      <nav class="nav">
        {#each items as item}
          <a href={'#' + item.toLowerCase()} on:click={closeSidebar}>{item}</a>
        {/each}
      </nav>
    </aside>
  </div>
{/if}

<style>
  .open-btn { padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 18px; }
  .overlay-container { position: fixed; inset: 0; z-index: 100; display: flex; }
  .backdrop { flex: 1; background-color: rgba(0,0,0,0.4); }
  .sidebar { width: 280px; background-color: #fff; padding: 20px; display: flex; flex-direction: column; }
  .close-btn { align-self: flex-end; background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 20px; }
  .nav { display: flex; flex-direction: column; gap: 4px; }
  .nav a { padding: 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 16px; }
  .nav a:hover { background-color: #f3f4f6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-toggle',
    description: 'Sidebar with a toggle switch to expand and collapse',
    tags: ['sidebar', 'toggle', 'expand'],
    code: `<script>
  let expanded = true;
  let items = ['Dashboard', 'Analytics', 'Contacts', 'Calendar', 'Settings'];

  function toggle() {
    expanded = !expanded;
  }
</script>

<aside class="sidebar" class:expanded>
  <div class="top">
    <button on:click={toggle} class="toggle-btn">
      {expanded ? '\u25C0' : '\u25B6'}
    </button>
  </div>
  <nav class="nav">
    {#each items as item}
      <a href={'#' + item.toLowerCase()} class="nav-item" title={item}>
        <span class="icon">{item[0]}</span>
        {#if expanded}
          <span class="label">{item}</span>
        {/if}
      </a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar { width: 64px; height: 100vh; background-color: #f9fafb; border-right: 1px solid #e5e7eb; padding: 12px 8px; transition: width 0.2s; display: flex; flex-direction: column; }
  .sidebar.expanded { width: 220px; padding: 12px; }
  .top { display: flex; justify-content: flex-end; margin-bottom: 12px; }
  .toggle-btn { background: none; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px; }
  .nav { display: flex; flex-direction: column; gap: 2px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
  .nav-item:hover { background-color: #e5e7eb; }
  .icon { width: 24px; text-align: center; font-weight: 600; font-size: 16px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
