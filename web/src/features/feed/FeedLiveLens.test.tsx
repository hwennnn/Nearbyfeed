import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Post } from '../../types';
import { FeedLiveLens } from './FeedLiveLens';

const post: Post = {
  id: 91,
  title: 'Tiny DJ set near the bus stop',
  latitude: 37.323,
  longitude: -122.032,
  points: 4,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:30:00Z').toISOString(),
};

describe('FeedLiveLens', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses singular copy when one nearby drop is in range', () => {
    render(<FeedLiveLens onOpenPost={vi.fn()} posts={[post]} />);

    expect(screen.getByText('1 drop in range')).toBeInTheDocument();
    expect(screen.queryByText('1 drops in range')).not.toBeInTheDocument();
  });
});
