import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Post } from '../../types';
import { FeedView } from './FeedView';

afterEach(() => {
  cleanup();
});

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const post: Post = {
  id: 31,
  title: 'Tiny DJ set near the bus stop',
  content: null,
  latitude: 37.318,
  longitude: -122.03,
  points: 0,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
};

describe('FeedView', () => {
  it('sends signed-out like taps to the auth flow', () => {
    const onRequireAuth = vi.fn();

    render(
      <FeedView
        distance={200}
        fetchMorePosts={vi.fn()}
        hasMorePosts={false}
        isFetchingMorePosts={false}
        isLiveFallback={false}
        isLiveFetching={false}
        isLoading={false}
        liveUpdates={[]}
        locationName="Cupertino"
        onOpenMap={vi.fn()}
        onOpenPost={vi.fn()}
        onRequireAuth={onRequireAuth}
        posts={[post]}
        refreshLiveUpdates={vi.fn()}
        refreshPosts={vi.fn()}
        session={null}
        setDistance={vi.fn()}
        setTimeWindow={vi.fn()}
        timeWindow="24h"
      />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in to like' }));

    expect(onRequireAuth).toHaveBeenCalledWith('like');
  });
});
