import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div class="profile-card">
      <h2>Profile App</h2>
      <p>A second Angular application, bootstrapped on its own.</p>
      <div class="prop-badge" data-testid="profile-theme">
        Theme prop: {{ theme || 'default' }}
      </div>
    </div>
  `,
  styles: [
    `
      .profile-card {
        padding: 24px;
        background: #222831;
        border-radius: 12px;
      }
      h2 {
        margin: 0 0 16px;
        color: #f2a365;
      }
      p {
        color: #aaa;
        margin-bottom: 16px;
        font-size: 14px;
      }
      .prop-badge {
        display: inline-block;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        font-size: 14px;
      }
    `,
  ],
})
export class ProfileApp {
  @Input() theme = '';
}
