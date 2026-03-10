import { render, screen } from '@testing-library/react';
import AboutApp from '../apps/about/AboutApp';

describe('AboutApp', () => {
  it('renders the About heading', () => {
    render(<AboutApp />);
    expect(screen.getByText(/ℹ️ About/)).toBeDefined();
  });

  it('renders the independently deployable bullet', () => {
    render(<AboutApp />);
    expect(screen.getByText(/Independently deployable/)).toBeDefined();
  });
});
