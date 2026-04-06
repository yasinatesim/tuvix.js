import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal footer with copyright and a few links',
    tags: ['footer', 'minimal', 'simple'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function MinimalFooter() {
  return (
    <footer style={{ padding: '24px 32px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
      <span>&copy; 2025 Company Inc.</span>
      <div style={{ display: 'flex', gap: '20px' }}>
        <a href="#privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy</a>
        <a href="#terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms</a>
      </div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'minimal-footer', App: MinimalFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'multi-column',
    description: 'Multi-column footer with categorized links',
    tags: ['footer', 'multi-column', 'navigation'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function MultiColumnFooter() {
  const columns: Record<string, string[]> = {
    Product: ['Features', 'Pricing', 'Changelog', 'Docs'],
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Support: ['Help Center', 'Contact', 'Status', 'API'],
    Legal: ['Privacy', 'Terms', 'Cookies', 'Licenses'],
  };

  return (
    <footer style={{ padding: '48px 32px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        {Object.entries(columns).map(([title, links]) => (
          <div key={title}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h4>
            {links.map((link) => (
              <a key={link} href={'#' + link.toLowerCase().replace(/\\s/g, '-')} style={{ display: 'block', padding: '4px 0', textDecoration: 'none', color: '#6b7280', fontSize: '13px' }}>{link}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#9ca3af' }}>&copy; 2025 Company. All rights reserved.</div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'multi-column-footer', App: MultiColumnFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-newsletter',
    description: 'Footer with newsletter signup form and link columns',
    tags: ['footer', 'newsletter', 'email'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function NewsletterFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer style={{ padding: '48px 32px 24px', backgroundColor: '#111827', color: '#d1d5db' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '48px', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 8px' }}>Stay in the loop</h3>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 16px' }}>Get updates on new features and releases.</p>
          {subscribed ? (
            <p style={{ color: '#10b981', fontSize: '14px' }}>Thanks for subscribing!</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }} style={{ display: 'flex', gap: '8px' }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={{ flex: 1, padding: '10px 12px', border: '1px solid #374151', borderRadius: '6px', backgroundColor: '#1f2937', color: '#fff', outline: 'none' }} />
              <button type="submit" style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Subscribe</button>
            </form>
          )}
        </div>
        <div style={{ display: 'flex', gap: '32px' }}>
          {[['Product', 'Features', 'Pricing'], ['Support', 'Docs', 'Contact']].map(([title, ...links]) => (
            <div key={title}>
              <h4 style={{ color: '#fff', fontSize: '14px', margin: '0 0 8px' }}>{title}</h4>
              {links.map((l) => <a key={l} href="#" style={{ display: 'block', padding: '3px 0', color: '#9ca3af', textDecoration: 'none', fontSize: '13px' }}>{l}</a>)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#6b7280' }}>&copy; 2025 Company</div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'newsletter-footer', App: NewsletterFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'corporate',
    description: 'Corporate footer with logo, links, and compliance text',
    tags: ['footer', 'corporate', 'business'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function CorporateFooter() {
  return (
    <footer style={{ padding: '40px 32px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Corp Inc.</div>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '300px', lineHeight: 1.5 }}>Enterprise solutions for modern businesses. Trusted by 500+ companies worldwide.</p>
          </div>
          <div style={{ display: 'flex', gap: '48px' }}>
            {[['Solutions', 'Cloud', 'Security', 'Analytics'], ['Resources', 'Documentation', 'Whitepapers', 'Webinars']].map(([title, ...links]) => (
              <div key={title}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>{title}</h4>
                {links.map((l) => <a key={l} href="#" style={{ display: 'block', padding: '3px 0', color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          &copy; 2025 Corp Inc. All rights reserved. Securities offered through registered broker-dealers.
        </div>
      </div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'corporate-footer', App: CorporateFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-social',
    description: 'Footer with social media icon links',
    tags: ['footer', 'social', 'links'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function SocialFooter() {
  const socials = [
    { name: 'Twitter', icon: 'T' },
    { name: 'GitHub', icon: 'G' },
    { name: 'LinkedIn', icon: 'L' },
    { name: 'YouTube', icon: 'Y' },
  ];

  return (
    <footer style={{ padding: '32px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
        {socials.map((s) => (
          <a key={s.name} href={'#' + s.name.toLowerCase()} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#6b7280', fontWeight: 700, fontSize: '14px' }}>{s.icon}</a>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
        {['About', 'Blog', 'Careers', 'Contact'].map((l) => <a key={l} href="#" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '14px' }}>{l}</a>)}
      </div>
      <div style={{ fontSize: '13px', color: '#9ca3af' }}>&copy; 2025 Brand. All rights reserved.</div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'social-footer', App: SocialFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed footer with light text and accent links',
    tags: ['footer', 'dark', 'theme'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function DarkFooter() {
  return (
    <footer style={{ padding: '40px 32px 24px', backgroundColor: '#0f172a', color: '#94a3b8' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>DarkBrand</div>
          <p style={{ fontSize: '13px', lineHeight: 1.5 }}>Building the future of web architecture with micro-frontends.</p>
        </div>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 10px' }}>Quick Links</h4>
          {['Home', 'Features', 'Pricing', 'Blog'].map((l) => <a key={l} href="#" style={{ display: 'block', padding: '3px 0', color: '#818cf8', textDecoration: 'none', fontSize: '13px' }}>{l}</a>)}
        </div>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 10px' }}>Contact</h4>
          <p style={{ fontSize: '13px', lineHeight: 1.6 }}>hello@darkbrand.dev<br />San Francisco, CA</p>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #1e293b', fontSize: '12px' }}>&copy; 2025 DarkBrand</div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'dark-footer', App: DarkFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'centered',
    description: 'Centered footer with stacked content and links',
    tags: ['footer', 'centered', 'stacked'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function CenteredFooter() {
  return (
    <footer style={{ padding: '40px 32px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Brand</div>
      <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '400px', margin: '0 auto 20px', lineHeight: 1.5 }}>Making web development better, one micro-frontend at a time.</p>
      <nav style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' }}>
        {['Home', 'About', 'Features', 'Pricing', 'Contact'].map((l) => (
          <a key={l} href="#" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px' }}>{l}</a>
        ))}
      </nav>
      <div style={{ fontSize: '13px', color: '#9ca3af' }}>&copy; 2025 Brand. Built with care.</div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'centered-footer', App: CenteredFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-logo',
    description: 'Footer with a prominent logo and tagline section',
    tags: ['footer', 'logo', 'brand'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function LogoFooter() {
  return (
    <footer style={{ padding: '40px 32px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>T</div>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>Tuvix</span>
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', maxWidth: '280px', lineHeight: 1.5 }}>The micro-frontend framework for building composable web applications.</p>
        </div>
        <div style={{ display: 'flex', gap: '40px' }}>
          {[['Product', 'Features', 'Integrations'], ['Company', 'About', 'Careers']].map(([title, ...links]) => (
            <div key={title}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px' }}>{title}</h4>
              {links.map((l) => <a key={l} href="#" style={{ display: 'block', padding: '3px 0', color: '#6b7280', textDecoration: 'none', fontSize: '13px' }}>{l}</a>)}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'logo-footer', App: LogoFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-sitemap',
    description: 'Footer with comprehensive sitemap-style navigation',
    tags: ['footer', 'sitemap', 'navigation'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function SitemapFooter() {
  const sections: Record<string, string[]> = {
    Platform: ['Overview', 'Features', 'Security', 'Enterprise', 'Pricing'],
    Developers: ['API Docs', 'SDKs', 'CLI', 'Playground', 'Examples'],
    Resources: ['Blog', 'Guides', 'Webinars', 'Case Studies', 'Changelog'],
    Company: ['About Us', 'Careers', 'Press', 'Partners', 'Contact'],
  };

  return (
    <footer style={{ padding: '48px 32px 24px', backgroundColor: '#fafafa', borderTop: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {Object.entries(sections).map(([title, links]) => (
          <div key={title}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#111827' }}>{title}</h4>
            {links.map((l) => <a key={l} href="#" style={{ display: 'block', padding: '4px 0', textDecoration: 'none', color: '#6b7280', fontSize: '13px' }}>{l}</a>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: '1100px', margin: '32px auto 0', paddingTop: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
        <span>&copy; 2025 Company Inc.</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms</a>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Cookies</a>
        </div>
      </div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'sitemap-footer', App: SitemapFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-legal',
    description: 'Footer with legal disclaimer and compliance links',
    tags: ['footer', 'legal', 'compliance'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function LegalFooter() {
  return (
    <footer style={{ padding: '32px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' }}>
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Accessibility'].map((l) => (
            <a key={l} href="#" style={{ textDecoration: 'none', color: '#6366f1', fontSize: '13px' }}>{l}</a>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
          This site is protected by applicable privacy laws. By using our services, you agree to our terms and conditions.
          All content is provided for informational purposes only and does not constitute legal advice.
        </p>
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#d1d5db' }}>&copy; 2025 Legal Corp. All rights reserved.</div>
      </div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'legal-footer', App: LegalFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-map',
    description: 'Footer with embedded map placeholder and address',
    tags: ['footer', 'map', 'location'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function MapFooter() {
  return (
    <footer style={{ borderTop: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, padding: '32px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700 }}>Visit Us</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 16px' }}>
            123 Innovation Blvd<br />
            Suite 400<br />
            San Francisco, CA 94105
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Mon - Fri: 9am - 6pm<br />
            contact@company.dev
          </p>
        </div>
        <div style={{ width: '50%', minHeight: '200px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
          Map Placeholder
        </div>
      </div>
      <div style={{ padding: '16px 32px', backgroundColor: '#f9fafb', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>&copy; 2025 Company</div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'map-footer', App: MapFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-app-links',
    description: 'Footer with app store download badges and platform links',
    tags: ['footer', 'app', 'download'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function AppLinksFooter() {
  return (
    <footer style={{ padding: '40px 32px', backgroundColor: '#111827', color: '#d1d5db' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Get the App</h3>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>Available on all major platforms</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          {['App Store', 'Google Play', 'Web App'].map((store) => (
            <a key={store} href="#" style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#1f2937', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>{store}</a>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' }}>
          {['Features', 'Pricing', 'Support', 'Blog'].map((l) => <a key={l} href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13px' }}>{l}</a>)}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>&copy; 2025 MobileApp Inc.</div>
      </div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'app-links-footer', App: AppLinksFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'transparent',
    description: 'Transparent footer for overlay on dark backgrounds',
    tags: ['footer', 'transparent', 'overlay'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function TransparentFooter() {
  return (
    <footer style={{ padding: '24px 32px', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>&copy; 2025 Overlay Corp</span>
      <nav style={{ display: 'flex', gap: '20px' }}>
        {['Privacy', 'Terms', 'Contact'].map((l) => (
          <a key={l} href="#" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{l}</a>
        ))}
      </nav>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'transparent-footer', App: TransparentFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-awards',
    description: 'Footer showcasing trust badges and award icons',
    tags: ['footer', 'awards', 'trust'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function AwardsFooter() {
  const badges = ['ISO 27001', 'SOC 2', 'GDPR Ready', 'Top Rated 2025'];

  return (
    <footer style={{ padding: '40px 32px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          {badges.map((b) => (
            <div key={b} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>{b}</div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
          {['Home', 'About', 'Security', 'Contact'].map((l) => <a key={l} href="#" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '13px' }}>{l}</a>)}
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>&copy; 2025 Trusted Corp. All rights reserved.</div>
      </div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'awards-footer', App: AwardsFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-payment',
    description: 'Footer with accepted payment method icons',
    tags: ['footer', 'payment', 'ecommerce'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function PaymentFooter() {
  const methods = ['Visa', 'MC', 'Amex', 'PayPal', 'Apple Pay'];

  return (
    <footer style={{ padding: '32px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Shop', 'Returns', 'Shipping', 'FAQ'].map((l) => <a key={l} href="#" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '14px' }}>{l}</a>)}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#9ca3af', marginRight: '4px' }}>We accept:</span>
            {methods.map((m) => (
              <span key={m} style={{ padding: '4px 8px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#374151' }}>{m}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>&copy; 2025 ShopCo. Secure checkout guaranteed.</div>
      </div>
    </footer>
  );
}

const app = createReactMicroApp({ name: 'payment-footer', App: PaymentFooter });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
