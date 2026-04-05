import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal header with logo and navigation links',
    tags: ['header', 'minimal', 'navigation'],
    code: `<template>
  <header class="minimal-header">
    <span class="logo">Logo</span>
    <nav class="nav-links">
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MinimalHeader = defineComponent({
  name: 'MinimalHeader',
  setup() {
    return {};
  },
});

export default createVueMicroApp({ name: 'minimal-header', App: MinimalHeader });
</script>

<style scoped>
.minimal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.nav-links {
  display: flex;
  gap: 24px;
}
.nav-links a {
  text-decoration: none;
  color: #374151;
}
.nav-links a:hover {
  color: #111827;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-search',
    description: 'Header with integrated search bar and autocomplete suggestions',
    tags: ['header', 'search', 'interactive'],
    code: `<template>
  <header class="search-header">
    <span class="brand">Brand</span>
    <div class="search-wrapper">
      <input
        type="text"
        placeholder="Search..."
        v-model="query"
        @focus="focused = true"
        @blur="onBlur"
        class="search-input"
      />
      <ul v-if="focused && query && filteredSuggestions.length" class="suggestions">
        <li v-for="s in filteredSuggestions" :key="s" @mousedown="query = s">{{ s }}</li>
      </ul>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SearchHeader = defineComponent({
  name: 'SearchHeader',
  setup() {
    const query = ref('');
    const focused = ref(false);
    const items = ['Dashboard', 'Settings', 'Profile', 'Help'];
    const filteredSuggestions = computed(() =>
      items.filter(i => i.toLowerCase().includes(query.value.toLowerCase()))
    );
    const onBlur = () => {
      setTimeout(() => { focused.value = false; }, 200);
    };
    return { query, focused, filteredSuggestions, onBlur };
  },
});

export default createVueMicroApp({ name: 'search-header', App: SearchHeader });
</script>

