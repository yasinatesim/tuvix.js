import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

/** Hydrates the HTML that `renderVueToString(VueCard, props)` produced on the server. */
export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });

export { VueCard };
