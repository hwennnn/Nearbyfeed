import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type LiveUpdate, type Post } from '../../types';
import { MapVibeCard } from './MapVibeCard';

const post: Post = {
  id: 91,
  title: 'Night market line is moving',
  latitude: 37.323,
  longitude: -122.032,
  points: 18,
  commentsCount: 2,
};

const liveUpdate: LiveUpdate = {
  id: 'x-live-91',
  title: 'DJ set outside the plaza',
  summary: 'People nearby are posting about a small outdoor set.',
  url: 'https://x.com/search?q=plaza%20dj',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:06:00Z').toISOString(),
  tags: ['music'],
};

describe('MapVibeCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the nearby vibe as a scan-friendly social card', () => {
    render(<MapVibeCard liveUpdates={[liveUpdate]} posts={[post]} />);

    expect(screen.getByText('vibe check')).toBeInTheDocument();
    expect(screen.getByText('Outside chatter is spiking')).toBeInTheDocument();
    expect(
      screen.getByText('1 X signal is moving around 1 nearby drop.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Scan live stack')).toBeInTheDocument();
  });
});
