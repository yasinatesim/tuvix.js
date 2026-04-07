import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'product',
    description: 'Product card with image, title, price, and add-to-cart button',
    tags: ['card', 'product', 'e-commerce'],
    code: `<script>
  let added = false;
  let product = { name: 'Wireless Headphones', price: 79.99, image: '', rating: 4.5 };

  function addToCart() {
    added = true;
    setTimeout(() => { added = false; }, 1500);
  }
</script>

<div class="card">
  <div class="image-placeholder">{product.name[0]}</div>
  <div class="body">
    <h3 class="name">{product.name}</h3>
    <div class="rating">{'\u2605'.repeat(Math.round(product.rating))} {product.rating}</div>
    <div class="price">\${product.price}</div>
    <button on:click={addToCart} class="cart-btn">
      {added ? 'Added!' : 'Add to Cart'}
    </button>
  </div>
</div>

<style>
  .card { width: 280px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .image-placeholder { height: 180px; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #9ca3af; }
  .body { padding: 16px; }
  .name { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
  .rating { font-size: 13px; color: #f59e0b; margin-bottom: 8px; }
  .price { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 12px; }
  .cart-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'profile',
    description: 'Profile card with avatar, name, role, and social links',
    tags: ['card', 'profile', 'user'],
    code: `<script>
  let user = { name: 'Sarah Connor', role: 'Lead Engineer', initials: 'SC', bio: 'Building the future, one commit at a time.' };
</script>

<div class="card">
  <div class="avatar">{user.initials}</div>
  <h3 class="name">{user.name}</h3>
  <p class="role">{user.role}</p>
  <p class="bio">{user.bio}</p>
  <div class="social">
    <a href="#twitter">Twitter</a>
    <a href="#github">GitHub</a>
    <a href="#linkedin">LinkedIn</a>
  </div>
</div>

