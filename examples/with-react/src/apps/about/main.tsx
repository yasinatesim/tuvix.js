import { createReactMicroApp } from '@tuvix.js/react';
import AboutApp from './AboutApp';

export default createReactMicroApp({
  name: 'about',
  App: AboutApp,
  bootstrap() {
    console.log('[about] bootstrapped');
  },
});
