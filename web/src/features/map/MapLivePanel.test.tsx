import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type LiveUpdate, type Post } from '../../types';
import { MapLivePanel } from './MapLivePanel';

const post: Post = {
  id: 77,
  title: 'Tiny ramen line outside the car wash',
  latitude: 37.323,
  longitude: -122.0322,
  points: 18,
  commentsCount: 2,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
  locationName: 'Cupertino Car Wash, 10002',
};

const liveUpdate: LiveUpdate = {
  id: 'x-live-map-panel-1',
  title: 'Open mic queue is moving fast',
  summary: 'Local posts say the cafe stage has plenty of room outside.',
  url: 'https://x.com/search?q=cupertino%20open%20mic',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:08:00Z').toISOString(),
  tags: ['music'],
};

describe('MapLivePanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('surfaces the social vibe snapshot inside the live map panel', () => {
    render(
      <MapLivePanel
        featuredPost={post}
        isLiveFallback
        isLiveLoading={false}
        liveUpdates={[liveUpdate]}
        locationName="Cupertino Car Wash, 10002"
        onOpenPost={vi.fn()}
        posts={[post]}
        refreshLiveUpdates={vi.fn()}
        selectedPostId={null}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'Nearby vibe snapshot' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Outside chatter is spiking')).toBeInTheDocument();
    expect(screen.getByText('Scan live stack')).toBeInTheDocument();
  });

  it('lets people collapse and reopen the mobile live sheet', () => {
    render(
      <MapLivePanel
        featuredPost={post}
        isLiveFallback
        isLiveLoading={false}
        liveUpdates={[liveUpdate]}
        locationName="Cupertino Car Wash, 10002"
        onOpenPost={vi.fn()}
        posts={[post]}
        refreshLiveUpdates={vi.fn()}
        selectedPostId={null}
      />,
    );

    const panel = screen.getByLabelText('Nearby live map panel');
    const collapseButton = screen.getByRole('button', {
      name: 'Collapse live sheet',
    });

    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(collapseButton);

    expect(panel).toHaveClass('is-collapsed');
    expect(
      screen.queryByRole('region', { name: 'Nearby vibe snapshot' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand live sheet' }),
    ).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Expand live sheet' }));

    expect(panel).toHaveClass('is-expanded');
    expect(
      screen.getByRole('region', { name: 'Nearby vibe snapshot' }),
    ).toBeInTheDocument();
  });
});