<style scoped>
.search-header {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.brand {
  font-size: 20px;
  font-weight: 700;
  margin-right: 32px;
}
.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 480px;
}
.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  font-size: 14px;
}
.search-input:focus {
  border-color: #3b82f6;
}
.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  list-style: none;
  padding: 4px 0;
  margin: 4px 0 0;
  z-index: 10;
}
.suggestions li {
  padding: 8px 12px;
  cursor: pointer;
}
.suggestions li:hover {
  background-color: #f3f4f6;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-auth',
    description: 'Header with authentication buttons and user avatar',
    tags: ['header', 'auth', 'user'],
    code: `<template>
  <header class="auth-header">
    <span class="app-name">AppName</span>
    <nav class="auth-nav">
      <template v-if="loggedIn">
        <div class="avatar">{{ initials }}</div>
        <button class="btn-logout" @click="loggedIn = false">Logout</button>
      </template>
      <template v-else>
        <button class="btn-login" @click="loggedIn = true">Log In</button>
        <button class="btn-signup">Sign Up</button>
      </template>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AuthHeader = defineComponent({
  name: 'AuthHeader',
  setup() {
    const loggedIn = ref(false);
    const userName = ref('Jane Doe');
    const initials = computed(() =>
      userName.value.split(' ').map(n => n[0]).join('')
    );
    return { loggedIn, initials };
  },
});

export default createVueMicroApp({ name: 'auth-header', App: AuthHeader });
</script>

<style scoped>
.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.app-name {
  font-size: 20px;
  font-weight: 700;
}
.auth-nav {
  display: flex;
  gap: 12px;
  align-items: center;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}
.btn-login {
  padding: 8px 16px;
  border: 1px solid #3b82f6;
  background: transparent;
  color: #3b82f6;
  border-radius: 6px;
  cursor: pointer;
}
.btn-signup {
  padding: 8px 16px;
  border: none;
  background-color: #3b82f6;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.btn-logout {
  padding: 8px 16px;
  border: 1px solid #ef4444;
  background: transparent;
  color: #ef4444;
  border-radius: 6px;
  cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive header with hamburger menu toggle for mobile',
    tags: ['header', 'responsive', 'mobile'],
    code: `<template>
  <header class="responsive-header">
    <span class="logo">Brand</span>
    <button class="hamburger" @click="menuOpen = !menuOpen">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>
    <nav class="nav-menu" :class="{ open: menuOpen }">
      <a href="#home" @click="menuOpen = false">Home</a>
      <a href="#features" @click="menuOpen = false">Features</a>
      <a href="#pricing" @click="menuOpen = false">Pricing</a>
      <a href="#contact" @click="menuOpen = false">Contact</a>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ResponsiveHeader = defineComponent({
  name: 'ResponsiveHeader',
  setup() {
    const menuOpen = ref(false);
    return { menuOpen };
  },
});

export default createVueMicroApp({ name: 'responsive-header', App: ResponsiveHeader });
</script>

<style scoped>
.responsive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.bar {
  display: block;
  width: 24px;
  height: 3px;
  background-color: #374151;
  border-radius: 2px;
}
.nav-menu {
  display: flex;
  gap: 24px;
}
.nav-menu a {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
}
.nav-menu a:hover {
  color: #3b82f6;
}
@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }
  .nav-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    flex-direction: column;
    padding: 16px 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .nav-menu.open {
    display: flex;
  }
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed header with contrasting text and hover effects',
    tags: ['header', 'dark', 'theme'],
    code: `<template>
  <header class="dark-header">
    <span class="logo">DarkApp</span>
    <nav class="nav-links">
      <a v-for="link in links" :key="link.href" :href="link.href"
         :class="{ active: activeLink === link.href }"
         @click.prevent="activeLink = link.href">
        {{ link.label }}
      </a>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DarkHeader = defineComponent({
  name: 'DarkHeader',
  setup() {
    const activeLink = ref('#home');
    const links = [
      { href: '#home', label: 'Home' },
      { href: '#explore', label: 'Explore' },
      { href: '#library', label: 'Library' },
      { href: '#settings', label: 'Settings' },
    ];
    return { activeLink, links };
  },
});

export default createVueMicroApp({ name: 'dark-header', App: DarkHeader });
</script>

<style scoped>
.dark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background-color: #1f2937;
  color: #f9fafb;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.nav-links {
  display: flex;
  gap: 20px;
}
.nav-links a {
  text-decoration: none;
  color: #9ca3af;
  font-weight: 500;
  transition: color 0.2s;
}
.nav-links a:hover {
  color: #f9fafb;
}
.nav-links a.active {
  color: #60a5fa;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sticky',
    description: 'Sticky header that stays fixed at the top on scroll',
    tags: ['header', 'sticky', 'scroll'],
    code: `<template>
  <header class="sticky-header" :class="{ scrolled: isScrolled }">
    <span class="logo">StickyBrand</span>
    <nav class="nav-links">
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#services">Services</a>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const StickyHeader = defineComponent({
  name: 'StickyHeader',
  setup() {
    const isScrolled = ref(false);
    const handleScroll = () => {
      isScrolled.value = window.scrollY > 50;
    };
    onMounted(() => window.addEventListener('scroll', handleScroll));
    onUnmounted(() => window.removeEventListener('scroll', handleScroll));
    return { isScrolled };
  },
});