<style>
  .card { width: 280px; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 12px; text-align: center; }
  .avatar { width: 64px; height: 64px; border-radius: 50%; background-color: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; margin: 0 auto 16px; }
  .name { margin: 0 0 4px; font-size: 18px; font-weight: 700; }
  .role { margin: 0 0 12px; font-size: 14px; color: #6b7280; }
  .bio { margin: 0 0 16px; font-size: 14px; color: #374151; }
  .social { display: flex; justify-content: center; gap: 16px; }
  .social a { text-decoration: none; color: #6366f1; font-size: 14px; font-weight: 500; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'stats',
    description: 'Stats card showing a metric with trend indicator',
    tags: ['card', 'stats', 'dashboard'],
    code: `<script>
  let stat = { label: 'Revenue', value: '$48,200', change: '+12.5%', positive: true };
</script>

<div class="card">
  <div class="label">{stat.label}</div>
  <div class="value">{stat.value}</div>
  <div class="change" class:positive={stat.positive} class:negative={!stat.positive}>
    {stat.change} vs last month
  </div>
</div>

<style>
  .card { width: 240px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .label { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
  .value { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 8px; }
  .change { font-size: 13px; font-weight: 500; }
  .change.positive { color: #16a34a; }
  .change.negative { color: #dc2626; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'pricing',
    description: 'Pricing card with plan name, features list, and CTA button',
    tags: ['card', 'pricing', 'plan'],
    code: `<script>
  let plan = { name: 'Pro', price: 29, period: '/mo', features: ['Unlimited projects', '50 GB storage', 'Priority support', 'API access', 'Custom domain'], highlighted: true };
</script>

<div class="card" class:highlighted={plan.highlighted}>
  {#if plan.highlighted}
    <div class="badge">Popular</div>
  {/if}
  <h3 class="plan-name">{plan.name}</h3>
  <div class="price"><span class="amount">\${plan.price}</span>{plan.period}</div>
  <ul class="features">
    {#each plan.features as feature}
      <li>\u2713 {feature}</li>
    {/each}
  </ul>
  <button class="cta-btn">Get Started</button>
</div>

<style>
  .card { width: 280px; padding: 32px 24px; border: 2px solid #e5e7eb; border-radius: 12px; text-align: center; position: relative; }
  .card.highlighted { border-color: #6366f1; }
  .badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background-color: #6366f1; color: #fff; padding: 4px 16px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .plan-name { margin: 0 0 8px; font-size: 20px; }
  .price { margin-bottom: 24px; font-size: 14px; color: #6b7280; }
  .amount { font-size: 36px; font-weight: 700; color: #111827; }
  .features { list-style: none; padding: 0; margin: 0 0 24px; text-align: left; }
  .features li { padding: 6px 0; font-size: 14px; color: #374151; }
  .cta-btn { width: 100%; padding: 12px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; font-size: 16px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'media',
    description: 'Media card with image, title, description, and play button',
    tags: ['card', 'media', 'video'],
    code: `<script>
  let playing = false;
  let media = { title: 'Introduction to Svelte', duration: '12:34', views: '24K' };

  function togglePlay() {
    playing = !playing;
  }
</script>

<div class="card">
  <div class="thumbnail" on:click={togglePlay}>
    <span class="play-icon">{playing ? '\u23F8' : '\u25B6'}</span>
    <span class="duration">{media.duration}</span>
  </div>
  <div class="body">
    <h3 class="title">{media.title}</h3>
    <div class="meta">{media.views} views</div>
  </div>
</div>

<style>
  .card { width: 300px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .thumbnail { height: 170px; background-color: #1f2937; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; }
  .play-icon { font-size: 36px; color: #fff; }
  .duration { position: absolute; bottom: 8px; right: 8px; background-color: rgba(0,0,0,0.7); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
  .body { padding: 16px; }
  .title { margin: 0 0 6px; font-size: 16px; font-weight: 600; }
  .meta { font-size: 13px; color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'blog',
    description: 'Blog post card with title, excerpt, author, and date',
    tags: ['card', 'blog', 'article'],
    code: `<script>
  let post = { title: 'Getting Started with Micro-Frontends', excerpt: 'Learn how to build scalable applications using micro-frontend architecture with tuvix.js.', author: 'Alex Kim', date: 'Mar 15, 2026', readTime: '5 min read' };
</script>

<article class="card">
  <div class="image-placeholder">Blog</div>
  <div class="body">
    <div class="meta">{post.date} &middot; {post.readTime}</div>
    <h3 class="title">{post.title}</h3>
    <p class="excerpt">{post.excerpt}</p>
    <div class="author">By {post.author}</div>
  </div>
</article>

<style>
  .card { width: 320px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .image-placeholder { height: 160px; background-color: #ede9fe; display: flex; align-items: center; justify-content: center; color: #6366f1; font-size: 24px; font-weight: 700; }
  .body { padding: 20px; }
  .meta { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
  .title { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #111827; }
  .excerpt { margin: 0 0 12px; font-size: 14px; color: #6b7280; line-height: 1.5; }
  .author { font-size: 13px; color: #6366f1; font-weight: 500; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'testimonial',
    description: 'Testimonial card with quote, author name, and company',
    tags: ['card', 'testimonial', 'review'],
    code: `<script>
  let testimonial = { quote: 'Tuvix.js transformed how we build our front-end. The micro-frontend approach saved us months of development time.', author: 'Maria Lopez', company: 'TechCorp', rating: 5 };
</script>

<div class="card">
  <div class="stars">
    {#each Array(testimonial.rating) as _}
      <span>\u2605</span>
    {/each}
  </div>
  <blockquote class="quote">"{testimonial.quote}"</blockquote>
  <div class="author-row">
    <div class="avatar">{testimonial.author[0]}</div>
    <div>
      <div class="author-name">{testimonial.author}</div>
      <div class="company">{testimonial.company}</div>
    </div>
  </div>
</div>

<style>
  .card { width: 320px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .stars { color: #f59e0b; font-size: 18px; margin-bottom: 12px; }
  .quote { margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6; font-style: italic; }
  .author-row { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background-color: #10b981; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .author-name { font-weight: 600; font-size: 14px; }
  .company { font-size: 13px; color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'feature',
    description: 'Feature card with icon, title, and description',
    tags: ['card', 'feature', 'marketing'],
    code: `<script>
  let feature = { icon: '\u26A1', title: 'Lightning Fast', description: 'Load micro-frontends on demand with sub-second mount times and lazy module resolution.' };
</script>

<div class="card">
  <div class="icon">{feature.icon}</div>
  <h3 class="title">{feature.title}</h3>
  <p class="description">{feature.description}</p>
  <a href="#learn-more" class="link">Learn more \u2192</a>
</div>

<style>
  .card { width: 280px; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .icon { font-size: 32px; margin-bottom: 12px; }
  .title { margin: 0 0 8px; font-size: 18px; font-weight: 700; }
  .description { margin: 0 0 16px; font-size: 14px; color: #6b7280; line-height: 1.5; }
  .link { text-decoration: none; color: #6366f1; font-size: 14px; font-weight: 500; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'notification',
    description: 'Notification card with icon, message, time, and dismiss button',
    tags: ['card', 'notification', 'alert'],
    code: `<script>
  let visible = true;
  let notification = { type: 'info', title: 'Update Available', message: 'A new version is ready to install.', time: '2 min ago' };

  function dismiss() {
    visible = false;
  }
</script>

{#if visible}
  <div class="card">
    <div class="icon">\u{1F514}</div>
    <div class="content">
      <div class="title">{notification.title}</div>
      <div class="message">{notification.message}</div>
      <div class="time">{notification.time}</div>
    </div>
    <button on:click={dismiss} class="dismiss-btn">\u2715</button>
  </div>
{/if}

<style>
  .card { display: flex; align-items: flex-start; gap: 12px; width: 360px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 10px; background-color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .icon { font-size: 24px; }
  .content { flex: 1; }
  .title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
  .message { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
  .time { font-size: 12px; color: #9ca3af; }
  .dismiss-btn { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 14px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'team-member',
    description: 'Team member card with photo, name, role, and contact button',
    tags: ['card', 'team', 'member'],
    code: `<script>
  let member = { name: 'David Park', role: 'Frontend Lead', initials: 'DP', skills: ['Svelte', 'TypeScript', 'Node.js'] };
</script>

<div class="card">
  <div class="avatar">{member.initials}</div>
  <h3 class="name">{member.name}</h3>
  <p class="role">{member.role}</p>
  <div class="skills">
    {#each member.skills as skill}
      <span class="skill-tag">{skill}</span>
    {/each}
  </div>
  <button class="contact-btn">Contact</button>
</div>

<style>
  .card { width: 240px; padding: 28px 20px; border: 1px solid #e5e7eb; border-radius: 12px; text-align: center; }
  .avatar { width: 72px; height: 72px; border-radius: 50%; background-color: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; margin: 0 auto 16px; }
  .name { margin: 0 0 4px; font-size: 16px; font-weight: 700; }
  .role { margin: 0 0 14px; font-size: 13px; color: #6b7280; }
  .skills { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 16px; }
  .skill-tag { padding: 3px 10px; background-color: #f3f4f6; border-radius: 12px; font-size: 12px; color: #374151; }
  .contact-btn { padding: 8px 24px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 500; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'event',
    description: 'Event card with date, title, location, and RSVP button',
    tags: ['card', 'event', 'calendar'],
    code: `<script>
  let rsvped = false;
  let event = { title: 'Svelte Summit 2026', date: 'Apr 20, 2026', time: '10:00 AM', location: 'Online', attendees: 342 };

  function toggleRsvp() {
    rsvped = !rsvped;
  }
</script>

<div class="card">
  <div class="date-badge">
    <div class="month">APR</div>
    <div class="day">20</div>
  </div>
  <div class="body">
    <h3 class="title">{event.title}</h3>
    <div class="detail">{event.time} &middot; {event.location}</div>
    <div class="detail">{event.attendees} attendees</div>
    <button on:click={toggleRsvp} class="rsvp-btn" class:active={rsvped}>
      {rsvped ? 'Going \u2713' : 'RSVP'}
    </button>
  </div>
</div>

<style>
  .card { display: flex; gap: 16px; width: 340px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .date-badge { width: 56px; height: 56px; background-color: #6366f1; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; }
  .month { font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .day { font-size: 22px; font-weight: 700; }
  .body { flex: 1; }
  .title { margin: 0 0 6px; font-size: 16px; font-weight: 700; }
  .detail { font-size: 13px; color: #6b7280; margin-bottom: 2px; }
  .rsvp-btn { margin-top: 10px; padding: 6px 20px; border: 2px solid #6366f1; border-radius: 6px; background: #fff; color: #6366f1; font-weight: 600; cursor: pointer; }
  .rsvp-btn.active { background-color: #6366f1; color: #fff; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'job-listing',
    description: 'Job listing card with title, company, tags, and apply button',
    tags: ['card', 'job', 'listing'],
    code: `<script>
  let job = { title: 'Senior Svelte Developer', company: 'TechCo', location: 'Remote', salary: '$120k - $160k', tags: ['Svelte', 'TypeScript', 'Full-time'] };
</script>

<div class="card">
  <div class="top-row">
    <div class="company-icon">{job.company[0]}</div>
    <div>
      <h3 class="title">{job.title}</h3>
      <div class="company">{job.company} &middot; {job.location}</div>
    </div>
  </div>
  <div class="salary">{job.salary}</div>
  <div class="tags">
    {#each job.tags as tag}
      <span class="tag">{tag}</span>
    {/each}
  </div>
  <button class="apply-btn">Apply Now</button>
</div>

<style>
  .card { width: 340px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .top-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
  .company-icon { width: 44px; height: 44px; border-radius: 10px; background-color: #dbeafe; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; }
  .title { margin: 0; font-size: 16px; font-weight: 700; }
  .company { font-size: 13px; color: #6b7280; margin-top: 2px; }
  .salary { font-size: 15px; font-weight: 600; color: #16a34a; margin-bottom: 12px; }
  .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
  .tag { padding: 4px 10px; background-color: #f3f4f6; border-radius: 12px; font-size: 12px; color: #374151; }
  .apply-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #2563eb; color: #fff; font-weight: 600; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'recipe',
    description: 'Recipe card with image, cook time, servings, and ingredients',
    tags: ['card', 'recipe', 'food'],
    code: `<script>
  let saved = false;
  let recipe = { name: 'Svelte Pasta', time: '30 min', servings: 4, difficulty: 'Easy', ingredients: ['Pasta', 'Tomatoes', 'Basil', 'Garlic', 'Olive Oil'] };

  function toggleSave() {
    saved = !saved;
  }
</script>

<div class="card">
  <div class="image-placeholder">{recipe.name[0]}</div>
  <div class="body">
    <div class="top-row">
      <h3 class="name">{recipe.name}</h3>
      <button on:click={toggleSave} class="save-btn">{saved ? '\u2665' : '\u2661'}</button>
    </div>
    <div class="meta">{recipe.time} &middot; {recipe.servings} servings &middot; {recipe.difficulty}</div>
    <div class="ingredients">
      {#each recipe.ingredients as ing}
        <span class="ing-tag">{ing}</span>
      {/each}
    </div>
  </div>
</div>

<style>
  .card { width: 280px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .image-placeholder { height: 160px; background-color: #fef3c7; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #d97706; }
  .body { padding: 16px; }
  .top-row { display: flex; justify-content: space-between; align-items: center; }
  .name { margin: 0; font-size: 16px; font-weight: 700; }
  .save-btn { background: none; border: none; font-size: 22px; cursor: pointer; color: #ef4444; }
  .meta { font-size: 12px; color: #6b7280; margin: 8px 0 12px; }
  .ingredients { display: flex; flex-wrap: wrap; gap: 4px; }
  .ing-tag { padding: 3px 8px; background-color: #f3f4f6; border-radius: 8px; font-size: 12px; color: #374151; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'news',
    description: 'News card with headline, source, and publish date',
    tags: ['card', 'news', 'article'],
    code: `<script>
  let article = { headline: 'Svelte 5 Brings Runes to Production', source: 'Tech Weekly', date: 'Mar 28, 2026', category: 'Technology', summary: 'The latest release introduces runes, a new reactivity primitive that simplifies state management.' };
</script>

<article class="card">
  <div class="category">{article.category}</div>
  <h3 class="headline">{article.headline}</h3>
  <p class="summary">{article.summary}</p>
  <div class="footer">
    <span class="source">{article.source}</span>
    <span class="date">{article.date}</span>
  </div>
</article>

<style>
  .card { width: 340px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .category { display: inline-block; padding: 3px 10px; background-color: #dbeafe; color: #2563eb; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
  .headline { margin: 0 0 8px; font-size: 18px; font-weight: 700; line-height: 1.3; }
  .summary { margin: 0 0 16px; font-size: 14px; color: #6b7280; line-height: 1.5; }
  .footer { display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; }
  .source { font-weight: 600; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'announcement',
    description: 'Announcement card with banner style and action button',
    tags: ['card', 'announcement', 'banner'],
    code: `<script>
  let dismissed = false;

  function dismiss() {
    dismissed = true;
  }
</script>

{#if !dismissed}
  <div class="card">
    <div class="content">
      <div class="icon">\u{1F389}</div>
      <div>
        <h3 class="title">v2.0 is here!</h3>
        <p class="message">We have launched the new version with improved performance and new features. Check out the changelog.</p>
      </div>
    </div>
    <div class="actions">
      <a href="#changelog" class="action-btn">View Changelog</a>
      <button on:click={dismiss} class="dismiss-btn">Dismiss</button>
    </div>
  </div>
{/if}

<style>
  .card { width: 480px; padding: 24px; border: 2px solid #6366f1; border-radius: 12px; background-color: #ede9fe; }
  .content { display: flex; gap: 16px; margin-bottom: 16px; }
  .icon { font-size: 32px; }
  .title { margin: 0 0 6px; font-size: 18px; font-weight: 700; color: #111827; }
  .message { margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5; }
  .actions { display: flex; gap: 12px; }
  .action-btn { padding: 8px 20px; border-radius: 6px; background-color: #6366f1; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; }
  .dismiss-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
