import { Component, Input, OnInit, OnDestroy, ApplicationRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { defineMicroApp } from '@tuvix.js/angular';
import { createEventBus } from 'tuvix.js';

// Module-level bus so it can be shared across apps loaded in the same context
const bus = createEventBus();

// Props are passed via a module-level variable before bootstrapping because
// Angular standalone bootstrap does not support runtime input injection.
let initialUser = 'Guest';

@Component({
  selector: 'tuvix-profile',
  standalone: true,
  imports: [NgIf],
  template: `
    <div>
      <h1>Profile</h1>
      <p>Hello, {{ user }}!</p>
      <p *ngIf="loggedIn">You are logged in.</p>
      <button (click)="simulateLogin()">Simulate Login</button>
    </div>
  `,
})
class ProfileComponent implements OnInit, OnDestroy {
  @Input() user = initialUser;
  loggedIn = false;
  private off?: () => void;

  ngOnInit() {
    this.off = bus.on('user:login', (data) => {
      this.loggedIn = true;
      console.log(`[profile] ${data.name} logged in`);
    });
  }

  ngOnDestroy() {
    this.off?.();
  }

  simulateLogin() {
    bus.emit('user:login', { name: this.user });
  }
}

let appRef: ApplicationRef | null = null;

export default defineMicroApp({
  name: 'profile',

  bootstrap() {
    console.log('[profile] bootstrapped');
  },

  async mount({ container, props }) {
    initialUser = props?.user ?? 'Guest';

    // Insert a host element into the orchestrator-provided container so Angular
    // has a mount target without touching document.body.
    const host = document.createElement('tuvix-profile');
    container.appendChild(host);

    appRef = await bootstrapApplication(ProfileComponent);
  },

  unmount({ container }) {
    appRef?.destroy();
    appRef = null;
    container.innerHTML = '';
  },
});
