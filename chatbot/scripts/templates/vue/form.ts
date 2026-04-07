import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'login',
    description: 'Login form with email, password, and remember-me checkbox',
    tags: ['form', 'login', 'auth'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const LoginForm = defineComponent({
  setup() {
  const email = ref('');
      const password = ref('');
      const remember = ref(false);
      const loading = ref(false);
      const handleSubmit = () => {
        loading.value = true;
        setTimeout(() => { loading.value = false; }, 1500);
      };
      return { email, password, remember, loading, handleSubmit };
  },
  template: \`
    <div class="login-form">
    <h2 class="form-title">Sign In</h2>
    <form @submit.prevent="handleSubmit">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" type="email" v-model="email" placeholder="you@example.com" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" type="password" v-model="password" placeholder="Enter password" required />
      </div>
      <div class="row">
        <label class="checkbox-label">
          <input type="checkbox" v-model="remember" /> Remember me
        </label>
        <a href="#" class="forgot-link">Forgot password?</a>
      </div>
      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'login-form',
  App: LoginForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'signup',
    description: 'Signup form with name, email, password confirmation, and terms acceptance',
    tags: ['form', 'signup', 'registration'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const SignupForm = defineComponent({
  setup() {
  const firstName = ref('');
      const lastName = ref('');
      const email = ref('');
      const password = ref('');
      const confirmPassword = ref('');
      const acceptedTerms = ref(false);
      const passwordMismatch = computed(() =>
        confirmPassword.value.length > 0 && password.value !== confirmPassword.value
      );
      const handleSignup = () => {
        if (!passwordMismatch.value && acceptedTerms.value) {
          alert('Account created!');
        }
      };
      return { firstName, lastName, email, password, confirmPassword, acceptedTerms, passwordMismatch, handleSignup };
  },
  template: \`
    <div class="signup-form">
    <h2 class="form-title">Create Account</h2>
    <form @submit.prevent="handleSignup">
      <div class="field-row">
        <div class="field">
          <label>First Name</label>
          <input type="text" v-model="firstName" required />
        </div>
        <div class="field">
          <label>Last Name</label>
          <input type="text" v-model="lastName" required />
        </div>
      </div>
      <div class="field">
        <label>Email</label>
        <input type="email" v-model="email" required />
      </div>
      <div class="field">
        <label>Password</label>
        <input type="password" v-model="password" required />
      </div>
      <div class="field">
        <label>Confirm Password</label>
        <input type="password" v-model="confirmPassword" required />
        <span v-if="passwordMismatch" class="error">Passwords do not match</span>
      </div>
      <label class="terms-label">
        <input type="checkbox" v-model="acceptedTerms" />
        I agree to the Terms of Service
      </label>
      <button type="submit" class="submit-btn" :disabled="!acceptedTerms || passwordMismatch">
        Create Account
      </button>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'signup-form',
  App: SignupForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'contact',
    description: 'Contact form with name, email, subject, and message textarea',
    tags: ['form', 'contact', 'message'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ContactForm = defineComponent({
  setup() {
  const name = ref('');
      const email = ref('');
      const subject = ref('');
      const message = ref('');
      const handleSubmit = () => {
        alert('Message sent!');
        name.value = '';
        email.value = '';
        subject.value = '';
        message.value = '';
      };
      return { name, email, subject, message, handleSubmit };
  },
  template: \`
    <div class="contact-form">
    <h2 class="form-title">Contact Us</h2>
    <p class="form-subtitle">We'd love to hear from you. Send us a message below.</p>
    <form @submit.prevent="handleSubmit">
      <div class="field">
        <label>Name</label>
        <input type="text" v-model="name" required />
      </div>
      <div class="field">
        <label>Email</label>
        <input type="email" v-model="email" required />
      </div>
      <div class="field">
        <label>Subject</label>
        <select v-model="subject">
          <option value="">Select a topic</option>
          <option value="general">General Inquiry</option>
          <option value="support">Support</option>
          <option value="sales">Sales</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>
      <div class="field">
        <label>Message</label>
        <textarea v-model="message" rows="5" required></textarea>
        <span class="char-count">{{ message.length }}/500</span>
      </div>
      <button type="submit" class="submit-btn">Send Message</button>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'contact-form',
  App: ContactForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'search',
    description: 'Search form with filters, category select, and instant results',
    tags: ['form', 'search', 'filter'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SearchForm = defineComponent({
  setup() {
  const query = ref('');
      const category = ref('all');
      const results = ref<string[]>([]);
      const searched = ref(false);
      const lastQuery = ref('');
      const allData = ['Vue Components', 'React Hooks', 'Angular Services', 'Svelte Stores', 'Web APIs'];
      const performSearch = () => {
        searched.value = true;
        lastQuery.value = query.value;
        results.value = allData.filter(d => d.toLowerCase().includes(query.value.toLowerCase()));
      };
      return { query, category, results, searched, lastQuery, performSearch };
  },
  template: \`
    <div class="search-form">
    <div class="search-bar">
      <input type="text" v-model="query" placeholder="Search anything..." class="search-input" />
      <select v-model="category" class="category-select">
        <option value="all">All Categories</option>
        <option value="products">Products</option>
        <option value="articles">Articles</option>
        <option value="users">Users</option>
      </select>
      <button class="search-btn" @click="performSearch">Search</button>
    </div>
    <div v-if="results.length" class="results">
      <div v-for="result in results" :key="result" class="result-item">{{ result }}</div>
    </div>
    <p v-else-if="searched" class="no-results">No results found for "{{ lastQuery }}"</p>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'search-form',
  App: SearchForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'multi-step',
    description: 'Multi-step form wizard with progress indicators and validation',
    tags: ['form', 'multi-step', 'wizard'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, reactive } from 'vue';

const MultiStepForm = defineComponent({
  setup() {
  const step = ref(1);
      const totalSteps = 3;
      const form = reactive({ name: '', email: '', street: '', city: '' });
      const handleNext = () => {
        if (step.value < totalSteps) step.value++;
        else alert('Form submitted!');
      };
      return { step, totalSteps, form, handleNext };
  },
  template: \`
    <div class="multistep-form">
    <div class="steps-indicator">
      <div v-for="s in totalSteps" :key="s" class="step-dot"
           :class="{ active: s === step, completed: s < step }">
        {{ s }}
      </div>
    </div>
    <form @submit.prevent="handleNext">
      <div v-if="step === 1" class="step-content">
        <h3>Personal Info</h3>
        <div class="field">
          <label>Full Name</label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" required />
        </div>
      </div>
      <div v-if="step === 2" class="step-content">
        <h3>Address</h3>
        <div class="field">
          <label>Street</label>
          <input v-model="form.street" type="text" required />
        </div>
        <div class="field">
          <label>City</label>
          <input v-model="form.city" type="text" required />
        </div>
      </div>
      <div v-if="step === 3" class="step-content">
        <h3>Review</h3>
        <p class="review-item"><strong>Name:</strong> {{ form.name }}</p>
        <p class="review-item"><strong>Email:</strong> {{ form.email }}</p>
        <p class="review-item"><strong>Address:</strong> {{ form.street }}, {{ form.city }}</p>
      </div>
      <div class="form-actions">
        <button v-if="step > 1" type="button" class="btn-back" @click="step--">Back</button>
        <button type="submit" class="btn-next">{{ step === totalSteps ? 'Submit' : 'Next' }}</button>
      </div>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'multi-step-form',
  App: MultiStepForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'settings',
    description: 'Settings form with toggles, selects, and grouped preferences',
    tags: ['form', 'settings', 'preferences'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, reactive } from 'vue';

const SettingsForm = defineComponent({
  setup() {
  const settings = reactive({
        emailNotif: true,
        pushNotif: false,
        theme: 'light',
        language: 'en',
      });
      const save = () => alert('Settings saved!');
      return { settings, save };
  },
  template: \`
    <div class="settings-form">
    <h2 class="form-title">Settings</h2>
    <div class="setting-group">
      <h3 class="group-title">Notifications</h3>
      <div class="setting-row">
        <span>Email notifications</span>
        <button class="toggle" :class="{ on: settings.emailNotif }"
                @click="settings.emailNotif = !settings.emailNotif">
          <span class="toggle-knob"></span>
        </button>
      </div>
      <div class="setting-row">
        <span>Push notifications</span>
        <button class="toggle" :class="{ on: settings.pushNotif }"
                @click="settings.pushNotif = !settings.pushNotif">
          <span class="toggle-knob"></span>
        </button>
      </div>
    </div>
    <div class="setting-group">
      <h3 class="group-title">Appearance</h3>
      <div class="setting-row">
        <span>Theme</span>
        <select v-model="settings.theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
      <div class="setting-row">
        <span>Language</span>
        <select v-model="settings.language">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>
    </div>
    <button class="save-btn" @click="save">Save Changes</button>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'settings-form',
  App: SettingsForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'password-reset',
    description: 'Password reset form with email input and success state',
    tags: ['form', 'password-reset', 'auth'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const PasswordResetForm = defineComponent({
  setup() {
  const email = ref('');
      const submitted = ref(false);
      const handleSubmit = () => { submitted.value = true; };
      return { email, submitted, handleSubmit };
  },
  template: \`
    <div class="reset-form">
    <template v-if="!submitted">
      <h2 class="form-title">Reset Password</h2>
      <p class="form-desc">Enter your email and we'll send a reset link.</p>
      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>Email Address</label>
          <input type="email" v-model="email" required placeholder="you@example.com" />
        </div>
        <button type="submit" class="submit-btn">Send Reset Link</button>
      </form>
      <a href="#" class="back-link">Back to login</a>
  \`,
});

const app = createVueMicroApp({
  name: 'password-reset-form',
  App: PasswordResetForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'checkout',
    description: 'Checkout form with order summary, payment fields, and total',
    tags: ['form', 'checkout', 'e-commerce'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed, reactive } from 'vue';

const CheckoutForm = defineComponent({
  setup() {
  const cartItems = reactive([
        { name: 'Widget Pro', price: 29.99, qty: 1 },
        { name: 'Gadget Plus', price: 49.99, qty: 2 },
      ]);
      const total = computed(() => cartItems.reduce((sum, i) => sum + i.price * i.qty, 0));
      const cardNumber = ref('');
      const expiry = ref('');
      const cvv = ref('');
      const handleCheckout = () => alert('Payment processed!');
      return { cartItems, total, cardNumber, expiry, cvv, handleCheckout };
  },
  template: \`
    <div class="checkout-form">
    <h2 class="form-title">Checkout</h2>
    <div class="order-summary">
      <div v-for="item in cartItems" :key="item.name" class="cart-item">
        <span>{{ item.name }} x{{ item.qty }}</span>
        <span>\${{ (item.price * item.qty).toFixed(2) }}</span>
      </div>
      <div class="total-row">
        <strong>Total</strong>
        <strong>\${{ total.toFixed(2) }}</strong>
      </div>
    </div>
    <form @submit.prevent="handleCheckout">
      <div class="field">
        <label>Card Number</label>
        <input v-model="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" required />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Expiry</label>
          <input v-model="expiry" placeholder="MM/YY" maxlength="5" required />
        </div>
        <div class="field">
          <label>CVV</label>
          <input v-model="cvv" type="password" placeholder="123" maxlength="4" required />
        </div>
      </div>
      <button type="submit" class="pay-btn">Pay \${{ total.toFixed(2) }}</button>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'checkout-form',
  App: CheckoutForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'profile',
    description: 'Profile edit form with avatar upload, bio textarea, and social links',
    tags: ['form', 'profile', 'edit'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, reactive, computed } from 'vue';

const ProfileForm = defineComponent({
  setup() {
  const profile = reactive({
        name: 'Jane Doe',
        bio: 'Full-stack developer passionate about UI.',
        website: '',
        twitter: '',
      });
      const initials = computed(() => profile.name.split(' ').map(n => n[0]).join(''));
      const saveProfile = () => alert('Profile saved!');
      return { profile, initials, saveProfile };
  },
  template: \`
    <div class="profile-form">
    <h2 class="form-title">Edit Profile</h2>
    <div class="avatar-section">
      <div class="avatar">{{ initials }}</div>
      <button class="upload-btn">Change Photo</button>
    </div>
    <form @submit.prevent="saveProfile">
      <div class="field">
        <label>Display Name</label>
        <input v-model="profile.name" type="text" />
      </div>
      <div class="field">
        <label>Bio</label>
        <textarea v-model="profile.bio" rows="3" maxlength="200"></textarea>
        <span class="hint">{{ profile.bio.length }}/200</span>
      </div>
      <div class="field">
        <label>Website</label>
        <input v-model="profile.website" type="url" placeholder="https://" />
      </div>
      <div class="field">
        <label>Twitter</label>
        <input v-model="profile.twitter" placeholder="@username" />
      </div>
      <button type="submit" class="save-btn">Save Profile</button>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'profile-form',
  App: ProfileForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'filter',
    description: 'Filter form with checkboxes, range slider, and apply/reset buttons',
    tags: ['form', 'filter', 'range'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const FilterForm = defineComponent({
  setup() {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
      const selectedCategories = ref<string[]>([]);
      const maxPrice = ref(250);
      const minRating = ref('0');
      const applyFilters = () => alert('Filters applied');
      const resetFilters = () => {
        selectedCategories.value = [];
        maxPrice.value = 250;
        minRating.value = '0';
      };
      return { categories, selectedCategories, maxPrice, minRating, applyFilters, resetFilters };
  },
  template: \`
    <div class="filter-form">
    <h3 class="form-title">Filters</h3>
    <div class="filter-section">
      <h4 class="section-title">Category</h4>
      <label v-for="cat in categories" :key="cat" class="checkbox-row">
        <input type="checkbox" :value="cat" v-model="selectedCategories" />
        <span>{{ cat }}</span>
      </label>
    </div>
    <div class="filter-section">
      <h4 class="section-title">Price Range</h4>
      <input type="range" v-model.number="maxPrice" min="0" max="500" class="range-input" />
      <div class="range-labels">
        <span>\$0</span>
        <span>\${{ maxPrice }}</span>
      </div>
    </div>
    <div class="filter-section">
      <h4 class="section-title">Rating</h4>
      <select v-model="minRating" class="rating-select">
        <option value="0">Any rating</option>
        <option value="3">3+ stars</option>
        <option value="4">4+ stars</option>
        <option value="5">5 stars only</option>
      </select>
    </div>
    <div class="filter-actions">
      <button class="apply-btn" @click="applyFilters">Apply</button>
      <button class="reset-btn" @click="resetFilters">Reset</button>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'filter-form',
  App: FilterForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'newsletter',
    description: 'Newsletter subscription form with email input and inline success state',
    tags: ['form', 'newsletter', 'subscription'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const NewsletterForm = defineComponent({
  setup() {
  const email = ref('');
      const subscribed = ref(false);
      const subscribe = () => { subscribed.value = true; };
      return { email, subscribed, subscribe };
  },
  template: \`
    <div class="newsletter-form">
    <template v-if="!subscribed">
      <h3 class="form-title">Stay Updated</h3>
      <p class="form-desc">Get the latest news delivered to your inbox.</p>
      <form @submit.prevent="subscribe" class="inline-form">
        <input type="email" v-model="email" placeholder="Enter your email" required class="email-input" />
        <button type="submit" class="subscribe-btn">Subscribe</button>
      </form>
      <p class="privacy-note">No spam. Unsubscribe anytime.</p>
  \`,
});

const app = createVueMicroApp({
  name: 'newsletter-form',
  App: NewsletterForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'survey',
    description: 'Survey form with radio buttons, rating scale, and optional comment',
    tags: ['form', 'survey', 'feedback'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SurveyForm = defineComponent({
  setup() {
  const satisfaction = ref(0);
      const source = ref('');
      const comment = ref('');
      const sources = ['Search Engine', 'Social Media', 'Friend/Referral', 'Advertisement', 'Other'];
      const submitSurvey = () => alert('Thanks for your feedback!');
      return { satisfaction, source, comment, sources, submitSurvey };
  },
  template: \`
    <div class="survey-form">
    <h2 class="form-title">Quick Survey</h2>
    <form @submit.prevent="submitSurvey">
      <div class="question">
        <p class="q-text">1. How satisfied are you with our service?</p>
        <div class="rating-scale">
          <button v-for="n in 5" :key="n" type="button"
                  class="rating-btn" :class="{ selected: satisfaction === n }"
                  @click="satisfaction = n">
            {{ n }}
          </button>
        </div>
        <div class="scale-labels">
          <span>Not at all</span>
          <span>Very satisfied</span>
        </div>
      </div>
      <div class="question">
        <p class="q-text">2. How did you find us?</p>
        <label v-for="opt in sources" :key="opt" class="radio-row">
          <input type="radio" :value="opt" v-model="source" name="source" />
          <span>{{ opt }}</span>
        </label>
      </div>
      <div class="question">
        <p class="q-text">3. Any additional comments?</p>
        <textarea v-model="comment" rows="3" placeholder="Optional..."></textarea>
      </div>
      <button type="submit" class="submit-btn">Submit Survey</button>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'survey-form',
  App: SurveyForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'address',
    description: 'Address form with street, city, state, zip, and country fields',
    tags: ['form', 'address', 'location'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, reactive } from 'vue';

const AddressForm = defineComponent({
  setup() {
  const address = reactive({
        street: '', apt: '', city: '', state: '', zip: '', country: 'US',
      });
      const states = ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'PA', 'OH'];
      const saveAddress = () => alert('Address saved!');
      return { address, states, saveAddress };
  },
  template: \`
    <div class="address-form">
    <h2 class="form-title">Shipping Address</h2>
    <form @submit.prevent="saveAddress">
      <div class="field">
        <label>Street Address</label>
        <input v-model="address.street" type="text" required />
      </div>
      <div class="field">
        <label>Apartment / Suite (optional)</label>
        <input v-model="address.apt" type="text" />
      </div>
      <div class="field-row">
        <div class="field">
          <label>City</label>
          <input v-model="address.city" type="text" required />
        </div>
        <div class="field">
          <label>State</label>
          <select v-model="address.state" required>
            <option value="">Select</option>
            <option v-for="s in states" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>ZIP Code</label>
          <input v-model="address.zip" type="text" maxlength="10" required />
        </div>
        <div class="field">
          <label>Country</label>
          <select v-model="address.country" required>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
          </select>
        </div>
      </div>
      <button type="submit" class="save-btn">Save Address</button>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'address-form',
  App: AddressForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'payment',
    description: 'Payment method form with card type selection and saved cards list',
    tags: ['form', 'payment', 'credit-card'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, reactive } from 'vue';

const PaymentForm = defineComponent({
  setup() {
  const savedCards = reactive([
        { brand: 'Visa', last4: '4242' },
        { brand: 'Mastercard', last4: '8888' },
      ]);
      const selectedCard = ref('4242');
      const showNewCard = ref(false);
      const newCard = reactive({ number: '', name: '', expiry: '', cvc: '' });
      const addCard = () => {
        savedCards.push({ brand: 'New', last4: newCard.number.slice(-4) });
        showNewCard.value = false;
      };
      return { savedCards, selectedCard, showNewCard, newCard, addCard };
  },
  template: \`
    <div class="payment-form">
    <h2 class="form-title">Payment Method</h2>
    <div class="saved-cards">
      <div v-for="card in savedCards" :key="card.last4" class="card-option"
           :class="{ selected: selectedCard === card.last4 }"
           @click="selectedCard = card.last4">
        <span class="card-type">{{ card.brand }}</span>
        <span class="card-number">**** {{ card.last4 }}</span>
      </div>
    </div>
    <button class="add-card-btn" @click="showNewCard = !showNewCard">
      {{ showNewCard ? 'Cancel' : '+ Add new card' }}
    </button>
    <form v-if="showNewCard" @submit.prevent="addCard" class="new-card-form">
      <div class="field">
        <label>Card Number</label>
        <input v-model="newCard.number" placeholder="4242 4242 4242 4242" required />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Name on Card</label>
          <input v-model="newCard.name" required />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Expiry</label>
          <input v-model="newCard.expiry" placeholder="MM/YY" required />
        </div>
        <div class="field">
          <label>CVC</label>
          <input v-model="newCard.cvc" type="password" maxlength="4" required />
        </div>
      </div>
      <button type="submit" class="save-btn">Save Card</button>
    </form>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'payment-form',
  App: PaymentForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'file-upload',
    description: 'File upload form with drag-and-drop zone and file list preview',
    tags: ['form', 'file-upload', 'drag-drop'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const FileUploadForm = defineComponent({
  setup() {
  const files = ref<File[]>([]);
      const dragging = ref(false);
      const handleDrop = (e: DragEvent) => {
        dragging.value = false;
        if (e.dataTransfer?.files) {
          files.value.push(...Array.from(e.dataTransfer.files));
        }
      };
      const handleFileSelect = (e: Event) => {
        const input = e.target as HTMLInputElement;
        if (input.files) files.value.push(...Array.from(input.files));
      };
      const removeFile = (idx: number) => files.value.splice(idx, 1);
      const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
      };
      const uploadFiles = () => {
        alert(files.value.length + ' file(s) uploaded!');
        files.value = [];
      };
      return { files, dragging, handleDrop, handleFileSelect, removeFile, formatSize, uploadFiles };
  },
  template: \`
    <div class="upload-form">
    <h2 class="form-title">Upload Files</h2>
    <div class="drop-zone" :class="{ dragging }"
         @dragover.prevent="dragging = true"
         @dragleave="dragging = false"
         @drop.prevent="handleDrop">
      <p class="drop-text">Drag files here or</p>
      <label class="browse-btn">
        Browse
        <input type="file" multiple @change="handleFileSelect" class="hidden-input" />
      </label>
    </div>
    <div v-if="files.length" class="file-list">
      <div v-for="(file, idx) in files" :key="idx" class="file-item">
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ formatSize(file.size) }}</span>
        <button class="remove-btn" @click="removeFile(idx)">&times;</button>
      </div>
    </div>
    <button v-if="files.length" class="upload-btn" @click="uploadFiles">
      Upload {{ files.length }} file(s)
    </button>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'file-upload-form',
  App: FileUploadForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
