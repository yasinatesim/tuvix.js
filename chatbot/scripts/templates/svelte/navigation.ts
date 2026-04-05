import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'breadcrumb',
    description: 'Breadcrumb navigation showing current page path',
    tags: ['navigation', 'breadcrumb', 'path'],
    code: `<script>
  let crumbs = [
    { label: 'Home', href: '#home' },
    { label: 'Products', href: '#products' },
    { label: 'Accessories', href: '#accessories' },
    { label: 'Cables', href: '#cables' },
  ];
</script>

<nav class="breadcrumb">
  {#each crumbs as crumb, i}
    {#if i > 0}<span class="sep">/</span>{/if}
    {#if i < crumbs.length - 1}
      <a href={crumb.href}>{crumb.label}</a>
    {:else}
      <span class="current">{crumb.label}</span>
    {/if}
  {/each}
</nav>

<style>
  .breadcrumb { display: flex; align-items: center; gap: 4px; padding: 12px 0; font-size: 14px; }
  .sep { color: #9ca3af; margin: 0 4px; }
  a { text-decoration: none; color: #6366f1; }
  a:hover { text-decoration: underline; }
  .current { color: #6b7280; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Breadcrumb from './Breadcrumb.svelte';
export default createSvelteMicroApp({ name: 'breadcrumb-nav', App: Breadcrumb });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'tabs',
    description: 'Tab navigation with active state indicator',
    tags: ['navigation', 'tabs', 'switching'],
    code: `<script>
  let tabs = ['Overview', 'Features', 'Pricing', 'FAQ'];
  let active = 'Overview';

  function selectTab(tab) { active = tab; }
</script>

