import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'login',
    description: 'Login form with email and password fields',
    tags: ['form', 'login', 'auth'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 400px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  \`]
})
export class LoginFormComponent {
  email = '';
  password = '';
  onSubmit(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [LoginFormComponent],
  imports: [BrowserModule],
  bootstrap: [LoginFormComponent],
})
export class LoginFormModule {}

export default createAngularMicroApp({
  name: 'login-form',
  module: LoginFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'signup',
    description: 'Signup form with name, email, password and confirm password',
    tags: ['form', 'signup', 'registration'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 420px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
    .footer-text { margin-top: 16px; font-size: 13px; text-align: center; color: #6b7280; }
    .footer-text a { color: #6366f1; text-decoration: none; }
  \`]
})
export class SignupFormComponent {
  onSubmit(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [SignupFormComponent],
  imports: [BrowserModule],
  bootstrap: [SignupFormComponent],
})
export class SignupFormModule {}

export default createAngularMicroApp({
  name: 'signup-form',
  module: SignupFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'contact',
    description: 'Contact form with name, email, subject and message fields',
    tags: ['form', 'contact', 'message'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input, .textarea { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; }
    .textarea { resize: vertical; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  \`]
})
export class ContactFormComponent {
  onSubmit(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [ContactFormComponent],
  imports: [BrowserModule],
  bootstrap: [ContactFormComponent],
})
export class ContactFormModule {}

export default createAngularMicroApp({
  name: 'contact-form',
  module: ContactFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'search',
    description: 'Search form with input, filters and submit button',
    tags: ['form', 'search', 'filter'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 600px; margin: 40px auto; }
    .search-form { display: flex; gap: 8px; }
    .input { flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; }
    .select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: #fff; }
    .btn { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  \`]
})
export class SearchFormComponent {
  query = '';
  category = 'all';
  onSubmit(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [SearchFormComponent],
  imports: [BrowserModule],
  bootstrap: [SearchFormComponent],
})
export class SearchFormModule {}

export default createAngularMicroApp({
  name: 'search-form',
  module: SearchFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'multi-step',
    description: 'Multi-step form with progress indicator and step navigation',
    tags: ['form', 'multi-step', 'wizard'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .steps { display: flex; gap: 16px; margin-bottom: 24px; }
    .step { font-size: 13px; color: #9ca3af; font-weight: 600; }
    .step.active { color: #6366f1; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; }
    .confirm { color: #6b7280; font-size: 14px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .btn { padding: 10px 24px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-outline { padding: 10px 24px; background: transparent; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
  \`]
})
export class MultiStepFormComponent {
  step = 0;
  stepLabels = ['Personal', 'Address', 'Confirm'];
}

@NgModule({
  declarations: [MultiStepFormComponent],
  imports: [BrowserModule],
  bootstrap: [MultiStepFormComponent],
})
export class MultiStepFormModule {}

export default createAngularMicroApp({
  name: 'multi-step-form',
  module: MultiStepFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'settings',
    description: 'Settings form with toggle switches and save button',
    tags: ['form', 'settings', 'toggle'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .setting { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #f3f4f6; }
    .setting-label { font-size: 14px; font-weight: 600; }
    .setting-desc { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .toggle { width: 44px; height: 24px; border-radius: 12px; border: none; background: #d1d5db; cursor: pointer; position: relative; transition: background 0.2s; padding: 0; }
    .toggle.on { background: #6366f1; }
    .knob { display: block; width: 18px; height: 18px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: transform 0.2s; }
    .toggle.on .knob { transform: translateX(20px); }
    .btn { margin-top: 24px; width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  \`]
})
export class SettingsFormComponent {
  settings = [
    { label: 'Email Notifications', description: 'Receive email alerts', enabled: true },
    { label: 'Dark Mode', description: 'Use dark theme', enabled: false },
    { label: 'Two-Factor Auth', description: 'Extra security layer', enabled: true },
    { label: 'Public Profile', description: 'Show profile publicly', enabled: false },
  ];
}

@NgModule({
  declarations: [SettingsFormComponent],
  imports: [BrowserModule],
  bootstrap: [SettingsFormComponent],
})
export class SettingsFormModule {}

export default createAngularMicroApp({
  name: 'settings-form',
  module: SettingsFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'password-reset',
    description: 'Password reset form with email input and confirmation message',
    tags: ['form', 'password', 'reset'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 400px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; text-align: center; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
    .desc { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; text-align: left; }
    .input { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
    .success { padding: 16px 0; }
    .success p { color: #10b981; font-weight: 600; margin-bottom: 16px; }
    .btn-outline { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: transparent; cursor: pointer; }
  \`]
})
export class PasswordResetFormComponent {
  submitted = false;
  submit(e: Event) { e.preventDefault(); this.submitted = true; }
}

@NgModule({
  declarations: [PasswordResetFormComponent],
  imports: [BrowserModule],
  bootstrap: [PasswordResetFormComponent],
})
export class PasswordResetFormModule {}

export default createAngularMicroApp({
  name: 'password-reset-form',
  module: PasswordResetFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'checkout',
    description: 'Checkout form with payment and billing details',
    tags: ['form', 'checkout', 'payment'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 440px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; }
    .row { display: flex; gap: 12px; }
    .col { flex: 1; }
    .total { font-size: 18px; font-weight: 700; margin: 8px 0 16px; }
    .btn { width: 100%; padding: 12px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
  \`]
})
export class CheckoutFormComponent {
  onSubmit(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [CheckoutFormComponent],
  imports: [BrowserModule],
  bootstrap: [CheckoutFormComponent],
})
export class CheckoutFormModule {}

export default createAngularMicroApp({
  name: 'checkout-form',
  module: CheckoutFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'profile',
    description: 'Profile edit form with avatar, name and bio fields',
    tags: ['form', 'profile', 'edit'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 460px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .avatar-section { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .avatar { width: 56px; height: 56px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: 700; }
    .btn-outline { padding: 6px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: transparent; cursor: pointer; font-size: 13px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input, .textarea { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; }
    .textarea { resize: vertical; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  \`]
})
export class ProfileFormComponent {
  onSubmit(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [ProfileFormComponent],
  imports: [BrowserModule],
  bootstrap: [ProfileFormComponent],
})
export class ProfileFormModule {}

export default createAngularMicroApp({
  name: 'profile-form',
  module: ProfileFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'filter',
    description: 'Filter form with checkboxes, range and apply button',
    tags: ['form', 'filter', 'search'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { width: 260px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 16px; font-weight: 700; margin: 0 0 16px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #374151; }
    .checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 6px; cursor: pointer; color: #374151; }
    .range { width: 100%; }
    .range-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 8px; }
    .btn-link { width: 100%; background: none; border: none; color: #6366f1; font-size: 13px; cursor: pointer; }
  \`]
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

@NgModule({
  declarations: [FilterFormComponent],
  imports: [BrowserModule],
  bootstrap: [FilterFormComponent],
})
export class FilterFormModule {}

export default createAngularMicroApp({
  name: 'filter-form',
  module: FilterFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'newsletter',
    description: 'Newsletter subscription form with email input',
    tags: ['form', 'newsletter', 'subscription'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 480px; margin: 40px auto; padding: 32px; background: #f9fafb; border-radius: 12px; text-align: center; }
    .title { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
    .desc { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
    .form-row { display: flex; gap: 8px; }
    .input { flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; }
    .btn { padding: 10px 24px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .success { color: #10b981; font-weight: 600; font-size: 15px; }
  \`]
})
export class NewsletterFormComponent {
  subscribed = false;
  subscribe(e: Event) { e.preventDefault(); this.subscribed = true; }
}

@NgModule({
  declarations: [NewsletterFormComponent],
  imports: [BrowserModule],
  bootstrap: [NewsletterFormComponent],
})
export class NewsletterFormModule {}

export default createAngularMicroApp({
  name: 'newsletter-form',
  module: NewsletterFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'survey',
    description: 'Survey form with radio buttons and rating scale',
    tags: ['form', 'survey', 'feedback'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 460px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .question { margin-bottom: 20px; }
    .q-text { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .rating { display: flex; gap: 8px; }
    .rate-btn { width: 40px; height: 40px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; font-weight: 600; }
    .rate-btn.selected { background: #6366f1; color: #fff; border-color: #6366f1; }
    .radio { display: flex; align-items: center; gap: 6px; margin-right: 16px; font-size: 14px; cursor: pointer; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .textarea { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; resize: vertical; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  \`]
})
export class SurveyFormComponent {
  rating = 0;
  recommend = '';
}

@NgModule({
  declarations: [SurveyFormComponent],
  imports: [BrowserModule],
  bootstrap: [SurveyFormComponent],
})
export class SurveyFormModule {}

export default createAngularMicroApp({
  name: 'survey-form',
  module: SurveyFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'address',
    description: 'Address form with street, city, state and zip fields',
    tags: ['form', 'address', 'shipping'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; }
    .row { display: flex; gap: 12px; }
    .col { flex: 2; }
    .col-sm { flex: 1; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  \`]
})
export class AddressFormComponent {
  onSubmit(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [AddressFormComponent],
  imports: [BrowserModule],
  bootstrap: [AddressFormComponent],
})
export class AddressFormModule {}

export default createAngularMicroApp({
  name: 'address-form',
  module: AddressFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'payment',
    description: 'Payment method form with card type selection',
    tags: ['form', 'payment', 'card'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 440px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 20px; }
    .methods { display: flex; gap: 8px; margin-bottom: 24px; }
    .method { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; }
    .method.selected { border-color: #6366f1; background: #ede9fe; color: #6366f1; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; }
    .row { display: flex; gap: 12px; }
    .col { flex: 1; }
    .btn { width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  \`]
})
export class PaymentFormComponent {
  selected = 'Visa';
  methods = ['Visa', 'Mastercard', 'Amex', 'PayPal'];
  onSubmit(e: Event) { e.preventDefault(); }
}

@NgModule({
  declarations: [PaymentFormComponent],
  imports: [BrowserModule],
  bootstrap: [PaymentFormComponent],
})
export class PaymentFormModule {}

export default createAngularMicroApp({
  name: 'payment-form',
  module: PaymentFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'file-upload',
    description: 'File upload form with drag-and-drop area and file list',
    tags: ['form', 'upload', 'file'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .container { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0 0 24px; }
    .dropzone { border: 2px dashed #d1d5db; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
    .dropzone:hover { border-color: #6366f1; }
    .drop-text { font-size: 15px; font-weight: 600; color: #374151; margin: 0 0 4px; }
    .drop-hint { font-size: 12px; color: #9ca3af; margin: 0; }
    .hidden { display: none; }
    .file-list { margin-top: 16px; }
    .file-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 4px; }
    .file-name { font-size: 13px; color: #374151; }
    .remove-btn { background: none; border: none; cursor: pointer; color: #ef4444; font-size: 14px; }
    .btn { margin-top: 16px; width: 100%; padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  \`]
})
export class UploadFormComponent {
  files: string[] = [];
  onDragOver(e: DragEvent) { e.preventDefault(); }
  onDrop(e: DragEvent) { e.preventDefault(); if (e.dataTransfer) { this.addFiles(e.dataTransfer.files); } }
  onFiles(e: Event) { const input = e.target as HTMLInputElement; if (input.files) { this.addFiles(input.files); } }
  addFiles(fileList: FileList) { Array.from(fileList).forEach(f => this.files.push(f.name)); }
}

@NgModule({
  declarations: [UploadFormComponent],
  imports: [BrowserModule],
  bootstrap: [UploadFormComponent],
})
export class UploadFormModule {}

export default createAngularMicroApp({
  name: 'file-upload-form',
  module: UploadFormModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;
