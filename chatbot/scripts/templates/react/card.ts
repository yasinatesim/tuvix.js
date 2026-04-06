import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'product',
    description: 'Product card with image, price, and add-to-cart button',
    tags: ['card', 'product', 'ecommerce'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ProductCard() {
  const [added, setAdded] = useState(false);

  return (
    <div style={{ width: '280px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', backgroundColor: '#fff' }}>
      <div style={{ height: '200px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>Product Image</div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>Wireless Headphones</h3>
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280' }}>Premium noise-canceling audio</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>$129.99</span>
          <button onClick={() => setAdded(!added)} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', backgroundColor: added ? '#10b981' : '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>{added ? 'Added' : 'Add to Cart'}</button>
        </div>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'product-card', App: ProductCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'profile',
    description: 'User profile card with avatar, name, bio, and social stats',
    tags: ['card', 'profile', 'user'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function ProfileCard() {
  const stats = [{ label: 'Posts', value: 142 }, { label: 'Followers', value: '2.4K' }, { label: 'Following', value: 380 }];

  return (
    <div style={{ width: '300px', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center', overflow: 'hidden' }}>
      <div style={{ height: '80px', backgroundColor: '#6366f1' }} />
      <div style={{ marginTop: '-36px', padding: '0 20px 20px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#818cf8', border: '4px solid #fff', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 700 }}>JD</div>
        <h3 style={{ margin: '12px 0 4px', fontSize: '18px', fontWeight: 700 }}>Jane Doe</h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>Full-stack developer & OSS contributor</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', padding: '16px 0', borderTop: '1px solid #e5e7eb' }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'profile-card', App: ProfileCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'stats',
    description: 'Statistics card showing key metrics with trend indicators',
    tags: ['card', 'stats', 'dashboard'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function StatsCard() {
  const metrics = [
    { label: 'Revenue', value: '$48,200', change: '+12.5%', up: true },
    { label: 'Users', value: '3,842', change: '+8.2%', up: true },
    { label: 'Bounce Rate', value: '24.3%', change: '-3.1%', up: false },
  ];

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {metrics.map((m) => (
        <div key={m.label} style={{ flex: 1, padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{m.label}</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{m.value}</div>
          <div style={{ fontSize: '13px', color: m.up ? '#10b981' : '#ef4444', fontWeight: 500 }}>{m.change}</div>
        </div>
      ))}
    </div>
  );
}

const app = createReactMicroApp({ name: 'stats-card', App: StatsCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'pricing',
    description: 'Pricing card with plan details, features, and CTA button',
    tags: ['card', 'pricing', 'plan'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function PricingCard() {
  const features = ['10 projects', '5 team members', '20GB storage', 'Priority support', 'Custom domain'];

  return (
    <div style={{ width: '300px', borderRadius: '12px', border: '2px solid #6366f1', backgroundColor: '#fff', overflow: 'hidden' }}>
      <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#6366f1', color: '#fff' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Pro Plan</div>
        <div style={{ fontSize: '40px', fontWeight: 800 }}>$29<span style={{ fontSize: '16px', fontWeight: 400 }}>/mo</span></div>
      </div>
      <div style={{ padding: '24px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
          {features.map((f) => (
            <li key={f} style={{ padding: '8px 0', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>\\u2713</span> {f}
            </li>
          ))}
        </ul>
        <button style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>Get Started</button>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'pricing-card', App: PricingCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'media',
    description: 'Media card with video/image thumbnail and play overlay',
    tags: ['card', 'media', 'video'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function MediaCard() {
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{ width: '320px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div onClick={() => setPlaying(!playing)} style={{ height: '180px', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
        {!playing ? (
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>\\u25B6</div>
        ) : (
          <div style={{ color: '#fff', fontSize: '14px' }}>Playing...</div>
        )}
        <span style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>4:32</span>
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>Getting Started with Micro-Frontends</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Learn the basics in under 5 minutes</p>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'media-card', App: MediaCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'blog',
    description: 'Blog post card with title, excerpt, author, and date',
    tags: ['card', 'blog', 'article'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function BlogCard() {
  return (
    <article style={{ width: '340px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ height: '160px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#6366f1', fontSize: '14px' }}>Cover Image</span>
      </div>
      <div style={{ padding: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase' }}>Tutorial</span>
        <h3 style={{ margin: '8px 0', fontSize: '18px', fontWeight: 700, lineHeight: 1.3 }}>Building Scalable Micro-Frontends</h3>
        <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>A comprehensive guide to composing independent applications into a unified experience.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700 }}>AK</div>
          <div><div style={{ fontSize: '13px', fontWeight: 600 }}>Alex Kim</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Mar 15, 2025</div></div>
        </div>
      </div>
    </article>
  );
}

const app = createReactMicroApp({ name: 'blog-card', App: BlogCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'testimonial',
    description: 'Testimonial card with quote, author name, and rating stars',
    tags: ['card', 'testimonial', 'review'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function TestimonialCard() {
  const rating = 5;

  return (
    <div style={{ width: '340px', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: '18px', marginBottom: '12px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: i < rating ? '#f59e0b' : '#d1d5db' }}>\\u2605</span>
        ))}
      </div>
      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#374151', lineHeight: 1.6, fontStyle: 'italic' }}>"Tuvix.js completely changed how we think about frontend architecture. The migration was seamless and our team velocity doubled."</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>SM</div>
        <div><div style={{ fontWeight: 600, fontSize: '14px' }}>Sarah Mitchell</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>CTO at TechCorp</div></div>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'testimonial-card', App: TestimonialCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'feature',
    description: 'Feature card with icon, title, and description',
    tags: ['card', 'feature', 'landing'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function FeatureCard() {
  const features = [
    { icon: '\\u26A1', title: 'Lightning Fast', desc: 'Sub-millisecond mounting with zero overhead' },
    { icon: '\\u1F512', title: 'Sandboxed', desc: 'Complete style and script isolation between apps' },
    { icon: '\\u267B', title: 'Framework Agnostic', desc: 'Mix React, Vue, Svelte, and Angular freely' },
  ];

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {features.map((f) => (
        <div key={f.title} style={{ flex: 1, padding: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>{f.title}</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

const app = createReactMicroApp({ name: 'feature-card', App: FeatureCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'notification',
    description: 'Notification card with type indicator and dismiss button',
    tags: ['card', 'notification', 'alert'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function NotificationCard() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div style={{ maxWidth: '400px', padding: '16px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderLeft: '4px solid #6366f1', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>\\u2139</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#111827' }}>New Update Available</div>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.4 }}>Version 2.1.0 includes performance improvements and bug fixes.</p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
          <button style={{ padding: '4px 12px', border: 'none', borderRadius: '4px', backgroundColor: '#6366f1', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Update Now</button>
          <button onClick={() => setVisible(false)} style={{ padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff', fontSize: '12px', cursor: 'pointer' }}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'notification-card', App: NotificationCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'team-member',
    description: 'Team member card with role, skills, and contact links',
    tags: ['card', 'team', 'member'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function TeamMemberCard() {
  const skills = ['React', 'TypeScript', 'Node.js'];

  return (
    <div style={{ width: '260px', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: 700 }}>LK</div>
      <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>Lisa Kim</h3>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6366f1', fontWeight: 500 }}>Senior Engineer</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {skills.map((s) => (
          <span key={s} style={{ padding: '4px 10px', backgroundColor: '#f3f4f6', borderRadius: '12px', fontSize: '12px', color: '#374151' }}>{s}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
        <a href="#email" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Email</a>
        <a href="#linkedin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>LinkedIn</a>
        <a href="#github" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>GitHub</a>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'team-member-card', App: TeamMemberCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'event',
    description: 'Event card with date badge, location, and RSVP button',
    tags: ['card', 'event', 'calendar'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function EventCard() {
  const [rsvp, setRsvp] = useState(false);

  return (
    <div style={{ width: '320px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ height: '120px', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>15</div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>March 2025</div>
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700 }}>Frontend Architecture Summit</h3>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>\\u231A 10:00 AM - 4:00 PM</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>\\u2316 Convention Center, San Francisco</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>42 attending</span>
          <button onClick={() => setRsvp(!rsvp)} style={{ padding: '8px 20px', border: rsvp ? '1px solid #10b981' : 'none', borderRadius: '6px', backgroundColor: rsvp ? '#fff' : '#6366f1', color: rsvp ? '#10b981' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>{rsvp ? 'Going!' : 'RSVP'}</button>
        </div>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'event-card', App: EventCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'job-listing',
    description: 'Job listing card with role, company, tags, and apply button',
    tags: ['card', 'job', 'listing'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function JobListingCard() {
  const tags = ['Remote', 'Full-time', 'Senior'];

  return (
    <div style={{ width: '360px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px' }}>TC</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>Frontend Engineer</div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>TechCorp Inc.</div>
        </div>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>Join our platform team to build next-gen micro-frontend infrastructure.</p>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tags.map((t) => (
          <span key={t} style={{ padding: '4px 10px', backgroundColor: '#ede9fe', color: '#6366f1', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '14px' }}>
        <span style={{ fontWeight: 600, color: '#111827' }}>$120k - $160k</span>
        <button style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Apply</button>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'job-listing-card', App: JobListingCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'recipe',
    description: 'Recipe card with cook time, servings, and ingredients list',
    tags: ['card', 'recipe', 'food'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function RecipeCard() {
  const [saved, setSaved] = useState(false);
  const ingredients = ['Chicken breast', 'Olive oil', 'Garlic', 'Lemon', 'Fresh herbs'];

  return (
    <div style={{ width: '300px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ height: '160px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ color: '#92400e', fontSize: '14px' }}>Recipe Photo</span>
        <button onClick={() => setSaved(!saved)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>{saved ? '\\u2665' : '\\u2661'}</button>
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700 }}>Herb-Crusted Chicken</h3>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '13px', color: '#6b7280' }}>
          <span>\\u231A 30 min</span>
          <span>\\u2615 4 servings</span>
        </div>
        <ul style={{ margin: '0', padding: '0 0 0 16px', fontSize: '13px', color: '#374151' }}>
          {ingredients.map((i) => <li key={i} style={{ marginBottom: '2px' }}>{i}</li>)}
        </ul>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'recipe-card', App: RecipeCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'news',
    description: 'News card with headline, source, and timestamp',
    tags: ['card', 'news', 'article'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function NewsCard() {
  const articles = [
    { title: 'Micro-Frontends Adoption Surges in Enterprise', source: 'TechDaily', time: '2h ago' },
    { title: 'New Framework Comparison: 2025 Edition', source: 'DevWeekly', time: '4h ago' },
    { title: 'WebAssembly Meets Component Architecture', source: 'Frontend Times', time: '6h ago' },
  ];

  return (
    <div style={{ width: '360px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: '16px' }}>Latest News</div>
      {articles.map((a, i) => (
        <a key={i} href="#" style={{ display: 'block', padding: '14px 20px', textDecoration: 'none', borderBottom: i < articles.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', marginBottom: '4px', lineHeight: 1.3 }}>{a.title}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{a.source} &middot; {a.time}</div>
        </a>
      ))}
    </div>
  );
}

const app = createReactMicroApp({ name: 'news-card', App: NewsCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'announcement',
    description: 'Announcement card with icon, message, and action link',
    tags: ['card', 'announcement', 'info'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function AnnouncementCard() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div style={{ maxWidth: '500px', padding: '20px 24px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', flexShrink: 0 }}>!</div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#1e40af' }}>Scheduled Maintenance</h4>
        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>Our platform will undergo maintenance on Saturday, March 20 from 2:00 AM to 6:00 AM UTC. Expect brief downtime during this period.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="#details" style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}>View Details</a>
          <button onClick={() => setDismissed(true)} style={{ fontSize: '13px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'announcement-card', App: AnnouncementCard });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
