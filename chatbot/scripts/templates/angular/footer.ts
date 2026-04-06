import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal footer with copyright and basic links',
    tags: ['footer', 'minimal', 'simple'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-minimal-footer',
  template: \`
    <footer class="footer">
      <span class="copy">&copy; 2024 Company</span>
      <nav class="links"><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#contact">Contact</a></nav>
    </footer>
  \`,
  styles: [\`
    .footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
    .links { display: flex; gap: 16px; }
    .links a { color: #6b7280; text-decoration: none; }
    .links a:hover { color: #374151; }
  \`]
})
export class MinimalFooterComponent {}

@NgModule({
  declarations: [MinimalFooterComponent],
  imports: [BrowserModule],
  bootstrap: [MinimalFooterComponent],
})
export class MinimalFooterModule {}

export default createAngularMicroApp({
  name: 'minimal-footer',
  module: MinimalFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'multi-column',
    description: 'Multi-column footer with organized link sections',
    tags: ['footer', 'multi-column', 'organized'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; }
    .columns { display: flex; gap: 48px; margin-bottom: 32px; }
    .col-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #374151; margin: 0 0 12px; letter-spacing: 0.05em; }
    .col-link { display: block; padding: 4px 0; font-size: 13px; color: #6b7280; text-decoration: none; }
    .col-link:hover { color: #6366f1; }
    .bottom { font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
  \`]
})
export class MultiColFooterComponent {
  columns = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Docs'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
    { title: 'Support', links: ['Help Center', 'Community', 'Status', 'Contact'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Licenses'] },
  ];
}

@NgModule({
  declarations: [MultiColFooterComponent],
  imports: [BrowserModule],
  bootstrap: [MultiColFooterComponent],
})
export class MultiColFooterModule {}

export default createAngularMicroApp({
  name: 'multi-column-footer',
  module: MultiColFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-newsletter',
    description: 'Footer with newsletter subscription form',
    tags: ['footer', 'newsletter', 'subscription'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; }
    .newsletter { max-width: 400px; margin-bottom: 32px; }
    .nl-title { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
    .nl-desc { font-size: 13px; color: #6b7280; margin: 0 0 16px; }
    .nl-form { display: flex; gap: 8px; }
    .nl-input { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; }
    .nl-btn { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .bottom { display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
    .links { display: flex; gap: 16px; }
    .links a { color: #9ca3af; text-decoration: none; }
  \`]
})
export class NewsletterFooterComponent {
  subscribe(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [NewsletterFooterComponent],
  imports: [BrowserModule],
  bootstrap: [NewsletterFooterComponent],
})
export class NewsletterFooterModule {}

export default createAngularMicroApp({
  name: 'newsletter-footer',
  module: NewsletterFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'corporate',
    description: 'Corporate footer with company info, links and contact details',
    tags: ['footer', 'corporate', 'business'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { padding: 48px 24px 20px; background: #111827; color: #d1d5db; }
    .top { display: flex; gap: 48px; margin-bottom: 32px; }
    .company { max-width: 280px; }
    .brand { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .desc { font-size: 13px; line-height: 1.5; margin: 0 0 8px; }
    .contact { font-size: 13px; color: #818cf8; }
    .col-title { font-size: 13px; font-weight: 700; color: #fff; text-transform: uppercase; margin: 0 0 12px; letter-spacing: 0.05em; }
    .col-link { display: block; padding: 4px 0; font-size: 13px; color: #9ca3af; text-decoration: none; }
    .col-link:hover { color: #fff; }
    .bottom { font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 16px; }
  \`]
})
export class CorporateFooterComponent {
  columns = [
    { title: 'Services', links: ['Consulting', 'Development', 'Support', 'Training'] },
    { title: 'Resources', links: ['Documentation', 'API', 'Status', 'Partners'] },
  ];
}

@NgModule({
  declarations: [CorporateFooterComponent],
  imports: [BrowserModule],
  bootstrap: [CorporateFooterComponent],
})
export class CorporateFooterModule {}

export default createAngularMicroApp({
  name: 'corporate-footer',
  module: CorporateFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-social',
    description: 'Footer with social media icon links',
    tags: ['footer', 'social', 'links'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { text-align: center; padding: 32px 24px; border-top: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
    .social { display: flex; justify-content: center; gap: 12px; margin-bottom: 16px; }
    .social-link { width: 40px; height: 40px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 18px; transition: background 0.2s; }
    .social-link:hover { background: #6366f1; color: #fff; }
    .copy { font-size: 12px; color: #9ca3af; }
  \`]
})
export class SocialFooterComponent {
  socials = [
    { name: 'Twitter', icon: '\\u{1D54F}', url: '#twitter' },
    { name: 'GitHub', icon: '\\u{2B24}', url: '#github' },
    { name: 'LinkedIn', icon: '\\u{1D543}', url: '#linkedin' },
    { name: 'YouTube', icon: '\\u25B6', url: '#youtube' },
  ];
}

@NgModule({
  declarations: [SocialFooterComponent],
  imports: [BrowserModule],
  bootstrap: [SocialFooterComponent],
})
export class SocialFooterModule {}

export default createAngularMicroApp({
  name: 'social-footer',
  module: SocialFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed footer with light text on dark background',
    tags: ['footer', 'dark', 'theme'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { background: #0f172a; color: #cbd5e1; padding: 32px 24px 16px; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .brand { font-size: 18px; font-weight: 700; color: #fff; }
    .links { display: flex; gap: 20px; }
    .links a { color: #94a3b8; text-decoration: none; font-size: 13px; }
    .links a:hover { color: #fff; }
    .bottom { font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; }
  \`]
})
export class DarkFooterComponent {
  links = ['About', 'Careers', 'Blog', 'Docs', 'Support'];
}

@NgModule({
  declarations: [DarkFooterComponent],
  imports: [BrowserModule],
  bootstrap: [DarkFooterComponent],
})
export class DarkFooterModule {}

export default createAngularMicroApp({
  name: 'dark-footer',
  module: DarkFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'centered',
    description: 'Centered footer with stacked content alignment',
    tags: ['footer', 'centered', 'stacked'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-centered-footer',
  template: \`
    <footer class="footer">
      <div class="brand">CenteredApp</div>
      <nav class="links"><a *ngFor="let link of links" href="#">{{ link }}</a></nav>
      <div class="copy">&copy; 2024 CenteredApp. Made with care.</div>
    </footer>
  \`,
  styles: [\`
    .footer { text-align: center; padding: 40px 24px; border-top: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
    .links { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
    .links a { color: #6b7280; text-decoration: none; font-size: 14px; }
    .links a:hover { color: #6366f1; }
    .copy { font-size: 12px; color: #9ca3af; }
  \`]
})
export class CenteredFooterComponent {
  links = ['Home', 'About', 'Services', 'Blog', 'Contact'];
}

@NgModule({
  declarations: [CenteredFooterComponent],
  imports: [BrowserModule],
  bootstrap: [CenteredFooterComponent],
})
export class CenteredFooterModule {}

export default createAngularMicroApp({
  name: 'centered-footer',
  module: CenteredFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-logo',
    description: 'Footer with logo, tagline and organized link columns',
    tags: ['footer', 'logo', 'brand'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { text-align: center; padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; }
    .logo-icon { width: 48px; height: 48px; border-radius: 12px; background: #6366f1; color: #fff; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
    .brand-name { font-size: 20px; font-weight: 700; }
    .tagline { font-size: 13px; color: #6b7280; margin: 4px 0 20px; }
    .links { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; }
    .links a { font-size: 13px; color: #6b7280; text-decoration: none; }
    .links a:hover { color: #6366f1; }
    .copy { font-size: 12px; color: #9ca3af; }
  \`]
})
export class LogoFooterComponent {
  links = ['Docs', 'API', 'GitHub', 'Discord', 'Blog'];
}

@NgModule({
  declarations: [LogoFooterComponent],
  imports: [BrowserModule],
  bootstrap: [LogoFooterComponent],
})
export class LogoFooterModule {}

export default createAngularMicroApp({
  name: 'logo-footer',
  module: LogoFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-sitemap',
    description: 'Footer with comprehensive sitemap links organized in columns',
    tags: ['footer', 'sitemap', 'navigation'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { padding: 40px 24px 20px; border-top: 1px solid #e5e7eb; }
    .sitemap { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 32px; margin-bottom: 32px; }
    .col-title { font-size: 13px; font-weight: 700; margin: 0 0 12px; color: #374151; }
    .col-link { display: block; padding: 3px 0; font-size: 13px; color: #6b7280; text-decoration: none; }
    .col-link:hover { color: #6366f1; }
    .bottom { font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
    .bottom a { color: #9ca3af; text-decoration: none; }
  \`]
})
export class SitemapFooterComponent {
  sitemap = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Integrations'] },
    { title: 'Developers', links: ['Documentation', 'API Reference', 'SDKs', 'Open Source'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press Kit', 'Partners'] },
    { title: 'Support', links: ['Help Center', 'Community', 'Status', 'Contact Us'] },
  ];
}

@NgModule({
  declarations: [SitemapFooterComponent],
  imports: [BrowserModule],
  bootstrap: [SitemapFooterComponent],
})
export class SitemapFooterModule {}

export default createAngularMicroApp({
  name: 'sitemap-footer',
  module: SitemapFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-legal',
    description: 'Footer with legal disclaimers and compliance links',
    tags: ['footer', 'legal', 'compliance'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { padding: 32px 24px 16px; border-top: 1px solid #e5e7eb; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .brand { font-size: 16px; font-weight: 700; }
    .links { display: flex; gap: 16px; }
    .links a { font-size: 13px; color: #6b7280; text-decoration: none; }
    .disclaimer { font-size: 11px; color: #9ca3af; line-height: 1.5; padding: 12px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; margin-bottom: 12px; }
    .bottom { font-size: 11px; color: #9ca3af; }
  \`]
})
export class LegalFooterComponent {
  legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Accessibility'];
}

@NgModule({
  declarations: [LegalFooterComponent],
  imports: [BrowserModule],
  bootstrap: [LegalFooterComponent],
})
export class LegalFooterModule {}

export default createAngularMicroApp({
  name: 'legal-footer',
  module: LegalFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-map',
    description: 'Footer with embedded map placeholder and address',
    tags: ['footer', 'map', 'location'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { padding: 32px 24px 16px; border-top: 1px solid #e5e7eb; }
    .content { display: flex; gap: 32px; margin-bottom: 24px; }
    .info { flex: 1; }
    .brand { font-size: 18px; font-weight: 700; margin: 0 0 12px; }
    .address, .phone { font-size: 13px; color: #6b7280; margin: 0 0 8px; line-height: 1.5; }
    .map-placeholder { width: 300px; height: 160px; background: #f3f4f6; border-radius: 8px; flex-shrink: 0; }
    .map-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; }
    .bottom { font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
  \`]
})
export class MapFooterComponent {}

@NgModule({
  declarations: [MapFooterComponent],
  imports: [BrowserModule],
  bootstrap: [MapFooterComponent],
})
export class MapFooterModule {}

export default createAngularMicroApp({
  name: 'map-footer',
  module: MapFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-app-links',
    description: 'Footer with app store download badges and links',
    tags: ['footer', 'app', 'download'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { padding: 32px 24px 16px; border-top: 1px solid #e5e7eb; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .brand { font-size: 18px; font-weight: 700; }
    .tagline { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
    .app-links { display: flex; gap: 8px; }
    .store-badge { display: inline-block; padding: 10px 20px; background: #111827; color: #fff; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; }
    .bottom { font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
  \`]
})
export class AppLinksFooterComponent {}

@NgModule({
  declarations: [AppLinksFooterComponent],
  imports: [BrowserModule],
  bootstrap: [AppLinksFooterComponent],
})
export class AppLinksFooterModule {}

export default createAngularMicroApp({
  name: 'app-links-footer',
  module: AppLinksFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'transparent',
    description: 'Transparent footer for overlay on hero sections',
    tags: ['footer', 'transparent', 'overlay'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-transparent-footer',
  template: \`
    <footer class="footer">
      <nav class="links"><a *ngFor="let link of links" href="#">{{ link }}</a></nav>
      <div class="copy">&copy; 2024 TransparentCo</div>
    </footer>
  \`,
  styles: [\`
    .footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 24px; background: transparent; text-align: center; }
    .links { display: flex; justify-content: center; gap: 20px; margin-bottom: 8px; }
    .links a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 13px; }
    .links a:hover { color: #fff; }
    .copy { font-size: 12px; color: rgba(255,255,255,0.5); }
  \`]
})
export class TransparentFooterComponent {
  links = ['Home', 'About', 'Gallery', 'Contact'];
}

@NgModule({
  declarations: [TransparentFooterComponent],
  imports: [BrowserModule],
  bootstrap: [TransparentFooterComponent],
})
export class TransparentFooterModule {}

export default createAngularMicroApp({
  name: 'transparent-footer',
  module: TransparentFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-awards',
    description: 'Footer with trust badges and award icons',
    tags: ['footer', 'awards', 'trust'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { text-align: center; padding: 32px 24px 16px; border-top: 1px solid #e5e7eb; }
    .awards { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
    .award { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f9fafb; border-radius: 8px; }
    .award-icon { font-size: 18px; }
    .award-label { font-size: 12px; font-weight: 600; color: #374151; }
    .links { display: flex; justify-content: center; gap: 20px; margin-bottom: 16px; }
    .links a { font-size: 13px; color: #6b7280; text-decoration: none; }
    .copy { font-size: 12px; color: #9ca3af; }
  \`]
})
export class AwardsFooterComponent {
  awards = [
    { icon: '\\u{1F3C6}', label: 'Best Product 2024' },
    { icon: '\\u2B50', label: '4.9 Rating' },
    { icon: '\\u{1F6E1}', label: 'SOC2 Compliant' },
  ];
  links = ['About', 'Careers', 'Press', 'Legal'];
}

@NgModule({
  declarations: [AwardsFooterComponent],
  imports: [BrowserModule],
  bootstrap: [AwardsFooterComponent],
})
export class AwardsFooterModule {}

export default createAngularMicroApp({
  name: 'awards-footer',
  module: AwardsFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-payment',
    description: 'Footer with payment method icons and security badge',
    tags: ['footer', 'payment', 'security'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .footer { padding: 32px 24px 16px; border-top: 1px solid #e5e7eb; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .brand { font-size: 18px; font-weight: 700; }
    .links { display: flex; gap: 16px; }
    .links a { font-size: 13px; color: #6b7280; text-decoration: none; }
    .payment { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 12px 0; border-top: 1px solid #f3f4f6; }
    .pay-label { font-size: 12px; color: #6b7280; }
    .pay-method { padding: 4px 10px; background: #f3f4f6; border-radius: 4px; font-size: 11px; font-weight: 600; color: #374151; }
    .secure { margin-left: auto; font-size: 12px; color: #10b981; font-weight: 600; }
    .bottom { font-size: 11px; color: #9ca3af; }
  \`]
})
export class PaymentFooterComponent {
  methods = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay'];
}

@NgModule({
  declarations: [PaymentFooterComponent],
  imports: [BrowserModule],
  bootstrap: [PaymentFooterComponent],
})
export class PaymentFooterModule {}

export default createAngularMicroApp({
  name: 'payment-footer',
  module: PaymentFooterModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;
