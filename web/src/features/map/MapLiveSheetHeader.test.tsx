import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type LiveUpdate, type Post } from '../../types';
import { MapLiveSheetHeader } from './MapLiveSheetHeader';

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

describe('MapLiveSheetHeader', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a compact live sheet header with quick stats', () => {
    render(
      <MapLiveSheetHeader
        liveUpdates={[liveUpdate]}
        locationName="Cupertino Car Wash, 10002"
        posts={[post]}
      />,
    );

    expect(screen.getByLabelText('Nearby live sheet')).toHaveTextContent(
      'Cupertino Car Wash, 10002',
    );
    expect(screen.getByText('Outside chatter is leading')).toBeInTheDocument();
    expect(screen.getByLabelText('Live sheet quick stats')).toHaveTextContent(
      '1drops1X live4replies',
    );
  });
});
