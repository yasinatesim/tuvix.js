import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'product',
    description: 'Product card with image placeholder, title, price and add-to-cart button',
    tags: ['card', 'product', 'e-commerce'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 280px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .image { height: 180px; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); }
    .body { padding: 16px; }
    .title { font-size: 16px; font-weight: 700; margin: 0 0 8px; }
    .price { font-size: 18px; font-weight: 700; color: #6366f1; margin: 0 0 16px; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  \`]
})
export class ProductCardComponent {
  added = false;
}

@NgModule({
  declarations: [ProductCardComponent],
  imports: [BrowserModule],
  bootstrap: [ProductCardComponent],
})
export class ProductCardModule {}

export default createAngularMicroApp({
  name: 'product-card',
  module: ProductCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'profile',
    description: 'Profile card with avatar, name, role and social links',
    tags: ['card', 'profile', 'user'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 260px; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; text-align: center; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: 700; margin: 0 auto 16px; }
    .name { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
    .role { font-size: 14px; color: #6b7280; margin: 0 0 16px; }
    .links { display: flex; justify-content: center; gap: 16px; margin-bottom: 20px; }
    .links a { font-size: 13px; color: #6366f1; text-decoration: none; }
    .btn { padding: 8px 32px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  \`]
})
export class ProfileCardComponent {}

@NgModule({
  declarations: [ProfileCardComponent],
  imports: [BrowserModule],
  bootstrap: [ProfileCardComponent],
})
export class ProfileCardModule {}

export default createAngularMicroApp({
  name: 'profile-card',
  module: ProfileCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'stats',
    description: 'Stats card displaying a metric with trend indicator',
    tags: ['card', 'stats', 'dashboard'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 260px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .label { font-size: 13px; color: #6b7280; font-weight: 500; }
    .trend { font-size: 13px; font-weight: 600; }
    .trend.up { color: #10b981; }
    .value { font-size: 32px; font-weight: 700; margin-bottom: 4px; }
    .sub { font-size: 12px; color: #9ca3af; }
  \`]
})
export class StatsCardComponent {}

@NgModule({
  declarations: [StatsCardComponent],
  imports: [BrowserModule],
  bootstrap: [StatsCardComponent],
})
export class StatsCardModule {}

export default createAngularMicroApp({
  name: 'stats-card',
  module: StatsCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'pricing',
    description: 'Pricing card with plan name, features list and CTA button',
    tags: ['card', 'pricing', 'plan'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 280px; padding: 32px; border: 2px solid #6366f1; border-radius: 12px; text-align: center; }
    .plan { font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .price { font-size: 48px; font-weight: 700; margin-bottom: 24px; }
    .period { font-size: 16px; font-weight: 400; color: #6b7280; }
    .features { list-style: none; padding: 0; margin: 0 0 24px; text-align: left; }
    .features li { padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
    .btn { width: 100%; padding: 12px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
  \`]
})
export class PricingCardComponent {
  features = ['Unlimited projects', '50GB storage', 'Priority support', 'Custom domain', 'Analytics'];
}

@NgModule({
  declarations: [PricingCardComponent],
  imports: [BrowserModule],
  bootstrap: [PricingCardComponent],
})
export class PricingCardModule {}

export default createAngularMicroApp({
  name: 'pricing-card',
  module: PricingCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'media',
    description: 'Media card with image, title, description and action buttons',
    tags: ['card', 'media', 'content'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 300px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .media { height: 200px; background: linear-gradient(135deg, #fde68a, #f97316); }
    .body { padding: 16px; }
    .title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    .desc { font-size: 14px; color: #6b7280; margin: 0 0 16px; line-height: 1.5; }
    .actions { display: flex; gap: 8px; }
    .btn-primary { padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-outline { padding: 8px 20px; background: transparent; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
  \`]
})
export class MediaCardComponent {}

@NgModule({
  declarations: [MediaCardComponent],
  imports: [BrowserModule],
  bootstrap: [MediaCardComponent],
})
export class MediaCardModule {}

export default createAngularMicroApp({
  name: 'media-card',
  module: MediaCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'blog',
    description: 'Blog post card with author info, date and read-more link',
    tags: ['card', 'blog', 'article'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 320px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .tag { display: inline-block; padding: 4px 10px; background: #ede9fe; color: #6366f1; font-size: 12px; font-weight: 600; border-radius: 4px; margin-bottom: 12px; }
    .title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    .excerpt { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 16px; }
    .footer { display: flex; justify-content: space-between; align-items: center; }
    .author { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; }
    .author-name { font-size: 13px; font-weight: 600; }
    .date { font-size: 11px; color: #9ca3af; }
    .read-more { font-size: 13px; color: #6366f1; text-decoration: none; font-weight: 600; }
  \`]
})
export class BlogCardComponent {}

@NgModule({
  declarations: [BlogCardComponent],
  imports: [BrowserModule],
  bootstrap: [BlogCardComponent],
})
export class BlogCardModule {}

export default createAngularMicroApp({
  name: 'blog-card',
  module: BlogCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'testimonial',
    description: 'Testimonial card with quote, author name and rating stars',
    tags: ['card', 'testimonial', 'review'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 300px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .stars { margin-bottom: 12px; }
    .star { font-size: 18px; color: #d1d5db; }
    .star.filled { color: #f59e0b; }
    .quote { font-size: 15px; color: #374151; line-height: 1.6; font-style: italic; margin: 0 0 20px; }
    .author { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 700; }
    .name { font-size: 14px; font-weight: 600; }
    .role { font-size: 12px; color: #6b7280; }
  \`]
})
export class TestimonialCardComponent {
  rating = 5;
}

@NgModule({
  declarations: [TestimonialCardComponent],
  imports: [BrowserModule],
  bootstrap: [TestimonialCardComponent],
})
export class TestimonialCardModule {}

export default createAngularMicroApp({
  name: 'testimonial-card',
  module: TestimonialCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'feature',
    description: 'Feature card with icon, title and description for landing pages',
    tags: ['card', 'feature', 'landing'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-feature-card',
  template: \`
    <div class="card">
      <div class="icon-box">\\u26A1</div>
      <h3 class="title">Lightning Fast</h3>
      <p class="desc">Built for performance with lazy loading and tree-shaking out of the box.</p>
    </div>
  \`,
  styles: [\`
    .card { width: 260px; padding: 28px; border: 1px solid #e5e7eb; border-radius: 12px; text-align: center; }
    .icon-box { width: 48px; height: 48px; border-radius: 12px; background: #ede9fe; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px; }
    .title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    .desc { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0; }
  \`]
})
export class FeatureCardComponent {}

@NgModule({
  declarations: [FeatureCardComponent],
  imports: [BrowserModule],
  bootstrap: [FeatureCardComponent],
})
export class FeatureCardModule {}

export default createAngularMicroApp({
  name: 'feature-card',
  module: FeatureCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'notification',
    description: 'Notification card with type indicator and dismiss button',
    tags: ['card', 'notification', 'alert'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { display: flex; gap: 12px; width: 360px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; align-items: flex-start; }
    .icon { font-size: 24px; flex-shrink: 0; }
    .content { flex: 1; }
    .title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .message { font-size: 13px; color: #6b7280; line-height: 1.4; }
    .time { font-size: 11px; color: #9ca3af; margin-top: 8px; }
    .dismiss { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 14px; flex-shrink: 0; }
  \`]
})
export class NotificationCardComponent {
  visible = true;
}

@NgModule({
  declarations: [NotificationCardComponent],
  imports: [BrowserModule],
  bootstrap: [NotificationCardComponent],
})
export class NotificationCardModule {}

export default createAngularMicroApp({
  name: 'notification-card',
  module: NotificationCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'team-member',
    description: 'Team member card with photo placeholder, name and department',
    tags: ['card', 'team', 'member'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 240px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; text-align: center; }
    .photo { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #a78bfa, #6366f1); margin: 0 auto 16px; }
    .name { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .dept { font-size: 13px; color: #6366f1; font-weight: 600; margin: 0 0 12px; }
    .bio { font-size: 13px; color: #6b7280; line-height: 1.5; margin: 0 0 16px; }
    .links { display: flex; justify-content: center; gap: 16px; }
    .links a { font-size: 13px; color: #6366f1; text-decoration: none; }
  \`]
})
export class TeamCardComponent {}

@NgModule({
  declarations: [TeamCardComponent],
  imports: [BrowserModule],
  bootstrap: [TeamCardComponent],
})
export class TeamCardModule {}

export default createAngularMicroApp({
  name: 'team-member-card',
  module: TeamCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'event',
    description: 'Event card with date badge, title, location and RSVP button',
    tags: ['card', 'event', 'calendar'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { display: flex; gap: 16px; width: 340px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .date-badge { width: 56px; height: 64px; border-radius: 8px; background: #6366f1; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
    .month { font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .day { font-size: 24px; font-weight: 700; }
    .title { font-size: 16px; font-weight: 700; margin: 0 0 8px; }
    .location, .time { font-size: 13px; color: #6b7280; margin: 0 0 4px; }
    .btn { margin-top: 8px; padding: 6px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
  \`]
})
export class EventCardComponent {}

@NgModule({
  declarations: [EventCardComponent],
  imports: [BrowserModule],
  bootstrap: [EventCardComponent],
})
export class EventCardModule {}

export default createAngularMicroApp({
  name: 'event-card',
  module: EventCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'job-listing',
    description: 'Job listing card with position, company, tags and apply button',
    tags: ['card', 'job', 'listing'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 340px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .header { display: flex; gap: 12px; margin-bottom: 12px; }
    .company-logo { width: 44px; height: 44px; border-radius: 10px; background: #10b981; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .title { font-size: 16px; font-weight: 700; margin: 0 0 2px; }
    .company { font-size: 13px; color: #6b7280; margin: 0; }
    .tags { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
    .tag { padding: 4px 10px; background: #f3f4f6; border-radius: 4px; font-size: 12px; color: #374151; }
    .footer { display: flex; justify-content: space-between; align-items: center; }
    .salary { font-size: 14px; font-weight: 700; color: #6366f1; }
    .btn { padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
  \`]
})
export class JobCardComponent {
  tags = ['Angular', 'TypeScript', 'Remote', 'Full-time'];
}

@NgModule({
  declarations: [JobCardComponent],
  imports: [BrowserModule],
  bootstrap: [JobCardComponent],
})
export class JobCardModule {}

export default createAngularMicroApp({
  name: 'job-listing-card',
  module: JobCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'recipe',
    description: 'Recipe card with prep time, servings and ingredient preview',
    tags: ['card', 'recipe', 'food'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 280px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .image { height: 160px; background: linear-gradient(135deg, #fde68a, #f97316); }
    .body { padding: 16px; }
    .title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    .meta { display: flex; gap: 12px; font-size: 12px; color: #6b7280; margin-bottom: 8px; }
    .ingredients { font-size: 13px; color: #6b7280; line-height: 1.4; margin: 0 0 12px; }
    .btn { width: 100%; padding: 8px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  \`]
})
export class RecipeCardComponent {}

@NgModule({
  declarations: [RecipeCardComponent],
  imports: [BrowserModule],
  bootstrap: [RecipeCardComponent],
})
export class RecipeCardModule {}

export default createAngularMicroApp({
  name: 'recipe-card',
  module: RecipeCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'news',
    description: 'News card with category label, headline and source attribution',
    tags: ['card', 'news', 'article'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { width: 320px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .category { display: inline-block; padding: 4px 10px; background: #dbeafe; color: #2563eb; font-size: 12px; font-weight: 600; border-radius: 4px; margin-bottom: 12px; }
    .headline { font-size: 18px; font-weight: 700; line-height: 1.3; margin: 0 0 8px; }
    .summary { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 16px; }
    .footer { display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; }
    .source { font-weight: 600; }
  \`]
})
export class NewsCardComponent {}

@NgModule({
  declarations: [NewsCardComponent],
  imports: [BrowserModule],
  bootstrap: [NewsCardComponent],
})
export class NewsCardModule {}

export default createAngularMicroApp({
  name: 'news-card',
  module: NewsCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'announcement',
    description: 'Announcement card with icon, message and action link',
    tags: ['card', 'announcement', 'banner'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .card { display: flex; gap: 16px; padding: 20px; background: linear-gradient(135deg, #ede9fe, #e0e7ff); border-radius: 12px; align-items: flex-start; }
    .icon { font-size: 32px; flex-shrink: 0; }
    .content { flex: 1; }
    .title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .message { font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 8px; }
    .link { font-size: 14px; color: #6366f1; text-decoration: none; font-weight: 600; }
    .dismiss { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 16px; flex-shrink: 0; }
  \`]
})
export class AnnouncementCardComponent {
  visible = true;
}

@NgModule({
  declarations: [AnnouncementCardComponent],
  imports: [BrowserModule],
  bootstrap: [AnnouncementCardComponent],
})
export class AnnouncementCardModule {}

export default createAngularMicroApp({
  name: 'announcement-card',
  module: AnnouncementCardModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;
