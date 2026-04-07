import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'login',
    description: 'Login form with email and password fields',
    tags: ['form', 'login', 'auth'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('All fields are required'); return; }
    setError('');
    console.log('Login:', { email });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>Log In</h2>
      {error && <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
      <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
      <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '24px', outline: 'none', boxSizing: 'border-box' }} />
      <button type="submit" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>Sign In</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'login-form', App: LoginForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'signup',
    description: 'Signup form with name, email, password, and confirm password',
    tags: ['form', 'signup', 'registration'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SignupForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<string[]>([]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!form.name) errs.push('Name is required');
    if (!form.email.includes('@')) errs.push('Valid email required');
    if (form.password.length < 8) errs.push('Password must be 8+ chars');
    if (form.password !== form.confirm) errs.push('Passwords must match');
    setErrors(errs);
    if (errs.length === 0) console.log('Signup:', form);
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' as const };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '420px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>Create Account</h2>
      {errors.length > 0 && <ul style={{ padding: '8px 12px 8px 28px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <input placeholder="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
      <input type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} style={inputStyle} />
      <input type="password" placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} style={inputStyle} />
      <input type="password" placeholder="Confirm Password" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} style={inputStyle} />
      <button type="submit" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Sign Up</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'signup-form', App: SignupForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'contact',
    description: 'Contact form with name, email, subject, and message fields',
    tags: ['form', 'contact', 'message'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' as const };

  if (sent) return <div style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', textAlign: 'center' }}><h3 style={{ color: '#10b981' }}>Message sent!</h3><p style={{ color: '#6b7280' }}>We will get back to you soon.</p></div>;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700 }}>Contact Us</h2>
      <input placeholder="Your Name" value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
      <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => update('email', e.target.value)} style={inputStyle} />
      <input placeholder="Subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} style={inputStyle} />
      <textarea placeholder="Your message..." value={form.message} onChange={(e) => update('message', e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
      <button type="submit" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Send Message</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'contact-form', App: ContactForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'search',
    description: 'Search form with auto-suggest and recent searches',
    tags: ['form', 'search', 'autocomplete'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SearchForm() {
  const [query, setQuery] = useState('');
  const [recent] = useState(['React hooks', 'CSS Grid', 'TypeScript generics']);
  const suggestions = ['React micro-frontends', 'React state management', 'React testing', 'React performance'].filter((s) => query && s.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '24px' }}>
      <form onSubmit={(e) => { e.preventDefault(); console.log('Search:', query); }} style={{ position: 'relative' }}>
        <input type="text" placeholder="Search documentation..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} />
        {suggestions.length > 0 && (
          <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '4px', listStyle: 'none', padding: '4px 0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {suggestions.map((s) => <li key={s} onClick={() => setQuery(s)} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '14px' }}>{s}</li>)}
          </ul>
        )}
      </form>
      {!query && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Recent searches</div>
          {recent.map((r) => <button key={r} onClick={() => setQuery(r)} style={{ display: 'inline-block', marginRight: '8px', marginBottom: '8px', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '16px', background: '#f9fafb', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>{r}</button>)}
        </div>
      )}
    </div>
  );
}

const app = createReactMicroApp({ name: 'search-form', App: SearchForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'multi-step',
    description: 'Multi-step wizard form with progress indicator',
    tags: ['form', 'multi-step', 'wizard'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: '', email: '', plan: 'basic', agree: false });
  const steps = ['Personal', 'Plan', 'Confirm'];

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '16px' };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: i <= step ? '#6366f1' : '#e5e7eb', color: i <= step ? '#fff' : '#9ca3af', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}>{i + 1}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{s}</div>
          </div>
        ))}
      </div>
      {step === 0 && (<div><input placeholder="Full Name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} style={inputStyle} /><input type="email" placeholder="Email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} style={inputStyle} /></div>)}
      {step === 1 && (<div>{['basic', 'pro', 'enterprise'].map((p) => (<label key={p} style={{ display: 'block', padding: '12px', border: data.plan === p ? '2px solid #6366f1' : '1px solid #d1d5db', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}><input type="radio" name="plan" checked={data.plan === p} onChange={() => setData({ ...data, plan: p })} style={{ marginRight: '8px' }} />{p.charAt(0).toUpperCase() + p.slice(1)}</label>))}</div>)}
      {step === 2 && (<div style={{ fontSize: '14px', color: '#374151' }}><p>Name: {data.name}</p><p>Email: {data.email}</p><p>Plan: {data.plan}</p></div>)}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.4 : 1 }}>Back</button>
        <button onClick={() => step < 2 ? setStep(step + 1) : console.log('Submit:', data)} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{step === 2 ? 'Submit' : 'Next'}</button>
      </div>
    </div>
  );
}

