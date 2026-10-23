import { Component, Input, computed, signal } from '@angular/core';

/**
 * Standalone component, compiled just in time in the browser. The adapter
 * loads `@angular/compiler` before Angular's other packages, so this file
 * does not import it.
 */
@Component({
  selector: 'contact-island',
  template: `
    <section class="contact">
      <h2>{{ heading }}</h2>
      <p class="status" data-testid="angular-status">{{ status() }}</p>
      <div class="row">
        <button type="button" data-testid="angular-send" (click)="send()">
          Send message
        </button>
        <a href="/" data-testid="angular-link">Back to home</a>
      </div>
    </section>
  `,
  styles: [
    `
      .contact {
        display: block;
        border: 2px solid rgb(221, 0, 49);
        border-radius: 12px;
        padding: 1.25rem;
        background: rgb(255, 240, 243);
      }
      h2 {
        margin: 0 0 0.5rem;
        color: rgb(195, 0, 47);
        font-size: 1.25rem;
      }
      .status {
        margin: 0 0 1rem;
      }
      .row {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 0.5rem 1rem;
        background: rgb(221, 0, 49);
        color: white;
        font: inherit;
        cursor: pointer;
      }
      a {
        color: rgb(195, 0, 47);
        font-weight: 600;
      }
    `,
  ],
})
export class ContactComponent {
  @Input() heading = 'Angular contact island';

  // A signal write schedules change detection in zoneless Angular 20, so the
  // click handler needs no zone.js and no manual `detectChanges()`.
  private readonly sent = signal(0);
  readonly status = computed(() =>
    this.sent() === 0
      ? 'No messages sent yet.'
      : `Messages sent: ${this.sent()}`
  );

  send(): void {
    this.sent.update((count) => count + 1);
  }
}
