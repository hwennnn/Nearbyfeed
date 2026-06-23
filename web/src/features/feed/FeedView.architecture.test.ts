import { describe, expect, it } from 'vitest';
import feedViewSource from './FeedView.tsx?raw';

describe('FeedView architecture', () => {
  it('delegates the repeated post stack out of the route-level view', () => {
    expect(feedViewSource).toContain('FeedPostStack');
    expect(feedViewSource).not.toContain('posts.map');
    expect(feedViewSource).not.toContain('FeedPaginationControl');
  });
});