const app = createReactMicroApp({ name: 'multi-step-form', App: MultiStepForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'settings',
    description: 'Settings form with toggles, selects, and save button',
    tags: ['form', 'settings', 'preferences'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SettingsForm() {
  const [settings, setSettings] = useState({ language: 'en', timezone: 'UTC', notifications: true, newsletter: false, theme: 'light' });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const selectStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '16px', backgroundColor: '#fff' };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: '500px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700 }}>Settings</h2>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Language</label>
      <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} style={selectStyle}>
        <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option>
      </select>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Theme</label>
      <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })} style={selectStyle}>
        <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
      </select>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: '14px' }}>Email Notifications</span>
        <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #f3f4f6', marginBottom: '20px' }}>
        <span style={{ fontSize: '14px' }}>Newsletter</span>
        <input type="checkbox" checked={settings.newsletter} onChange={(e) => setSettings({ ...settings, newsletter: e.target.checked })} />
      </div>
      <button type="submit" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{saved ? 'Saved!' : 'Save Changes'}</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'settings-form', App: SettingsForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'password-reset',
    description: 'Password reset form with email verification step',
    tags: ['form', 'password', 'reset'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function PasswordResetForm() {
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (email.includes('@')) setStep('sent'); };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', textAlign: 'center' }}>
      {step === 'email' ? (
        <form onSubmit={handleSubmit}>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700 }}>Reset Password</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Enter your email to receive a reset link</p>
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
          <button type="submit" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Send Reset Link</button>
        </form>
      ) : (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>\\u2709</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700 }}>Check Your Email</h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>We sent a reset link to <strong>{email}</strong></p>
          <button onClick={() => setStep('email')} style={{ marginTop: '20px', padding: '10px 24px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Try different email</button>
        </div>
      )}
    </div>
  );
}

