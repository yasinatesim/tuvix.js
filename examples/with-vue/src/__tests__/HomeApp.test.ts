import { render, screen } from '@testing-library/vue';
import HomeApp from '../apps/home/HomeApp.vue';

describe('HomeApp.vue', () => {
  it('renders the Home heading', () => {
    render(HomeApp);
    expect(screen.getByText(/Home App/)).toBeDefined();
  });

  it('renders the @tuvix.js/vue description', () => {
    render(HomeApp);
    expect(screen.getByText(/@tuvix\.js\/vue/)).toBeDefined();
  });
});
