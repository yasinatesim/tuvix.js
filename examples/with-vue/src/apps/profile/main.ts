import { createVueMicroApp } from '@tuvix.js/vue';
import ProfileApp from './ProfileApp.vue';

export default createVueMicroApp(ProfileApp, { name: 'profile' });
