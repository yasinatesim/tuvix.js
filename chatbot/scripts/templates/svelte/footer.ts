import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal footer with copyright and a few links',
    tags: ['footer', 'minimal', 'simple'],
    code: `<script>
  let year = new Date().getFullYear();
</script>

<footer class="footer">
  <span>&copy; {year} Company. All rights reserved.</span>
  <nav class="links">
    <a href="#privacy">Privacy</a>
    <a href="#terms">Terms</a>
    <a href="#contact">Contact</a>
  </nav>
</footer>

<style>
  .footer { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
  .links { display: flex; gap: 20px; }
  .links a { text-decoration: none; color: #6b7280; }
  .links a:hover { color: #374151; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import MinimalFooter from './MinimalFooter.svelte';
export default createSvelteMicroApp({ name: 'minimal-footer', App: MinimalFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'multi-column',
    description: 'Multi-column footer with organized link sections',
    tags: ['footer', 'multi-column', 'organized'],
    code: `<script>
  let columns = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers'] },
    { title: 'Support', links: ['Help Center', 'Contact', 'Status'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'License'] },
  ];
</script>

<footer class="footer">
  <div class="columns">
    {#each columns as col}
      <div class="column">
        <h4>{col.title}</h4>
        {#each col.links as link}
          <a href={'#' + link.toLowerCase().replace(/\\s/g, '-')}>{link}</a>
        {/each}
      </div>
    {/each}
  </div>
  <div class="bottom">
    <span>&copy; 2026 Company. All rights reserved.</span>
  </div>
</footer>

<style>
  .footer { padding: 48px 24px 24px; border-top: 1px solid #e5e7eb; }
  .columns { display: flex; gap: 48px; margin-bottom: 32px; }
  .column h4 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #111827; }
  .column a { display: block; padding: 4px 0; text-decoration: none; color: #6b7280; font-size: 14px; }
  .column a:hover { color: #374151; }
  .bottom { padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import MultiColumnFooter from './MultiColumnFooter.svelte';
export default createSvelteMicroApp({ name: 'multi-column-footer', App: MultiColumnFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-newsletter',
    description: 'Footer with newsletter subscription form',
    tags: ['footer', 'newsletter', 'subscription'],
    code: `<script>
  let email = '';
  let subscribed = false;

  function handleSubscribe() {
    if (!email) return;
    subscribed = true;
  }
</script>

<footer class="footer">
  <div class="newsletter-section">
    {#if subscribed}
      <p class="success">Subscribed! Check {email} for updates.</p>
    {:else}
      <h3>Subscribe to our newsletter</h3>
      <form on:submit|preventDefault={handleSubscribe} class="form-row">
        <input type="email" bind:value={email} placeholder="you@example.com" />
        <button type="submit">Subscribe</button>
      </form>
    {/if}
  </div>
  <div class="bottom-row">
    <span>&copy; 2026 Company</span>
    <nav class="links">
      <a href="#privacy">Privacy</a>
      <a href="#terms">Terms</a>
    </nav>
  </div>
</footer>

<style>
  .footer { padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; }
  .newsletter-section { text-align: center; margin-bottom: 32px; }
  .newsletter-section h3 { margin: 0 0 12px; font-size: 18px; }
  .form-row { display: flex; justify-content: center; gap: 8px; }
  .form-row input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; width: 280px; outline: none; }
  .form-row button { padding: 10px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .success { color: #16a34a; font-weight: 500; }
  .bottom-row { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
  .links { display: flex; gap: 16px; }
  .links a { text-decoration: none; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import NewsletterFooter from './NewsletterFooter.svelte';
export default createSvelteMicroApp({ name: 'newsletter-footer', App: NewsletterFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'corporate',
    description: 'Corporate footer with company info and multiple link sections',
    tags: ['footer', 'corporate', 'business'],
    code: `<script>
  let sections = [
    { title: 'Services', links: ['Consulting', 'Development', 'Training'] },
    { title: 'Resources', links: ['Documentation', 'Blog', 'Case Studies'] },
    { title: 'Connect', links: ['Contact Us', 'Support', 'Partners'] },
  ];
</script>

<footer class="footer">
  <div class="top">
    <div class="company-info">
      <h3>TechCorp</h3>
      <p>Enterprise solutions for modern development teams. Trusted by 500+ companies worldwide.</p>
    </div>
    <div class="link-sections">
      {#each sections as section}
        <div class="section">
          <h4>{section.title}</h4>
          {#each section.links as link}
            <a href={'#' + link.toLowerCase().replace(/\\s/g, '-')}>{link}</a>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  <div class="bottom">
    <span>&copy; 2026 TechCorp Inc. All rights reserved.</span>
  </div>
</footer>

<style>
  .footer { padding: 48px 32px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
  .top { display: flex; gap: 60px; margin-bottom: 32px; }
  .company-info { max-width: 300px; }
  .company-info h3 { margin: 0 0 8px; font-size: 20px; }
  .company-info p { margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5; }
  .link-sections { display: flex; gap: 48px; flex: 1; }
  .section h4 { margin: 0 0 12px; font-size: 14px; font-weight: 700; }
  .section a { display: block; padding: 3px 0; text-decoration: none; color: #6b7280; font-size: 14px; }
  .section a:hover { color: #374151; }
  .bottom { padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import CorporateFooter from './CorporateFooter.svelte';
export default createSvelteMicroApp({ name: 'corporate-footer', App: CorporateFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-social',
    description: 'Footer with social media icon links',
    tags: ['footer', 'social', 'links'],
    code: `<script>
  let socials = [
    { name: 'Twitter', icon: '\u{1F426}', url: '#twitter' },
    { name: 'GitHub', icon: '\u{1F4BB}', url: '#github' },
    { name: 'LinkedIn', icon: '\u{1F4BC}', url: '#linkedin' },
    { name: 'YouTube', icon: '\u{1F3AC}', url: '#youtube' },
  ];
</script>

<footer class="footer">
  <div class="brand">Brand</div>
  <div class="social-row">
    {#each socials as social}
      <a href={social.url} title={social.name} class="social-link">{social.icon}</a>
    {/each}
  </div>
  <div class="copyright">&copy; 2026 Brand. All rights reserved.</div>
</footer>

<style>
  .footer { padding: 32px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
  .social-row { display: flex; justify-content: center; gap: 16px; margin-bottom: 16px; }
  .social-link { font-size: 24px; text-decoration: none; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background-color: #f3f4f6; }
  .social-link:hover { background-color: #e5e7eb; }
  .copyright { font-size: 13px; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import SocialFooter from './SocialFooter.svelte';
export default createSvelteMicroApp({ name: 'social-footer', App: SocialFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed footer with light text on dark background',
    tags: ['footer', 'dark', 'theme'],
    code: `<script>
  let links = ['About', 'Blog', 'Careers', 'Press', 'Support'];
</script>

<footer class="footer">
  <div class="brand">DarkBrand</div>
  <nav class="links">
    {#each links as link}
      <a href={'#' + link.toLowerCase()}>{link}</a>
    {/each}
  </nav>
  <div class="copyright">&copy; 2026 DarkBrand. Built with care.</div>
</footer>

<style>
  .footer { padding: 40px 24px; background-color: #111827; text-align: center; }
  .brand { font-size: 20px; font-weight: 700; color: #818cf8; margin-bottom: 16px; }
  .links { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
  .links a { text-decoration: none; color: #9ca3af; font-size: 14px; }
  .links a:hover { color: #f9fafb; }
  .copyright { font-size: 13px; color: #6b7280; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import DarkFooter from './DarkFooter.svelte';
export default createSvelteMicroApp({ name: 'dark-footer', App: DarkFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'centered',
    description: 'Centered footer with stacked content',
    tags: ['footer', 'centered', 'simple'],
    code: `<script>
  let links = ['Home', 'Features', 'Pricing', 'Docs', 'Contact'];
</script>

<footer class="footer">
  <div class="logo">CenteredApp</div>
  <nav class="links">
    {#each links as link}
      <a href={'#' + link.toLowerCase()}>{link}</a>
    {/each}
  </nav>
  <p class="tagline">Making micro-frontends simple.</p>
  <div class="copyright">&copy; 2026 CenteredApp</div>
</footer>

<style>
  .footer { padding: 48px 24px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
  .logo { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
  .links { display: flex; justify-content: center; gap: 24px; margin-bottom: 16px; }
  .links a { text-decoration: none; color: #6b7280; font-size: 14px; }
  .links a:hover { color: #6366f1; }
  .tagline { font-size: 14px; color: #9ca3af; margin: 0 0 16px; }
  .copyright { font-size: 12px; color: #d1d5db; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import CenteredFooter from './CenteredFooter.svelte';
export default createSvelteMicroApp({ name: 'centered-footer', App: CenteredFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-logo',
    description: 'Footer with logo placeholder and company description',
    tags: ['footer', 'logo', 'brand'],
    code: `<script>
  let brand = 'Tuvix';
</script>

<footer class="footer">
  <div class="top">
    <div class="brand-area">
      <div class="logo-icon">T</div>
      <span class="brand-name">{brand}</span>
    </div>
    <p class="desc">Build scalable micro-frontend applications with ease. Ship faster, iterate independently.</p>
  </div>
  <div class="bottom">
    <span>&copy; 2026 {brand}</span>
    <nav>
      <a href="#privacy">Privacy</a>
      <a href="#terms">Terms</a>
      <a href="#docs">Docs</a>
    </nav>
  </div>
</footer>

<style>
  .footer { padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; }
  .top { margin-bottom: 24px; }
  .brand-area { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .logo-icon { width: 36px; height: 36px; border-radius: 8px; background-color: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .brand-name { font-size: 18px; font-weight: 700; }
  .desc { margin: 0; max-width: 400px; font-size: 14px; color: #6b7280; line-height: 1.5; }
  .bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
  .bottom nav { display: flex; gap: 16px; }
  .bottom nav a { text-decoration: none; color: #9ca3af; }
  .bottom nav a:hover { color: #374151; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import LogoFooter from './LogoFooter.svelte';
export default createSvelteMicroApp({ name: 'logo-footer', App: LogoFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-sitemap',
    description: 'Footer with comprehensive sitemap navigation',
    tags: ['footer', 'sitemap', 'navigation'],
    code: `<script>
  let sitemap = [
    { title: 'Product', links: ['Overview', 'Features', 'Pricing', 'Integrations', 'API'] },
    { title: 'Resources', links: ['Docs', 'Guides', 'Blog', 'Community', 'Templates'] },
    { title: 'Company', links: ['About', 'Careers', 'Press', 'Partners', 'Contact'] },
  ];
</script>

<footer class="footer">
  <div class="sitemap">
    {#each sitemap as section}
      <div class="section">
        <h4>{section.title}</h4>
        {#each section.links as link}
          <a href={'#' + link.toLowerCase()}>{link}</a>
        {/each}
      </div>
    {/each}
  </div>
  <div class="bottom">&copy; 2026 Company. All rights reserved.</div>
</footer>

<style>
  .footer { padding: 48px 24px 20px; border-top: 1px solid #e5e7eb; }
  .sitemap { display: flex; gap: 60px; margin-bottom: 32px; }
  .section h4 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #111827; }
  .section a { display: block; padding: 3px 0; text-decoration: none; color: #6b7280; font-size: 14px; }
  .section a:hover { color: #6366f1; }
  .bottom { padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import SitemapFooter from './SitemapFooter.svelte';
export default createSvelteMicroApp({ name: 'sitemap-footer', App: SitemapFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-legal',
    description: 'Footer with legal disclaimer and compliance links',
    tags: ['footer', 'legal', 'compliance'],
    code: `<script>
  let legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Accessibility'];
</script>

<footer class="footer">
  <nav class="legal-links">
    {#each legalLinks as link}
      <a href={'#' + link.toLowerCase().replace(/\\s/g, '-')}>{link}</a>
    {/each}
  </nav>
  <p class="disclaimer">This site is protected by reCAPTCHA. The Google Privacy Policy and Terms of Service apply. All content is for informational purposes only.</p>
  <div class="copyright">&copy; 2026 LegalCorp. All rights reserved.</div>
</footer>

<style>
  .footer { padding: 32px 24px; border-top: 1px solid #e5e7eb; }
  .legal-links { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
  .legal-links a { text-decoration: none; color: #6b7280; font-size: 13px; }
  .legal-links a:hover { color: #374151; text-decoration: underline; }
  .disclaimer { font-size: 12px; color: #9ca3af; line-height: 1.5; max-width: 600px; margin: 0 0 12px; }
  .copyright { font-size: 12px; color: #d1d5db; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import LegalFooter from './LegalFooter.svelte';
export default createSvelteMicroApp({ name: 'legal-footer', App: LegalFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-map',
    description: 'Footer with a map placeholder and contact info',
    tags: ['footer', 'map', 'contact'],
    code: `<script>
  let address = '123 Tech Street, San Francisco, CA 94105';
  let phone = '+1 (555) 123-4567';
  let email = 'hello@company.com';
</script>

<footer class="footer">
  <div class="content">
    <div class="map-placeholder">
      <span>Map</span>
    </div>
    <div class="contact-info">
      <h4>Contact Us</h4>
      <p>{address}</p>
      <p>{phone}</p>
      <p>{email}</p>
    </div>
  </div>
  <div class="bottom">&copy; 2026 Company. All rights reserved.</div>
</footer>

<style>
  .footer { padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; }
  .content { display: flex; gap: 32px; margin-bottom: 24px; }
  .map-placeholder { width: 300px; height: 180px; background-color: #e5e7eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 18px; }
  .contact-info h4 { margin: 0 0 12px; font-size: 16px; }
  .contact-info p { margin: 0 0 6px; font-size: 14px; color: #6b7280; }
  .bottom { padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import MapFooter from './MapFooter.svelte';
export default createSvelteMicroApp({ name: 'map-footer', App: MapFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-app-links',
    description: 'Footer with app store download buttons',
    tags: ['footer', 'app', 'download'],
    code: `<script>
  let links = ['Features', 'Pricing', 'Support'];
</script>

<footer class="footer">
  <div class="top-row">
    <div class="brand-section">
      <div class="brand">AppName</div>
      <p class="desc">Available on all platforms.</p>
    </div>
    <div class="app-buttons">
      <a href="#ios" class="app-btn">App Store</a>
      <a href="#android" class="app-btn">Google Play</a>
    </div>
  </div>
  <div class="bottom-row">
    <nav class="links">
      {#each links as link}
        <a href={'#' + link.toLowerCase()}>{link}</a>
      {/each}
    </nav>
    <span class="copyright">&copy; 2026 AppName</span>
  </div>
</footer>

<style>
  .footer { padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; }
  .top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .brand { font-size: 20px; font-weight: 700; }
  .desc { margin: 4px 0 0; font-size: 14px; color: #6b7280; }
  .app-buttons { display: flex; gap: 12px; }
  .app-btn { display: inline-block; padding: 10px 20px; background-color: #111827; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; }
  .bottom-row { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .links { display: flex; gap: 20px; }
  .links a { text-decoration: none; color: #6b7280; font-size: 14px; }
  .copyright { font-size: 13px; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import AppLinksFooter from './AppLinksFooter.svelte';
export default createSvelteMicroApp({ name: 'app-links-footer', App: AppLinksFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'transparent',
    description: 'Transparent footer for overlay on hero images',
    tags: ['footer', 'transparent', 'overlay'],
    code: `<script>
  let links = ['Home', 'Gallery', 'About', 'Contact'];
</script>

<footer class="footer">
  <nav class="links">
    {#each links as link}
      <a href={'#' + link.toLowerCase()}>{link}</a>
    {/each}
  </nav>
  <div class="copyright">&copy; 2026 PhotoStudio</div>
</footer>

<style>
  .footer { padding: 24px 32px; background: transparent; text-align: center; }
  .links { display: flex; justify-content: center; gap: 24px; margin-bottom: 12px; }
  .links a { text-decoration: none; color: rgba(255,255,255,0.8); font-size: 14px; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
  .links a:hover { color: #fff; }
  .copyright { font-size: 13px; color: rgba(255,255,255,0.6); text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import TransparentFooter from './TransparentFooter.svelte';
export default createSvelteMicroApp({ name: 'transparent-footer', App: TransparentFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-awards',
    description: 'Footer with awards and recognition badges',
    tags: ['footer', 'awards', 'trust'],
    code: `<script>
  let awards = ['Best SaaS 2025', 'Top 100 Startups', 'Security Certified', 'SOC 2'];
</script>

<footer class="footer">
  <div class="awards-row">
    {#each awards as award}
      <div class="award-badge">{award}</div>
    {/each}
  </div>
  <nav class="links">
    <a href="#about">About</a>
    <a href="#careers">Careers</a>
    <a href="#privacy">Privacy</a>
    <a href="#terms">Terms</a>
  </nav>
  <div class="copyright">&copy; 2026 AwardCo. All rights reserved.</div>
</footer>

<style>
  .footer { padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; text-align: center; }
  .awards-row { display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; }
  .award-badge { padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 12px; font-weight: 600; color: #374151; background-color: #f9fafb; }
  .links { display: flex; justify-content: center; gap: 24px; margin-bottom: 16px; }
  .links a { text-decoration: none; color: #6b7280; font-size: 14px; }
  .links a:hover { color: #374151; }
  .copyright { font-size: 13px; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import AwardsFooter from './AwardsFooter.svelte';
export default createSvelteMicroApp({ name: 'awards-footer', App: AwardsFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-payment',
    description: 'Footer with accepted payment method icons',
    tags: ['footer', 'payment', 'e-commerce'],
    code: `<script>
  let paymentMethods = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay'];
  let links = ['Shop', 'Returns', 'Shipping', 'FAQ'];
</script>

<footer class="footer">
  <nav class="links">
    {#each links as link}
      <a href={'#' + link.toLowerCase()}>{link}</a>
    {/each}
  </nav>
  <div class="payment-row">
    <span class="label">We accept:</span>
    {#each paymentMethods as method}
      <span class="payment-badge">{method}</span>
    {/each}
  </div>
  <div class="copyright">&copy; 2026 ShopBrand. Secure checkout guaranteed.</div>
</footer>

<style>
  .footer { padding: 32px 24px; border-top: 1px solid #e5e7eb; text-align: center; }
  .links { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
  .links a { text-decoration: none; color: #6b7280; font-size: 14px; }
  .payment-row { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 16px; }
  .label { font-size: 13px; color: #9ca3af; }
  .payment-badge { padding: 4px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px; font-weight: 600; color: #374151; background: #fff; }
  .copyright { font-size: 12px; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import PaymentFooter from './PaymentFooter.svelte';
export default createSvelteMicroApp({ name: 'payment-footer', App: PaymentFooter });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
