import { createSvelteMicroApp } from '@tuvix.js/svelte';
import ProfileApp from './ProfileApp.svelte';

export default createSvelteMicroApp({ name: 'profile', App: ProfileApp });
