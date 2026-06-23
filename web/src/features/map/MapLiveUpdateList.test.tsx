import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type LiveUpdate } from '../../types';
import { MapLiveUpdateList } from './MapLiveUpdateList';

const liveUpdate: LiveUpdate = {
  id: 'x-live-map-1',
  title: 'Outdoor stage is filling up',
  summary: 'People nearby are posting that the plaza set is starting.',
  url: 'https://x.com/search?q=plaza%20stage',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:15:00Z').toISOString(),
  tags: ['music'],
};

describe('MapLiveUpdateList', () => {
  afterEach(() => {
    cleanup();
  });

  it('lets people refresh preview live enrichment from the map panel', () => {
    const onRefreshLive = vi.fn();

    render(
      <MapLiveUpdateList
        isFallback
        isLoading={false}
        liveUpdates={[liveUpdate]}
        onRefreshLive={onRefreshLive}
      />,
    );

    expect(screen.getByText('preview enrichment')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Check live again' }));

    expect(onRefreshLive).toHaveBeenCalledTimes(1);
  });

  it('disables live refresh while the map is already refreshing', () => {
    render(
      <MapLiveUpdateList
        isFallback={false}
        isLoading
        liveUpdates={[liveUpdate]}
        onRefreshLive={vi.fn()}
      />,
    );

    expect(screen.getByText('refreshing')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Check live again' }),
    ).toBeDisabled();
  });
});
