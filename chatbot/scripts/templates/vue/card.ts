import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'product',
    description: 'Product card with image placeholder, price, and add-to-cart button',
    tags: ['card', 'product', 'e-commerce'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ProductCard = defineComponent({
  setup() {
  const name = ref('Wireless Headphones');
      const price = ref(79.99);
      const originalPrice = ref(99.99);
      const onSale = ref(true);
      const addToCart = () => alert('Added to cart!');
      return { name, price, originalPrice, onSale, addToCart };
  },
  template: \`
    <div class="product-card">
    <div class="card-image">
      <span v-if="onSale" class="sale-badge">Sale</span>
    </div>
    <div class="card-body">
      <h3 class="product-name">{{ name }}</h3>
      <div class="price-row">
        <span v-if="onSale" class="original-price">\${{ originalPrice.toFixed(2) }}</span>
        <span class="current-price">\${{ price.toFixed(2) }}</span>
      </div>
      <button class="add-btn" @click="addToCart">Add to Cart</button>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'product-card',
  App: ProductCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'profile',
    description: 'Profile card with avatar, name, bio, and social stats',
    tags: ['card', 'profile', 'social'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const ProfileCard = defineComponent({
  setup() {
  const name = ref('Alex Rivera');
      const bio = ref('Designer & Developer. Building beautiful interfaces.');
      const initials = computed(() => name.value.split(' ').map(n => n[0]).join(''));
      const following = ref(false);
      const stats = [
        { label: 'Posts', value: '142' },
        { label: 'Followers', value: '2.4K' },
        { label: 'Following', value: '389' },
      ];
      return { name, bio, initials, following, stats };
  },
  template: \`
    <div class="profile-card">
    <div class="card-header"></div>
    <div class="avatar-wrapper">
      <div class="avatar">{{ initials }}</div>
    </div>
    <div class="card-body">
      <h3 class="user-name">{{ name }}</h3>
      <p class="user-bio">{{ bio }}</p>
      <div class="stats-row">
        <div class="stat" v-for="s in stats" :key="s.label">
          <span class="stat-value">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>
      <button class="follow-btn" :class="{ following }" @click="following = !following">
        {{ following ? 'Following' : 'Follow' }}
      </button>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'profile-card',
  App: ProfileCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'stats',
    description: 'Statistics card with metric value, label, trend indicator, and icon',
    tags: ['card', 'stats', 'dashboard'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const StatsCard = defineComponent({
  setup() {
  const label = ref('Revenue');
      const value = ref(48250);
      const trendPercent = ref(12.5);
      const trendUp = ref(true);
      const icon = ref('\\u{1F4B0}');
      const formattedValue = computed(() =>
        '$' + value.value.toLocaleString()
      );
      return { label, formattedValue, trendPercent, trendUp, icon };
  },
  template: \`
    <div class="stats-card">
    <div class="stats-header">
      <span class="stats-label">{{ label }}</span>
      <span class="stats-icon">{{ icon }}</span>
    </div>
    <div class="stats-value">{{ formattedValue }}</div>
    <div class="stats-trend" :class="{ positive: trendUp, negative: !trendUp }">
      <span>{{ trendUp ? '\\u2191' : '\\u2193' }} {{ trendPercent }}%</span>
      <span class="trend-period">vs last month</span>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'stats-card',
  App: StatsCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'pricing',
    description: 'Pricing tier card with feature list, price, and CTA button',
    tags: ['card', 'pricing', 'plan'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const PricingCard = defineComponent({
  setup() {
  const planName = ref('Pro');
      const price = ref(29);
      const featured = ref(true);
      const features = ref([
        'Unlimited projects',
        '50 GB storage',
        'Priority support',
        'Custom integrations',
        'Advanced analytics',
      ]);
      return { planName, price, featured, features };
  },
  template: \`
    <div class="pricing-card" :class="{ featured }">
    <span v-if="featured" class="popular-badge">Most Popular</span>
    <h3 class="plan-name">{{ planName }}</h3>
    <div class="price-section">
      <span class="price">\${{ price }}</span>
      <span class="period">/month</span>
    </div>
    <ul class="features">
      <li v-for="feat in features" :key="feat" class="feature-item">
        <span class="check">&#10003;</span> {{ feat }}
      </li>
    </ul>
    <button class="cta-btn" :class="{ 'cta-featured': featured }">Get Started</button>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'pricing-card',
  App: PricingCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'media',
    description: 'Media card with video/audio placeholder, title, and playback controls',
    tags: ['card', 'media', 'player'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, onUnmounted } from 'vue';

const MediaCard = defineComponent({
  setup() {
  const title = ref('Ambient Dreams');
      const artist = ref('SynthWave');
      const duration = ref('3:45');
      const playing = ref(false);
      const progress = ref(0);
      let interval: ReturnType<typeof setInterval> | null = null;
      const togglePlay = () => {
        playing.value = !playing.value;
        if (playing.value) {
          interval = setInterval(() => {
            progress.value = Math.min(progress.value + 1, 100);
            if (progress.value >= 100) { playing.value = false; if (interval) clearInterval(interval); }
          }, 200);
        } else if (interval) { clearInterval(interval); }
      };
      onUnmounted(() => { if (interval) clearInterval(interval); });
      return { title, artist, duration, playing, progress, togglePlay };
  },
  template: \`
    <div class="media-card">
    <div class="media-preview" @click="togglePlay">
      <div class="play-overlay" v-if="!playing">
        <span class="play-icon">&#9654;</span>
      </div>
      <div v-else class="playing-indicator">Now Playing</div>
    </div>
    <div class="media-info">
      <h3 class="media-title">{{ title }}</h3>
      <p class="media-meta">{{ artist }} &middot; {{ duration }}</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'media-card',
  App: MediaCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'blog',
    description: 'Blog post card with featured image area, title, excerpt, and read more',
    tags: ['card', 'blog', 'article'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BlogCard = defineComponent({
  setup() {
  const title = ref('Understanding Micro-Frontends');
      const excerpt = ref('Learn how to build scalable applications with micro-frontend architecture and module federation.');
      const author = ref('Jane Smith');
      const date = ref('Mar 15, 2024');
      const category = ref('Architecture');
      return { title, excerpt, author, date, category };
  },
  template: \`
    <div class="blog-card">
    <div class="card-image">
      <span class="category-tag">{{ category }}</span>
    </div>
    <div class="card-body">
      <div class="meta">
        <span>{{ author }}</span>
        <span>&middot;</span>
        <span>{{ date }}</span>
      </div>
      <h3 class="card-title">{{ title }}</h3>
      <p class="card-excerpt">{{ excerpt }}</p>
      <a href="#" class="read-more">Read more &rarr;</a>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'blog-card',
  App: BlogCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'testimonial',
    description: 'Testimonial card with quote, author avatar, name, and company',
    tags: ['card', 'testimonial', 'review'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const TestimonialCard = defineComponent({
  setup() {
  const quote = ref('This tool transformed our development workflow. We shipped 3x faster after adopting it.');
      const authorName = ref('Sarah Chen');
      const authorTitle = ref('CTO at TechCorp');
      const rating = ref(5);
      const initials = computed(() => authorName.value.split(' ').map(n => n[0]).join(''));
      return { quote, authorName, authorTitle, rating, initials };
  },
  template: \`
    <div class="testimonial-card">
    <div class="quote-icon">&ldquo;</div>
    <p class="quote-text">{{ quote }}</p>
    <div class="author-row">
      <div class="author-avatar">{{ initials }}</div>
      <div class="author-info">
        <span class="author-name">{{ authorName }}</span>
        <span class="author-title">{{ authorTitle }}</span>
      </div>
    </div>
    <div class="rating">
      <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= rating }">&#9733;</span>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'testimonial-card',
  App: TestimonialCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'feature',
    description: 'Feature highlight card with icon, title, description, and learn-more link',
    tags: ['card', 'feature', 'marketing'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const FeatureCard = defineComponent({
  setup() {
  const icon = ref('\\u26A1');
      const title = ref('Lightning Fast');
      const description = ref('Optimized build pipeline delivers sub-second hot reloads and instant production builds.');
      return { icon, title, description };
  },
  template: \`
    <div class="feature-card">
    <div class="feature-icon-wrapper">
      <span class="feature-icon">{{ icon }}</span>
    </div>
    <h3 class="feature-title">{{ title }}</h3>
    <p class="feature-desc">{{ description }}</p>
    <a href="#" class="learn-more">Learn more &rarr;</a>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'feature-card',
  App: FeatureCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'notification',
    description: 'Notification card with type indicator, message, timestamp, and dismiss',
    tags: ['card', 'notification', 'alert'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const NotificationCard = defineComponent({
  setup() {
  const visible = ref(true);
      const type = ref<'success' | 'warning' | 'error' | 'info'>('success');
      const message = ref('Your changes have been saved successfully.');
      const time = ref('2 minutes ago');
      const typeIcon = computed(() => {
        const icons = { success: '\\u2713', warning: '\\u26A0', error: '\\u2717', info: '\\u2139' };
        return icons[type.value];
      });
      return { visible, type, message, time, typeIcon };
  },
  template: \`
    <div v-if="visible" class="notification-card" :class="type">
    <div class="notif-icon">{{ typeIcon }}</div>
    <div class="notif-content">
      <p class="notif-message">{{ message }}</p>
      <span class="notif-time">{{ time }}</span>
    </div>
    <button class="dismiss-btn" @click="visible = false">&times;</button>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'notification-card',
  App: NotificationCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'team-member',
    description: 'Team member card with role, contact info, and social links',
    tags: ['card', 'team', 'people'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const TeamMemberCard = defineComponent({
  setup() {
  const name = ref('Marcus Lee');
      const role = ref('Lead Engineer');
      const bio = ref('Building scalable systems with a passion for clean architecture.');
      const initials = computed(() => name.value.split(' ').map(n => n[0]).join(''));
      const socials = [
        { platform: 'GitHub', url: '#' },
        { platform: 'Twitter', url: '#' },
        { platform: 'LinkedIn', url: '#' },
      ];
      return { name, role, bio, initials, socials };
  },
  template: \`
    <div class="team-card">
    <div class="member-avatar">{{ initials }}</div>
    <h3 class="member-name">{{ name }}</h3>
    <p class="member-role">{{ role }}</p>
    <p class="member-bio">{{ bio }}</p>
    <div class="social-links">
      <a v-for="link in socials" :key="link.platform" :href="link.url" class="social-link">
        {{ link.platform }}
      </a>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'team-member-card',
  App: TeamMemberCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'event',
    description: 'Event card with date badge, title, location, and RSVP button',
    tags: ['card', 'event', 'calendar'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const EventCard = defineComponent({
  setup() {
  const title = ref('Vue.js Conference 2024');
      const month = ref('MAR');
      const day = ref('28');
      const time = ref('9:00 AM - 5:00 PM');
      const location = ref('San Francisco, CA');
      const description = ref('Join the community for talks on Vue 3, Vite, and the ecosystem.');
      const rsvp = ref(false);
      const attendees = ref(245);
      return { title, month, day, time, location, description, rsvp, attendees };
  },
  template: \`
    <div class="event-card">
    <div class="date-badge">
      <span class="date-month">{{ month }}</span>
      <span class="date-day">{{ day }}</span>
    </div>
    <div class="event-info">
      <h3 class="event-title">{{ title }}</h3>
      <p class="event-detail">{{ time }} &middot; {{ location }}</p>
      <p class="event-desc">{{ description }}</p>
      <div class="event-actions">
        <button class="rsvp-btn" :class="{ attending: rsvp }" @click="rsvp = !rsvp">
          {{ rsvp ? 'Attending' : 'RSVP' }}
        </button>
        <span class="attendee-count">{{ attendees }} going</span>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'event-card',
  App: EventCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'job-listing',
    description: 'Job listing card with company, position, tags, and apply button',
    tags: ['card', 'job', 'listing'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const JobListingCard = defineComponent({
  setup() {
  const title = ref('Senior Frontend Engineer');
      const company = ref('TechStartup');
      const location = ref('Remote');
      const salary = ref('$130K - $170K');
      const tags = ref(['Vue.js', 'TypeScript', 'Full-time']);
      const saved = ref(false);
      return { title, company, location, salary, tags, saved };
  },
  template: \`
    <div class="job-card">
    <div class="job-header">
      <div class="company-logo">{{ company[0] }}</div>
      <div class="job-meta">
        <h3 class="job-title">{{ title }}</h3>
        <span class="company-name">{{ company }}</span>
      </div>
    </div>
    <div class="job-tags">
      <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <div class="job-details">
      <span>{{ location }}</span>
      <span>&middot;</span>
      <span>{{ salary }}</span>
    </div>
    <div class="job-actions">
      <button class="apply-btn">Apply Now</button>
      <button class="save-btn" :class="{ saved }" @click="saved = !saved">
        {{ saved ? 'Saved' : 'Save' }}
      </button>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'job-listing-card',
  App: JobListingCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'recipe',
    description: 'Recipe card with cooking time, servings, ingredients preview, and difficulty',
    tags: ['card', 'recipe', 'food'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const RecipeCard = defineComponent({
  setup() {
  const title = ref('Pasta Carbonara');
      const cookTime = ref(25);
      const servings = ref(4);
      const difficulty = ref<'easy' | 'medium' | 'hard'>('medium');
      const expanded = ref(false);
      const ingredients = ref(['Spaghetti', 'Eggs', 'Pecorino', 'Guanciale', 'Black Pepper']);
      return { title, cookTime, servings, difficulty, expanded, ingredients };
  },
  template: \`
    <div class="recipe-card">
    <div class="recipe-image">
      <span class="difficulty-badge" :class="difficulty">{{ difficulty }}</span>
    </div>
    <div class="recipe-body">
      <h3 class="recipe-title">{{ title }}</h3>
      <div class="recipe-meta">
        <span>{{ cookTime }} min</span>
        <span>&middot;</span>
        <span>{{ servings }} servings</span>
      </div>
      <div class="ingredients-preview">
        <span v-for="ing in ingredients.slice(0, 3)" :key="ing" class="ingredient-tag">{{ ing }}</span>
        <span v-if="ingredients.length > 3" class="more-tag">+{{ ingredients.length - 3 }} more</span>
      </div>
      <button class="view-btn" @click="expanded = !expanded">
        {{ expanded ? 'Hide' : 'View Recipe' }}
      </button>
      <ul v-if="expanded" class="full-ingredients">
        <li v-for="ing in ingredients" :key="ing">{{ ing }}</li>
      </ul>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'recipe-card',
  App: RecipeCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'news',
    description: 'News card with source, headline, timestamp, and share button',
    tags: ['card', 'news', 'headline'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const NewsCard = defineComponent({
  setup() {
  const source = ref('TechDaily');
      const time = ref('3h ago');
      const headline = ref('New Framework Achieves 10x Build Performance');
      const summary = ref('The latest benchmarks show dramatic improvements in build times and bundle sizes compared to previous-generation tools.');
      const shared = ref(false);
      return { source, time, headline, summary, shared };
  },
  template: \`
    <div class="news-card">
    <div class="news-source">
      <span class="source-dot"></span>
      <span class="source-name">{{ source }}</span>
      <span class="news-time">{{ time }}</span>
    </div>
    <h3 class="news-headline">{{ headline }}</h3>
    <p class="news-summary">{{ summary }}</p>
    <div class="news-actions">
      <a href="#" class="read-link">Read full story</a>
      <button class="share-btn" @click="shared = true">
        {{ shared ? 'Link copied!' : 'Share' }}
      </button>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'news-card',
  App: NewsCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'announcement',
    description: 'Announcement card with type badge, message, CTA, and dismiss option',
    tags: ['card', 'announcement', 'banner'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const AnnouncementCard = defineComponent({
  setup() {
  const visible = ref(true);
      const type = ref<'update' | 'maintenance' | 'new'>('new');
      const title = ref('Introducing Team Workspaces');
      const body = ref('Collaborate with your team in shared workspaces. Manage permissions, share templates, and track progress together.');
      const ctaText = ref('Learn More');
      return { visible, type, title, body, ctaText };
  },
  template: \`
    <div v-if="visible" class="announcement-card" :class="type">
    <div class="announcement-content">
      <span class="type-badge">{{ type.toUpperCase() }}</span>
      <h3 class="announcement-title">{{ title }}</h3>
      <p class="announcement-body">{{ body }}</p>
      <div class="announcement-actions">
        <button class="cta-btn">{{ ctaText }}</button>
        <button class="dismiss-btn" @click="visible = false">Dismiss</button>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'announcement-card',
  App: AnnouncementCard,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
