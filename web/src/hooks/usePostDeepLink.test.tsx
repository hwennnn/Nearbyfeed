import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Post } from '../types';
import { getPostDeepLinkId, usePostDeepLink } from './usePostDeepLink';

const fetchPostMock = vi.hoisted(() => vi.fn());

vi.mock('../lib/api', () => ({
  fetchPost: fetchPostMock,
}));

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

describe('getPostDeepLinkId', () => {
  it.each([
    ['?post=42', 42],
    ['?draft=1&post=7', 7],
    ['', null],
    ['?post=0', null],
    ['?post=-1', null],
    ['?post=abc', null],
    ['?post=9007199254740992', null],
  ])('parses %s as %p', (search, expected) => {
    expect(getPostDeepLinkId(search)).toBe(expected);
  });
});

describe('usePostDeepLink', () => {
  afterEach(() => {
    fetchPostMock.mockReset();
    window.history.replaceState(null, '', '/');
  });

  it('opens a matching nearby post without fetching it', async () => {
    window.history.replaceState(null, '', '/?post=9');
    const openPost = vi.fn();
    const post = makePost(9);

    renderHook(
      () =>
        usePostDeepLink({
          openPost,
          posts: [post],
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(openPost).toHaveBeenCalledWith(post, 'feed');
    });
    expect(fetchPostMock).not.toHaveBeenCalled();
  });

  it('fetches and opens a shared post that is outside the current feed', async () => {
    window.history.replaceState(null, '', '/?post=42');
    const openPost = vi.fn();
    const post = makePost(42);
    fetchPostMock.mockResolvedValue(post);

    renderHook(
      () =>
        usePostDeepLink({
          openPost,
          posts: [],
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(openPost).toHaveBeenCalledWith(post, 'feed');
    });
    expect(fetchPostMock).toHaveBeenCalledWith(42);
  });
});
