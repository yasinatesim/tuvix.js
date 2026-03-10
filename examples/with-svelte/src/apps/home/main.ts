import { createSvelteMicroApp } from '@tuvix.js/svelte';
import HomeApp from './HomeApp.svelte';

export default createSvelteMicroApp(HomeApp, { name: 'home' });
