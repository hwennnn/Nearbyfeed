import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Post } from '../../types';
import { FeedCard } from './FeedCard';

afterEach(() => {
  cleanup();
});

const renderFeedCard = (post: Post, onOpen = vi.fn()) => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <FeedCard onOpen={onOpen} post={post} session={null} />
    </QueryClientProvider>,
  );

  return { onOpen };
};

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 19,
  title: 'Tiny ramen line outside the car wash',
  content: 'A pop-up cart just opened.',
  latitude: 37.318,
  longitude: -122.03,
  points: 0,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
  ...overrides,
});

describe('FeedCard', () => {
  it('opens details from the visible title button', () => {
    const post = makePost();
    const { onOpen } = renderFeedCard(post);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Tiny ramen line outside the car wash',
      }),
    );

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('keeps trust actions optional so feed cards stay reusable', () => {
    const post = makePost({
      id: 20,
      title: 'Too many bikes blocking the station stairs',
      content: null,
      points: 3,
      commentsCount: 1,
    });
    const onReport = vi.fn();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <FeedCard
          onOpen={vi.fn()}
          onReport={onReport}
          post={post}
          session={null}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /report/i }));

    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('routes signed-out like taps through the auth-required callback', () => {
    const post: Post = makePost({
      id: 21,
      title: 'Basketball court just opened',
      content: null,
    });
    const onRequireAuth = vi.fn();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <FeedCard
          onOpen={vi.fn()}
          onRequireAuth={onRequireAuth}
          post={post}
          session={null}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in to like' }));

    expect(onRequireAuth).toHaveBeenCalledWith('like');
  });

  it('copies a deep link when native share is unavailable', async () => {
    const post = makePost({ id: 88 });
    const writeText = vi.fn().mockResolvedValue(undefined);
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <FeedCard
          onOpen={vi.fn()}
          post={post}
          session={null}
          shareTarget={{
            clipboard: { writeText },
            href: 'https://app.nearbyfeed.com/',
          }}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Share post' }));

    expect(await screen.findByText('link copied')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(
      'Tiny ramen line outside the car wash\nhttps://app.nearbyfeed.com/?post=88',
    );
  });
});
