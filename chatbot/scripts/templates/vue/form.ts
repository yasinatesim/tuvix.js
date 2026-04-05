import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'login',
    description: 'Login form with email, password, and remember-me checkbox',
    tags: ['form', 'login', 'auth'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const LoginForm = defineComponent({
  name: 'LoginForm',
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
});

export default createVueMicroApp({ name: 'login-form', App: LoginForm });
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
  text-align: center;
}
.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}
.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.field input:focus {
  outline: none;
  border-color: #3b82f6;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.checkbox-label {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}
.forgot-link {
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.submit-btn:hover:not(:disabled) {
  background: #2563eb;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'signup',
    description: 'Signup form with name, email, password confirmation, and terms acceptance',
    tags: ['form', 'signup', 'registration'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SignupForm = defineComponent({
  name: 'SignupForm',
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
});

export default createVueMicroApp({ name: 'signup-form', App: SignupForm });
</script>

<style scoped>
.signup-form {
  max-width: 480px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
}
.field-row {
  display: flex;
  gap: 16px;
}
.field {
  flex: 1;
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}
.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}
.terms-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 20px;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'contact',
    description: 'Contact form with name, email, subject, and message textarea',
    tags: ['form', 'contact', 'message'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ContactForm = defineComponent({
  name: 'ContactForm',
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
});

export default createVueMicroApp({ name: 'contact-form', App: ContactForm });
</script>

<style scoped>
.contact-form {
  max-width: 520px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
}
.form-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 24px;
}
.field {
  margin-bottom: 16px;
  position: relative;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}
.field input, .field select, .field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}
.field textarea {
  resize: vertical;
}
.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  color: #9ca3af;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.submit-btn:hover {
  background: #2563eb;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'search',
    description: 'Search form with filters, category select, and instant results',
    tags: ['form', 'search', 'filter'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SearchForm = defineComponent({
  name: 'SearchForm',
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
});

export default createVueMicroApp({ name: 'search-form', App: SearchForm });
</script>

<style scoped>
.search-form {
  max-width: 600px;
  margin: 40px auto;
}
.search-bar {
  display: flex;
  gap: 8px;
}
.search-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}
.category-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}
.search-btn {
  padding: 10px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.search-btn:hover {
  background: #2563eb;
}
.results {
  margin-top: 16px;
}
.result-item {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fff;
}
.no-results {
  margin-top: 16px;
  color: #6b7280;
  text-align: center;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'multi-step',
    description: 'Multi-step form wizard with progress indicators and validation',
    tags: ['form', 'multi-step', 'wizard'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MultiStepForm = defineComponent({
  name: 'MultiStepForm',
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
});

export default createVueMicroApp({ name: 'multi-step-form', App: MultiStepForm });
</script>

<style scoped>
.multistep-form {
  max-width: 480px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.steps-indicator {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 28px;
}
.step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #9ca3af;
}
.step-dot.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: #fff;
}
.step-dot.completed {
  border-color: #10b981;
  background: #10b981;
  color: #fff;
}
.step-content h3 {
  font-size: 18px;
  margin: 0 0 16px;
}
.field {
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.review-item {
  font-size: 14px;
  margin: 8px 0;
}
.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}
.btn-back {
  padding: 10px 24px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.btn-next {
  padding: 10px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'settings',
    description: 'Settings form with toggles, selects, and grouped preferences',
    tags: ['form', 'settings', 'preferences'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SettingsForm = defineComponent({
  name: 'SettingsForm',
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
});

export default createVueMicroApp({ name: 'settings-form', App: SettingsForm });
</script>

<style scoped>
.settings-form {
  max-width: 520px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
}
.setting-group {
  margin-bottom: 24px;
}
.group-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #374151;
}
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  color: #374151;
}
.toggle {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: #d1d5db;
  border: none;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}
.toggle.on {
  background: #3b82f6;
}
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}
.toggle.on .toggle-knob {
  transform: translateX(22px);
}
.setting-row select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
.save-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'password-reset',
    description: 'Password reset form with email input and success state',
    tags: ['form', 'password-reset', 'auth'],
    code: `<template>
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
    </template>
    <template v-else>
      <div class="success-state">
        <div class="success-icon">&#10003;</div>
        <h2>Check Your Email</h2>
        <p>We sent a reset link to <strong>{{ email }}</strong></p>
        <button class="submit-btn" @click="submitted = false">Try another email</button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const PasswordResetForm = defineComponent({
  name: 'PasswordResetForm',
  setup() {
    const email = ref('');
    const submitted = ref(false);
    const handleSubmit = () => { submitted.value = true; };
    return { email, submitted, handleSubmit };
  },
});

export default createVueMicroApp({ name: 'password-reset-form', App: PasswordResetForm });
</script>

<style scoped>
.reset-form {
  max-width: 400px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
}
.form-desc {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 24px;
}
.field {
  margin-bottom: 16px;
  text-align: left;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.back-link {
  display: block;
  margin-top: 16px;
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
}
.success-state {
  padding: 16px 0;
}
.success-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #10b981;
  color: #fff;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'checkout',
    description: 'Checkout form with order summary, payment fields, and total',
    tags: ['form', 'checkout', 'e-commerce'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const CheckoutForm = defineComponent({
  name: 'CheckoutForm',
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
});

export default createVueMicroApp({ name: 'checkout-form', App: CheckoutForm });
</script>

<style scoped>
.checkout-form {
  max-width: 460px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 20px;
}
.order-summary {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}
.cart-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid #e5e7eb;
  font-size: 16px;
}
.field {
  margin-bottom: 14px;
  flex: 1;
}
.field-row {
  display: flex;
  gap: 16px;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.pay-btn {
  width: 100%;
  padding: 14px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}
.pay-btn:hover {
  background: #059669;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'profile',
    description: 'Profile edit form with avatar upload, bio textarea, and social links',
    tags: ['form', 'profile', 'edit'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, reactive, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ProfileForm = defineComponent({
  name: 'ProfileForm',
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
});

export default createVueMicroApp({ name: 'profile-form', App: ProfileForm });
</script>

<style scoped>
.profile-form {
  max-width: 480px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
}
.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 22px;
}
.upload-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.field {
  margin-bottom: 16px;
  position: relative;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}
.field input, .field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}
.hint {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  color: #9ca3af;
}
.save-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'filter',
    description: 'Filter form with checkboxes, range slider, and apply/reset buttons',
    tags: ['form', 'filter', 'range'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FilterForm = defineComponent({
  name: 'FilterForm',
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
});

export default createVueMicroApp({ name: 'filter-form', App: FilterForm });
</script>

<style scoped>
.filter-form {
  width: 280px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 20px;
}
.filter-section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px;
  color: #374151;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  padding: 4px 0;
  cursor: pointer;
}
.range-input {
  width: 100%;
  cursor: pointer;
}
.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}
.rating-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
.filter-actions {
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
  cursor: pointer;
  font-weight: 600;
}
.reset-btn {
  flex: 1;
  padding: 10px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'newsletter',
    description: 'Newsletter subscription form with email input and inline success state',
    tags: ['form', 'newsletter', 'subscription'],
    code: `<template>
  <div class="newsletter-form">
    <template v-if="!subscribed">
      <h3 class="form-title">Stay Updated</h3>
      <p class="form-desc">Get the latest news delivered to your inbox.</p>
      <form @submit.prevent="subscribe" class="inline-form">
        <input type="email" v-model="email" placeholder="Enter your email" required class="email-input" />
        <button type="submit" class="subscribe-btn">Subscribe</button>
      </form>
      <p class="privacy-note">No spam. Unsubscribe anytime.</p>
    </template>
    <template v-else>
      <div class="success-msg">
        <span class="check-icon">&#10003;</span>
        <p>Thanks! You're subscribed with <strong>{{ email }}</strong></p>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const NewsletterForm = defineComponent({
  name: 'NewsletterForm',
  setup() {
    const email = ref('');
    const subscribed = ref(false);
    const subscribe = () => { subscribed.value = true; };
    return { email, subscribed, subscribe };
  },
});

export default createVueMicroApp({ name: 'newsletter-form', App: NewsletterForm });
</script>

<style scoped>
.newsletter-form {
  max-width: 480px;
  margin: 40px auto;
  padding: 32px;
  background: #f0f9ff;
  border-radius: 12px;
  text-align: center;
}
.form-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
}
.form-desc {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 20px;
}
.inline-form {
  display: flex;
  gap: 8px;
}
.email-input {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
.subscribe-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.subscribe-btn:hover {
  background: #2563eb;
}
.privacy-note {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 12px;
}
.success-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.check-icon {
  width: 36px;
  height: 36px;
  background: #10b981;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'survey',
    description: 'Survey form with radio buttons, rating scale, and optional comment',
    tags: ['form', 'survey', 'feedback'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SurveyForm = defineComponent({
  name: 'SurveyForm',
  setup() {
    const satisfaction = ref(0);
    const source = ref('');
    const comment = ref('');
    const sources = ['Search Engine', 'Social Media', 'Friend/Referral', 'Advertisement', 'Other'];
    const submitSurvey = () => alert('Thanks for your feedback!');
    return { satisfaction, source, comment, sources, submitSurvey };
  },
});

export default createVueMicroApp({ name: 'survey-form', App: SurveyForm });
</script>

<style scoped>
.survey-form {
  max-width: 520px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
}
.question {
  margin-bottom: 24px;
}
.q-text {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 10px;
}
.rating-scale {
  display: flex;
  gap: 8px;
}
.rating-btn {
  width: 44px;
  height: 44px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.rating-btn.selected {
  border-color: #3b82f6;
  background: #3b82f6;
  color: #fff;
}
.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 6px;
  max-width: 244px;
}
.radio-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  padding: 4px 0;
  cursor: pointer;
}
.question textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'address',
    description: 'Address form with street, city, state, zip, and country fields',
    tags: ['form', 'address', 'location'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AddressForm = defineComponent({
  name: 'AddressForm',
  setup() {
    const address = reactive({
      street: '', apt: '', city: '', state: '', zip: '', country: 'US',
    });
    const states = ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'PA', 'OH'];
    const saveAddress = () => alert('Address saved!');
    return { address, states, saveAddress };
  },
});

export default createVueMicroApp({ name: 'address-form', App: AddressForm });
</script>

<style scoped>
.address-form {
  max-width: 520px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
}
.field {
  margin-bottom: 14px;
  flex: 1;
}
.field-row {
  display: flex;
  gap: 16px;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}
.field input, .field select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.save-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'payment',
    description: 'Payment method form with card type selection and saved cards list',
    tags: ['form', 'payment', 'credit-card'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const PaymentForm = defineComponent({
  name: 'PaymentForm',
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
});

export default createVueMicroApp({ name: 'payment-form', App: PaymentForm });
</script>

<style scoped>
.payment-form {
  max-width: 460px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 20px;
}
.saved-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.card-option {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.card-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}
.card-type {
  font-weight: 600;
  font-size: 14px;
}
.card-number {
  color: #6b7280;
  font-size: 14px;
}
.add-card-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
}
.new-card-form .field {
  margin-bottom: 14px;
  flex: 1;
}
.field-row {
  display: flex;
  gap: 16px;
}
.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.save-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'file-upload',
    description: 'File upload form with drag-and-drop zone and file list preview',
    tags: ['form', 'file-upload', 'drag-drop'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FileUploadForm = defineComponent({
  name: 'FileUploadForm',
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
});

export default createVueMicroApp({ name: 'file-upload-form', App: FileUploadForm });
</script>

<style scoped>
.upload-form {
  max-width: 500px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
}
.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.2s;
}
.drop-zone.dragging {
  border-color: #3b82f6;
  background: #eff6ff;
}
.drop-text {
  color: #6b7280;
  margin: 0 0 8px;
}
.browse-btn {
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}
.hidden-input {
  display: none;
}
.file-list {
  margin-top: 16px;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 6px;
}
.file-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-size {
  font-size: 12px;
  color: #9ca3af;
}
.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 18px;
  cursor: pointer;
}
.upload-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