export default createVueMicroApp({ name: 'sticky-header', App: StickyHeader });
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #fff;
  transition: box-shadow 0.3s, padding 0.3s;
}
.sticky-header.scrolled {
  padding: 10px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.nav-links {
  display: flex;
  gap: 24px;
}
.nav-links a {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
}
.nav-links a:hover {
  color: #3b82f6;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-logo',
    description: 'Header with image logo and centered navigation',
    tags: ['header', 'logo', 'centered'],
    code: `<template>
  <header class="logo-header">
    <div class="logo-section">
      <div class="logo-icon">T</div>
      <span class="logo-text">Tuvix</span>
    </div>
    <nav class="center-nav">
      <a v-for="item in navItems" :key="item" href="#">{{ item }}</a>
    </nav>
    <div class="actions">
      <button class="btn-cta">Get Started</button>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const LogoHeader = defineComponent({
  name: 'LogoHeader',
  setup() {
    const navItems = ref(['Products', 'Solutions', 'Resources', 'Pricing']);
    return { navItems };
  },
});

export default createVueMicroApp({ name: 'logo-header', App: LogoHeader });
</script>

<style scoped>
.logo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 32px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-icon {
  width: 32px;
  height: 32px;
  background-color: #3b82f6;
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}
.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}
.center-nav {
  display: flex;
  gap: 32px;
}
.center-nav a {
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
}
.center-nav a:hover {
  color: #111827;
}
.btn-cta {
  padding: 8px 20px;
  background-color: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-cta:hover {
  background-color: #2563eb;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-dropdown',
    description: 'Header with dropdown menus on hover for sub-navigation',
    tags: ['header', 'dropdown', 'submenu'],
    code: `<template>
  <header class="dropdown-header">
    <span class="logo">DropNav</span>
    <nav class="nav-items">
      <div v-for="item in menuItems" :key="item.label" class="nav-item"
           @mouseenter="openMenu = item.label" @mouseleave="openMenu = ''">
        <span class="nav-label">{{ item.label }}</span>
        <ul v-if="item.children.length && openMenu === item.label" class="dropdown">
          <li v-for="child in item.children" :key="child">
            <a href="#">{{ child }}</a>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DropdownHeader = defineComponent({
  name: 'DropdownHeader',
  setup() {
    const openMenu = ref('');
    const menuItems = [
      { label: 'Products', children: ['Analytics', 'Automation', 'Integrations'] },
      { label: 'Solutions', children: ['Enterprise', 'Startup', 'Agency'] },
      { label: 'Company', children: ['About', 'Careers', 'Blog'] },
      { label: 'Pricing', children: [] },
    ];
    return { openMenu, menuItems };
  },
});

export default createVueMicroApp({ name: 'dropdown-header', App: DropdownHeader });
</script>

<style scoped>
.dropdown-header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  height: 56px;
}
.logo {
  font-size: 20px;
  font-weight: 700;
  margin-right: 48px;
}
.nav-items {
  display: flex;
  gap: 8px;
  height: 100%;
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  height: 100%;
}
.nav-label {
  color: #374151;
  font-weight: 500;
}
.nav-item:hover .nav-label {
  color: #3b82f6;
}
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  list-style: none;
  padding: 8px 0;
  margin: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
}
.dropdown li a {
  display: block;
  padding: 8px 16px;
  text-decoration: none;
  color: #374151;
}
.dropdown li a:hover {
  background-color: #f3f4f6;
  color: #111827;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-breadcrumb',
    description: 'Header with breadcrumb trail for hierarchical navigation',
    tags: ['header', 'breadcrumb', 'hierarchy'],
    code: `<template>
  <header class="breadcrumb-header">
    <div class="top-bar">
      <span class="logo">Portal</span>
      <nav class="main-nav">
        <a href="#">Dashboard</a>
        <a href="#">Projects</a>
        <a href="#">Settings</a>
      </nav>
    </div>
    <div class="breadcrumb-bar">
      <span v-for="(crumb, index) in breadcrumbs" :key="crumb.label" class="crumb">
        <a v-if="index < breadcrumbs.length - 1" href="#" @click.prevent="navigateTo(index)">{{ crumb.label }}</a>
        <span v-else class="current">{{ crumb.label }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
      </span>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BreadcrumbHeader = defineComponent({
  name: 'BreadcrumbHeader',
  setup() {
    const breadcrumbs = ref([
      { label: 'Home', path: '/' },
      { label: 'Projects', path: '/projects' },
      { label: 'Alpha', path: '/projects/alpha' },
      { label: 'Settings', path: '/projects/alpha/settings' },
    ]);
    const navigateTo = (index: number) => {
      breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
    };
    return { breadcrumbs, navigateTo };
  },
});

export default createVueMicroApp({ name: 'breadcrumb-header', App: BreadcrumbHeader });
</script>

<style scoped>
.breadcrumb-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.main-nav {
  display: flex;
  gap: 20px;
}
.main-nav a {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
}
.breadcrumb-bar {
  padding: 8px 24px;
  background: #f9fafb;
  font-size: 13px;
}
.crumb a {
  text-decoration: none;
  color: #3b82f6;
}
.crumb a:hover {
  text-decoration: underline;
}
.separator {
  margin: 0 8px;
  color: #9ca3af;
}
.current {
  color: #6b7280;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-actions',
    description: 'Header with action buttons like notifications and settings',
    tags: ['header', 'actions', 'toolbar'],
    code: `<template>
  <header class="actions-header">
    <span class="logo">WorkHub</span>
    <div class="action-bar">
      <button class="action-btn" @click="toggleNotifications">
        <span class="icon">&#128276;</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </button>
      <button class="action-btn" @click="showSettings = !showSettings">
        <span class="icon">&#9881;</span>
      </button>
      <div class="user-info">
        <div class="user-avatar">JD</div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ActionsHeader = defineComponent({
  name: 'ActionsHeader',
  setup() {
    const unreadCount = ref(3);
    const showSettings = ref(false);
    const toggleNotifications = () => {
      unreadCount.value = 0;
    };
    return { unreadCount, showSettings, toggleNotifications };
  },
});

export default createVueMicroApp({ name: 'actions-header', App: ActionsHeader });
</script>

<style scoped>
.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.action-bar {
  display: flex;
  align-items: center;
  gap: 16px;
}
.action-btn {
  position: relative;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 18px;
}
.action-btn:hover {
  background-color: #f3f4f6;
}
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.icon {
  line-height: 1;
}
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'transparent',
    description: 'Transparent header that overlays content with light text',
    tags: ['header', 'transparent', 'overlay'],
    code: `<template>
  <header class="transparent-header">
    <span class="logo">Overlay</span>
    <nav class="nav-links">
      <a v-for="item in navItems" :key="item" href="#">{{ item }}</a>
    </nav>
    <button class="btn-cta">Try Free</button>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TransparentHeader = defineComponent({
  name: 'TransparentHeader',
  setup() {
    const navItems = ref(['Features', 'Pricing', 'Docs', 'Blog']);
    return { navItems };
  },
});

export default createVueMicroApp({ name: 'transparent-header', App: TransparentHeader });
</script>

<style scoped>
.transparent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
.logo {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}
.nav-links {
  display: flex;
  gap: 28px;
}
.nav-links a {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}
.nav-links a:hover {
  color: #fff;
}
.btn-cta {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  backdrop-filter: blur(4px);
}
.btn-cta:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'fixed',
    description: 'Fixed-position header with scroll progress indicator',
    tags: ['header', 'fixed', 'progress'],
    code: `<template>
  <header class="fixed-header">
    <div class="header-content">
      <span class="logo">FixedNav</span>
      <nav class="nav-links">
        <a href="#intro">Intro</a>
        <a href="#features">Features</a>
        <a href="#faq">FAQ</a>
      </nav>
    </div>
    <div class="progress-bar" :style="{ width: scrollProgress + '%' }"></div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FixedHeader = defineComponent({
  name: 'FixedHeader',
  setup() {
    const scrollProgress = ref(0);
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    };
    onMounted(() => window.addEventListener('scroll', updateProgress));
    onUnmounted(() => window.removeEventListener('scroll', updateProgress));
    return { scrollProgress };
  },
});

