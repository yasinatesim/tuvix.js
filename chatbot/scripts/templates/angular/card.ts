import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'product',
    description: 'Product card with image placeholder, title, price and add-to-cart button',
    tags: ['card', 'product', 'e-commerce'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-product-card',
  template: \`

    <div class="card">
      <div class="image"></div>
      <div class="body">
        <h3 class="title">Wireless Headphones</h3>
        <p class="price">\$79.99</p>
        <button class="btn" (click)="added=true">{{ added ? 'Added!' : 'Add to Cart' }}</button>
      </div>
    </div>
  
  \`,
})
export class ProductCardComponent {
added = false;
}

const app = defineMicroApp({
  name: 'product-card',
  async mount({ container }) {
    const el = document.createElement('app-product-card');
    container.appendChild(el);
    await bootstrapApplication(ProductCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'profile',
    description: 'Profile card with avatar, name, role and social links',
    tags: ['card', 'profile', 'user'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-profile-card',
  template: \`

    <div class="card">
      <div class="avatar">JD</div>
      <h3 class="name">Jane Doe</h3>
      <p class="role">Senior Developer</p>
      <div class="links">
        <a href="#twitter">Twitter</a>
        <a href="#github">GitHub</a>
        <a href="#linkedin">LinkedIn</a>
      </div>
      <button class="btn">Follow</button>
    </div>
  
  \`,
})
export class ProfileCardComponent {
}

const app = defineMicroApp({
  name: 'profile-card',
  async mount({ container }) {
    const el = document.createElement('app-profile-card');
    container.appendChild(el);
    await bootstrapApplication(ProfileCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'stats',
    description: 'Stats card displaying a metric with trend indicator',
    tags: ['card', 'stats', 'dashboard'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-stats-card',
  template: \`

    <div class="card">
      <div class="header">
        <span class="label">Total Revenue</span>
        <span class="trend up">+12.5%</span>
      </div>
      <div class="value">\$48,290</div>
      <div class="sub">vs \$42,930 last month</div>
    </div>
  
  \`,
})
export class StatsCardComponent {
}

const app = defineMicroApp({
  name: 'stats-card',
  async mount({ container }) {
    const el = document.createElement('app-stats-card');
    container.appendChild(el);
    await bootstrapApplication(StatsCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'pricing',
    description: 'Pricing card with plan name, features list and CTA button',
    tags: ['card', 'pricing', 'plan'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-pricing-card',
  template: \`

    <div class="card">
      <div class="plan">Pro</div>
      <div class="price">\$29<span class="period">/mo</span></div>
      <ul class="features">
        <li *ngFor="let f of features">\\u2713 {{ f }}</li>
      </ul>
      <button class="btn">Get Started</button>
    </div>
  
  \`,
})
export class PricingCardComponent {
features = ['Unlimited projects', '50GB storage', 'Priority support', 'Custom domain', 'Analytics'];
}

const app = defineMicroApp({
  name: 'pricing-card',
  async mount({ container }) {
    const el = document.createElement('app-pricing-card');
    container.appendChild(el);
    await bootstrapApplication(PricingCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'media',
    description: 'Media card with image, title, description and action buttons',
    tags: ['card', 'media', 'content'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-media-card',
  template: \`

    <div class="card">
      <div class="media"></div>
      <div class="body">
        <h3 class="title">Mountain Sunrise</h3>
        <p class="desc">A breathtaking view captured at dawn in the alpine region.</p>
        <div class="actions">
          <button class="btn-primary">View</button>
          <button class="btn-outline">Share</button>
        </div>
      </div>
    </div>
  
  \`,
})
export class MediaCardComponent {
}

const app = defineMicroApp({
  name: 'media-card',
  async mount({ container }) {
    const el = document.createElement('app-media-card');
    container.appendChild(el);
    await bootstrapApplication(MediaCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'blog',
    description: 'Blog post card with author info, date and read-more link',
    tags: ['card', 'blog', 'article'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-blog-card',
  template: \`

    <div class="card">
      <div class="tag">Tutorial</div>
      <h3 class="title">Getting Started with Micro Frontends</h3>
      <p class="excerpt">Learn how to break your monolithic frontend into manageable micro apps.</p>
      <div class="footer">
        <div class="author">
          <div class="avatar">AB</div>
          <div>
            <div class="author-name">Alice Brown</div>
            <div class="date">Mar 15, 2024</div>
          </div>
        </div>
        <a href="#read" class="read-more">Read more</a>
      </div>
    </div>
  
  \`,
})
export class BlogCardComponent {
}

const app = defineMicroApp({
  name: 'blog-card',
  async mount({ container }) {
    const el = document.createElement('app-blog-card');
    container.appendChild(el);
    await bootstrapApplication(BlogCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'testimonial',
    description: 'Testimonial card with quote, author name and rating stars',
    tags: ['card', 'testimonial', 'review'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-testimonial-card',
  template: \`

    <div class="card">
      <div class="stars">
        <span *ngFor="let s of [1,2,3,4,5]" class="star" [class.filled]="s <= rating">\\u2605</span>
      </div>
      <p class="quote">"This tool completely transformed our development workflow. Highly recommended!"</p>
      <div class="author">
        <div class="avatar">MK</div>
        <div>
          <div class="name">Michael Kim</div>
          <div class="role">CTO, TechCorp</div>
        </div>
      </div>
    </div>
  
  \`,
})
export class TestimonialCardComponent {
rating = 5;
}

const app = defineMicroApp({
  name: 'testimonial-card',
  async mount({ container }) {
    const el = document.createElement('app-testimonial-card');
    container.appendChild(el);
    await bootstrapApplication(TestimonialCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'feature',
    description: 'Feature card with icon, title and description for landing pages',
    tags: ['card', 'feature', 'landing'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-feature-card',
  template: \`

    <div class="card">
      <div class="icon-box">\\u26A1</div>
      <h3 class="title">Lightning Fast</h3>
      <p class="desc">Built for performance with lazy loading and tree-shaking out of the box.</p>
    </div>
  
  \`,
})
export class FeatureCardComponent {
}

const app = defineMicroApp({
  name: 'feature-card',
  async mount({ container }) {
    const el = document.createElement('app-feature-card');
    container.appendChild(el);
    await bootstrapApplication(FeatureCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'notification',
    description: 'Notification card with type indicator and dismiss button',
    tags: ['card', 'notification', 'alert'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-notification-card',
  template: \`

    <div class="card" *ngIf="visible">
      <div class="icon">\\u{1F514}</div>
      <div class="content">
        <div class="title">New Update Available</div>
        <div class="message">Version 2.1.0 includes performance improvements and bug fixes.</div>
        <div class="time">2 minutes ago</div>
      </div>
      <button class="dismiss" (click)="visible=false">\\u2715</button>
    </div>
  
  \`,
})
export class NotificationCardComponent {
visible = true;
}

const app = defineMicroApp({
  name: 'notification-card',
  async mount({ container }) {
    const el = document.createElement('app-notification-card');
    container.appendChild(el);
    await bootstrapApplication(NotificationCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'team-member',
    description: 'Team member card with photo placeholder, name and department',
    tags: ['card', 'team', 'member'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-team-card',
  template: \`

    <div class="card">
      <div class="photo"></div>
      <h3 class="name">Sarah Chen</h3>
      <p class="dept">Engineering Lead</p>
      <p class="bio">Passionate about building scalable systems and mentoring junior developers.</p>
      <div class="links">
        <a href="#email">Email</a>
        <a href="#linkedin">LinkedIn</a>
      </div>
    </div>
  
  \`,
})
export class TeamCardComponent {
}

const app = defineMicroApp({
  name: 'team-member-card',
  async mount({ container }) {
    const el = document.createElement('app-team-card');
    container.appendChild(el);
    await bootstrapApplication(TeamCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'event',
    description: 'Event card with date badge, title, location and RSVP button',
    tags: ['card', 'event', 'calendar'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-event-card',
  template: \`

    <div class="card">
      <div class="date-badge">
        <div class="month">MAR</div>
        <div class="day">28</div>
      </div>
      <div class="details">
        <h3 class="title">Frontend Meetup 2024</h3>
        <p class="location">\\u{1F4CD} Tech Hub, San Francisco</p>
        <p class="time">\\u{1F552} 6:00 PM - 9:00 PM</p>
        <button class="btn">RSVP</button>
      </div>
    </div>
  
  \`,
})
export class EventCardComponent {
}

const app = defineMicroApp({
  name: 'event-card',
  async mount({ container }) {
    const el = document.createElement('app-event-card');
    container.appendChild(el);
    await bootstrapApplication(EventCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'job-listing',
    description: 'Job listing card with position, company, tags and apply button',
    tags: ['card', 'job', 'listing'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-job-card',
  template: \`

    <div class="card">
      <div class="header">
        <div class="company-logo">TC</div>
        <div>
          <h3 class="title">Senior Frontend Engineer</h3>
          <p class="company">TechCorp Inc. \\u00B7 Remote</p>
        </div>
      </div>
      <div class="tags">
        <span class="tag" *ngFor="let t of tags">{{ t }}</span>
      </div>
      <div class="footer">
        <span class="salary">\$120k - \$160k</span>
        <button class="btn">Apply Now</button>
      </div>
    </div>
  
  \`,
})
export class JobCardComponent {
tags = ['Angular', 'TypeScript', 'Remote', 'Full-time'];
}

const app = defineMicroApp({
  name: 'job-listing-card',
  async mount({ container }) {
    const el = document.createElement('app-job-card');
    container.appendChild(el);
    await bootstrapApplication(JobCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'recipe',
    description: 'Recipe card with prep time, servings and ingredient preview',
    tags: ['card', 'recipe', 'food'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-recipe-card',
  template: \`

    <div class="card">
      <div class="image"></div>
      <div class="body">
        <h3 class="title">Pasta Primavera</h3>
        <div class="meta">
          <span>\\u{1F552} 30 min</span>
          <span>\\u{1F374} 4 servings</span>
          <span>\\u2B50 4.8</span>
        </div>
        <p class="ingredients">Penne, bell pepper, zucchini, cherry tomatoes, garlic, olive oil...</p>
        <button class="btn">View Recipe</button>
      </div>
    </div>
  
  \`,
})
export class RecipeCardComponent {
}

const app = defineMicroApp({
  name: 'recipe-card',
  async mount({ container }) {
    const el = document.createElement('app-recipe-card');
    container.appendChild(el);
    await bootstrapApplication(RecipeCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'news',
    description: 'News card with category label, headline and source attribution',
    tags: ['card', 'news', 'article'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-news-card',
  template: \`

    <div class="card">
      <div class="category">Technology</div>
      <h3 class="headline">AI-Powered Development Tools See Record Adoption in 2024</h3>
      <p class="summary">New survey reveals 78% of developers now use AI assistants in their daily workflow.</p>
      <div class="footer">
        <span class="source">TechDaily</span>
        <span class="date">Mar 22, 2024</span>
      </div>
    </div>
  
  \`,
})
export class NewsCardComponent {
}

const app = defineMicroApp({
  name: 'news-card',
  async mount({ container }) {
    const el = document.createElement('app-news-card');
    container.appendChild(el);
    await bootstrapApplication(NewsCardComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'announcement',
    description: 'Announcement card with icon, message and action link',
    tags: ['card', 'announcement', 'banner'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-announcement-card',
  template: \`

    <div class="card" *ngIf="visible">
      <div class="icon">\\u{1F389}</div>
      <div class="content">
        <h3 class="title">We just launched v3.0!</h3>
        <p class="message">Explore the new features including improved performance, better DX, and more plugins.</p>
        <a href="#changelog" class="link">View Changelog \\u2192</a>
      </div>
      <button class="dismiss" (click)="visible=false">\\u2715</button>
    </div>
  
  \`,
})
export class AnnouncementCardComponent {
visible = true;
}

const app = defineMicroApp({
  name: 'announcement-card',
  async mount({ container }) {
    const el = document.createElement('app-announcement-card');
    container.appendChild(el);
    await bootstrapApplication(AnnouncementCardComponent);
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
