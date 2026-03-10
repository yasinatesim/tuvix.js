import { render, screen } from '@testing-library/vue';
import ProfileApp from '../apps/profile/ProfileApp.vue';

describe('ProfileApp.vue', () => {
  it('renders the Profile heading', () => {
    render(ProfileApp);
    expect(screen.getByText(/Profile App/)).toBeDefined();
  });

  it('shows default when no theme prop provided', () => {
    render(ProfileApp);
    expect(screen.getByText(/Theme prop: default/)).toBeDefined();
  });
});