export default createVueMicroApp({ name: 'fixed-header', App: FixedHeader });
</script>

<style scoped>
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.nav-links {
  display: flex;
  gap: 24px;
}
.nav-links a {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
}
.progress-bar {
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.1s;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-banner',
    description: 'Header with dismissible announcement banner above navigation',
    tags: ['header', 'banner', 'announcement'],
    code: `<template>
  <div class="header-with-banner">
    <div v-if="bannerVisible" class="banner">
      <span>{{ bannerMessage }}</span>
      <button class="banner-close" @click="bannerVisible = false">&times;</button>
    </div>
    <header class="main-header">
      <span class="logo">BannerApp</span>
      <nav class="nav-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#docs">Docs</a>
      </nav>
    </header>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BannerHeader = defineComponent({
  name: 'BannerHeader',
  setup() {
    const bannerVisible = ref(true);
    const bannerMessage = ref('New release v2.0 is out! Check out the latest features.');
    return { bannerVisible, bannerMessage };
  },
});

export default createVueMicroApp({ name: 'banner-header', App: BannerHeader });
</script>

<style scoped>
.banner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 24px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  position: relative;
}
.banner-close {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.8;
}
.banner-close:hover {
  opacity: 1;
}
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.nav-links {
  display: flex;
  gap: 24px;
}
.nav-links a {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
}
.nav-links a:hover {
  color: #3b82f6;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'mobile-menu',
    description: 'Header with slide-in mobile menu panel and overlay',
    tags: ['header', 'mobile', 'slide-menu'],
    code: `<template>
  <div class="mobile-header-wrapper">
    <header class="mobile-header">
      <span class="logo">MobileApp</span>
      <button class="menu-toggle" @click="isOpen = true">&#9776;</button>
    </header>
    <div v-if="isOpen" class="overlay" @click="isOpen = false"></div>
    <aside class="slide-menu" :class="{ open: isOpen }">
      <button class="close-btn" @click="isOpen = false">&times;</button>
      <nav class="slide-nav">
        <a v-for="item in menuItems" :key="item" href="#" @click="isOpen = false">{{ item }}</a>
      </nav>
    </aside>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MobileMenuHeader = defineComponent({
  name: 'MobileMenuHeader',
  setup() {
    const isOpen = ref(false);
    const menuItems = ref(['Home', 'Products', 'About', 'Blog', 'Contact']);
    return { isOpen, menuItems };
  },
});

export default createVueMicroApp({ name: 'mobile-menu-header', App: MobileMenuHeader });
</script>

<style scoped>
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.menu-toggle {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #374151;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
}
.slide-menu {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: #fff;
  z-index: 300;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  padding: 20px;
}
.slide-menu.open {
  transform: translateX(0);
}
.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #374151;
  display: block;
  margin-left: auto;
}
.slide-nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}
.slide-nav a {
  text-decoration: none;
  color: #374151;
  font-size: 18px;
  font-weight: 500;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}
