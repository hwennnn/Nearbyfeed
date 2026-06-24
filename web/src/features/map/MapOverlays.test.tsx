import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapControls } from './MapOverlays';

describe('MapControls', () => {
  it('groups time and distance filters for the map viewport', () => {
    render(
      <MapControls
        distance={200}
        onFrameNearby={vi.fn()}
        setDistance={vi.fn()}
        setTimeWindow={vi.fn()}
        timeWindow="24h"
      />,
    );

    const filters = screen.getByLabelText('Map filters');

    expect(within(filters).getByLabelText('Time window')).toBeInTheDocument();
    expect(within(filters).getByLabelText('Distance')).toBeInTheDocument();
    expect(
      within(filters).getByRole('button', { name: 'Frame live area' }),
    ).toBeInTheDocument();
  });
});
