import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal header with logo and navigation links',
    tags: ['header', 'minimal', 'navigation'],
    code: `<script>
  let brand = 'Logo';
</script>

<header class="header">
  <span class="brand">{brand}</span>
  <nav class="nav">
    <a href="#home">Home</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </nav>
</header>

<style>
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .nav { display: flex; gap: 24px; }
  .nav a { text-decoration: none; color: #374151; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-search',
    description: 'Header with integrated search bar and suggestions',
    tags: ['header', 'search', 'interactive'],
    code: `<script>
  let query = '';
  let focused = false;
  let allSuggestions = ['Dashboard', 'Settings', 'Profile', 'Help'];

  $: suggestions = allSuggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()));

  function handleFocus() {
    focused = true;
  }

  function handleBlur() {
    setTimeout(() => { focused = false; }, 200);
  }

  function selectSuggestion(s) {
    query = s;
  }
</script>

<header class="header">
  <span class="brand">Brand</span>
  <div class="search-wrapper">
    <input
      type="text"
      placeholder="Search..."
      bind:value={query}
      on:focus={handleFocus}
      on:blur={handleBlur}
    />
    {#if focused && query && suggestions.length > 0}
      <ul class="suggestions">
        {#each suggestions as s}
          <li on:click={() => selectSuggestion(s)}>{s}</li>
        {/each}
      </ul>
    {/if}
  </div>
</header>

<style>
  .header { display: flex; align-items: center; padding: 12px 24px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .brand { font-size: 20px; font-weight: 700; margin-right: 32px; }
  .search-wrapper { position: relative; flex: 1; max-width: 480px; }
  input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; }
  .suggestions { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; list-style: none; padding: 4px 0; margin: 4px 0 0; z-index: 10; }
  .suggestions li { padding: 8px 12px; cursor: pointer; }
  .suggestions li:hover { background-color: #f3f4f6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-auth',
    description: 'Header with authentication buttons and user avatar',
    tags: ['header', 'auth', 'user'],
    code: `<script>
  let loggedIn = false;

  function login() {
    loggedIn = true;
  }

  function logout() {
    loggedIn = false;
  }
</script>

<header class="header">
  <span class="brand">AppName</span>
  <nav class="nav">
    <a href="#features">Features</a>
    <a href="#pricing">Pricing</a>
    {#if loggedIn}
      <div class="user-area">
        <div class="avatar">JD</div>
        <button on:click={logout} class="btn-outline">Log out</button>
      </div>
    {:else}
      <div class="auth-buttons">
        <button on:click={login} class="btn-outline">Log in</button>
        <button on:click={login} class="btn-primary">Sign up</button>
      </div>
    {/if}
  </nav>
</header>

<style>
  .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .nav { display: flex; gap: 20px; align-items: center; }
  .nav a { text-decoration: none; color: #6b7280; }
  .user-area { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background-color: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 600; }
  .auth-buttons { display: flex; gap: 8px; }
  .btn-outline { padding: 6px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: transparent; cursor: pointer; }
  .btn-primary { padding: 6px 16px; border: none; border-radius: 6px; background: #6366f1; color: #fff; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive header with hamburger menu toggle for mobile',
    tags: ['header', 'responsive', 'mobile'],
    code: `<script>
  let menuOpen = false;
  let links = ['Home', 'Products', 'About', 'Contact'];

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function closeMenu() {
    menuOpen = false;
  }
</script>

<header class="header">
  <div class="top-bar">
    <span class="brand">Brand</span>
    <button on:click={toggleMenu} class="menu-btn">
      {menuOpen ? '\u2715' : '\u2630'}
    </button>
  </div>
  {#if menuOpen}
    <nav class="mobile-nav">
      {#each links as link}
        <a href={'#' + link.toLowerCase()} on:click={closeMenu}>{link}</a>
      {/each}
    </nav>
  {/if}
</header>

<style>
  .header { background-color: #fff; border-bottom: 1px solid #e5e7eb; }
  .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; }
  .brand { font-size: 20px; font-weight: 700; }
  .menu-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
  .mobile-nav { display: flex; flex-direction: column; padding: 0 24px 16px; }
  .mobile-nav a { padding: 10px 0; text-decoration: none; color: #374151; border-bottom: 1px solid #f3f4f6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed header with contrasting text and accent colors',
    tags: ['header', 'dark', 'theme'],
    code: `<script>
  let links = ['Dashboard', 'Analytics', 'Reports', 'Settings'];
</script>

<header class="header">
  <span class="brand">DarkApp</span>
  <nav class="nav">
    {#each links as link}
      <a href={'#' + link.toLowerCase()}>{link}</a>
    {/each}
  </nav>
  <button class="upgrade-btn">Upgrade</button>
</header>

<style>
  .header { display: flex; justify-content: space-between; align-items: center; padding: 14px 28px; background-color: #111827; color: #f9fafb; }
  .brand { font-size: 20px; font-weight: 700; color: #818cf8; }
  .nav { display: flex; gap: 24px; }
  .nav a { text-decoration: none; color: #d1d5db; font-size: 14px; }
  .upgrade-btn { padding: 8px 18px; border: none; border-radius: 6px; background-color: #818cf8; color: #fff; cursor: pointer; font-weight: 600; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'sticky',
    description: 'Sticky header that remains at top on scroll with shadow',
    tags: ['header', 'sticky', 'scroll'],
    code: `<script>
  import { onMount, onDestroy } from 'svelte';

  let scrolled = false;

  function onScroll() {
    scrolled = window.scrollY > 10;
  }

  onMount(() => {
    window.addEventListener('scroll', onScroll);
  });

  onDestroy(() => {
    window.removeEventListener('scroll', onScroll);
  });
</script>

<header class="header" class:scrolled>
  <span class="brand">StickyBrand</span>
  <nav class="nav">
    <a href="#home">Home</a>
    <a href="#services">Services</a>
    <a href="#contact">Contact</a>
  </nav>
</header>

<style>
  .header { position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background-color: #fff; transition: box-shadow 0.2s; }
  .header.scrolled { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .brand { font-size: 20px; font-weight: 700; }
  .nav { display: flex; gap: 20px; }
  .nav a { text-decoration: none; color: #374151; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-logo',
    description: 'Header with image logo placeholder and centered navigation',
    tags: ['header', 'logo', 'centered'],
    code: `<script>
  let brand = 'Tuvix';
</script>

<header class="header">
  <div class="logo-area">
    <div class="logo-icon">T</div>
    <span class="logo-text">{brand}</span>
  </div>
  <nav class="nav">
    <a href="#docs">Docs</a>
    <a href="#api">API</a>
    <a href="#blog">Blog</a>
    <a href="#github">GitHub</a>
  </nav>
</header>

<style>
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; border-bottom: 2px solid #e5e7eb; }
  .logo-area { display: flex; align-items: center; gap: 12px; }
  .logo-icon { width: 40px; height: 40px; border-radius: 8px; background-color: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; }
  .logo-text { font-size: 18px; font-weight: 700; }
  .nav { display: flex; gap: 28px; }
  .nav a { text-decoration: none; color: #374151; font-weight: 500; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-dropdown',
    description: 'Header with dropdown menus for nested navigation',
    tags: ['header', 'dropdown', 'nested'],
    code: `<script>
  let openMenu = '';
  let menus = {
    Products: ['Widget A', 'Widget B', 'Widget C'],
    Solutions: ['Enterprise', 'Startup', 'Agency'],
    Resources: ['Docs', 'Tutorials', 'Community'],
  };

  function showMenu(label) {
    openMenu = label;
  }

  function hideMenu() {
    openMenu = '';
  }
</script>

<header class="header">
  <span class="brand">Brand</span>
  <nav class="nav">
    {#each Object.entries(menus) as [label, items]}
      <div
        class="dropdown"
        on:mouseenter={() => showMenu(label)}
        on:mouseleave={hideMenu}
      >
        <button class="dropdown-btn">{label}</button>
        {#if openMenu === label}
          <ul class="dropdown-list">
            {#each items as item}
              <li><a href={'#' + item.toLowerCase().replace(/\\s/g, '-')}>{item}</a></li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </nav>
</header>

<style>
  .header { display: flex; align-items: center; padding: 12px 24px; background-color: #fff; border-bottom: 1px solid #e5e7eb; position: relative; }
  .brand { font-size: 20px; font-weight: 700; margin-right: 40px; }
  .nav { display: flex; gap: 4px; }
  .dropdown { position: relative; }
  .dropdown-btn { padding: 8px 14px; background: none; border: none; cursor: pointer; font-weight: 500; color: #374151; }
  .dropdown-list { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; list-style: none; padding: 8px 0; margin: 0; min-width: 160px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 20; }
  .dropdown-list li a { display: block; padding: 8px 16px; text-decoration: none; color: #374151; }
  .dropdown-list li a:hover { background-color: #f3f4f6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-breadcrumb',
    description: 'Header that includes a breadcrumb trail below the main nav',
    tags: ['header', 'breadcrumb', 'navigation'],
    code: `<script>
  let crumbs = [
    { label: 'Home', href: '#home' },
    { label: 'Products', href: '#products' },
    { label: 'Widget Pro', href: '#widget-pro' },
  ];
</script>

<header class="header">
  <div class="top-bar">
    <span class="brand">Store</span>
    <nav class="nav">
      <a href="#shop">Shop</a>
      <a href="#deals">Deals</a>
      <a href="#cart">Cart (0)</a>
    </nav>
  </div>
  <div class="breadcrumb-bar">
    {#each crumbs as crumb, i}
      {#if i > 0}
        <span class="separator">/</span>
      {/if}
      {#if i < crumbs.length - 1}
        <a href={crumb.href} class="crumb-link">{crumb.label}</a>
      {:else}
        <span class="crumb-current">{crumb.label}</span>
      {/if}
    {/each}
  </div>
</header>

<style>
  .header { border-bottom: 1px solid #e5e7eb; }
  .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; }
  .brand { font-size: 20px; font-weight: 700; }
  .nav { display: flex; gap: 20px; }
  .nav a { text-decoration: none; color: #374151; }
  .breadcrumb-bar { padding: 8px 24px; background-color: #f9fafb; font-size: 13px; }
  .separator { margin: 0 8px; color: #9ca3af; }
  .crumb-link { text-decoration: none; color: #6366f1; }
  .crumb-current { color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-actions',
    description: 'Header with action buttons like notifications and settings',
    tags: ['header', 'actions', 'icons'],
    code: `<script>
  let notifCount = 3;
</script>

<header class="header">
  <span class="brand">Platform</span>
  <div class="actions">
    <button class="icon-btn">
      \u{1F514}
      {#if notifCount > 0}
        <span class="badge">{notifCount}</span>
      {/if}
    </button>
    <button class="icon-btn">\u2699</button>
    <div class="avatar">AB</div>
  </div>
</header>

<style>
  .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .actions { display: flex; align-items: center; gap: 16px; }
  .icon-btn { position: relative; background: none; border: none; cursor: pointer; font-size: 20px; }
  .badge { position: absolute; top: -4px; right: -6px; background-color: #ef4444; color: #fff; font-size: 11px; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background-color: #10b981; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'transparent',
    description: 'Transparent header designed for hero sections with overlay text',
    tags: ['header', 'transparent', 'hero'],
    code: `<script>
  let links = ['Home', 'Gallery', 'About', 'Contact'];
</script>

<header class="header">
  <span class="brand">Overlay</span>
  <nav class="nav">
    {#each links as link}
      <a href={'#' + link.toLowerCase()}>{link}</a>
    {/each}
  </nav>
</header>

<style>
  .header { position: absolute; top: 0; left: 0; right: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; background: transparent; }
  .brand { font-size: 22px; font-weight: 700; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
  .nav { display: flex; gap: 24px; }
  .nav a { text-decoration: none; color: #fff; font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'fixed',
    description: 'Fixed position header that stays at viewport top',
    tags: ['header', 'fixed', 'position'],
    code: `<script>
  let brand = 'FixedNav';
</script>

<header class="header">
  <span class="brand">{brand}</span>
  <nav class="nav">
    <a href="#overview">Overview</a>
    <a href="#pricing">Pricing</a>
    <a href="#faq">FAQ</a>
  </nav>
  <button class="cta-btn">Get Started</button>
</header>

<style>
  .header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background-color: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
  .brand { font-size: 20px; font-weight: 700; color: #111827; }
  .nav { display: flex; gap: 24px; }
  .nav a { text-decoration: none; color: #4b5563; }
  .cta-btn { padding: 8px 20px; border-radius: 6px; border: none; background-color: #2563eb; color: #fff; cursor: pointer; font-weight: 600; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-banner',
    description: 'Header with a promotional banner above the main nav',
    tags: ['header', 'banner', 'promotion'],
    code: `<script>
  let bannerVisible = true;

  function closeBanner() {
    bannerVisible = false;
  }
</script>

<header>
  {#if bannerVisible}
    <div class="banner">
      <span>New release! Check out v2.0 features</span>
      <button on:click={closeBanner} class="close-btn">\u2715</button>
    </div>
  {/if}
  <div class="main-bar">
    <span class="brand">Product</span>
    <nav class="nav">
      <a href="#features">Features</a>
      <a href="#changelog">Changelog</a>
      <a href="#docs">Docs</a>
    </nav>
  </div>
</header>

<style>
  .banner { display: flex; justify-content: center; align-items: center; padding: 8px 16px; background-color: #6366f1; color: #fff; font-size: 14px; position: relative; }
  .close-btn { position: absolute; right: 16px; background: none; border: none; color: #fff; cursor: pointer; font-size: 16px; }
  .main-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .nav { display: flex; gap: 20px; }
  .nav a { text-decoration: none; color: #374151; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'mobile-menu',
    description: 'Header with slide-in mobile menu panel',
    tags: ['header', 'mobile', 'slide-menu'],
    code: `<script>
  let open = false;
  let links = ['Home', 'Explore', 'Bookmarks', 'Profile', 'Settings'];

  function openMenu() {
    open = true;
  }

  function closeMenu() {
    open = false;
  }
</script>

<header class="header">
  <span class="brand">MobileApp</span>
  <button on:click={openMenu} class="menu-btn">\u2630</button>
</header>

{#if open}
  <div class="overlay-wrapper">
    <div class="backdrop" on:click={closeMenu}></div>
    <nav class="side-panel">
      <button on:click={closeMenu} class="close-btn">\u2715</button>
      {#each links as link}
        <a href={'#' + link.toLowerCase()} on:click={closeMenu}>{link}</a>
      {/each}
    </nav>
  </div>
{/if}

<style>
  .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; }
  .menu-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
  .overlay-wrapper { position: fixed; inset: 0; z-index: 100; display: flex; }
  .backdrop { flex: 1; background-color: rgba(0,0,0,0.4); }
  .side-panel { width: 280px; background-color: #fff; padding: 24px; display: flex; flex-direction: column; gap: 4px; }
  .close-btn { align-self: flex-end; background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px; }
  .side-panel a { padding: 12px 8px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 16px; }
  .side-panel a:hover { background-color: #f3f4f6; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-progress',
    description: 'Header with a progress bar indicating page scroll position',
    tags: ['header', 'progress', 'scroll'],
    code: `<script>
  import { onMount, onDestroy } from 'svelte';

  let progress = 0;

  function onScroll() {
    let docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
  }

  onMount(() => {
    window.addEventListener('scroll', onScroll);
  });

  onDestroy(() => {
    window.removeEventListener('scroll', onScroll);
  });
</script>

<header class="header">
  <div class="top-bar">
    <span class="brand">Reader</span>
    <nav class="nav">
      <a href="#article">Article</a>
      <a href="#comments">Comments</a>
    </nav>
  </div>
  <div class="progress-track">
    <div class="progress-fill" style="width: {progress}%"></div>
  </div>
</header>

<style>
  .header { position: sticky; top: 0; z-index: 50; background-color: #fff; }
  .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; }
  .brand { font-size: 20px; font-weight: 700; }
  .nav { display: flex; gap: 20px; }
  .nav a { text-decoration: none; color: #374151; }
  .progress-track { height: 3px; background-color: #e5e7eb; }
  .progress-fill { height: 100%; background-color: #6366f1; transition: width 0.1s; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
