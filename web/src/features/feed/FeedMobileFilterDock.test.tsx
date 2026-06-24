import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedMobileFilterDock } from './FeedMobileFilterDock';

afterEach(() => {
  cleanup();
});

describe('FeedMobileFilterDock', () => {
  it('groups distance and time controls inside the compact mobile tray', () => {
    render(
      <FeedMobileFilterDock
        distance={200}
        setDistance={vi.fn()}
        setTimeWindow={vi.fn()}
        timeWindow="24h"
      />,
    );

    const dock = screen.getByLabelText('Mobile feed filters');

    expect(dock).toHaveClass('feed-mobile-filter-dock');
    expect(dock).toContainElement(screen.getByLabelText('Distance'));
    expect(dock).toContainElement(screen.getByLabelText('Time window'));
  });
});
