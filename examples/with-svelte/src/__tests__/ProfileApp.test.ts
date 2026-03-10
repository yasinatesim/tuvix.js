import { render, screen } from '@testing-library/svelte';
import ProfileApp from '../apps/profile/ProfileApp.svelte';

describe('ProfileApp.svelte', () => {
  it('renders the Profile heading', () => {
    render(ProfileApp);
    expect(screen.getByText(/Profile App/)).toBeDefined();
  });

  it('shows default when no theme context set', () => {
    render(ProfileApp);
    expect(screen.getByText(/Theme prop: default/)).toBeDefined();
  });
});
