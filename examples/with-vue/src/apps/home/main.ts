import { createVueMicroApp } from '@tuvix.js/vue';
import HomeApp from './HomeApp.vue';

export default createVueMicroApp(HomeApp, { name: 'home' });
