import { ReportReason } from '@nearbyfeed/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  API_URL,
  blockUser,
  buildPostsUrl,
  buildVerifyEmailPath,
  captureEvent,
  fetchComments,
  fetchLiveUpdates,
  fetchPost,
  reportComment,
  reportPost,
  unblockUser,
} from './api';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('buildPostsUrl', () => {
  it('includes distance and time-window filters for map parity', () => {
    const url = buildPostsUrl({
      latitude: 1.3,
      longitude: 103.8,
      distance: 500,
      timeWindow: '2h',
    });

    expect(url).toContain('distance=500');
    expect(url).toContain('timeWindow=2h');
    expect(url).toContain('latitude=1.3');
    expect(url).toContain('longitude=103.8');
  });
});

describe('buildVerifyEmailPath', () => {
  it('encodes the pending user id before placing it in the route', () => {
    expect(buildVerifyEmailPath('pending/user 1')).toBe(
      '/auth/verify-email/pending%2Fuser%201',
    );
  });
});

describe('live updates API', () => {
  it('requests live enrichment with distance, time-window, and place context', async () => {
    const fetch = vi.fn(async () => Response.json({ updates: [] }));
    vi.stubGlobal('fetch', fetch);

    await fetchLiveUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      distance: 500,
      timeWindow: '2h',
      locationName: 'Cupertino Car Wash, 10002',
    });

    const [url] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const parsedUrl = new URL(url);

    expect(parsedUrl.pathname).toBe('/live/nearby');
    expect(parsedUrl.searchParams.get('latitude')).toBe('37.323');
    expect(parsedUrl.searchParams.get('longitude')).toBe('-122.0322');
    expect(parsedUrl.searchParams.get('distance')).toBe('500');
    expect(parsedUrl.searchParams.get('timeWindow')).toBe('2h');
    expect(parsedUrl.searchParams.get('locationName')).toBe(
      'Cupertino Car Wash, 10002',
    );
  });
});

describe('comments API', () => {
  it('requests top comments by default to match the mobile thread sort', async () => {
    const fetch = vi.fn(async () =>
      Response.json({ comments: [], hasMore: false }),
    );
    vi.stubGlobal('fetch', fetch);

    await fetchComments(42);

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/posts/42/comments?sort=top`,
      expect.any(Object),
    );
  });

  it('requests the selected comment sort', async () => {
    const fetch = vi.fn(async () =>
      Response.json({ comments: [], hasMore: false }),
    );
    vi.stubGlobal('fetch', fetch);

    await fetchComments(42, 'oldest');

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/posts/42/comments?sort=oldest`,
      expect.any(Object),
    );
  });
});

describe('single post API', () => {
  it('fetches a shared post by id', async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        id: 42,
        title: 'Tiny ramen line outside the car wash',
        latitude: 37.323,
        longitude: -122.0322,
        points: 0,
        commentsCount: 0,
      }),
    );
    vi.stubGlobal('fetch', fetch);

    await fetchPost(42);

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/posts/42`,
      expect.any(Object),
    );
  });
});

describe('observability API', () => {
  it('sends a client timestamp with web telemetry events', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-23T07:58:00.123Z'));
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);

    await captureEvent('web.map_viewed', { distance: 200 }, 'map');

    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      clientTimestamp?: string;
      name?: string;
      properties?: Record<string, unknown>;
      route?: string;
    };

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/observability/events`,
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(body).toEqual(
      expect.objectContaining({
        clientTimestamp: '2026-06-23T07:58:00.123Z',
        name: 'web.map_viewed',
        route: 'map',
        properties: {
          distance: 200,
        },
      }),
    );
  });
});

describe('report APIs', () => {
  it('reports posts with string ids for backend parity', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);

    await reportPost(42, ReportReason.SPAM);

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/reports/posts`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          postId: '42',
          reason: ReportReason.SPAM,
        }),
      }),
    );
  });

  it('reports comments with the selected moderation reason', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);

    await reportComment(88, ReportReason.HARASSMENT_OR_BULLYING);

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/reports/comments`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          commentId: '88',
          reason: ReportReason.HARASSMENT_OR_BULLYING,
        }),
      }),
    );
  });
});

describe('block APIs', () => {
  it('blocks a user through the guarded mobile-compatible route', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);

    await blockUser({ userId: 7, blockedId: 9 });

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/users/7/block/9`,
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('unblocks a user through the guarded mobile-compatible route', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);

    await unblockUser({ userId: 7, blockedId: 9 });

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/users/7/block/9`,
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});
