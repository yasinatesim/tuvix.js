import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'login',
    description: 'Login form with email and password fields',
    tags: ['form', 'login', 'auth'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-login-form',
  template: \`

    <div class="container">
      <h2 class="title">Log In</h2>
      <form (submit)="onSubmit($event)">
        <label class="label">Email</label>
        <input type="email" class="input" placeholder="you@example.com" [value]="email" (input)="email=$any($event.target).value" />
        <label class="label">Password</label>
        <input type="password" class="input" placeholder="********" [value]="password" (input)="password=$any($event.target).value" />
        <button type="submit" class="btn">Sign In</button>
      </form>
    </div>
  
  \`,
})
export class LoginFormComponent {
email = '';
  password = '';
  onSubmit(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'login-form',
  async mount({ container }) {
    const el = document.createElement('app-login-form');
    container.appendChild(el);
    await bootstrapApplication(LoginFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'signup',
    description: 'Signup form with name, email, password and confirm password',
    tags: ['form', 'signup', 'registration'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-signup-form',
  template: \`

    <div class="container">
      <h2 class="title">Create Account</h2>
      <form (submit)="onSubmit($event)">
        <label class="label">Full Name</label>
        <input type="text" class="input" placeholder="Jane Doe" />
        <label class="label">Email</label>
        <input type="email" class="input" placeholder="jane@example.com" />
        <label class="label">Password</label>
        <input type="password" class="input" placeholder="Min 8 characters" />
        <label class="label">Confirm Password</label>
        <input type="password" class="input" placeholder="Repeat password" />
        <button type="submit" class="btn">Sign Up</button>
      </form>
      <p class="footer-text">Already have an account? <a href="#login">Log in</a></p>
    </div>
  
  \`,
})
export class SignupFormComponent {
onSubmit(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'signup-form',
  async mount({ container }) {
    const el = document.createElement('app-signup-form');
    container.appendChild(el);
    await bootstrapApplication(SignupFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'contact',
    description: 'Contact form with name, email, subject and message fields',
    tags: ['form', 'contact', 'message'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-contact-form',
  template: \`

    <div class="container">
      <h2 class="title">Contact Us</h2>
      <form (submit)="onSubmit($event)">
        <label class="label">Name</label>
        <input type="text" class="input" placeholder="Your name" />
        <label class="label">Email</label>
        <input type="email" class="input" placeholder="you@example.com" />
        <label class="label">Subject</label>
        <input type="text" class="input" placeholder="How can we help?" />
        <label class="label">Message</label>
        <textarea class="textarea" rows="4" placeholder="Write your message..."></textarea>
        <button type="submit" class="btn">Send Message</button>
      </form>
    </div>
  
  \`,
})
export class ContactFormComponent {
onSubmit(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'contact-form',
  async mount({ container }) {
    const el = document.createElement('app-contact-form');
    container.appendChild(el);
    await bootstrapApplication(ContactFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'search',
    description: 'Search form with input, filters and submit button',
    tags: ['form', 'search', 'filter'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-search-form',
  template: \`

    <div class="container">
      <form class="search-form" (submit)="onSubmit($event)">
        <input type="text" class="input" placeholder="Search..." [value]="query" (input)="query=$any($event.target).value" />
        <select class="select" (change)="category=$any($event.target).value">
          <option value="all">All</option>
          <option value="docs">Docs</option>
          <option value="blog">Blog</option>
          <option value="api">API</option>
        </select>
        <button type="submit" class="btn">Search</button>
      </form>
    </div>
  
  \`,
})
export class SearchFormComponent {
query = '';
  category = 'all';
  onSubmit(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'search-form',
  async mount({ container }) {
    const el = document.createElement('app-search-form');
    container.appendChild(el);
    await bootstrapApplication(SearchFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'multi-step',
    description: 'Multi-step form with progress indicator and step navigation',
    tags: ['form', 'multi-step', 'wizard'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-multistep-form',
  template: \`

    <div class="container">
      <div class="steps">
        <div *ngFor="let s of stepLabels; let i = index" class="step" [class.active]="i <= step">{{ i + 1 }}. {{ s }}</div>
      </div>
      <div class="body" *ngIf="step === 0">
        <label class="label">Full Name</label>
        <input class="input" placeholder="Jane Doe" />
        <label class="label">Email</label>
        <input class="input" type="email" placeholder="jane@example.com" />
      </div>
      <div class="body" *ngIf="step === 1">
        <label class="label">Address</label>
        <input class="input" placeholder="123 Main St" />
        <label class="label">City</label>
        <input class="input" placeholder="City" />
      </div>
      <div class="body" *ngIf="step === 2">
        <p class="confirm">Please confirm your details and submit.</p>
      </div>
      <div class="actions">
        <button class="btn-outline" *ngIf="step > 0" (click)="step=step-1">Back</button>
        <button class="btn" *ngIf="step < 2" (click)="step=step+1">Next</button>
        <button class="btn" *ngIf="step === 2">Submit</button>
      </div>
    </div>
  
  \`,
})
export class MultiStepFormComponent {
step = 0;
  stepLabels = ['Personal', 'Address', 'Confirm'];
}

const app = defineMicroApp({
  name: 'multi-step-form',
  async mount({ container }) {
    const el = document.createElement('app-multistep-form');
    container.appendChild(el);
    await bootstrapApplication(MultiStepFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'settings',
    description: 'Settings form with toggle switches and save button',
    tags: ['form', 'settings', 'toggle'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-settings-form',
  template: \`

    <div class="container">
      <h2 class="title">Settings</h2>
      <div class="setting" *ngFor="let s of settings">
        <div>
          <div class="setting-label">{{ s.label }}</div>
          <div class="setting-desc">{{ s.description }}</div>
        </div>
        <button class="toggle" [class.on]="s.enabled" (click)="s.enabled=!s.enabled">
          <span class="knob"></span>
        </button>
      </div>
      <button class="btn">Save Changes</button>
    </div>
  
  \`,
})
export class SettingsFormComponent {
settings = [
    { label: 'Email Notifications', description: 'Receive email alerts', enabled: true },
    { label: 'Dark Mode', description: 'Use dark theme', enabled: false },
    { label: 'Two-Factor Auth', description: 'Extra security layer', enabled: true },
    { label: 'Public Profile', description: 'Show profile publicly', enabled: false },
  ];
}

const app = defineMicroApp({
  name: 'settings-form',
  async mount({ container }) {
    const el = document.createElement('app-settings-form');
    container.appendChild(el);
    await bootstrapApplication(SettingsFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'password-reset',
    description: 'Password reset form with email input and confirmation message',
    tags: ['form', 'password', 'reset'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-password-reset-form',
  template: \`

    <div class="container">
      <h2 class="title">Reset Password</h2>
      <p class="desc" *ngIf="!submitted">Enter your email to receive a password reset link.</p>
      <form *ngIf="!submitted" (submit)="submit($event)">
        <label class="label">Email Address</label>
        <input type="email" class="input" placeholder="you@example.com" />
        <button type="submit" class="btn">Send Reset Link</button>
      </form>
      <div *ngIf="submitted" class="success">
        <p>Check your email for a reset link.</p>
        <button class="btn-outline" (click)="submitted=false">Try another email</button>
      </div>
    </div>
  
  \`,
})
export class PasswordResetFormComponent {
submitted = false;
  submit(e: Event) { e.preventDefault(); this.submitted = true; }
}

const app = defineMicroApp({
  name: 'password-reset-form',
  async mount({ container }) {
    const el = document.createElement('app-password-reset-form');
    container.appendChild(el);
    await bootstrapApplication(PasswordResetFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'checkout',
    description: 'Checkout form with payment and billing details',
    tags: ['form', 'checkout', 'payment'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-checkout-form',
  template: \`

    <div class="container">
      <h2 class="title">Checkout</h2>
      <form (submit)="onSubmit($event)">
        <label class="label">Cardholder Name</label>
        <input class="input" placeholder="Jane Doe" />
        <label class="label">Card Number</label>
        <input class="input" placeholder="4242 4242 4242 4242" />
        <div class="row">
          <div class="col">
            <label class="label">Expiry</label>
            <input class="input" placeholder="MM/YY" />
          </div>
          <div class="col">
            <label class="label">CVC</label>
            <input class="input" placeholder="123" />
          </div>
        </div>
        <div class="total">Total: $49.99</div>
        <button type="submit" class="btn">Pay Now</button>
      </form>
    </div>
  
  \`,
})
export class CheckoutFormComponent {
onSubmit(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'checkout-form',
  async mount({ container }) {
    const el = document.createElement('app-checkout-form');
    container.appendChild(el);
    await bootstrapApplication(CheckoutFormComponent);
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
    description: 'Profile edit form with avatar, name and bio fields',
    tags: ['form', 'profile', 'edit'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-profile-form',
  template: \`

    <div class="container">
      <h2 class="title">Edit Profile</h2>
      <div class="avatar-section">
        <div class="avatar">JD</div>
        <button class="btn-outline">Change Photo</button>
      </div>
      <form (submit)="onSubmit($event)">
        <label class="label">Display Name</label>
        <input class="input" placeholder="Jane Doe" />
        <label class="label">Bio</label>
        <textarea class="textarea" rows="3" placeholder="Tell us about yourself..."></textarea>
        <label class="label">Website</label>
        <input class="input" placeholder="https://example.com" />
        <button type="submit" class="btn">Save Profile</button>
      </form>
    </div>
  
  \`,
})
export class ProfileFormComponent {
onSubmit(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'profile-form',
  async mount({ container }) {
    const el = document.createElement('app-profile-form');
    container.appendChild(el);
    await bootstrapApplication(ProfileFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'filter',
    description: 'Filter form with checkboxes, range and apply button',
    tags: ['form', 'filter', 'search'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-filter-form',
  template: \`

    <div class="container">
      <h3 class="title">Filters</h3>
      <div class="section">
        <div class="section-title">Category</div>
        <label class="checkbox" *ngFor="let cat of categories">
          <input type="checkbox" [checked]="cat.checked" (change)="cat.checked=!cat.checked" />
          {{ cat.label }}
        </label>
      </div>
      <div class="section">
        <div class="section-title">Price Range</div>
        <input type="range" min="0" max="500" class="range" [value]="maxPrice" (input)="maxPrice=$any($event.target).value" />
        <div class="range-label">Up to \${{ maxPrice }}</div>
      </div>
      <button class="btn">Apply Filters</button>
      <button class="btn-link" (click)="reset()">Clear All</button>
    </div>
  
  \`,
})
export class FilterFormComponent {
maxPrice = 250;
  categories = [
    { label: 'Electronics', checked: true },
    { label: 'Clothing', checked: false },
    { label: 'Books', checked: false },
    { label: 'Home', checked: true },
  ];
  reset() { this.maxPrice = 250; this.categories.forEach(c => c.checked = false); }
}

const app = defineMicroApp({
  name: 'filter-form',
  async mount({ container }) {
    const el = document.createElement('app-filter-form');
    container.appendChild(el);
    await bootstrapApplication(FilterFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'newsletter',
    description: 'Newsletter subscription form with email input',
    tags: ['form', 'newsletter', 'subscription'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-newsletter-form',
  template: \`

    <div class="container">
      <h3 class="title">Stay Updated</h3>
      <p class="desc">Subscribe to our newsletter for the latest updates.</p>
      <form class="form-row" (submit)="subscribe($event)" *ngIf="!subscribed">
        <input type="email" class="input" placeholder="Enter your email" />
        <button type="submit" class="btn">Subscribe</button>
      </form>
      <div *ngIf="subscribed" class="success">Thanks for subscribing!</div>
    </div>
  
  \`,
})
export class NewsletterFormComponent {
subscribed = false;
  subscribe(e: Event) { e.preventDefault(); this.subscribed = true; }
}

const app = defineMicroApp({
  name: 'newsletter-form',
  async mount({ container }) {
    const el = document.createElement('app-newsletter-form');
    container.appendChild(el);
    await bootstrapApplication(NewsletterFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'survey',
    description: 'Survey form with radio buttons and rating scale',
    tags: ['form', 'survey', 'feedback'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-survey-form',
  template: \`

    <div class="container">
      <h2 class="title">Quick Survey</h2>
      <div class="question">
        <p class="q-text">How would you rate your experience?</p>
        <div class="rating">
          <button *ngFor="let n of [1,2,3,4,5]" class="rate-btn" [class.selected]="rating===n" (click)="rating=n">{{ n }}</button>
        </div>
      </div>
      <div class="question">
        <p class="q-text">Would you recommend us?</p>
        <label class="radio"><input type="radio" name="recommend" (click)="recommend='yes'" /> Yes</label>
        <label class="radio"><input type="radio" name="recommend" (click)="recommend='no'" /> No</label>
      </div>
      <label class="label">Additional Feedback</label>
      <textarea class="textarea" rows="3" placeholder="Optional..."></textarea>
      <button class="btn">Submit Survey</button>
    </div>
  
  \`,
})
export class SurveyFormComponent {
rating = 0;
  recommend = '';
}

const app = defineMicroApp({
  name: 'survey-form',
  async mount({ container }) {
    const el = document.createElement('app-survey-form');
    container.appendChild(el);
    await bootstrapApplication(SurveyFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'address',
    description: 'Address form with street, city, state and zip fields',
    tags: ['form', 'address', 'shipping'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-address-form',
  template: \`

    <div class="container">
      <h2 class="title">Shipping Address</h2>
      <form (submit)="onSubmit($event)">
        <label class="label">Street Address</label>
        <input class="input" placeholder="123 Main Street" />
        <label class="label">Apartment, suite, etc.</label>
        <input class="input" placeholder="Apt 4B" />
        <div class="row">
          <div class="col">
            <label class="label">City</label>
            <input class="input" placeholder="New York" />
          </div>
          <div class="col-sm">
            <label class="label">State</label>
            <input class="input" placeholder="NY" />
          </div>
          <div class="col-sm">
            <label class="label">Zip</label>
            <input class="input" placeholder="10001" />
          </div>
        </div>
        <button type="submit" class="btn">Save Address</button>
      </form>
    </div>
  
  \`,
})
export class AddressFormComponent {
onSubmit(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'address-form',
  async mount({ container }) {
    const el = document.createElement('app-address-form');
    container.appendChild(el);
    await bootstrapApplication(AddressFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'payment',
    description: 'Payment method form with card type selection',
    tags: ['form', 'payment', 'card'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-payment-form',
  template: \`

    <div class="container">
      <h2 class="title">Payment Method</h2>
      <div class="methods">
        <button *ngFor="let m of methods" class="method" [class.selected]="selected===m" (click)="selected=m">{{ m }}</button>
      </div>
      <form (submit)="onSubmit($event)">
        <label class="label">Card Number</label>
        <input class="input" placeholder="1234 5678 9012 3456" />
        <div class="row">
          <div class="col">
            <label class="label">Expiry Date</label>
            <input class="input" placeholder="MM/YY" />
          </div>
          <div class="col">
            <label class="label">CVV</label>
            <input class="input" placeholder="***" />
          </div>
        </div>
        <button type="submit" class="btn">Add Payment Method</button>
      </form>
    </div>
  
  \`,
})
export class PaymentFormComponent {
selected = 'Visa';
  methods = ['Visa', 'Mastercard', 'Amex', 'PayPal'];
  onSubmit(e: Event) { e.preventDefault(); }
}

const app = defineMicroApp({
  name: 'payment-form',
  async mount({ container }) {
    const el = document.createElement('app-payment-form');
    container.appendChild(el);
    await bootstrapApplication(PaymentFormComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'file-upload',
    description: 'File upload form with drag-and-drop area and file list',
    tags: ['form', 'upload', 'file'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-upload-form',
  template: \`

    <div class="container">
      <h2 class="title">Upload Files</h2>
      <div class="dropzone" (dragover)="onDragOver($event)" (drop)="onDrop($event)" (click)="fileInput.click()">
        <p class="drop-text">Drag files here or click to browse</p>
        <p class="drop-hint">Max 10MB per file</p>
        <input #fileInput type="file" class="hidden" multiple (change)="onFiles($event)" />
      </div>
      <div class="file-list" *ngIf="files.length">
        <div class="file-item" *ngFor="let f of files; let i = index">
          <span class="file-name">{{ f }}</span>
          <button class="remove-btn" (click)="files.splice(i, 1)">\\u2715</button>
        </div>
      </div>
      <button class="btn" *ngIf="files.length">Upload {{ files.length }} file(s)</button>
    </div>
  
  \`,
})
export class UploadFormComponent {
files: string[] = [];
  onDragOver(e: DragEvent) { e.preventDefault(); }
  onDrop(e: DragEvent) { e.preventDefault(); if (e.dataTransfer) { this.addFiles(e.dataTransfer.files); } }
  onFiles(e: Event) { const input = e.target as HTMLInputElement; if (input.files) { this.addFiles(input.files); } }
  addFiles(fileList: FileList) { Array.from(fileList).forEach(f => this.files.push(f.name)); }
}

const app = defineMicroApp({
  name: 'file-upload-form',
  async mount({ container }) {
    const el = document.createElement('app-upload-form');
    container.appendChild(el);
    await bootstrapApplication(UploadFormComponent);
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
