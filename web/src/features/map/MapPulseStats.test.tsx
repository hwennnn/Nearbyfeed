import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type LiveUpdate, type Post } from '../../types';
import { MapPulseStats } from './MapPulseStats';

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  title: 'Library steps are buzzing',
  latitude: 37.323,
  longitude: -122.032,
  points: 10,
  commentsCount: 3,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
  ...overrides,
});

const makeLiveUpdate = (id: string): LiveUpdate => ({
  id,
  title: 'Queue forming nearby',
  summary: 'People are posting about a short line.',
  url: `https://x.com/example/status/${id.replace(/\D/g, '')}`,
  source: 'x',
  occurredAt: new Date('2026-06-23T08:02:00Z').toISOString(),
  tags: ['nearby'],
});

describe('MapPulseStats', () => {
  it('surfaces X live enrichment alongside nearby post stats', () => {
    render(
      <MapPulseStats
        liveUpdates={[makeLiveUpdate('live-1'), makeLiveUpdate('live-2')]}
        posts={[
          makePost(),
          makePost({
            id: 2,
            commentsCount: 1,
            poll: {
              id: 1,
              postId: 2,
              votingLength: 1,
              participantsCount: 7,
              options: [],
            },
          }),
        ]}
      />,
    );

    const stats = screen.getByLabelText('Nearby pulse stats');
    const liveSignals = within(stats).getByLabelText(
      '2 X live signals nearby',
    );

    expect(within(liveSignals).getByText('X live')).toBeInTheDocument();
    expect(within(liveSignals).getByText('2')).toBeInTheDocument();
    expect(within(stats).getByText('drops')).toBeInTheDocument();
    expect(within(stats).getByText('replies')).toBeInTheDocument();
    expect(within(stats).getByText('polls')).toBeInTheDocument();
  });
});
