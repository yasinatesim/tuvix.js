import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

/**
 * Zoneless by default: the adapter never loads zone.js. It re-renders into
 * the host element that `renderAngularToString` produced on the server.
 */
export const angularContact = createSsrAngularMicroApp({
  name: 'angular-contact',
  component: ContactComponent,
});

export { ContactComponent };
