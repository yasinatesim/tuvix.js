import { ChangeDetectorRef, Component, Input, inject } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="home-card">
      <h2>Home App</h2>
      <p>
        An Angular 16 standalone component mounted by
        <code>@tuvix.js/angular</code>.
      </p>
      <div *ngIf="name" class="prop-badge" data-testid="home-greeting">
        Hello, {{ name }} (prop received from shell)
      </div>
      <button type="button" data-testid="home-counter" (click)="increment()">
        Clicked {{ count }} times
      </button>
    </div>
  `,
  styles: [
    `
      .home-card {
        padding: 24px;
        background: #30475e;
        border-radius: 12px;
      }
      h2 {
        margin: 0 0 16px;
        color: #f05454;
      }
      p {
        color: #e0e0e0;
        margin-bottom: 16px;
        font-size: 14px;
      }
      .prop-badge {
        display: inline-block;
        padding: 8px 16px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        font-size: 14px;
        color: #a7f3d0;
      }
      button {
        display: block;
        margin-top: 16px;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }
    `,
  ],
})
export class HomeApp {
  @Input() name = '';

  count = 0;

  private readonly cdr = inject(ChangeDetectorRef);

  increment(): void {
    this.count += 1;
    // The adapter runs Angular 16 without zone.js, so nothing schedules change
    // detection after a DOM event. Run it here. Angular 18+ does this for you.
    this.cdr.detectChanges();
  }
}
