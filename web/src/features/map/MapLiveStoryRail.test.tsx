import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type LiveUpdate, type Post } from '../../types';
import { MapLiveStoryRail } from './MapLiveStoryRail';

const post: Post = {
  id: 44,
  title: 'Food truck line is moving fast',
  latitude: 37.323,
  longitude: -122.032,
  points: 38,
  commentsCount: 4,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
};

const liveUpdate: LiveUpdate = {
  id: 'x-live-1',
  title: 'Open mic queue is moving',
  summary: 'People are posting about the line.',
  url: 'https://x.com/search?q=open%20mic',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:06:00Z').toISOString(),
  tags: ['music'],
};

describe('MapLiveStoryRail', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a scan-friendly map story with live metrics', () => {
    render(<MapLiveStoryRail liveUpdates={[liveUpdate]} posts={[post]} />);

    expect(screen.getByText('rising nearby')).toBeInTheDocument();
    expect(screen.getByText('1 outside signal nearby')).toBeInTheDocument();
    expect(
      screen.getByText('1 drop and 4 replies are already in range.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Map live story metrics')).toHaveTextContent(
      '1drop1outside4replies',
    );
  });
});
