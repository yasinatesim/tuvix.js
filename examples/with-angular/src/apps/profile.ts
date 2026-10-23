import { createAngularMicroApp } from '@tuvix.js/angular';
import { ProfileApp } from '../app/profile.component';

export default createAngularMicroApp({
  name: 'profile',
  component: ProfileApp,
});