.slide-nav a:hover {
  color: #3b82f6;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-progress',
    description: 'Header with step progress indicator for multi-step flows',
    tags: ['header', 'progress', 'stepper'],
    code: `<template>
  <header class="progress-header">
    <div class="header-top">
      <span class="logo">SetupWizard</span>
      <span class="step-label">Step {{ currentStep }} of {{ totalSteps }}</span>
    </div>
    <div class="steps-bar">
      <div v-for="step in totalSteps" :key="step" class="step"
           :class="{ completed: step < currentStep, active: step === currentStep }"
           @click="goToStep(step)">
        <div class="step-circle">{{ step }}</div>
        <span class="step-text">{{ stepLabels[step - 1] }}</span>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ProgressHeader = defineComponent({
  name: 'ProgressHeader',
  setup() {
    const currentStep = ref(2);
    const totalSteps = 4;
    const stepLabels = ['Account', 'Profile', 'Preferences', 'Review'];
    const goToStep = (step: number) => {
      if (step <= currentStep.value) {
        currentStep.value = step;
      }
    };
    return { currentStep, totalSteps, stepLabels, goToStep };
  },
});

export default createVueMicroApp({ name: 'progress-header', App: ProgressHeader });
</script>

<style scoped>
.progress-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.step-label {
  font-size: 14px;
  color: #6b7280;
}
.steps-bar {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 12px 24px;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #9ca3af;
  transition: all 0.2s;
}
.step.active .step-circle {
  border-color: #3b82f6;
  background: #3b82f6;
  color: #fff;
}
.step.completed .step-circle {
  border-color: #10b981;
  background: #10b981;
  color: #fff;
}
.step-text {
  font-size: 12px;
  color: #6b7280;
}
.step.active .step-text {
  color: #3b82f6;
  font-weight: 600;
}
.step.completed .step-text {
  color: #10b981;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
