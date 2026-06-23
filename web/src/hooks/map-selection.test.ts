import { describe, expect, it } from 'vitest';
import { type Post } from '../types';
import { shouldClearStaleMapSelection } from './map-selection';

const makePost = (id: number): Post => ({
  id,
  title: `Post ${id}`,
  latitude: 37.323,
  longitude: -122.0322,
  points: 0,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
});

describe('map selection helpers', () => {
  it('clears selected map posts that are no longer in the current nearby results', () => {
    expect(
      shouldClearStaleMapSelection({
        posts: [makePost(1), makePost(2)],
        selectedPostId: 9,
        view: 'map',
      }),
    ).toBe(true);
  });

  it('keeps selected map posts that are still visible', () => {
    expect(
      shouldClearStaleMapSelection({
        posts: [makePost(1), makePost(2)],
        selectedPostId: 2,
        view: 'map',
      }),
    ).toBe(false);
  });

  it('does not clear selections outside the map route', () => {
    expect(
      shouldClearStaleMapSelection({
        posts: [makePost(1), makePost(2)],
        selectedPostId: 9,
        view: 'details',
      }),
    ).toBe(false);
  });
});
