import { render, screen } from '@testing-library/react';
import HomeApp from '../apps/home/HomeApp';

describe('HomeApp', () => {
  it('renders with default user prop', () => {
    render(<HomeApp />);
    expect(screen.getAllByText(/Guest/).length).toBeGreaterThan(0);
  });

  it('renders with provided user prop', () => {
    render(<HomeApp user="Alice" />);
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0);
  });

  it('renders the Home heading', () => {
    render(<HomeApp />);
    expect(screen.getByText(/🏠 Home/)).toBeDefined();
  });
});
