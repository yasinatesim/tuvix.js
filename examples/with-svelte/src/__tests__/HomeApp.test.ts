import { render, screen } from '@testing-library/svelte';
import HomeApp from '../apps/home/HomeApp.svelte';

describe('HomeApp.svelte', () => {
  it('renders the Home heading', () => {
    render(HomeApp);
    expect(screen.getByText(/Home App/)).toBeDefined();
  });

  it('renders the @tuvix.js/svelte description', () => {
    render(HomeApp);
    expect(screen.getByText(/@tuvix\.js\/svelte/)).toBeDefined();
  });
});
