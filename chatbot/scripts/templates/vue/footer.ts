import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal footer with copyright and a few links',
    tags: ['footer', 'minimal', 'simple'],
    code: `<template>
  <footer class="minimal-footer">
    <span class="copyright">&copy; {{ year }} {{ companyName }}. All rights reserved.</span>
    <nav class="footer-links">
      <a v-for="link in links" :key="link" href="#">{{ link }}</a>
    </nav>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MinimalFooter = defineComponent({
  name: 'MinimalFooter',
  setup() {
    const year = ref(new Date().getFullYear());
    const companyName = ref('Acme Inc');
    const links = ref(['Privacy', 'Terms', 'Contact']);
    return { year, companyName, links };
  },
});

export default createVueMicroApp({ name: 'minimal-footer', App: MinimalFooter });
</script>

<style scoped>
.minimal-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 32px; border-top: 1px solid #e5e7eb; background: #fff;
}
.copyright { font-size: 13px; color: #6b7280; }
.footer-links { display: flex; gap: 20px; }
.footer-links a { text-decoration: none; color: #6b7280; font-size: 13px; }
.footer-links a:hover { color: #374151; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'multi-column',
    description: 'Multi-column footer with organized link groups and branding',
    tags: ['footer', 'multi-column', 'organized'],
    code: `<template>
  <footer class="multi-col-footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <h3>{{ brandName }}</h3>
        <p>{{ tagline }}</p>
      </div>
      <div v-for="group in linkGroups" :key="group.title" class="link-group">
        <h4>{{ group.title }}</h4>
        <a v-for="link in group.links" :key="link" href="#">{{ link }}</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; {{ year }} {{ brandName }}</span>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MultiColumnFooter = defineComponent({
  name: 'MultiColumnFooter',
  setup() {
    const brandName = ref('CompanyName');
    const tagline = ref('Making the web better, one component at a time.');
    const year = ref(new Date().getFullYear());
    const linkGroups = ref([
      { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Docs'] },
      { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
      { title: 'Support', links: ['Help Center', 'Community', 'Status', 'Contact'] },
    ]);
    return { brandName, tagline, year, linkGroups };
  },
});

export default createVueMicroApp({ name: 'multi-column-footer', App: MultiColumnFooter });
</script>

<style scoped>
.multi-col-footer { background: #fff; border-top: 1px solid #e5e7eb; padding: 48px 32px 24px; }
.footer-grid { display: flex; gap: 60px; margin-bottom: 32px; }
.footer-brand { max-width: 260px; }
.footer-brand h3 { font-size: 18px; margin: 0 0 8px; }
.footer-brand p { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0; }
.link-group h4 { font-size: 13px; font-weight: 700; color: #374151; margin: 0 0 12px; text-transform: uppercase; }
.link-group a { display: block; padding: 4px 0; text-decoration: none; color: #6b7280; font-size: 14px; }
.link-group a:hover { color: #3b82f6; }
.footer-bottom { padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 13px; color: #9ca3af; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-newsletter',
    description: 'Footer with newsletter subscription form and link columns',
    tags: ['footer', 'newsletter', 'subscription'],
    code: `<template>
  <footer class="newsletter-footer">
    <div class="newsletter-section">
      <h3>Stay in the loop</h3>
      <p>Get updates on new features and releases.</p>
      <form @submit.prevent="subscribe" class="subscribe-form">
        <input v-model="email" type="email" placeholder="Enter your email" required />
        <button type="submit">{{ subscribed ? 'Subscribed!' : 'Subscribe' }}</button>
      </form>
    </div>
    <div class="links-section">
      <div v-for="group in groups" :key="group.title" class="link-col">
        <h4>{{ group.title }}</h4>
        <a v-for="link in group.links" :key="link" href="#">{{ link }}</a>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const NewsletterFooter = defineComponent({
  name: 'NewsletterFooter',
  setup() {
    const email = ref('');
    const subscribed = ref(false);
    const subscribe = () => { subscribed.value = true; };
    const groups = [
      { title: 'Product', links: ['Features', 'Integrations', 'Pricing'] },
      { title: 'Resources', links: ['Docs', 'Guides', 'API'] },
    ];
    return { email, subscribed, subscribe, groups };
  },
});

export default createVueMicroApp({ name: 'newsletter-footer', App: NewsletterFooter });
</script>

<style scoped>
.newsletter-footer {
  display: flex; gap: 60px; padding: 48px 32px;
  background: #f9fafb; border-top: 1px solid #e5e7eb;
}
.newsletter-section { max-width: 360px; }
.newsletter-section h3 { font-size: 20px; margin: 0 0 8px; }
.newsletter-section p { font-size: 14px; color: #6b7280; margin: 0 0 16px; }
.subscribe-form { display: flex; gap: 8px; }
.subscribe-form input {
  flex: 1; padding: 10px 12px; border: 1px solid #d1d5db;
  border-radius: 6px; font-size: 14px;
}
.subscribe-form button {
  padding: 10px 20px; background: #3b82f6; color: #fff;
  border: none; border-radius: 6px; font-weight: 600; cursor: pointer;
}
.links-section { display: flex; gap: 48px; }
.link-col h4 { font-size: 13px; font-weight: 700; margin: 0 0 12px; text-transform: uppercase; }
.link-col a { display: block; padding: 4px 0; text-decoration: none; color: #6b7280; font-size: 14px; }
.link-col a:hover { color: #3b82f6; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'corporate',
    description: 'Corporate footer with logo, legal links, and regulatory disclaimers',
    tags: ['footer', 'corporate', 'legal'],
    code: `<template>
  <footer class="corporate-footer">
    <div class="footer-top">
      <div class="footer-logo">
        <div class="logo-mark">C</div>
        <span class="logo-text">{{ companyName }}</span>
      </div>
      <div class="footer-columns">
        <div v-for="col in columns" :key="col.title" class="footer-col">
          <h4>{{ col.title }}</h4>
          <a v-for="link in col.links" :key="link" href="#">{{ link }}</a>
        </div>
      </div>
    </div>
    <div class="footer-legal">
      <p>{{ disclaimer }}</p>
      <div class="legal-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Cookie Policy</a>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const CorporateFooter = defineComponent({
  name: 'CorporateFooter',
  setup() {
    const companyName = ref('CorpTech');
    const disclaimer = ref('CorpTech Inc. is a registered trademark. All information provided is subject to our terms.');
    const columns = ref([
      { title: 'Solutions', links: ['Enterprise', 'Small Business', 'Partners'] },
      { title: 'Resources', links: ['Documentation', 'API Reference', 'Support'] },
      { title: 'Company', links: ['About Us', 'Careers', 'Investor Relations'] },
    ]);
    return { companyName, disclaimer, columns };
  },
});

export default createVueMicroApp({ name: 'corporate-footer', App: CorporateFooter });
</script>

<style scoped>
.corporate-footer { background: #111827; color: #d1d5db; padding: 48px 32px 24px; }
.footer-top { display: flex; gap: 80px; margin-bottom: 32px; }
.footer-logo { display: flex; align-items: center; gap: 10px; }
.logo-mark {
  width: 36px; height: 36px; background: #3b82f6; color: #fff;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px;
}
.logo-text { font-size: 18px; font-weight: 700; color: #f9fafb; }
.footer-columns { display: flex; gap: 48px; }
.footer-col h4 { font-size: 12px; font-weight: 700; color: #9ca3af; margin: 0 0 12px; text-transform: uppercase; }
.footer-col a { display: block; padding: 4px 0; text-decoration: none; color: #d1d5db; font-size: 14px; }
.footer-col a:hover { color: #fff; }
.footer-legal { padding-top: 24px; border-top: 1px solid #374151; }
.footer-legal p { font-size: 12px; color: #6b7280; margin: 0 0 12px; line-height: 1.5; }
.legal-links { display: flex; gap: 20px; }
.legal-links a { text-decoration: none; color: #6b7280; font-size: 12px; }
.legal-links a:hover { color: #d1d5db; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-social',
    description: 'Footer with social media links and icon badges',
    tags: ['footer', 'social', 'media'],
    code: `<template>
  <footer class="social-footer">
    <div class="footer-content">
      <span class="brand">{{ brandName }}</span>
      <div class="social-icons">
        <a v-for="social in socials" :key="social.name" :href="social.url"
           class="social-badge" :title="social.name">
          {{ social.icon }}
        </a>
      </div>
      <span class="copyright">&copy; {{ year }} All rights reserved.</span>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SocialFooter = defineComponent({
  name: 'SocialFooter',
  setup() {
    const brandName = ref('SocialApp');
    const year = ref(new Date().getFullYear());
    const socials = ref([
      { name: 'Twitter', icon: 'X', url: '#' },
      { name: 'GitHub', icon: 'GH', url: '#' },
      { name: 'LinkedIn', icon: 'in', url: '#' },
      { name: 'YouTube', icon: 'YT', url: '#' },
    ]);
    return { brandName, year, socials };
  },
});

export default createVueMicroApp({ name: 'social-footer', App: SocialFooter });
</script>

<style scoped>
.social-footer { background: #fff; border-top: 1px solid #e5e7eb; padding: 32px; }
.footer-content { display: flex; justify-content: space-between; align-items: center; }
.brand { font-size: 18px; font-weight: 700; }
.social-icons { display: flex; gap: 12px; }
.social-badge {
  width: 36px; height: 36px; border-radius: 50%; background: #f3f4f6;
  display: flex; align-items: center; justify-content: center;
  text-decoration: none; color: #374151; font-size: 12px; font-weight: 700;
  transition: background 0.2s;
}
.social-badge:hover { background: #3b82f6; color: #fff; }
.copyright { font-size: 13px; color: #9ca3af; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed footer with gradient accent stripe',
    tags: ['footer', 'dark', 'theme'],
    code: `<template>
  <footer class="dark-footer">
    <div class="accent-stripe"></div>
    <div class="footer-body">
      <div class="footer-info">
        <h3>{{ brandName }}</h3>
        <p>{{ description }}</p>
      </div>
      <div class="footer-nav">
        <a v-for="link in links" :key="link" href="#">{{ link }}</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; {{ year }} {{ brandName }}. All rights reserved.</span>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DarkFooter = defineComponent({
  name: 'DarkFooter',
  setup() {
    const brandName = ref('DarkMode');
    const description = ref('Building the future of web development.');
    const year = ref(new Date().getFullYear());
    const links = ref(['Home', 'Features', 'Pricing', 'Blog', 'Contact']);
    return { brandName, description, year, links };
  },
});

export default createVueMicroApp({ name: 'dark-footer', App: DarkFooter });
</script>

<style scoped>
.dark-footer { background: #0f172a; color: #cbd5e1; }
.accent-stripe { height: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899); }
.footer-body {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 40px 32px;
}
.footer-info { max-width: 300px; }
.footer-info h3 { font-size: 20px; color: #f1f5f9; margin: 0 0 8px; }
.footer-info p { font-size: 14px; line-height: 1.5; margin: 0; }
.footer-nav { display: flex; gap: 24px; }
.footer-nav a { text-decoration: none; color: #94a3b8; font-size: 14px; }
.footer-nav a:hover { color: #e2e8f0; }
.footer-bottom {
  padding: 16px 32px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'centered',
    description: 'Centered footer with stacked logo, links, and copyright',
    tags: ['footer', 'centered', 'simple'],
    code: `<template>
  <footer class="centered-footer">
    <div class="footer-logo">{{ brandName }}</div>
    <nav class="footer-nav">
      <a v-for="link in links" :key="link" href="#">{{ link }}</a>
    </nav>
    <p class="footer-tagline">{{ tagline }}</p>
    <span class="footer-copy">&copy; {{ year }} {{ brandName }}</span>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const CenteredFooter = defineComponent({
  name: 'CenteredFooter',
  setup() {
    const brandName = ref('CenterBrand');
    const tagline = ref('Simple tools for complex problems.');
    const year = ref(new Date().getFullYear());
    const links = ref(['About', 'Blog', 'Careers', 'Press', 'Contact']);
    return { brandName, tagline, year, links };
  },
});

export default createVueMicroApp({ name: 'centered-footer', App: CenteredFooter });
</script>

<style scoped>
.centered-footer { text-align: center; padding: 48px 32px; background: #fff; border-top: 1px solid #e5e7eb; }
.footer-logo { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
.footer-nav { display: flex; justify-content: center; gap: 28px; margin-bottom: 16px; }
.footer-nav a { text-decoration: none; color: #6b7280; font-size: 14px; font-weight: 500; }
.footer-nav a:hover { color: #3b82f6; }
.footer-tagline { font-size: 14px; color: #9ca3af; margin: 0 0 16px; }
.footer-copy { font-size: 12px; color: #9ca3af; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-logo',
    description: 'Footer with large logo mark and organized link sections',
    tags: ['footer', 'logo', 'branding'],
    code: `<template>
  <footer class="logo-footer">
    <div class="footer-main">
      <div class="brand-section">
        <div class="logo-mark">T</div>
        <h3>{{ brandName }}</h3>
        <p>{{ tagline }}</p>
      </div>
      <div class="links-grid">
        <div v-for="section in sections" :key="section.title" class="link-section">
          <h4>{{ section.title }}</h4>
          <a v-for="link in section.links" :key="link" href="#">{{ link }}</a>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span>&copy; {{ year }} {{ brandName }}</span>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const LogoFooter = defineComponent({
  name: 'LogoFooter',
  setup() {
    const brandName = ref('TuvixApp');
    const tagline = ref('Micro-frontends made simple.');
    const year = ref(new Date().getFullYear());
    const sections = ref([
      { title: 'Product', links: ['Overview', 'Features', 'Pricing'] },
      { title: 'Developers', links: ['Docs', 'API', 'SDK'] },
      { title: 'Company', links: ['About', 'Blog', 'Careers'] },
    ]);
    return { brandName, tagline, year, sections };
  },
});

export default createVueMicroApp({ name: 'logo-footer', App: LogoFooter });
</script>

<style scoped>
.logo-footer { background: #fff; border-top: 1px solid #e5e7eb; }
.footer-main { display: flex; gap: 80px; padding: 48px 32px; }
.brand-section { max-width: 280px; }
.logo-mark {
  width: 48px; height: 48px; background: #3b82f6; color: #fff;
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 700; margin-bottom: 12px;
}
.brand-section h3 { font-size: 18px; margin: 0 0 8px; }
.brand-section p { font-size: 14px; color: #6b7280; margin: 0; line-height: 1.5; }
.links-grid { display: flex; gap: 48px; }
.link-section h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin: 0 0 12px; }
.link-section a { display: block; padding: 4px 0; text-decoration: none; color: #6b7280; font-size: 14px; }
.link-section a:hover { color: #3b82f6; }
.footer-bar { padding: 16px 32px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-sitemap',
    description: 'Footer with comprehensive sitemap organized by sections',
    tags: ['footer', 'sitemap', 'navigation'],
    code: `<template>
  <footer class="sitemap-footer">
    <div class="sitemap-grid">
      <div v-for="section in sitemap" :key="section.category" class="sitemap-column">
        <h4>{{ section.category }}</h4>
        <a v-for="link in section.links" :key="link.label" :href="link.url">
          {{ link.label }}
          <span v-if="link.isNew" class="new-badge">New</span>
        </a>
      </div>
    </div>
    <div class="sitemap-bottom">
      <span>&copy; {{ year }} SitemapCo</span>
      <nav class="bottom-links">
        <a href="#">Terms</a>
        <a href="#">Privacy</a>
        <a href="#">Cookies</a>
      </nav>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SitemapFooter = defineComponent({
  name: 'SitemapFooter',
  setup() {
    const year = ref(new Date().getFullYear());
    const sitemap = ref([
      { category: 'Platform', links: [
        { label: 'Features', url: '#', isNew: false },
        { label: 'Security', url: '#', isNew: false },
        { label: 'Enterprise', url: '#', isNew: true },
      ]},
      { category: 'Solutions', links: [
        { label: 'Startups', url: '#', isNew: false },
        { label: 'E-Commerce', url: '#', isNew: false },
        { label: 'Education', url: '#', isNew: true },
      ]},
      { category: 'Resources', links: [
        { label: 'Documentation', url: '#', isNew: false },
        { label: 'Tutorials', url: '#', isNew: false },
        { label: 'Webinars', url: '#', isNew: false },
      ]},
      { category: 'Company', links: [
        { label: 'About', url: '#', isNew: false },
        { label: 'Careers', url: '#', isNew: true },
        { label: 'Press', url: '#', isNew: false },
      ]},
    ]);
    return { year, sitemap };
  },
});

export default createVueMicroApp({ name: 'sitemap-footer', App: SitemapFooter });
</script>

<style scoped>
.sitemap-footer { background: #f9fafb; border-top: 1px solid #e5e7eb; }
.sitemap-grid { display: flex; gap: 48px; padding: 48px 32px; }
.sitemap-column h4 { font-size: 13px; font-weight: 700; color: #374151; margin: 0 0 12px; }
.sitemap-column a {
  display: flex; align-items: center; gap: 6px; padding: 4px 0;
  text-decoration: none; color: #6b7280; font-size: 14px;
}
.sitemap-column a:hover { color: #3b82f6; }
.new-badge {
  padding: 1px 6px; background: #10b981; color: #fff; border-radius: 3px;
  font-size: 10px; font-weight: 700;
}
.sitemap-bottom {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;
}
.bottom-links { display: flex; gap: 16px; }
.bottom-links a { text-decoration: none; color: #9ca3af; font-size: 12px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-legal',
    description: 'Footer with prominent legal notices and compliance badges',
    tags: ['footer', 'legal', 'compliance'],
    code: `<template>
  <footer class="legal-footer">
    <div class="footer-upper">
      <nav class="footer-nav">
        <a v-for="link in links" :key="link" href="#">{{ link }}</a>
      </nav>
    </div>
    <div class="compliance-row">
      <div v-for="badge in complianceBadges" :key="badge" class="compliance-badge">
        {{ badge }}
      </div>
    </div>
    <div class="legal-text">
      <p>{{ legalNotice }}</p>
      <p class="secondary">{{ secondaryNotice }}</p>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const LegalFooter = defineComponent({
  name: 'LegalFooter',
  setup() {
    const links = ref(['Privacy Policy', 'Terms of Use', 'Cookie Settings', 'Accessibility', 'GDPR']);
    const complianceBadges = ref(['SOC 2', 'GDPR', 'HIPAA', 'ISO 27001']);
    const legalNotice = ref('This site and its contents are protected under applicable intellectual property laws.');
    const secondaryNotice = ref('By using this service you agree to our Terms of Service and Privacy Policy.');
    return { links, complianceBadges, legalNotice, secondaryNotice };
  },
});

export default createVueMicroApp({ name: 'legal-footer', App: LegalFooter });
</script>

<style scoped>
.legal-footer { background: #fff; border-top: 1px solid #e5e7eb; padding: 32px; }
.footer-upper { margin-bottom: 20px; }
.footer-nav { display: flex; gap: 24px; }
.footer-nav a { text-decoration: none; color: #3b82f6; font-size: 14px; font-weight: 500; }
.compliance-row { display: flex; gap: 12px; margin-bottom: 20px; }
.compliance-badge {
  padding: 4px 12px; border: 1px solid #d1d5db; border-radius: 4px;
  font-size: 11px; font-weight: 700; color: #374151;
}
.legal-text p { font-size: 12px; color: #6b7280; line-height: 1.5; margin: 0 0 8px; }
.legal-text .secondary { color: #9ca3af; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-map',
    description: 'Footer with company location info and map placeholder',
    tags: ['footer', 'map', 'location'],
    code: `<template>
  <footer class="map-footer">
    <div class="footer-content">
      <div class="location-info">
        <h3>Visit Us</h3>
        <p class="address">{{ address }}</p>
        <p class="contact-info">{{ phone }}</p>
        <p class="contact-info">{{ emailAddr }}</p>
        <div class="hours">
          <h4>Hours</h4>
          <p>Mon-Fri: 9am - 6pm</p>
          <p>Sat: 10am - 4pm</p>
        </div>
      </div>
      <div class="map-placeholder">
        <span>Map View</span>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MapFooter = defineComponent({
  name: 'MapFooter',
  setup() {
    const address = ref('123 Innovation Drive, Suite 400, San Francisco, CA 94105');
    const phone = ref('+1 (555) 123-4567');
    const emailAddr = ref('hello@company.com');
    return { address, phone, emailAddr };
  },
});

export default createVueMicroApp({ name: 'map-footer', App: MapFooter });
</script>

<style scoped>
.map-footer { background: #1f2937; color: #d1d5db; }
.footer-content { display: flex; gap: 40px; padding: 48px 32px; }
.location-info { flex: 1; }
.location-info h3 { font-size: 20px; color: #f9fafb; margin: 0 0 16px; }
.address { font-size: 14px; line-height: 1.6; margin: 0 0 12px; }
.contact-info { font-size: 14px; margin: 0 0 4px; }
.hours { margin-top: 20px; }
.hours h4 { font-size: 14px; color: #f9fafb; margin: 0 0 8px; }
.hours p { font-size: 13px; margin: 0 0 4px; }
.map-placeholder {
  width: 400px; height: 240px; background: #374151; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #6b7280; font-size: 16px; flex-shrink: 0;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-app-links',
    description: 'Footer with mobile app download links and QR code placeholder',
    tags: ['footer', 'app-links', 'download'],
    code: `<template>
  <footer class="app-links-footer">
    <div class="footer-body">
      <div class="app-section">
        <h3>Get the App</h3>
        <p>Download on your favorite platform.</p>
        <div class="store-buttons">
          <button v-for="store in stores" :key="store.name" class="store-btn">
            <span class="store-icon">{{ store.icon }}</span>
            <div class="store-text">
              <span class="store-small">{{ store.prefix }}</span>
              <span class="store-name">{{ store.name }}</span>
            </div>
          </button>
        </div>
      </div>
      <div class="qr-section">
        <div class="qr-placeholder">QR</div>
        <p>Scan to download</p>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AppLinksFooter = defineComponent({
  name: 'AppLinksFooter',
  setup() {
    const stores = ref([
      { name: 'App Store', prefix: 'Download on the', icon: '\\u{1F34E}' },
      { name: 'Google Play', prefix: 'Get it on', icon: '\\u25B6' },
    ]);
    return { stores };
  },
});

export default createVueMicroApp({ name: 'app-links-footer', App: AppLinksFooter });
</script>

<style scoped>
.app-links-footer { background: #f9fafb; border-top: 1px solid #e5e7eb; }
.footer-body { display: flex; align-items: center; gap: 60px; padding: 48px 32px; }
.app-section h3 { font-size: 20px; margin: 0 0 8px; }
.app-section p { font-size: 14px; color: #6b7280; margin: 0 0 20px; }
.store-buttons { display: flex; gap: 12px; }
.store-btn {
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  background: #111827; color: #fff; border: none; border-radius: 8px; cursor: pointer;
}
.store-icon { font-size: 24px; }
.store-text { display: flex; flex-direction: column; text-align: left; }
.store-small { font-size: 10px; opacity: 0.7; }
.store-name { font-size: 16px; font-weight: 600; }
.qr-section { text-align: center; }
.qr-placeholder {
  width: 120px; height: 120px; background: #e5e7eb; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 700; color: #9ca3af;
}
.qr-section p { font-size: 13px; color: #6b7280; margin: 8px 0 0; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'transparent',
    description: 'Transparent footer for overlay on dark backgrounds',
    tags: ['footer', 'transparent', 'overlay'],
    code: `<template>
  <footer class="transparent-footer">
    <nav class="footer-nav">
      <a v-for="link in links" :key="link" href="#">{{ link }}</a>
    </nav>
    <span class="footer-copy">&copy; {{ year }} TransparentCo</span>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TransparentFooter = defineComponent({
  name: 'TransparentFooter',
  setup() {
    const year = ref(new Date().getFullYear());
    const links = ref(['Home', 'About', 'Services', 'Contact']);
    return { year, links };
  },
});

export default createVueMicroApp({ name: 'transparent-footer', App: TransparentFooter });
</script>

<style scoped>
.transparent-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 32px; background: transparent;
}
.footer-nav { display: flex; gap: 24px; }
.footer-nav a { text-decoration: none; color: rgba(255,255,255,0.7); font-size: 14px; }
.footer-nav a:hover { color: rgba(255,255,255,1); }
.footer-copy { font-size: 13px; color: rgba(255,255,255,0.5); }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-awards',
    description: 'Footer with award badges and trust indicators',
    tags: ['footer', 'awards', 'trust'],
    code: `<template>
  <footer class="awards-footer">
    <div class="awards-section">
      <h4>Recognized By</h4>
      <div class="awards-row">
        <div v-for="award in awards" :key="award.name" class="award-badge">
          <span class="award-icon">{{ award.icon }}</span>
          <span class="award-name">{{ award.name }}</span>
          <span class="award-year">{{ award.year }}</span>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; {{ year }} AwardsCo</span>
      <nav class="bottom-nav">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
      </nav>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AwardsFooter = defineComponent({
  name: 'AwardsFooter',
  setup() {
    const year = ref(new Date().getFullYear());
    const awards = ref([
      { name: 'Best Startup', icon: '\\u{1F3C6}', year: '2024' },
      { name: 'Innovation Award', icon: '\\u{1F4A1}', year: '2023' },
      { name: 'Top 50 SaaS', icon: '\\u2B50', year: '2024' },
      { name: 'G2 Leader', icon: '\\u{1F31F}', year: '2024' },
    ]);
    return { year, awards };
  },
});

export default createVueMicroApp({ name: 'awards-footer', App: AwardsFooter });
</script>

<style scoped>
.awards-footer { background: #fff; border-top: 1px solid #e5e7eb; }
.awards-section { padding: 32px 32px 24px; text-align: center; }
.awards-section h4 { font-size: 14px; color: #9ca3af; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.05em; }
.awards-row { display: flex; justify-content: center; gap: 24px; }
.award-badge {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 20px; border: 1px solid #e5e7eb; border-radius: 10px;
}
.award-icon { font-size: 24px; }
.award-name { font-size: 12px; font-weight: 600; color: #374151; }
.award-year { font-size: 11px; color: #9ca3af; }
.footer-bottom {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 32px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;
}
.bottom-nav { display: flex; gap: 16px; }
.bottom-nav a { text-decoration: none; color: #9ca3af; font-size: 12px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-payment',
    description: 'Footer with accepted payment methods and secure checkout badge',
    tags: ['footer', 'payment', 'e-commerce'],
    code: `<template>
  <footer class="payment-footer">
    <div class="footer-upper">
      <div class="footer-links">
        <a v-for="link in links" :key="link" href="#">{{ link }}</a>
      </div>
    </div>
    <div class="payment-section">
      <span class="payment-label">We accept:</span>
      <div class="payment-methods">
        <span v-for="method in paymentMethods" :key="method" class="payment-badge">{{ method }}</span>
      </div>
      <div class="secure-badge">
        <span class="lock-icon">&#128274;</span>
        <span>Secure Checkout</span>
      </div>
    </div>
    <div class="footer-copy">&copy; {{ year }} ShopSecure. All rights reserved.</div>
  </footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const PaymentFooter = defineComponent({
  name: 'PaymentFooter',
  setup() {
    const year = ref(new Date().getFullYear());
    const links = ref(['Shipping Info', 'Returns', 'FAQ', 'Contact']);
    const paymentMethods = ref(['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay']);
    return { year, links, paymentMethods };
  },
});

export default createVueMicroApp({ name: 'payment-footer', App: PaymentFooter });
</script>

<style scoped>
.payment-footer { background: #fff; border-top: 1px solid #e5e7eb; padding: 32px; }
.footer-upper { margin-bottom: 20px; }
.footer-links { display: flex; gap: 24px; }
.footer-links a { text-decoration: none; color: #6b7280; font-size: 14px; }
.footer-links a:hover { color: #374151; }
.payment-section { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.payment-label { font-size: 13px; color: #6b7280; }
.payment-methods { display: flex; gap: 8px; }
.payment-badge {
  padding: 4px 12px; border: 1px solid #d1d5db; border-radius: 4px;
  font-size: 12px; font-weight: 600; color: #374151; background: #f9fafb;
}
.secure-badge {
  display: flex; align-items: center; gap: 6px; padding: 4px 12px;
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px;
  font-size: 12px; font-weight: 600; color: #15803d;
}
.lock-icon { font-size: 14px; }
.footer-copy { font-size: 12px; color: #9ca3af; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
