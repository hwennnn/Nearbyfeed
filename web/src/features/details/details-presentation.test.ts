import { describe, expect, it, vi } from 'vitest';
import { type Comment, type Post } from '../../types';
import {
  COMMENT_SORT_OPTIONS,
  getCommentSignalLabel,
  getCommentSortLabel,
  getThreadMetrics,
} from './details-presentation';

const post: Post = {
  id: 1,
  title: 'Tiny ramen line outside the car wash',
  latitude: 37.323,
  longitude: -122.032,
  points: 4,
  commentsCount: 1,
  authorId: 10,
  author: {
    id: 10,
    username: 'pulseqa',
    email: 'pulseqa@example.com',
    image: null,
  },
  poll: {
    id: 1,
    postId: 1,
    votingLength: 1,
    participantsCount: 6,
    options: [],
  },
};

const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 1,
  content: 'Still here, line is moving fast.',
  createdAt: new Date('2026-06-23T08:45:00Z').toISOString(),
  postId: 1,
  points: 0,
  author: {
    id: 11,
    username: 'mina',
    email: 'mina@example.com',
    image: null,
  },
  ...overrides,
});

describe('details presentation helpers', () => {
  it('builds thread metrics from post, poll, and visible comments', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-23T09:00:00Z'));

    expect(
      getThreadMetrics(post, [
        makeComment(),
        makeComment({
          id: 2,
          author: {
            id: 12,
            username: 'ari',
            email: 'ari@example.com',
            image: null,
          },
          createdAt: new Date('2026-06-23T08:58:00Z').toISOString(),
        }),
      ]),
    ).toEqual({
      commentLabel: '2 replies',
      energy: 'warming',
      energyLabel: 'warming up',
      latestLabel: 'Latest Just now',
      participantCount: 3,
      pollLabel: '6 votes',
      score: 30,
      voiceLabel: '3 nearby voices',
    });

    vi.useRealTimers();
  });

  it('uses post comment count when fetched comments are stale or empty', () => {
    expect(getThreadMetrics({ ...post, commentsCount: 3 }, [])).toMatchObject({
      commentLabel: '3 replies',
      latestLabel: 'No replies yet',
      participantCount: 1,
      voiceLabel: '1 nearby voice',
    });
  });

  it('labels comment rows by visible engagement', () => {
    expect(getCommentSignalLabel(makeComment({ points: 12 }))).toBe('top local take');
    expect(getCommentSignalLabel(makeComment({ points: 2 }))).toBe('2 up');
    expect(getCommentSignalLabel(makeComment({ points: 0 }))).toBe('fresh reply');
  });

  it('exposes the same comment sort options as the mobile thread sheet', () => {
    expect(COMMENT_SORT_OPTIONS).toEqual([
      { label: 'Top', value: 'top' },
      { label: 'Newest', value: 'latest' },
      { label: 'Oldest', value: 'oldest' },
    ]);
    expect(getCommentSortLabel('top')).toBe('Top');
    expect(getCommentSortLabel('latest')).toBe('Newest');
    expect(getCommentSortLabel('oldest')).toBe('Oldest');
  });
});