<div class="tabs-container">
  <div class="tabs">
    {#each tabs as tab}
      <button class="tab" class:active={active === tab} on:click={() => selectTab(tab)}>{tab}</button>
    {/each}
  </div>
  <div class="content">
    <p>Content for {active} tab.</p>
  </div>
</div>

<style>
  .tabs { display: flex; border-bottom: 2px solid #e5e7eb; }
  .tab { padding: 12px 20px; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-size: 14px; color: #6b7280; font-weight: 500; }
  .tab.active { border-bottom-color: #6366f1; color: #6366f1; font-weight: 600; }
  .tab:hover { color: #374151; }
  .content { padding: 20px 0; }
  .content p { color: #374151; font-size: 14px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import TabsNav from './TabsNav.svelte';
export default createSvelteMicroApp({ name: 'tabs-nav', App: TabsNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'stepper',
    description: 'Step-by-step navigation with progress indicators',
    tags: ['navigation', 'stepper', 'progress'],
    code: `<script>
  let steps = ['Cart', 'Shipping', 'Payment', 'Review'];
  let currentStep = 1;

  function goTo(index) {
    if (index <= currentStep) currentStep = index;
  }

  function next() {
    if (currentStep < steps.length - 1) currentStep += 1;
  }

  function prev() {
    if (currentStep > 0) currentStep -= 1;
  }
</script>

<div class="stepper">
  <div class="steps">
    {#each steps as step, i}
      <div class="step" class:completed={i < currentStep} class:active={i === currentStep} on:click={() => goTo(i)}>
        <div class="circle">{i < currentStep ? '\u2713' : i + 1}</div>
        <span class="label">{step}</span>
      </div>
      {#if i < steps.length - 1}
        <div class="connector" class:filled={i < currentStep}></div>
      {/if}
    {/each}
  </div>
  <div class="actions">
    <button on:click={prev} disabled={currentStep === 0}>Back</button>
    <button on:click={next} disabled={currentStep === steps.length - 1} class="primary">Next</button>
  </div>
</div>

<style>
  .stepper { padding: 24px; }
  .steps { display: flex; align-items: center; margin-bottom: 24px; }
  .step { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  .circle { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #6b7280; background: #fff; }
  .step.active .circle { border-color: #6366f1; color: #6366f1; }
  .step.completed .circle { border-color: #16a34a; background-color: #16a34a; color: #fff; }
  .label { margin-top: 6px; font-size: 12px; color: #6b7280; }
  .step.active .label { color: #6366f1; font-weight: 600; }
  .connector { flex: 1; height: 2px; background-color: #d1d5db; margin: 0 8px; margin-bottom: 20px; }
  .connector.filled { background-color: #16a34a; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; }
  button { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  button:disabled { opacity: 0.4; }
  button.primary { background-color: #6366f1; color: #fff; border: none; font-weight: 600; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import StepperNav from './StepperNav.svelte';
export default createSvelteMicroApp({ name: 'stepper-nav', App: StepperNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'pagination',
    description: 'Pagination navigation with page numbers',
    tags: ['navigation', 'pagination', 'pages'],
    code: `<script>
  let totalPages = 10;
  let currentPage = 1;

  function goTo(page) { currentPage = page; }
  function prev() { if (currentPage > 1) currentPage -= 1; }
  function next() { if (currentPage < totalPages) currentPage += 1; }

  $: pages = Array.from({ length: totalPages }, (_, i) => i + 1);
</script>

<nav class="pagination">
  <button on:click={prev} disabled={currentPage === 1} class="nav-btn">Prev</button>
  {#each pages as page}
    <button class="page-btn" class:active={currentPage === page} on:click={() => goTo(page)}>{page}</button>
  {/each}
  <button on:click={next} disabled={currentPage === totalPages} class="nav-btn">Next</button>
</nav>

<style>
  .pagination { display: flex; align-items: center; gap: 4px; }
  .nav-btn { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
  .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .page-btn { width: 36px; height: 36px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
  .page-btn.active { background-color: #6366f1; color: #fff; border-color: #6366f1; }
  .page-btn:hover { background-color: #f3f4f6; }
  .page-btn.active:hover { background-color: #6366f1; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import PaginationNav from './PaginationNav.svelte';
export default createSvelteMicroApp({ name: 'pagination-nav', App: PaginationNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'menu',
    description: 'Dropdown menu navigation triggered by button click',
    tags: ['navigation', 'menu', 'dropdown'],
    code: `<script>
  let open = false;
  let items = ['Profile', 'Settings', 'Billing', 'Help', 'Log out'];

  function toggleMenu() { open = !open; }
  function closeMenu() { open = false; }
  function selectItem(item) { alert('Selected: ' + item); closeMenu(); }
</script>

<div class="menu-wrapper">
  <button on:click={toggleMenu} class="menu-btn">Menu \u25BC</button>
  {#if open}
    <div class="dropdown">
      {#each items as item}
        <button class="menu-item" on:click={() => selectItem(item)}>{item}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .menu-wrapper { position: relative; display: inline-block; }
  .menu-btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; }
  .dropdown { position: absolute; top: 100%; left: 0; margin-top: 4px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; min-width: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 20; padding: 4px; }
  .menu-item { display: block; width: 100%; text-align: left; padding: 8px 12px; background: none; border: none; font-size: 14px; color: #374151; cursor: pointer; border-radius: 6px; }
  .menu-item:hover { background-color: #f3f4f6; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import MenuNav from './MenuNav.svelte';
export default createSvelteMicroApp({ name: 'menu-nav', App: MenuNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'navbar',
    description: 'Horizontal navbar with links and active indicator',
    tags: ['navigation', 'navbar', 'horizontal'],
    code: `<script>
  let links = ['Home', 'Products', 'About', 'Blog', 'Contact'];
  let active = 'Home';

  function setActive(link) { active = link; }
</script>

<nav class="navbar">
  {#each links as link}
    <a href={'#' + link.toLowerCase()} class="nav-link" class:active={active === link} on:click={() => setActive(link)}>{link}</a>
  {/each}
</nav>

<style>
  .navbar { display: flex; gap: 4px; padding: 8px; background-color: #f9fafb; border-radius: 10px; }
  .nav-link { padding: 8px 16px; text-decoration: none; color: #6b7280; border-radius: 6px; font-size: 14px; font-weight: 500; }
  .nav-link:hover { background-color: #e5e7eb; color: #374151; }
  .nav-link.active { background-color: #fff; color: #111827; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Navbar from './Navbar.svelte';
export default createSvelteMicroApp({ name: 'navbar', App: Navbar });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'drawer',
    description: 'Navigation drawer that slides in from the side',
    tags: ['navigation', 'drawer', 'slide'],
    code: `<script>
  let open = false;
  let items = ['Dashboard', 'Messages', 'Calendar', 'Files', 'Settings'];

  function openDrawer() { open = true; }
  function closeDrawer() { open = false; }
</script>

<button on:click={openDrawer} class="open-btn">\u2630 Navigation</button>

{#if open}
  <div class="overlay" on:click={closeDrawer}>
    <nav class="drawer" on:click|stopPropagation>
      <div class="drawer-header">
        <span class="brand">App</span>
        <button on:click={closeDrawer} class="close-btn">\u2715</button>
      </div>
      {#each items as item}
        <a href={'#' + item.toLowerCase()} on:click={closeDrawer}>{item}</a>
      {/each}
    </nav>
  </div>
{/if}

<style>
  .open-btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.3); z-index: 100; }
  .drawer { position: fixed; top: 0; left: 0; width: 260px; height: 100%; background: #fff; padding: 0; box-shadow: 4px 0 20px rgba(0,0,0,0.1); }
  .drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 18px; font-weight: 700; }
  .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; }
  .drawer a { display: block; padding: 12px 20px; text-decoration: none; color: #374151; font-size: 15px; }
  .drawer a:hover { background-color: #f3f4f6; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import DrawerNav from './DrawerNav.svelte';
export default createSvelteMicroApp({ name: 'drawer-nav', App: DrawerNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'mega-menu',
    description: 'Mega menu with multi-column dropdown on hover',
    tags: ['navigation', 'mega-menu', 'complex'],
    code: `<script>
  let showMega = false;
  let columns = [
    { title: 'Products', links: ['Analytics', 'Automation', 'Security'] },
    { title: 'Solutions', links: ['Enterprise', 'SMB', 'Startups'] },
    { title: 'Resources', links: ['Blog', 'Docs', 'Community'] },
  ];

  function show() { showMega = true; }
  function hide() { showMega = false; }
</script>

<nav class="mega-nav" on:mouseleave={hide}>
  <a href="#home">Home</a>
  <div class="mega-trigger" on:mouseenter={show}>
    <span>Products \u25BC</span>
    {#if showMega}
      <div class="mega-panel">
        {#each columns as col}
          <div class="mega-column">
            <h4>{col.title}</h4>
            {#each col.links as link}
              <a href={'#' + link.toLowerCase()}>{link}</a>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
  <a href="#pricing">Pricing</a>
  <a href="#contact">Contact</a>
</nav>

<style>
  .mega-nav { display: flex; align-items: center; gap: 24px; padding: 12px 24px; border-bottom: 1px solid #e5e7eb; position: relative; }
  .mega-nav > a { text-decoration: none; color: #374151; font-size: 14px; font-weight: 500; }
  .mega-trigger { position: relative; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151; }
  .mega-panel { position: absolute; top: 100%; left: -100px; display: flex; gap: 32px; padding: 24px 32px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 30; margin-top: 12px; }
  .mega-column h4 { margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #111827; }
  .mega-column a { display: block; padding: 4px 0; text-decoration: none; color: #6b7280; font-size: 14px; }
  .mega-column a:hover { color: #6366f1; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import MegaMenu from './MegaMenu.svelte';
export default createSvelteMicroApp({ name: 'mega-menu', App: MegaMenu });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'bottom-bar',
    description: 'Bottom navigation bar for mobile-style apps',
    tags: ['navigation', 'bottom-bar', 'mobile'],
    code: `<script>
  let items = [
    { label: 'Home', icon: '\u{1F3E0}' },
    { label: 'Search', icon: '\u{1F50D}' },
    { label: 'Add', icon: '\u2795' },
    { label: 'Inbox', icon: '\u{1F4E8}' },
    { label: 'Profile', icon: '\u{1F464}' },
  ];
  let active = 'Home';

  function setActive(label) { active = label; }
</script>

<nav class="bottom-bar">
  {#each items as item}
    <button class="bar-item" class:active={active === item.label} on:click={() => setActive(item.label)}>
      <span class="icon">{item.icon}</span>
      <span class="label">{item.label}</span>
    </button>
  {/each}
</nav>

<style>
  .bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; background: #fff; border-top: 1px solid #e5e7eb; padding: 8px 0; z-index: 50; }
  .bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; cursor: pointer; padding: 4px; }
  .icon { font-size: 20px; }
  .label { font-size: 10px; color: #6b7280; }
  .bar-item.active .label { color: #6366f1; font-weight: 600; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import BottomBar from './BottomBar.svelte';
export default createSvelteMicroApp({ name: 'bottom-bar', App: BottomBar });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'side-menu',
    description: 'Vertical side menu with nested items',
    tags: ['navigation', 'side-menu', 'vertical'],
    code: `<script>
  let sections = [
    { label: 'Getting Started', items: ['Introduction', 'Installation', 'Quick Start'] },
    { label: 'Guides', items: ['Routing', 'State Management', 'Testing'] },
  ];
  let expanded = 'Getting Started';
  let active = 'Introduction';

  function toggleSection(label) {
    expanded = expanded === label ? '' : label;
  }

  function selectItem(item) { active = item; }
</script>

<nav class="side-menu">
  {#each sections as section}
    <button class="section-btn" on:click={() => toggleSection(section.label)}>
      {section.label} {expanded === section.label ? '\u25BC' : '\u25B6'}
    </button>
    {#if expanded === section.label}
      {#each section.items as item}
        <a href={'#' + item.toLowerCase().replace(/\\s/g, '-')} class="menu-item" class:active={active === item} on:click={() => selectItem(item)}>{item}</a>
      {/each}
    {/if}
  {/each}
</nav>

<style>
  .side-menu { width: 220px; padding: 16px 8px; }
  .section-btn { display: block; width: 100%; text-align: left; padding: 8px 12px; background: none; border: none; font-weight: 700; font-size: 13px; color: #374151; cursor: pointer; }
  .menu-item { display: block; padding: 6px 12px 6px 24px; text-decoration: none; color: #6b7280; font-size: 14px; border-radius: 6px; }
  .menu-item:hover { background-color: #f3f4f6; }
  .menu-item.active { color: #6366f1; background-color: #ede9fe; font-weight: 500; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import SideMenu from './SideMenu.svelte';
export default createSvelteMicroApp({ name: 'side-menu', App: SideMenu });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'wizard',
    description: 'Wizard navigation with labeled steps and completion state',
    tags: ['navigation', 'wizard', 'multi-step'],
    code: `<script>
  let steps = ['Account', 'Profile', 'Preferences', 'Confirm'];
  let current = 0;

  function goNext() { if (current < steps.length - 1) current += 1; }
  function goBack() { if (current > 0) current -= 1; }
</script>

<div class="wizard">
  <ol class="step-list">
    {#each steps as step, i}
      <li class="step" class:completed={i < current} class:active={i === current}>
        <span class="num">{i < current ? '\u2713' : i + 1}</span>
        {step}
      </li>
    {/each}
  </ol>
  <div class="wizard-body">
    <p>Step {current + 1}: {steps[current]}</p>
    <div class="wizard-actions">
      <button on:click={goBack} disabled={current === 0}>Previous</button>
      <button on:click={goNext} class="next-btn">{current === steps.length - 1 ? 'Finish' : 'Continue'}</button>
    </div>
  </div>
</div>

<style>
  .wizard { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; max-width: 600px; }
  .step-list { display: flex; list-style: none; padding: 0; margin: 0; background-color: #f9fafb; }
  .step { flex: 1; padding: 14px 12px; font-size: 13px; color: #9ca3af; display: flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; }
  .step.active { color: #6366f1; border-bottom-color: #6366f1; font-weight: 600; }
  .step.completed { color: #16a34a; }
  .num { width: 24px; height: 24px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
  .wizard-body { padding: 24px; }
  .wizard-body p { margin: 0 0 20px; font-size: 14px; color: #374151; }
  .wizard-actions { display: flex; gap: 8px; justify-content: flex-end; }
  button { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  button:disabled { opacity: 0.4; }
  .next-btn { background-color: #6366f1; color: #fff; border: none; font-weight: 600; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import WizardNav from './WizardNav.svelte';
export default createSvelteMicroApp({ name: 'wizard-nav', App: WizardNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'segmented-control',
    description: 'Segmented control for toggling between views',
    tags: ['navigation', 'segmented', 'toggle'],
    code: `<script>
  let options = ['Day', 'Week', 'Month', 'Year'];
  let selected = 'Week';

  function select(opt) { selected = opt; }
</script>

<div class="container">
  <div class="segmented">
    {#each options as opt}
      <button class="segment" class:active={selected === opt} on:click={() => select(opt)}>{opt}</button>
    {/each}
  </div>
  <div class="display">
    <p>Viewing: {selected}</p>
  </div>
</div>

<style>
  .container { padding: 16px; }
  .segmented { display: inline-flex; background-color: #f3f4f6; border-radius: 8px; padding: 3px; }
  .segment { padding: 8px 18px; border: none; background: transparent; cursor: pointer; font-size: 14px; color: #6b7280; border-radius: 6px; font-weight: 500; }
  .segment.active { background-color: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600; }
  .display { margin-top: 16px; }
  .display p { font-size: 14px; color: #374151; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import SegmentedControl from './SegmentedControl.svelte';
export default createSvelteMicroApp({ name: 'segmented-control', App: SegmentedControl });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'anchor-nav',
    description: 'Anchor navigation that scrolls to page sections',
    tags: ['navigation', 'anchor', 'scroll'],
    code: `<script>
  let sections = ['Introduction', 'Features', 'Pricing', 'FAQ', 'Contact'];
  let active = 'Introduction';

  function scrollTo(section) {
    active = section;
  }
</script>

<nav class="anchor-nav">
  {#each sections as section}
    <a
      href={'#' + section.toLowerCase()}
      class="anchor-link"
      class:active={active === section}
      on:click={() => scrollTo(section)}
    >
      {section}
    </a>
  {/each}
</nav>

<style>
  .anchor-nav { display: flex; flex-direction: column; gap: 2px; padding: 16px 0; border-left: 2px solid #e5e7eb; }
  .anchor-link { padding: 6px 16px; text-decoration: none; color: #6b7280; font-size: 14px; border-left: 2px solid transparent; margin-left: -2px; }
  .anchor-link:hover { color: #374151; }
  .anchor-link.active { color: #6366f1; border-left-color: #6366f1; font-weight: 600; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import AnchorNav from './AnchorNav.svelte';
export default createSvelteMicroApp({ name: 'anchor-nav', App: AnchorNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'tag-nav',
    description: 'Tag-based navigation with selectable filter chips',
    tags: ['navigation', 'tags', 'filter'],
    code: `<script>
  let tags = ['All', 'JavaScript', 'Svelte', 'React', 'Vue', 'Angular', 'TypeScript'];
  let selected = 'All';

  function selectTag(tag) { selected = tag; }
</script>

<div class="tag-nav">
  {#each tags as tag}
    <button class="tag" class:active={selected === tag} on:click={() => selectTag(tag)}>{tag}</button>
  {/each}
</div>
<p class="result">Showing results for: {selected}</p>

<style>
  .tag-nav { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 0; }
  .tag { padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 20px; background: #fff; cursor: pointer; font-size: 13px; color: #6b7280; }
  .tag:hover { border-color: #6366f1; color: #6366f1; }
  .tag.active { background-color: #6366f1; color: #fff; border-color: #6366f1; }
  .result { font-size: 14px; color: #374151; margin-top: 8px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import TagNav from './TagNav.svelte';
export default createSvelteMicroApp({ name: 'tag-nav', App: TagNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'dot-nav',
    description: 'Dot-style navigation for carousels or slideshows',
    tags: ['navigation', 'dots', 'carousel'],
    code: `<script>
  let total = 5;
  let current = 0;

  function goTo(index) { current = index; }
  function prev() { current = (current - 1 + total) % total; }
  function next() { current = (current + 1) % total; }
</script>

<div class="dot-nav-container">
  <div class="slide">Slide {current + 1}</div>
  <div class="controls">
    <button on:click={prev} class="arrow-btn">\u25C0</button>
    <div class="dots">
      {#each Array(total) as _, i}
        <button class="dot" class:active={current === i} on:click={() => goTo(i)}></button>
      {/each}
    </div>
    <button on:click={next} class="arrow-btn">\u25B6</button>
  </div>
</div>

<style>
  .dot-nav-container { width: 400px; }
  .slide { height: 200px; background-color: #ede9fe; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #6366f1; font-weight: 700; margin-bottom: 16px; }
  .controls { display: flex; align-items: center; justify-content: center; gap: 16px; }
  .arrow-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
  .dots { display: flex; gap: 8px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #d1d5db; background: #fff; cursor: pointer; padding: 0; }
  .dot.active { background-color: #6366f1; border-color: #6366f1; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import DotNav from './DotNav.svelte';
export default createSvelteMicroApp({ name: 'dot-nav', App: DotNav });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
