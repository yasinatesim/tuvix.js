import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal footer with copyright and basic links',
    tags: ['footer', 'minimal', 'simple'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-minimal-footer',
  template: \`

    <footer class="footer">
      <span class="copy">&copy; 2024 Company</span>
      <nav class="links"><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#contact">Contact</a></nav>
    </footer>
  
  \`,
})
export class MinimalFooterComponent {
}

const app = defineMicroApp({
  name: 'minimal-footer',
  async mount({ container }) {
    const el = document.createElement('app-minimal-footer');
    container.appendChild(el);
    await bootstrapApplication(MinimalFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'multi-column',
    description: 'Multi-column footer with organized link sections',
    tags: ['footer', 'multi-column', 'organized'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-multicol-footer',
  template: \`

    <footer class="footer">
      <div class="columns">
        <div class="col" *ngFor="let col of columns">
          <h4 class="col-title">{{ col.title }}</h4>
          <a *ngFor="let link of col.links" [href]="'#' + link.toLowerCase()" class="col-link">{{ link }}</a>
        </div>
      </div>
      <div class="bottom">&copy; 2024 Company. All rights reserved.</div>
    </footer>
  
  \`,
})
export class MultiColFooterComponent {
columns = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Docs'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
    { title: 'Support', links: ['Help Center', 'Community', 'Status', 'Contact'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Licenses'] },
  ];
}

const app = defineMicroApp({
  name: 'multi-column-footer',
  async mount({ container }) {
    const el = document.createElement('app-multicol-footer');
    container.appendChild(el);
    await bootstrapApplication(MultiColFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-newsletter',
    description: 'Footer with newsletter subscription form',
    tags: ['footer', 'newsletter', 'subscription'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-newsletter-footer',
  template: \`

    <footer class="footer">
      <div class="newsletter">
        <h3 class="nl-title">Stay in the loop</h3>
        <p class="nl-desc">Get the latest updates delivered to your inbox.</p>
        <form class="nl-form" (submit)="subscribe($event)">
          <input type="email" class="nl-input" placeholder="Enter your email" />
          <button type="submit" class="nl-btn">Subscribe</button>
        </form>
      </div>
      <div class="bottom">
        <span>&copy; 2024 Company</span>
        <nav class="links"><a href="#privacy">Privacy</a><a href="#terms">Terms</a></nav>
      </div>
    </footer>
  
  \`,
})
export class NewsletterFooterComponent {
subscribe(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'newsletter-footer',
  async mount({ container }) {
    const el = document.createElement('app-newsletter-footer');
    container.appendChild(el);
    await bootstrapApplication(NewsletterFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'corporate',
    description: 'Corporate footer with company info, links and contact details',
    tags: ['footer', 'corporate', 'business'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-corporate-footer',
  template: \`

    <footer class="footer">
      <div class="top">
        <div class="company">
          <div class="brand">CorporateCo</div>
          <p class="desc">Enterprise solutions for modern businesses. Trusted by 500+ companies worldwide.</p>
          <p class="contact">contact@corporate.co</p>
        </div>
        <div class="col" *ngFor="let col of columns">
          <h4 class="col-title">{{ col.title }}</h4>
          <a *ngFor="let link of col.links" href="#" class="col-link">{{ link }}</a>
        </div>
      </div>
      <div class="bottom">&copy; 2024 CorporateCo Inc. All rights reserved.</div>
    </footer>
  
  \`,
})
export class CorporateFooterComponent {
columns = [
    { title: 'Services', links: ['Consulting', 'Development', 'Support', 'Training'] },
    { title: 'Resources', links: ['Documentation', 'API', 'Status', 'Partners'] },
  ];
}

const app = defineMicroApp({
  name: 'corporate-footer',
  async mount({ container }) {
    const el = document.createElement('app-corporate-footer');
    container.appendChild(el);
    await bootstrapApplication(CorporateFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-social',
    description: 'Footer with social media icon links',
    tags: ['footer', 'social', 'links'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-social-footer',
  template: \`

    <footer class="footer">
      <div class="brand">Brand</div>
      <div class="social">
        <a *ngFor="let s of socials" [href]="s.url" class="social-link" [title]="s.name">{{ s.icon }}</a>
      </div>
      <div class="copy">&copy; 2024 Brand. All rights reserved.</div>
    </footer>
  
  \`,
})
export class SocialFooterComponent {
socials = [
    { name: 'Twitter', icon: '\\u{1D54F}', url: '#twitter' },
    { name: 'GitHub', icon: '\\u{2B24}', url: '#github' },
    { name: 'LinkedIn', icon: '\\u{1D543}', url: '#linkedin' },
    { name: 'YouTube', icon: '\\u25B6', url: '#youtube' },
  ];
}

const app = defineMicroApp({
  name: 'social-footer',
  async mount({ container }) {
    const el = document.createElement('app-social-footer');
    container.appendChild(el);
    await bootstrapApplication(SocialFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed footer with light text on dark background',
    tags: ['footer', 'dark', 'theme'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-dark-footer',
  template: \`

    <footer class="footer">
      <div class="top">
        <div class="brand">DarkBrand</div>
        <nav class="links"><a *ngFor="let link of links" href="#">{{ link }}</a></nav>
      </div>
      <div class="bottom">&copy; 2024 DarkBrand. Built with Angular.</div>
    </footer>
  
  \`,
})
export class DarkFooterComponent {
links = ['About', 'Careers', 'Blog', 'Docs', 'Support'];
}

const app = defineMicroApp({
  name: 'dark-footer',
  async mount({ container }) {
    const el = document.createElement('app-dark-footer');
    container.appendChild(el);
    await bootstrapApplication(DarkFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'centered',
    description: 'Centered footer with stacked content alignment',
    tags: ['footer', 'centered', 'stacked'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-centered-footer',
  template: \`

    <footer class="footer">
      <div class="brand">CenteredApp</div>
      <nav class="links"><a *ngFor="let link of links" href="#">{{ link }}</a></nav>
      <div class="copy">&copy; 2024 CenteredApp. Made with care.</div>
    </footer>
  
  \`,
})
export class CenteredFooterComponent {
links = ['Home', 'About', 'Services', 'Blog', 'Contact'];
}

const app = defineMicroApp({
  name: 'centered-footer',
  async mount({ container }) {
    const el = document.createElement('app-centered-footer');
    container.appendChild(el);
    await bootstrapApplication(CenteredFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-logo',
    description: 'Footer with logo, tagline and organized link columns',
    tags: ['footer', 'logo', 'brand'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-logo-footer',
  template: \`

    <footer class="footer">
      <div class="logo-section">
        <div class="logo-icon">T</div>
        <div class="brand-name">Tuvix</div>
        <p class="tagline">Modern micro frontend framework</p>
      </div>
      <nav class="links"><a *ngFor="let link of links" href="#">{{ link }}</a></nav>
      <div class="copy">&copy; 2024 Tuvix. Open source under MIT.</div>
    </footer>
  
  \`,
})
export class LogoFooterComponent {
links = ['Docs', 'API', 'GitHub', 'Discord', 'Blog'];
}

const app = defineMicroApp({
  name: 'logo-footer',
  async mount({ container }) {
    const el = document.createElement('app-logo-footer');
    container.appendChild(el);
    await bootstrapApplication(LogoFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-sitemap',
    description: 'Footer with comprehensive sitemap links organized in columns',
    tags: ['footer', 'sitemap', 'navigation'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-sitemap-footer',
  template: \`

    <footer class="footer">
      <div class="sitemap">
        <div class="col" *ngFor="let col of sitemap">
          <h4 class="col-title">{{ col.title }}</h4>
          <a *ngFor="let link of col.links" href="#" class="col-link">{{ link }}</a>
        </div>
      </div>
      <div class="bottom">&copy; 2024 SitemapCo. All rights reserved. <a href="#privacy">Privacy</a> | <a href="#terms">Terms</a></div>
    </footer>
  
  \`,
})
export class SitemapFooterComponent {
sitemap = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Integrations'] },
    { title: 'Developers', links: ['Documentation', 'API Reference', 'SDKs', 'Open Source'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press Kit', 'Partners'] },
    { title: 'Support', links: ['Help Center', 'Community', 'Status', 'Contact Us'] },
  ];
}

const app = defineMicroApp({
  name: 'sitemap-footer',
  async mount({ container }) {
    const el = document.createElement('app-sitemap-footer');
    container.appendChild(el);
    await bootstrapApplication(SitemapFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-legal',
    description: 'Footer with legal disclaimers and compliance links',
    tags: ['footer', 'legal', 'compliance'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-legal-footer',
  template: \`

    <footer class="footer">
      <div class="top">
        <span class="brand">LegalCo</span>
        <nav class="links"><a *ngFor="let link of legalLinks" href="#">{{ link }}</a></nav>
      </div>
      <div class="disclaimer">
        This website is provided for informational purposes only. All trademarks are the property of their respective owners.
      </div>
      <div class="bottom">&copy; 2024 LegalCo Inc. All rights reserved. Registered in Delaware, USA.</div>
    </footer>
  
  \`,
})
export class LegalFooterComponent {
legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Accessibility'];
}

const app = defineMicroApp({
  name: 'legal-footer',
  async mount({ container }) {
    const el = document.createElement('app-legal-footer');
    container.appendChild(el);
    await bootstrapApplication(LegalFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-map',
    description: 'Footer with embedded map placeholder and address',
    tags: ['footer', 'map', 'location'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-map-footer',
  template: \`

    <footer class="footer">
      <div class="content">
        <div class="info">
          <h3 class="brand">MapCo</h3>
          <p class="address">123 Tech Street<br>San Francisco, CA 94105</p>
          <p class="phone">+1 (555) 123-4567</p>
        </div>
        <div class="map-placeholder">
          <div class="map-inner">Map Placeholder</div>
        </div>
      </div>
      <div class="bottom">&copy; 2024 MapCo. All rights reserved.</div>
    </footer>
  
  \`,
})
export class MapFooterComponent {
}

const app = defineMicroApp({
  name: 'map-footer',
  async mount({ container }) {
    const el = document.createElement('app-map-footer');
    container.appendChild(el);
    await bootstrapApplication(MapFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-app-links',
    description: 'Footer with app store download badges and links',
    tags: ['footer', 'app', 'download'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-applinks-footer',
  template: \`

    <footer class="footer">
      <div class="top">
        <div class="brand-section">
          <div class="brand">AppBrand</div>
          <p class="tagline">Available on all platforms</p>
        </div>
        <div class="app-links">
          <a href="#ios" class="store-badge">App Store</a>
          <a href="#android" class="store-badge">Google Play</a>
        </div>
      </div>
      <div class="bottom">&copy; 2024 AppBrand. Download our app today.</div>
    </footer>
  
  \`,
})
export class AppLinksFooterComponent {
}

const app = defineMicroApp({
  name: 'app-links-footer',
  async mount({ container }) {
    const el = document.createElement('app-applinks-footer');
    container.appendChild(el);
    await bootstrapApplication(AppLinksFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'transparent',
    description: 'Transparent footer for overlay on hero sections',
    tags: ['footer', 'transparent', 'overlay'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-transparent-footer',
  template: \`

    <footer class="footer">
      <nav class="links"><a *ngFor="let link of links" href="#">{{ link }}</a></nav>
      <div class="copy">&copy; 2024 TransparentCo</div>
    </footer>
  
  \`,
})
export class TransparentFooterComponent {
links = ['Home', 'About', 'Gallery', 'Contact'];
}

const app = defineMicroApp({
  name: 'transparent-footer',
  async mount({ container }) {
    const el = document.createElement('app-transparent-footer');
    container.appendChild(el);
    await bootstrapApplication(TransparentFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-awards',
    description: 'Footer with trust badges and award icons',
    tags: ['footer', 'awards', 'trust'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-awards-footer',
  template: \`

    <footer class="footer">
      <div class="awards">
        <div class="award" *ngFor="let a of awards">
          <span class="award-icon">{{ a.icon }}</span>
          <span class="award-label">{{ a.label }}</span>
        </div>
      </div>
      <nav class="links"><a *ngFor="let link of links" href="#">{{ link }}</a></nav>
      <div class="copy">&copy; 2024 AwardsCo. Trusted by thousands.</div>
    </footer>
  
  \`,
})
export class AwardsFooterComponent {
awards = [
    { icon: '\\u{1F3C6}', label: 'Best Product 2024' },
    { icon: '\\u2B50', label: '4.9 Rating' },
    { icon: '\\u{1F6E1}', label: 'SOC2 Compliant' },
  ];
  links = ['About', 'Careers', 'Press', 'Legal'];
}

const app = defineMicroApp({
  name: 'awards-footer',
  async mount({ container }) {
    const el = document.createElement('app-awards-footer');
    container.appendChild(el);
    await bootstrapApplication(AwardsFooterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-payment',
    description: 'Footer with payment method icons and security badge',
    tags: ['footer', 'payment', 'security'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-payment-footer',
  template: \`

    <footer class="footer">
      <div class="top">
        <span class="brand">ShopCo</span>
        <nav class="links"><a href="#returns">Returns</a><a href="#shipping">Shipping</a><a href="#faq">FAQ</a></nav>
      </div>
      <div class="payment">
        <span class="pay-label">We accept:</span>
        <span class="pay-method" *ngFor="let m of methods">{{ m }}</span>
        <span class="secure">\\u{1F512} Secure Checkout</span>
      </div>
      <div class="bottom">&copy; 2024 ShopCo. All transactions are secure and encrypted.</div>
    </footer>
  
  \`,
})
export class PaymentFooterComponent {
methods = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay'];
}

const app = defineMicroApp({
  name: 'payment-footer',
  async mount({ container }) {
    const el = document.createElement('app-payment-footer');
    container.appendChild(el);
    await bootstrapApplication(PaymentFooterComponent);
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
