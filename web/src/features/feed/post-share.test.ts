import { describe, expect, it, vi } from 'vitest';
import { type Post } from '../../types';
import { buildPostShareText, buildPostShareUrl, sharePost } from './post-share';

const post: Post = {
  id: 42,
  title: 'Tiny ramen line outside the car wash',
  content: 'A pop-up cart just opened.',
  latitude: 37.318,
  longitude: -122.03,
  points: 0,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
};

describe('post sharing', () => {
  it('builds stable deep links without keeping stale query params', () => {
    expect(buildPostShareUrl(42, 'https://app.nearbyfeed.com/?post=7&draft=1')).toBe(
      'https://app.nearbyfeed.com/?post=42',
    );
  });

  it('builds compact social share text from the post', () => {
    expect(buildPostShareText(post)).toBe(
      'Tiny ramen line outside the car wash - A pop-up cart just opened.',
    );
  });

  it('uses native share when the browser supports it', async () => {
    const share = vi.fn().mockResolvedValue(undefined);

    await expect(
      sharePost(post, {
        href: 'https://app.nearbyfeed.com/',
        share,
      }),
    ).resolves.toBe('native');

    expect(share).toHaveBeenCalledWith({
      title: post.title,
      text: 'Tiny ramen line outside the car wash - A pop-up cart just opened.',
      url: 'https://app.nearbyfeed.com/?post=42',
    });
  });

  it('falls back to copying a deep link when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(
      sharePost(post, {
        clipboard: { writeText },
        href: 'https://app.nearbyfeed.com/feed',
      }),
    ).resolves.toBe('clipboard');

    expect(writeText).toHaveBeenCalledWith(
      'Tiny ramen line outside the car wash\nhttps://app.nearbyfeed.com/feed?post=42',
    );
  });
});
