import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal footer with copyright and a few links',
    tags: ['footer', 'minimal', 'simple'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const MinimalFooter = defineComponent({
  setup() {
  const year = ref(new Date().getFullYear());
      const companyName = ref('Acme Inc');
      const links = ref(['Privacy', 'Terms', 'Contact']);
      return { year, companyName, links };
  },
  template: \`
    <footer class="minimal-footer">
    <span class="copyright">&copy; {{ year }} {{ companyName }}. All rights reserved.</span>
    <nav class="footer-links">
      <a v-for="link in links" :key="link" href="#">{{ link }}</a>
    </nav>
  </footer>
  \`,
});

const app = createVueMicroApp({
  name: 'minimal-footer',
  App: MinimalFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'multi-column',
    description: 'Multi-column footer with organized link groups and branding',
    tags: ['footer', 'multi-column', 'organized'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const MultiColumnFooter = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'multi-column-footer',
  App: MultiColumnFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-newsletter',
    description: 'Footer with newsletter subscription form and link columns',
    tags: ['footer', 'newsletter', 'subscription'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const NewsletterFooter = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'newsletter-footer',
  App: NewsletterFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'corporate',
    description: 'Corporate footer with logo, legal links, and regulatory disclaimers',
    tags: ['footer', 'corporate', 'legal'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const CorporateFooter = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'corporate-footer',
  App: CorporateFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-social',
    description: 'Footer with social media links and icon badges',
    tags: ['footer', 'social', 'media'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SocialFooter = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'social-footer',
  App: SocialFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed footer with gradient accent stripe',
    tags: ['footer', 'dark', 'theme'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DarkFooter = defineComponent({
  setup() {
  const brandName = ref('DarkMode');
      const description = ref('Building the future of web development.');
      const year = ref(new Date().getFullYear());
      const links = ref(['Home', 'Features', 'Pricing', 'Blog', 'Contact']);
      return { brandName, description, year, links };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'dark-footer',
  App: DarkFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'centered',
    description: 'Centered footer with stacked logo, links, and copyright',
    tags: ['footer', 'centered', 'simple'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const CenteredFooter = defineComponent({
  setup() {
  const brandName = ref('CenterBrand');
      const tagline = ref('Simple tools for complex problems.');
      const year = ref(new Date().getFullYear());
      const links = ref(['About', 'Blog', 'Careers', 'Press', 'Contact']);
      return { brandName, tagline, year, links };
  },
  template: \`
    <footer class="centered-footer">
    <div class="footer-logo">{{ brandName }}</div>
    <nav class="footer-nav">
      <a v-for="link in links" :key="link" href="#">{{ link }}</a>
    </nav>
    <p class="footer-tagline">{{ tagline }}</p>
    <span class="footer-copy">&copy; {{ year }} {{ brandName }}</span>
  </footer>
  \`,
});

const app = createVueMicroApp({
  name: 'centered-footer',
  App: CenteredFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-logo',
    description: 'Footer with large logo mark and organized link sections',
    tags: ['footer', 'logo', 'branding'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const LogoFooter = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'logo-footer',
  App: LogoFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-sitemap',
    description: 'Footer with comprehensive sitemap organized by sections',
    tags: ['footer', 'sitemap', 'navigation'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SitemapFooter = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'sitemap-footer',
  App: SitemapFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-legal',
    description: 'Footer with prominent legal notices and compliance badges',
    tags: ['footer', 'legal', 'compliance'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const LegalFooter = defineComponent({
  setup() {
  const links = ref(['Privacy Policy', 'Terms of Use', 'Cookie Settings', 'Accessibility', 'GDPR']);
      const complianceBadges = ref(['SOC 2', 'GDPR', 'HIPAA', 'ISO 27001']);
      const legalNotice = ref('This site and its contents are protected under applicable intellectual property laws.');
      const secondaryNotice = ref('By using this service you agree to our Terms of Service and Privacy Policy.');
      return { links, complianceBadges, legalNotice, secondaryNotice };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'legal-footer',
  App: LegalFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-map',
    description: 'Footer with company location info and map placeholder',
    tags: ['footer', 'map', 'location'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const MapFooter = defineComponent({
  setup() {
  const address = ref('123 Innovation Drive, Suite 400, San Francisco, CA 94105');
      const phone = ref('+1 (555) 123-4567');
      const emailAddr = ref('hello@company.com');
      return { address, phone, emailAddr };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'map-footer',
  App: MapFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-app-links',
    description: 'Footer with mobile app download links and QR code placeholder',
    tags: ['footer', 'app-links', 'download'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const AppLinksFooter = defineComponent({
  setup() {
  const stores = ref([
        { name: 'App Store', prefix: 'Download on the', icon: '\\u{1F34E}' },
        { name: 'Google Play', prefix: 'Get it on', icon: '\\u25B6' },
      ]);
      return { stores };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'app-links-footer',
  App: AppLinksFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'transparent',
    description: 'Transparent footer for overlay on dark backgrounds',
    tags: ['footer', 'transparent', 'overlay'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const TransparentFooter = defineComponent({
  setup() {
  const year = ref(new Date().getFullYear());
      const links = ref(['Home', 'About', 'Services', 'Contact']);
      return { year, links };
  },
  template: \`
    <footer class="transparent-footer">
    <nav class="footer-nav">
      <a v-for="link in links" :key="link" href="#">{{ link }}</a>
    </nav>
    <span class="footer-copy">&copy; {{ year }} TransparentCo</span>
  </footer>
  \`,
});

const app = createVueMicroApp({
  name: 'transparent-footer',
  App: TransparentFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-awards',
    description: 'Footer with award badges and trust indicators',
    tags: ['footer', 'awards', 'trust'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const AwardsFooter = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'awards-footer',
  App: AwardsFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-payment',
    description: 'Footer with accepted payment methods and secure checkout badge',
    tags: ['footer', 'payment', 'e-commerce'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const PaymentFooter = defineComponent({
  setup() {
  const year = ref(new Date().getFullYear());
      const links = ref(['Shipping Info', 'Returns', 'FAQ', 'Contact']);
      const paymentMethods = ref(['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay']);
      return { year, links, paymentMethods };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'payment-footer',
  App: PaymentFooter,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
