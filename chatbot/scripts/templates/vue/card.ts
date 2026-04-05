import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'product',
    description: 'Product card with image placeholder, price, and add-to-cart button',
    tags: ['card', 'product', 'e-commerce'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ProductCard = defineComponent({
  name: 'ProductCard',
  setup() {
    const name = ref('Wireless Headphones');
    const price = ref(79.99);
    const originalPrice = ref(99.99);
    const onSale = ref(true);
    const addToCart = () => alert('Added to cart!');
    return { name, price, originalPrice, onSale, addToCart };
  },
});

export default createVueMicroApp({ name: 'product-card', App: ProductCard });
</script>

<style scoped>
.product-card {
  width: 280px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
}
.product-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.card-image {
  height: 200px;
  background: #f3f4f6;
  position: relative;
}
.sale-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #ef4444;
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}
.card-body {
  padding: 16px;
}
.product-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
}
.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.original-price {
  text-decoration: line-through;
  color: #9ca3af;
  font-size: 14px;
}
.current-price {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.add-btn {
  width: 100%;
  padding: 10px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.add-btn:hover {
  background: #2563eb;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'profile',
    description: 'Profile card with avatar, name, bio, and social stats',
    tags: ['card', 'profile', 'social'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ProfileCard = defineComponent({
  name: 'ProfileCard',
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
});

export default createVueMicroApp({ name: 'profile-card', App: ProfileCard });
</script>

<style scoped>
.profile-card {
  width: 300px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
}
.card-header {
  height: 80px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}
.avatar-wrapper {
  margin-top: -32px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  border: 3px solid #fff;
}
.card-body {
  padding: 12px 20px 20px;
}
.user-name {
  font-size: 18px;
  font-weight: 700;
  margin: 8px 0 4px;
}
.user-bio {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px;
}
.stats-row {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
}
.stat {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-weight: 700;
  font-size: 16px;
}
.stat-label {
  font-size: 12px;
  color: #9ca3af;
}
.follow-btn {
  padding: 8px 32px;
  border-radius: 20px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.follow-btn.following {
  background: #e5e7eb;
  color: #374151;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'stats',
    description: 'Statistics card with metric value, label, trend indicator, and icon',
    tags: ['card', 'stats', 'dashboard'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const StatsCard = defineComponent({
  name: 'StatsCard',
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
});

export default createVueMicroApp({ name: 'stats-card', App: StatsCard });
</script>

<style scoped>
.stats-card {
  width: 240px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.stats-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}
.stats-icon {
  font-size: 24px;
}
.stats-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}
.stats-trend {
  font-size: 13px;
  font-weight: 600;
}
.stats-trend.positive {
  color: #10b981;
}
.stats-trend.negative {
  color: #ef4444;
}
.trend-period {
  font-weight: 400;
  color: #9ca3af;
  margin-left: 4px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'pricing',
    description: 'Pricing tier card with feature list, price, and CTA button',
    tags: ['card', 'pricing', 'plan'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const PricingCard = defineComponent({
  name: 'PricingCard',
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
});

export default createVueMicroApp({ name: 'pricing-card', App: PricingCard });
</script>

<style scoped>
.pricing-card {
  width: 300px;
  padding: 32px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  position: relative;
}
.pricing-card.featured {
  border: 2px solid #3b82f6;
}
.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: #fff;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}
.plan-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
}
.price-section {
  margin-bottom: 24px;
}
.price {
  font-size: 40px;
  font-weight: 800;
}
.period {
  font-size: 16px;
  color: #6b7280;
}
.features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  text-align: left;
}
.feature-item {
  padding: 8px 0;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}
.check {
  color: #10b981;
  margin-right: 8px;
}
.cta-btn {
  width: 100%;
  padding: 12px;
  border: 2px solid #3b82f6;
  background: transparent;
  color: #3b82f6;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.cta-featured {
  background: #3b82f6;
  color: #fff;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'media',
    description: 'Media card with video/audio placeholder, title, and playback controls',
    tags: ['card', 'media', 'player'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, onUnmounted } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MediaCard = defineComponent({
  name: 'MediaCard',
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
});

export default createVueMicroApp({ name: 'media-card', App: MediaCard });
</script>

<style scoped>
.media-card {
  width: 300px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.media-preview {
  height: 180px;
  background: linear-gradient(135deg, #1e293b, #334155);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.play-overlay {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.play-icon {
  color: #fff;
  font-size: 24px;
  margin-left: 4px;
}
.playing-indicator {
  color: #60a5fa;
  font-weight: 600;
  font-size: 14px;
}
.media-info {
  padding: 16px;
}
.media-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}
.media-meta {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 12px;
}
.progress-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.2s;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'blog',
    description: 'Blog post card with featured image area, title, excerpt, and read more',
    tags: ['card', 'blog', 'article'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BlogCard = defineComponent({
  name: 'BlogCard',
  setup() {
    const title = ref('Understanding Micro-Frontends');
    const excerpt = ref('Learn how to build scalable applications with micro-frontend architecture and module federation.');
    const author = ref('Jane Smith');
    const date = ref('Mar 15, 2024');
    const category = ref('Architecture');
    return { title, excerpt, author, date, category };
  },
});

export default createVueMicroApp({ name: 'blog-card', App: BlogCard });
</script>

<style scoped>
.blog-card {
  width: 340px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.card-image {
  height: 180px;
  background: linear-gradient(135deg, #dbeafe, #ede9fe);
  position: relative;
}
.category-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
}
.card-body {
  padding: 20px;
}
.meta {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}
.card-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.3;
}
.card-excerpt {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px;
}
.read-more {
  text-decoration: none;
  color: #3b82f6;
  font-weight: 600;
  font-size: 14px;
}
.read-more:hover {
  text-decoration: underline;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'testimonial',
    description: 'Testimonial card with quote, author avatar, name, and company',
    tags: ['card', 'testimonial', 'review'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TestimonialCard = defineComponent({
  name: 'TestimonialCard',
  setup() {
    const quote = ref('This tool transformed our development workflow. We shipped 3x faster after adopting it.');
    const authorName = ref('Sarah Chen');
    const authorTitle = ref('CTO at TechCorp');
    const rating = ref(5);
    const initials = computed(() => authorName.value.split(' ').map(n => n[0]).join(''));
    return { quote, authorName, authorTitle, rating, initials };
  },
});

export default createVueMicroApp({ name: 'testimonial-card', App: TestimonialCard });
</script>

<style scoped>
.testimonial-card {
  width: 320px;
  padding: 28px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.quote-icon {
  font-size: 48px;
  line-height: 1;
  color: #3b82f6;
  margin-bottom: 8px;
}
.quote-text {
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 20px;
  font-style: italic;
}
.author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}
.author-info {
  display: flex;
  flex-direction: column;
}
.author-name {
  font-weight: 600;
  font-size: 14px;
}
.author-title {
  font-size: 12px;
  color: #6b7280;
}
.rating {
  display: flex;
  gap: 2px;
}
.star {
  color: #d1d5db;
  font-size: 18px;
}
.star.filled {
  color: #f59e0b;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'feature',
    description: 'Feature highlight card with icon, title, description, and learn-more link',
    tags: ['card', 'feature', 'marketing'],
    code: `<template>
  <div class="feature-card">
    <div class="feature-icon-wrapper">
      <span class="feature-icon">{{ icon }}</span>
    </div>
    <h3 class="feature-title">{{ title }}</h3>
    <p class="feature-desc">{{ description }}</p>
    <a href="#" class="learn-more">Learn more &rarr;</a>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FeatureCard = defineComponent({
  name: 'FeatureCard',
  setup() {
    const icon = ref('\\u26A1');
    const title = ref('Lightning Fast');
    const description = ref('Optimized build pipeline delivers sub-second hot reloads and instant production builds.');
    return { icon, title, description };
  },
});

export default createVueMicroApp({ name: 'feature-card', App: FeatureCard });
</script>

<style scoped>
.feature-card {
  width: 280px;
  padding: 28px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}
.feature-card:hover {
  transform: translateY(-4px);
}
.feature-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.feature-icon {
  font-size: 24px;
}
.feature-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
}
.feature-desc {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px;
}
.learn-more {
  text-decoration: none;
  color: #3b82f6;
  font-weight: 600;
  font-size: 14px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'notification',
    description: 'Notification card with type indicator, message, timestamp, and dismiss',
    tags: ['card', 'notification', 'alert'],
    code: `<template>
  <div v-if="visible" class="notification-card" :class="type">
    <div class="notif-icon">{{ typeIcon }}</div>
    <div class="notif-content">
      <p class="notif-message">{{ message }}</p>
      <span class="notif-time">{{ time }}</span>
    </div>
    <button class="dismiss-btn" @click="visible = false">&times;</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const NotificationCard = defineComponent({
  name: 'NotificationCard',
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
});

export default createVueMicroApp({ name: 'notification-card', App: NotificationCard });
</script>

<style scoped>
.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  max-width: 420px;
  border-left: 4px solid;
}
.notification-card.success {
  background: #f0fdf4;
  border-left-color: #10b981;
}
.notification-card.warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
}
.notification-card.error {
  background: #fef2f2;
  border-left-color: #ef4444;
}
.notification-card.info {
  background: #eff6ff;
  border-left-color: #3b82f6;
}
.notif-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.notif-content {
  flex: 1;
}
.notif-message {
  font-size: 14px;
  color: #374151;
  margin: 0 0 4px;
}
.notif-time {
  font-size: 12px;
  color: #9ca3af;
}
.dismiss-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'team-member',
    description: 'Team member card with role, contact info, and social links',
    tags: ['card', 'team', 'people'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TeamMemberCard = defineComponent({
  name: 'TeamMemberCard',
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
});

export default createVueMicroApp({ name: 'team-member-card', App: TeamMemberCard });
</script>

<style scoped>
.team-card {
  width: 260px;
  padding: 28px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
}
.member-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #10b981;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 14px;
}
.member-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
}
.member-role {
  font-size: 14px;
  color: #6366f1;
  font-weight: 500;
  margin: 0 0 12px;
}
.member-bio {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px;
}
.social-links {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.social-link {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}
.social-link:hover {
  text-decoration: underline;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'event',
    description: 'Event card with date badge, title, location, and RSVP button',
    tags: ['card', 'event', 'calendar'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const EventCard = defineComponent({
  name: 'EventCard',
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
});

export default createVueMicroApp({ name: 'event-card', App: EventCard });
</script>

<style scoped>
.event-card {
  display: flex;
  gap: 20px;
  width: 420px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.date-badge {
  width: 60px;
  height: 68px;
  background: #eff6ff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.date-month {
  font-size: 11px;
  font-weight: 700;
  color: #3b82f6;
  text-transform: uppercase;
}
.date-day {
  font-size: 24px;
  font-weight: 800;
  color: #1e40af;
}
.event-info {
  flex: 1;
}
.event-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
}
.event-detail {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px;
}
.event-desc {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
  margin: 0 0 12px;
}
.event-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rsvp-btn {
  padding: 6px 18px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.rsvp-btn.attending {
  background: #10b981;
}
.attendee-count {
  font-size: 12px;
  color: #9ca3af;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'job-listing',
    description: 'Job listing card with company, position, tags, and apply button',
    tags: ['card', 'job', 'listing'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const JobListingCard = defineComponent({
  name: 'JobListingCard',
  setup() {
    const title = ref('Senior Frontend Engineer');
    const company = ref('TechStartup');
    const location = ref('Remote');
    const salary = ref('$130K - $170K');
    const tags = ref(['Vue.js', 'TypeScript', 'Full-time']);
    const saved = ref(false);
    return { title, company, location, salary, tags, saved };
  },
});

export default createVueMicroApp({ name: 'job-listing-card', App: JobListingCard });
</script>

<style scoped>
.job-card {
  width: 380px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
}
.job-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.company-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #6366f1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
}
.job-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.company-name {
  font-size: 13px;
  color: #6b7280;
}
.job-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.tag {
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}
.job-details {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}
.job-actions {
  display: flex;
  gap: 8px;
}
.apply-btn {
  flex: 1;
  padding: 10px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.save-btn {
  padding: 10px 20px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.save-btn.saved {
  background: #fef3c7;
  color: #d97706;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'recipe',
    description: 'Recipe card with cooking time, servings, ingredients preview, and difficulty',
    tags: ['card', 'recipe', 'food'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const RecipeCard = defineComponent({
  name: 'RecipeCard',
  setup() {
    const title = ref('Pasta Carbonara');
    const cookTime = ref(25);
    const servings = ref(4);
    const difficulty = ref<'easy' | 'medium' | 'hard'>('medium');
    const expanded = ref(false);
    const ingredients = ref(['Spaghetti', 'Eggs', 'Pecorino', 'Guanciale', 'Black Pepper']);
    return { title, cookTime, servings, difficulty, expanded, ingredients };
  },
});

export default createVueMicroApp({ name: 'recipe-card', App: RecipeCard });
</script>

<style scoped>
.recipe-card {
  width: 300px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.recipe-image {
  height: 160px;
  background: linear-gradient(135deg, #fde68a, #fbbf24);
  position: relative;
}
.difficulty-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}
.difficulty-badge.easy { background: #d1fae5; color: #059669; }
.difficulty-badge.medium { background: #fef3c7; color: #d97706; }
.difficulty-badge.hard { background: #fee2e2; color: #dc2626; }
.recipe-body {
  padding: 16px;
}
.recipe-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
}
.recipe-meta {
  display: flex;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}
.ingredients-preview {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.ingredient-tag {
  padding: 3px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
}
.more-tag {
  font-size: 12px;
  color: #9ca3af;
  padding: 3px 0;
}
.view-btn {
  width: 100%;
  padding: 8px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.full-ingredients {
  margin-top: 12px;
  padding-left: 20px;
  font-size: 14px;
  color: #374151;
}
.full-ingredients li {
  padding: 2px 0;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'news',
    description: 'News card with source, headline, timestamp, and share button',
    tags: ['card', 'news', 'headline'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const NewsCard = defineComponent({
  name: 'NewsCard',
  setup() {
    const source = ref('TechDaily');
    const time = ref('3h ago');
    const headline = ref('New Framework Achieves 10x Build Performance');
    const summary = ref('The latest benchmarks show dramatic improvements in build times and bundle sizes compared to previous-generation tools.');
    const shared = ref(false);
    return { source, time, headline, summary, shared };
  },
});

export default createVueMicroApp({ name: 'news-card', App: NewsCard });
</script>

<style scoped>
.news-card {
  width: 380px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #3b82f6;
}
.news-source {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.source-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
}
.source-name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.news-time {
  font-size: 12px;
  color: #9ca3af;
  margin-left: auto;
}
.news-headline {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.3;
}
.news-summary {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px;
}
.news-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.read-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
.share-btn {
  padding: 6px 14px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'announcement',
    description: 'Announcement card with type badge, message, CTA, and dismiss option',
    tags: ['card', 'announcement', 'banner'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AnnouncementCard = defineComponent({
  name: 'AnnouncementCard',
  setup() {
    const visible = ref(true);
    const type = ref<'update' | 'maintenance' | 'new'>('new');
    const title = ref('Introducing Team Workspaces');
    const body = ref('Collaborate with your team in shared workspaces. Manage permissions, share templates, and track progress together.');
    const ctaText = ref('Learn More');
    return { visible, type, title, body, ctaText };
  },
});

export default createVueMicroApp({ name: 'announcement-card', App: AnnouncementCard });
</script>

<style scoped>
.announcement-card {
  max-width: 480px;
  border-radius: 12px;
  overflow: hidden;
}
.announcement-card.new {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
}
.announcement-card.update {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0;
}
.announcement-card.maintenance {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1px solid #fde68a;
}
.announcement-content {
  padding: 24px;
}
.type-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}
.new .type-badge { background: #3b82f6; color: #fff; }
.update .type-badge { background: #10b981; color: #fff; }
.maintenance .type-badge { background: #f59e0b; color: #fff; }
.announcement-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
}
.announcement-body {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  margin: 0 0 16px;
}
.announcement-actions {
  display: flex;
  gap: 12px;
}
.cta-btn {
  padding: 8px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.dismiss-btn {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
