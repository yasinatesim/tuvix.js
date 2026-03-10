import { createReactMicroApp } from '@tuvix.js/react';
import HomeApp from './HomeApp';

export default createReactMicroApp({
  name: 'home',
  App: HomeApp,
  bootstrap() {
    console.log('[home] bootstrapped');
  },
});
