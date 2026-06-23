import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type LiveUpdate, type Post } from '../../types';
import { FeedSceneBoard } from './FeedSceneBoard';

const post: Post = {
  id: 44,
  title: 'Night market line is wrapping the block',
  content: 'The dumpling stall is the move.',
  latitude: 37.323,
  longitude: -122.032,
  points: 24,
  commentsCount: 11,
  createdAt: new Date('2026-06-23T08:30:00Z').toISOString(),
};

const liveUpdate: LiveUpdate = {
  id: 'x-live-1',
  title: 'People are posting about the night market',
  summary: 'Outside signals match the nearby feed.',
  url: 'https://x.com/search?q=night%20market',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:36:00Z').toISOString(),
  tags: ['food'],
};

describe('FeedSceneBoard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a live scene with map and post actions', () => {
    const onOpenMap = vi.fn();
    const onOpenPost = vi.fn();

    render(
      <FeedSceneBoard
        liveUpdates={[liveUpdate]}
        onOpenMap={onOpenMap}
        onOpenPost={onOpenPost}
        posts={[post]}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'People are posting nearby' }),
    ).toBeInTheDocument();
    expect(screen.getByText('People are posting about the night market')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open top post' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open map' }));

    expect(onOpenPost).toHaveBeenCalledWith(44);
    expect(onOpenMap).toHaveBeenCalledTimes(1);
  });

  it('labels preview enrichment and lets people check live again', () => {
    const onRefreshLive = vi.fn();

    render(
      <FeedSceneBoard
        isLiveFallback
        liveUpdates={[liveUpdate]}
        onOpenMap={vi.fn()}
        onOpenPost={vi.fn()}
        onRefreshLive={onRefreshLive}
        posts={[post]}
      />,
    );

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('demo posts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Check live' }));

    expect(onRefreshLive).toHaveBeenCalledTimes(1);
  });

  it('does not show a dead post action when there are no posts', () => {
    render(
      <FeedSceneBoard
        liveUpdates={[]}
        onOpenMap={vi.fn()}
        onOpenPost={vi.fn()}
        posts={[]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Nothing nearby yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Post first' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open map' })).toBeEnabled();
  });
});