const app = createReactMicroApp({ name: 'password-reset-form', App: PasswordResetForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'checkout',
    description: 'Checkout form with billing and payment sections',
    tags: ['form', 'checkout', 'payment'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function CheckoutForm() {
  const [form, setForm] = useState({ name: '', address: '', city: '', zip: '', cardNumber: '', expiry: '', cvv: '' });
  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '12px' };

  return (
    <form onSubmit={(e) => { e.preventDefault(); console.log('Checkout:', form); }} style={{ maxWidth: '500px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700 }}>Checkout</h2>
      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>Billing Address</h3>
      <input placeholder="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
      <input placeholder="Street Address" value={form.address} onChange={(e) => update('address', e.target.value)} style={inputStyle} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <input placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <input placeholder="ZIP" value={form.zip} onChange={(e) => update('zip', e.target.value)} style={{ ...inputStyle, width: '120px' }} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '16px 0 12px', color: '#374151' }}>Payment</h3>
      <input placeholder="Card Number" value={form.cardNumber} onChange={(e) => update('cardNumber', e.target.value)} style={inputStyle} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <input placeholder="MM/YY" value={form.expiry} onChange={(e) => update('expiry', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <input placeholder="CVV" value={form.cvv} onChange={(e) => update('cvv', e.target.value)} style={{ ...inputStyle, width: '100px' }} />
      </div>
      <button type="submit" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: '8px', fontSize: '15px' }}>Pay Now</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'checkout-form', App: CheckoutForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'profile',
    description: 'Profile edit form with avatar, bio, and social links',
    tags: ['form', 'profile', 'edit'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ProfileForm() {
  const [profile, setProfile] = useState({ displayName: 'Jane Doe', bio: 'Software developer', website: '', twitter: '' });
  const update = (field: string, value: string) => setProfile((p) => ({ ...p, [field]: value }));
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '16px' };

  return (
    <form onSubmit={(e) => { e.preventDefault(); console.log('Update profile:', profile); }} style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700 }}>Edit Profile</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: 700 }}>JD</div>
        <button type="button" style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Change Avatar</button>
      </div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Display Name</label>
      <input value={profile.displayName} onChange={(e) => update('displayName', e.target.value)} style={inputStyle} />
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Bio</label>
      <textarea value={profile.bio} onChange={(e) => update('bio', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Website</label>
      <input placeholder="https://..." value={profile.website} onChange={(e) => update('website', e.target.value)} style={inputStyle} />
      <button type="submit" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save Profile</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'profile-form', App: ProfileForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'filter',
    description: 'Filter form with checkboxes, range slider, and clear button',
    tags: ['form', 'filter', 'sidebar'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function FilterForm() {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
  const [selected, setSelected] = useState<string[]>(['Electronics']);
  const [priceRange, setPriceRange] = useState(100);

  const toggleCat = (cat: string) => setSelected((s) => s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat]);

  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ width: '260px', padding: '20px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Filters</h3>
        <button type="button" onClick={() => { setSelected([]); setPriceRange(100); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '13px' }}>Clear All</button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Category</div>
        {categories.map((cat) => (
          <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={selected.includes(cat)} onChange={() => toggleCat(cat)} />
            {cat}
          </label>
        ))}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Max Price: {priceRange}</div>
        <input type="range" min={0} max={500} value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
      <button type="submit" style={{ width: '100%', marginTop: '20px', padding: '10px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Apply Filters</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'filter-form', App: FilterForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'newsletter',
    description: 'Newsletter subscription form with email input',
    tags: ['form', 'newsletter', 'email'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) setSubscribed(true);
  };

  if (subscribed) return (
    <div style={{ maxWidth: '460px', margin: '40px auto', padding: '32px', backgroundColor: '#f0fdf4', borderRadius: '12px', textAlign: 'center' }}>
      <h3 style={{ color: '#16a34a', margin: '0 0 8px' }}>Subscribed!</h3>
      <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Check {email} for confirmation.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '460px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700 }}>Stay Updated</h2>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Get the latest articles and updates in your inbox</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }} />
        <button type="submit" style={{ padding: '12px 24px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
      </form>
    </div>
  );
}

const app = createReactMicroApp({ name: 'newsletter-form', App: NewsletterForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'survey',
    description: 'Survey form with rating scale and text feedback',
    tags: ['form', 'survey', 'feedback'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SurveyForm() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return <div style={{ maxWidth: '460px', margin: '40px auto', padding: '32px', textAlign: 'center' }}><h3 style={{ color: '#10b981' }}>Thanks for your feedback!</h3></div>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ maxWidth: '460px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700 }}>Quick Survey</h2>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>How would you rate your experience?</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} style={{ width: '48px', height: '48px', borderRadius: '50%', border: rating >= n ? '2px solid #6366f1' : '1px solid #d1d5db', backgroundColor: rating >= n ? '#ede9fe' : '#fff', color: rating >= n ? '#6366f1' : '#9ca3af', fontWeight: 700, fontSize: '18px', cursor: 'pointer' }}>{n}</button>
        ))}
      </div>
      <textarea placeholder="Additional feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', resize: 'vertical', marginBottom: '20px', boxSizing: 'border-box' }} />
      <button type="submit" disabled={rating === 0} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: rating > 0 ? '#6366f1' : '#d1d5db', color: '#fff', fontWeight: 600, cursor: rating > 0 ? 'pointer' : 'default' }}>Submit</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'survey-form', App: SurveyForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'address',
    description: 'Address form with country selector and auto-format',
    tags: ['form', 'address', 'shipping'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function AddressForm() {
  const [form, setForm] = useState({ street: '', apt: '', city: '', state: '', zip: '', country: 'US' });
  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '12px' };

  return (
    <form onSubmit={(e) => { e.preventDefault(); console.log('Address:', form); }} style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700 }}>Shipping Address</h2>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Country</label>
      <select value={form.country} onChange={(e) => update('country', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }}>
        <option value="US">United States</option><option value="CA">Canada</option><option value="UK">United Kingdom</option><option value="DE">Germany</option><option value="FR">France</option>
      </select>
      <input placeholder="Street Address" value={form.street} onChange={(e) => update('street', e.target.value)} style={inputStyle} />
      <input placeholder="Apt, Suite, Unit (optional)" value={form.apt} onChange={(e) => update('apt', e.target.value)} style={inputStyle} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <input placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} style={{ ...inputStyle, flex: 2 }} />
        <input placeholder="State" value={form.state} onChange={(e) => update('state', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
      </div>
      <input placeholder="ZIP / Postal Code" value={form.zip} onChange={(e) => update('zip', e.target.value)} style={{ ...inputStyle, width: '160px' }} />
      <button type="submit" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>Save Address</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'address-form', App: AddressForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'payment',
    description: 'Payment method form with card type detection',
    tags: ['form', 'payment', 'card'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function PaymentForm() {
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const update = (field: string, value: string) => setCard((c) => ({ ...c, [field]: value }));

  const getCardType = (num: string): string => {
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5')) return 'Mastercard';
    if (num.startsWith('3')) return 'Amex';
    return 'Card';
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '12px' };

  return (
    <form onSubmit={(e) => { e.preventDefault(); console.log('Payment:', card); }} style={{ maxWidth: '420px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700 }}>Payment Method</h2>
      <div style={{ position: 'relative' }}>
        <input placeholder="Card Number" value={card.number} onChange={(e) => update('number', e.target.value.replace(/\\D/g, '').slice(0, 16))} style={inputStyle} />
        {card.number && <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>{getCardType(card.number)}</span>}
      </div>
      <input placeholder="Name on Card" value={card.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <input placeholder="MM/YY" value={card.expiry} onChange={(e) => update('expiry', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <input placeholder="CVV" type="password" value={card.cvv} onChange={(e) => update('cvv', e.target.value.slice(0, 4))} style={{ ...inputStyle, width: '100px' }} />
      </div>
      <button type="submit" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '15px', marginTop: '8px' }}>Add Payment Method</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'payment-form', App: PaymentForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'file-upload',
    description: 'File upload form with drag-and-drop zone and file list',
    tags: ['form', 'upload', 'file'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useRef } from 'react';

function FileUploadForm() {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map((f) => ({ name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(1) + ' KB';

  return (
    <form onSubmit={(e) => { e.preventDefault(); console.log('Upload:', files); }} style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700 }}>Upload Files</h2>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
        style={{ border: '2px dashed ' + (dragOver ? '#6366f1' : '#d1d5db'), borderRadius: '10px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', backgroundColor: dragOver ? '#ede9fe' : '#f9fafb', transition: 'all 0.2s', marginBottom: '16px' }}
      >
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Drag & drop files here or click to browse</div>
        <input ref={inputRef} type="file" multiple onChange={(e) => e.target.files && addFiles(e.target.files)} style={{ display: 'none' }} />
      </div>
      {files.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          {files.map((f, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
              <span style={{ color: '#374151' }}>{f.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>{formatSize(f.size)}</span>
                <button type="button" onClick={() => setFiles((fl) => fl.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>\\u2715</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="submit" disabled={files.length === 0} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: files.length > 0 ? '#6366f1' : '#d1d5db', color: '#fff', fontWeight: 600, cursor: files.length > 0 ? 'pointer' : 'default' }}>Upload {files.length > 0 ? \`(\${files.length})\` : ''}</button>
    </form>
  );
}

const app = createReactMicroApp({ name: 'file-upload-form', App: FileUploadForm });
app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;
