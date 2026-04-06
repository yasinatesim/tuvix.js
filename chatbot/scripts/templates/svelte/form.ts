import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'login',
    description: 'Login form with email and password fields',
    tags: ['form', 'login', 'auth'],
    code: `<script>
  let email = '';
  let password = '';
  let error = '';

  function handleSubmit() {
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }
    error = '';
    alert('Logged in as ' + email);
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  <h2 class="title">Log In</h2>
  {#if error}
    <div class="error">{error}</div>
  {/if}
  <label class="field">
    <span>Email</span>
    <input type="email" bind:value={email} placeholder="you@example.com" />
  </label>
  <label class="field">
    <span>Password</span>
    <input type="password" bind:value={password} placeholder="Enter password" />
  </label>
  <button type="submit" class="submit-btn">Log In</button>
</form>

<style>
  .form { max-width: 400px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .error { padding: 8px 12px; background-color: #fef2f2; color: #dc2626; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .submit-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; font-size: 14px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'signup',
    description: 'Signup form with name, email, password and confirmation',
    tags: ['form', 'signup', 'registration'],
    code: `<script>
  let name = '';
  let email = '';
  let password = '';
  let confirm = '';
  let error = '';

  function handleSubmit() {
    if (!name || !email || !password || !confirm) {
      error = 'All fields are required';
      return;
    }
    if (password !== confirm) {
      error = 'Passwords do not match';
      return;
    }
    error = '';
    alert('Account created for ' + name);
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  <h2 class="title">Create Account</h2>
  {#if error}
    <div class="error">{error}</div>
  {/if}
  <label class="field">
    <span>Full Name</span>
    <input type="text" bind:value={name} placeholder="John Doe" />
  </label>
  <label class="field">
    <span>Email</span>
    <input type="email" bind:value={email} placeholder="john@example.com" />
  </label>
  <label class="field">
    <span>Password</span>
    <input type="password" bind:value={password} placeholder="Min 8 characters" />
  </label>
  <label class="field">
    <span>Confirm Password</span>
    <input type="password" bind:value={confirm} placeholder="Repeat password" />
  </label>
  <button type="submit" class="submit-btn">Sign Up</button>
</form>

<style>
  .form { max-width: 420px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .error { padding: 8px 12px; background-color: #fef2f2; color: #dc2626; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .submit-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; font-size: 14px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'contact',
    description: 'Contact form with name, email, and message textarea',
    tags: ['form', 'contact', 'message'],
    code: `<script>
  let name = '';
  let email = '';
  let message = '';
  let sent = false;

  function handleSubmit() {
    if (!name || !email || !message) return;
    sent = true;
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  {#if sent}
    <div class="success">Message sent! We will get back to you soon.</div>
  {:else}
    <h2 class="title">Contact Us</h2>
    <label class="field">
      <span>Name</span>
      <input type="text" bind:value={name} placeholder="Your name" />
    </label>
    <label class="field">
      <span>Email</span>
      <input type="email" bind:value={email} placeholder="you@example.com" />
    </label>
    <label class="field">
      <span>Message</span>
      <textarea bind:value={message} rows="4" placeholder="How can we help?"></textarea>
    </label>
    <button type="submit" class="submit-btn">Send Message</button>
  {/if}
</form>

<style>
  .form { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .success { padding: 16px; background-color: #f0fdf4; color: #16a34a; border-radius: 8px; text-align: center; font-weight: 500; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input, .field textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; font-family: inherit; }
  .submit-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'search',
    description: 'Search form with input field and filter options',
    tags: ['form', 'search', 'filter'],
    code: `<script>
  let query = '';
  let category = 'all';
  let categories = ['all', 'articles', 'products', 'users'];
  let results = [];

  function handleSearch() {
    if (!query) return;
    results = ['Result 1 for "' + query + '"', 'Result 2 for "' + query + '"', 'Result 3 for "' + query + '"'];
  }
</script>

<form on:submit|preventDefault={handleSearch} class="form">
  <div class="search-row">
    <input type="text" bind:value={query} placeholder="Search..." class="search-input" />
    <select bind:value={category} class="category-select">
      {#each categories as cat}
        <option value={cat}>{cat}</option>
      {/each}
    </select>
    <button type="submit" class="search-btn">Search</button>
  </div>
  {#if results.length > 0}
    <ul class="results">
      {#each results as result}
        <li>{result}</li>
      {/each}
    </ul>
  {/if}
</form>

<style>
  .form { max-width: 600px; margin: 40px auto; }
  .search-row { display: flex; gap: 8px; }
  .search-input { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .category-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .search-btn { padding: 10px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .results { margin-top: 16px; list-style: none; padding: 0; }
  .results li { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'multi-step',
    description: 'Multi-step form wizard with progress indicator',
    tags: ['form', 'multi-step', 'wizard'],
    code: `<script>
  let step = 0;
  let steps = ['Personal', 'Address', 'Confirm'];
  let name = '';
  let email = '';
  let street = '';
  let city = '';

  function next() {
    if (step < steps.length - 1) step += 1;
  }

  function prev() {
    if (step > 0) step -= 1;
  }

  function handleSubmit() {
    alert('Submitted: ' + name + ', ' + email + ', ' + street + ', ' + city);
  }
</script>

<div class="wizard">
  <div class="progress">
    {#each steps as s, i}
      <div class="step-indicator" class:active={i <= step}>{i + 1}. {s}</div>
    {/each}
  </div>
  <form on:submit|preventDefault={handleSubmit} class="form">
    {#if step === 0}
      <label class="field"><span>Name</span><input type="text" bind:value={name} /></label>
      <label class="field"><span>Email</span><input type="email" bind:value={email} /></label>
    {:else if step === 1}
      <label class="field"><span>Street</span><input type="text" bind:value={street} /></label>
      <label class="field"><span>City</span><input type="text" bind:value={city} /></label>
    {:else}
      <div class="summary">
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Address:</strong> {street}, {city}</p>
      </div>
    {/if}
    <div class="actions">
      {#if step > 0}
        <button type="button" on:click={prev} class="back-btn">Back</button>
      {/if}
      {#if step < steps.length - 1}
        <button type="button" on:click={next} class="next-btn">Next</button>
      {:else}
        <button type="submit" class="next-btn">Submit</button>
      {/if}
    </div>
  </form>
</div>

<style>
  .wizard { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .progress { display: flex; gap: 16px; margin-bottom: 24px; }
  .step-indicator { font-size: 13px; color: #9ca3af; font-weight: 500; }
  .step-indicator.active { color: #6366f1; font-weight: 700; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; }
  .summary p { margin: 4px 0; font-size: 14px; color: #374151; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  .back-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .next-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'settings',
    description: 'Settings form with toggles, selects, and save button',
    tags: ['form', 'settings', 'preferences'],
    code: `<script>
  let theme = 'light';
  let notifications = true;
  let language = 'en';
  let saved = false;

  function handleSave() {
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }
</script>

<form on:submit|preventDefault={handleSave} class="form">
  <h2 class="title">Settings</h2>
  <label class="field">
    <span>Theme</span>
    <select bind:value={theme}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  </label>
  <label class="field">
    <span>Language</span>
    <select bind:value={language}>
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
    </select>
  </label>
  <label class="toggle-field">
    <input type="checkbox" bind:checked={notifications} />
    <span>Enable notifications</span>
  </label>
  <button type="submit" class="save-btn">Save</button>
  {#if saved}
    <div class="saved-msg">Settings saved!</div>
  {/if}
</form>

<style>
  .form { max-width: 400px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .toggle-field { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 14px; color: #374151; }
  .save-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .saved-msg { margin-top: 12px; text-align: center; color: #16a34a; font-size: 14px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'password-reset',
    description: 'Password reset form with email input and status feedback',
    tags: ['form', 'password', 'reset'],
    code: `<script>
  let email = '';
  let submitted = false;
  let error = '';

  function handleSubmit() {
    if (!email) {
      error = 'Please enter your email address';
      return;
    }
    error = '';
    submitted = true;
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  {#if submitted}
    <div class="success">
      <h3>Check your email</h3>
      <p>We sent a reset link to {email}</p>
    </div>
  {:else}
    <h2 class="title">Reset Password</h2>
    <p class="subtitle">Enter your email to receive a reset link.</p>
    {#if error}
      <div class="error">{error}</div>
    {/if}
    <label class="field">
      <span>Email</span>
      <input type="email" bind:value={email} placeholder="you@example.com" />
    </label>
    <button type="submit" class="submit-btn">Send Reset Link</button>
  {/if}
</form>

<style>
  .form { max-width: 400px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 8px; font-size: 24px; }
  .subtitle { margin: 0 0 20px; color: #6b7280; font-size: 14px; }
  .error { padding: 8px 12px; background-color: #fef2f2; color: #dc2626; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
  .success { text-align: center; padding: 24px 0; }
  .success h3 { margin: 0 0 8px; }
  .success p { color: #6b7280; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; }
  .submit-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'checkout',
    description: 'Checkout form with card number, expiry, and CVC fields',
    tags: ['form', 'checkout', 'payment'],
    code: `<script>
  let cardNumber = '';
  let expiry = '';
  let cvc = '';
  let cardName = '';

  function handleSubmit() {
    alert('Payment processed for ' + cardName);
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  <h2 class="title">Checkout</h2>
  <label class="field">
    <span>Name on Card</span>
    <input type="text" bind:value={cardName} placeholder="John Doe" />
  </label>
  <label class="field">
    <span>Card Number</span>
    <input type="text" bind:value={cardNumber} placeholder="4242 4242 4242 4242" maxlength="19" />
  </label>
  <div class="row">
    <label class="field half">
      <span>Expiry</span>
      <input type="text" bind:value={expiry} placeholder="MM/YY" maxlength="5" />
    </label>
    <label class="field half">
      <span>CVC</span>
      <input type="text" bind:value={cvc} placeholder="123" maxlength="4" />
    </label>
  </div>
  <button type="submit" class="submit-btn">Pay Now</button>
</form>

<style>
  .form { max-width: 420px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .row { display: flex; gap: 12px; }
  .half { flex: 1; }
  .submit-btn { width: 100%; padding: 12px; border: none; border-radius: 6px; background-color: #16a34a; color: #fff; font-weight: 600; cursor: pointer; font-size: 16px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'profile',
    description: 'Profile edit form with avatar, bio, and personal info',
    tags: ['form', 'profile', 'edit'],
    code: `<script>
  let displayName = 'Jane Doe';
  let bio = 'Software engineer and open source enthusiast.';
  let website = 'https://example.com';
  let saved = false;

  function handleSave() {
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }
</script>

<form on:submit|preventDefault={handleSave} class="form">
  <h2 class="title">Edit Profile</h2>
  <div class="avatar-section">
    <div class="avatar">JD</div>
    <button type="button" class="change-btn">Change Photo</button>
  </div>
  <label class="field">
    <span>Display Name</span>
    <input type="text" bind:value={displayName} />
  </label>
  <label class="field">
    <span>Bio</span>
    <textarea bind:value={bio} rows="3"></textarea>
  </label>
  <label class="field">
    <span>Website</span>
    <input type="url" bind:value={website} />
  </label>
  <button type="submit" class="save-btn">Save Profile</button>
  {#if saved}
    <div class="saved-msg">Profile updated!</div>
  {/if}
</form>

<style>
  .form { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .avatar-section { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
  .avatar { width: 56px; height: 56px; border-radius: 50%; background-color: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; }
  .change-btn { padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input, .field textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; font-family: inherit; }
  .save-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .saved-msg { margin-top: 12px; text-align: center; color: #16a34a; font-size: 14px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'filter',
    description: 'Filter form with checkboxes, range slider, and apply button',
    tags: ['form', 'filter', 'search'],
    code: `<script>
  let priceRange = 50;
  let categories = { electronics: false, clothing: true, books: false, home: false };
  let sortBy = 'relevance';

  function applyFilters() {
    alert('Filters applied: price<=' + priceRange + ', sort=' + sortBy);
  }

  function resetFilters() {
    priceRange = 50;
    sortBy = 'relevance';
    categories = { electronics: false, clothing: false, books: false, home: false };
  }
</script>

<form on:submit|preventDefault={applyFilters} class="form">
  <h3 class="title">Filters</h3>
  <div class="section">
    <label class="label">Max Price: {priceRange}</label>
    <input type="range" min="0" max="200" bind:value={priceRange} />
  </div>
  <div class="section">
    <div class="label">Categories</div>
    <label class="checkbox"><input type="checkbox" bind:checked={categories.electronics} /> Electronics</label>
    <label class="checkbox"><input type="checkbox" bind:checked={categories.clothing} /> Clothing</label>
    <label class="checkbox"><input type="checkbox" bind:checked={categories.books} /> Books</label>
    <label class="checkbox"><input type="checkbox" bind:checked={categories.home} /> Home</label>
  </div>
  <div class="section">
    <label class="label">Sort By</label>
    <select bind:value={sortBy}>
      <option value="relevance">Relevance</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  </div>
  <div class="actions">
    <button type="button" on:click={resetFilters} class="reset-btn">Reset</button>
    <button type="submit" class="apply-btn">Apply</button>
  </div>
</form>

<style>
  .form { width: 260px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 16px; font-size: 18px; }
  .section { margin-bottom: 16px; }
  .label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; display: block; }
  input[type="range"] { width: 100%; }
  .checkbox { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #374151; margin-bottom: 4px; }
  select { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .actions { display: flex; gap: 8px; }
  .reset-btn { flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .apply-btn { flex: 1; padding: 8px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'newsletter',
    description: 'Newsletter subscription form with email input',
    tags: ['form', 'newsletter', 'subscription'],
    code: `<script>
  let email = '';
  let subscribed = false;

  function handleSubscribe() {
    if (!email) return;
    subscribed = true;
  }
</script>

<div class="newsletter">
  {#if subscribed}
    <div class="success">
      <h3>You are subscribed!</h3>
      <p>We will send updates to {email}</p>
    </div>
  {:else}
    <h3 class="title">Stay Updated</h3>
    <p class="subtitle">Get the latest news delivered to your inbox.</p>
    <form on:submit|preventDefault={handleSubscribe} class="form-row">
      <input type="email" bind:value={email} placeholder="you@example.com" class="email-input" />
      <button type="submit" class="subscribe-btn">Subscribe</button>
    </form>
  {/if}
</div>

<style>
  .newsletter { max-width: 480px; margin: 40px auto; padding: 32px; background-color: #f9fafb; border-radius: 12px; text-align: center; }
  .title { margin: 0 0 8px; font-size: 20px; }
  .subtitle { margin: 0 0 20px; color: #6b7280; font-size: 14px; }
  .form-row { display: flex; gap: 8px; }
  .email-input { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .subscribe-btn { padding: 10px 24px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .success h3 { margin: 0 0 8px; color: #16a34a; }
  .success p { color: #6b7280; margin: 0; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'survey',
    description: 'Survey form with radio buttons and rating scale',
    tags: ['form', 'survey', 'feedback'],
    code: `<script>
  let rating = 0;
  let recommend = '';
  let feedback = '';
  let submitted = false;

  function handleSubmit() {
    submitted = true;
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  {#if submitted}
    <div class="success">Thank you for your feedback!</div>
  {:else}
    <h2 class="title">Quick Survey</h2>
    <div class="section">
      <div class="label">How would you rate your experience?</div>
      <div class="rating-row">
        {#each [1, 2, 3, 4, 5] as star}
          <button type="button" class="star-btn" class:active={rating >= star} on:click={() => rating = star}>
            {rating >= star ? '\u2605' : '\u2606'}
          </button>
        {/each}
      </div>
    </div>
    <div class="section">
      <div class="label">Would you recommend us?</div>
      <label class="radio"><input type="radio" bind:group={recommend} value="yes" /> Yes</label>
      <label class="radio"><input type="radio" bind:group={recommend} value="no" /> No</label>
      <label class="radio"><input type="radio" bind:group={recommend} value="maybe" /> Maybe</label>
    </div>
    <label class="section">
      <div class="label">Additional feedback</div>
      <textarea bind:value={feedback} rows="3" placeholder="Tell us more..."></textarea>
    </label>
    <button type="submit" class="submit-btn">Submit Survey</button>
  {/if}
</form>

<style>
  .form { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .section { margin-bottom: 20px; }
  .label { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
  .rating-row { display: flex; gap: 4px; }
  .star-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: #d1d5db; }
  .star-btn.active { color: #f59e0b; }
  .radio { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #374151; margin-bottom: 4px; }
  textarea { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-family: inherit; }
  .submit-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .success { text-align: center; padding: 24px 0; color: #16a34a; font-size: 18px; font-weight: 600; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'address',
    description: 'Address form with street, city, state, and zip fields',
    tags: ['form', 'address', 'location'],
    code: `<script>
  let street = '';
  let city = '';
  let state = '';
  let zip = '';
  let country = 'US';

  function handleSubmit() {
    alert('Address saved: ' + street + ', ' + city + ', ' + state + ' ' + zip);
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  <h2 class="title">Shipping Address</h2>
  <label class="field">
    <span>Street Address</span>
    <input type="text" bind:value={street} placeholder="123 Main St" />
  </label>
  <label class="field">
    <span>City</span>
    <input type="text" bind:value={city} placeholder="Springfield" />
  </label>
  <div class="row">
    <label class="field half">
      <span>State</span>
      <input type="text" bind:value={state} placeholder="IL" />
    </label>
    <label class="field half">
      <span>ZIP Code</span>
      <input type="text" bind:value={zip} placeholder="62701" />
    </label>
  </div>
  <label class="field">
    <span>Country</span>
    <select bind:value={country}>
      <option value="US">United States</option>
      <option value="CA">Canada</option>
      <option value="UK">United Kingdom</option>
    </select>
  </label>
  <button type="submit" class="submit-btn">Save Address</button>
</form>

<style>
  .form { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input, .field select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .row { display: flex; gap: 12px; }
  .half { flex: 1; }
  .submit-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'payment',
    description: 'Payment method form with card type selection',
    tags: ['form', 'payment', 'billing'],
    code: `<script>
  let method = 'card';
  let cardNumber = '';
  let expiry = '';
  let cvc = '';
  let paypalEmail = '';

  function handleSubmit() {
    if (method === 'card') {
      alert('Card payment: ' + cardNumber);
    } else {
      alert('PayPal payment: ' + paypalEmail);
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  <h2 class="title">Payment Method</h2>
  <div class="method-row">
    <label class="method-option" class:selected={method === 'card'}>
      <input type="radio" bind:group={method} value="card" /> Credit Card
    </label>
    <label class="method-option" class:selected={method === 'paypal'}>
      <input type="radio" bind:group={method} value="paypal" /> PayPal
    </label>
  </div>
  {#if method === 'card'}
    <label class="field">
      <span>Card Number</span>
      <input type="text" bind:value={cardNumber} placeholder="4242 4242 4242 4242" />
    </label>
    <div class="row">
      <label class="field half">
        <span>Expiry</span>
        <input type="text" bind:value={expiry} placeholder="MM/YY" />
      </label>
      <label class="field half">
        <span>CVC</span>
        <input type="text" bind:value={cvc} placeholder="123" />
      </label>
    </div>
  {:else}
    <label class="field">
      <span>PayPal Email</span>
      <input type="email" bind:value={paypalEmail} placeholder="you@paypal.com" />
    </label>
  {/if}
  <button type="submit" class="submit-btn">Pay</button>
</form>

<style>
  .form { max-width: 420px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .method-row { display: flex; gap: 12px; margin-bottom: 20px; }
  .method-option { flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; text-align: center; cursor: pointer; font-size: 14px; font-weight: 500; }
  .method-option.selected { border-color: #6366f1; background-color: #ede9fe; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .row { display: flex; gap: 12px; }
  .half { flex: 1; }
  .submit-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #16a34a; color: #fff; font-weight: 600; cursor: pointer; font-size: 16px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'file-upload',
    description: 'File upload form with drag-and-drop area and file list',
    tags: ['form', 'upload', 'files'],
    code: `<script>
  let files = [];
  let dragOver = false;

  function handleDrop(e) {
    dragOver = false;
    let dropped = Array.from(e.dataTransfer.files);
    files = [...files, ...dropped.map(f => f.name)];
  }

  function handleFileInput(e) {
    let selected = Array.from(e.target.files);
    files = [...files, ...selected.map(f => f.name)];
  }

  function removeFile(index) {
    files = files.filter((_, i) => i !== index);
  }

  function handleSubmit() {
    alert('Uploading ' + files.length + ' file(s)');
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
  <h2 class="title">Upload Files</h2>
  <div
    class="drop-zone"
    class:drag-over={dragOver}
    on:dragover|preventDefault={() => { dragOver = true; }}
    on:dragleave={() => { dragOver = false; }}
    on:drop|preventDefault={handleDrop}
  >
    <p>Drag files here or <label class="browse-label">browse<input type="file" multiple on:change={handleFileInput} class="hidden-input" /></label></p>
  </div>
  {#if files.length > 0}
    <ul class="file-list">
      {#each files as file, i}
        <li>
          <span>{file}</span>
          <button type="button" on:click={() => removeFile(i)} class="remove-btn">\u2715</button>
        </li>
      {/each}
    </ul>
  {/if}
  <button type="submit" class="submit-btn" disabled={files.length === 0}>Upload</button>
</form>

<style>
  .form { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .title { margin: 0 0 24px; font-size: 24px; }
  .drop-zone { border: 2px dashed #d1d5db; border-radius: 8px; padding: 32px; text-align: center; color: #6b7280; margin-bottom: 16px; }
  .drop-zone.drag-over { border-color: #6366f1; background-color: #ede9fe; }
  .browse-label { color: #6366f1; cursor: pointer; text-decoration: underline; }
  .hidden-input { display: none; }
  .file-list { list-style: none; padding: 0; margin: 0 0 16px; }
  .file-list li { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .remove-btn { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; }
  .submit-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
