import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Post } from '../types';

const fetchPostsMock = vi.hoisted(() => vi.fn());

vi.mock('../lib/api', () => ({
  fetchPosts: fetchPostsMock,
}));

import { useNearbyPosts } from './useNearbyPosts';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const makePost = (id: number): Post => ({
  id,
  title: `Post ${id}`,
  latitude: 37.323,
  longitude: -122.0322,
  points: 0,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
});

describe('useNearbyPosts', () => {
  afterEach(() => {
    fetchPostsMock.mockReset();
  });

  it('fetches the next nearby page with the last loaded post id as cursor', async () => {
    fetchPostsMock
      .mockResolvedValueOnce({
        hasMore: true,
        posts: [makePost(1), makePost(2)],
      })
      .mockResolvedValueOnce({
        hasMore: false,
        posts: [makePost(3)],
      });

    const { result } = renderHook(
      () =>
        useNearbyPosts({
          coordinates: { latitude: 37.323, longitude: -122.0322 },
          distance: 200,
          timeWindow: '24h',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.posts.map((post) => post.id)).toEqual([1, 2]);
    });

    expect(result.current.hasMorePosts).toBe(true);

    await act(async () => {
      await result.current.fetchMorePosts();
    });

    await waitFor(() => {
      expect(result.current.posts.map((post) => post.id)).toEqual([1, 2, 3]);
    });

    expect(fetchPostsMock).toHaveBeenLastCalledWith({
      latitude: 37.323,
      longitude: -122.0322,
      distance: 200,
      timeWindow: '24h',
      cursor: '2',
    });
    expect(result.current.hasMorePosts).toBe(false);
  });
});
