import { describe, expect, it } from 'vitest';
import { type Comment, type Post, type Session } from '../../types';
import {
  getCommentBlockTarget,
  getCommentReportTarget,
  getPostBlockTarget,
  getPostReportTarget,
} from './details-trust';

const session: Session = {
  tokens: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  },
  user: {
    email: 'mina@example.com',
    id: 7,
    image: null,
    username: 'mina',
  },
};

const post: Post = {
  id: 42,
  title: 'Tiny ramen line outside the car wash',
  content: null,
  latitude: 37.318,
  longitude: -122.03,
  points: 4,
  commentsCount: 1,
  authorId: 11,
  author: {
    email: 'pulseqa@example.com',
    id: 11,
    image: null,
    username: 'pulseqa',
  },
};

const comment: Comment = {
  id: 88,
  content: 'Line is still moving fast.',
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
  postId: 42,
  points: 0,
  author: {
    email: 'ari@example.com',
    id: 12,
    image: null,
    username: 'ari',
  },
};

describe('details trust helpers', () => {
  it('builds report targets with stable previews', () => {
    expect(getPostReportTarget(post)).toEqual({
      id: 42,
      kind: 'post',
      preview: 'Tiny ramen line outside the car wash',
    });
    expect(getCommentReportTarget(comment)).toEqual({
      id: 88,
      kind: 'comment',
      preview: 'Line is still moving fast.',
    });
  });

  it('builds block targets for other nearby voices', () => {
    expect(getPostBlockTarget(post, session)).toEqual({
      kind: 'post',
      preview: 'Tiny ramen line outside the car wash',
      userId: 11,
      username: 'pulseqa',
    });
    expect(getCommentBlockTarget(comment, session)).toEqual({
      kind: 'comment',
      preview: 'Line is still moving fast.',
      userId: 12,
      username: 'ari',
    });
  });

  it('does not offer blocking on your own posts or comments', () => {
    expect(
      getPostBlockTarget(
        { ...post, authorId: session.user.id, author: session.user },
        session,
      ),
    ).toBeNull();
    expect(
      getCommentBlockTarget({ ...comment, author: session.user }, session),
    ).toBeNull();
  });

  it('falls back gracefully when display names are absent', () => {
    expect(
      getPostBlockTarget(
        { ...post, author: undefined, authorId: 99 },
        session,
      ),
    ).toEqual({
      kind: 'post',
      preview: post.title,
      userId: 99,
      username: 'nearby',
    });
  });
});
