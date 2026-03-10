import { Component, ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { defineMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'tuvix-home',
  standalone: true,
  template: `
    <div>
      <h1>Home</h1>
      <p>Welcome to the Home micro frontend (Angular).</p>
    </div>
  `,
})
class HomeComponent {}

let appRef: ApplicationRef | null = null;

export default defineMicroApp({
  name: 'home',

  bootstrap() {
    console.log('[home] bootstrapped');
  },

  async mount({ container }) {
    // Insert a host element into the orchestrator-provided container so Angular
    // has a mount target without touching document.body.
    const host = document.createElement('tuvix-home');
    container.appendChild(host);

    appRef = await bootstrapApplication(HomeComponent);
  },

  unmount({ container }) {
    appRef?.destroy();
    appRef = null;
    container.innerHTML = '';
  },
});
