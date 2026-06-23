import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapTokenEmptyState } from './MapTokenEmptyState';

describe('MapTokenEmptyState', () => {
  it('renders an accessible missing-token state for the map canvas', () => {
    render(<MapTokenEmptyState />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Map offline')).toBeInTheDocument();
    expect(
      screen.getByText('Add a Mapbox token to show the live nearby map.'),
    ).toBeInTheDocument();
    expect(screen.getByText('env needed')).toBeInTheDocument();
  });
});
