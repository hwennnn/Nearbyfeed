import { describe, expect, it, vi } from 'vitest';
import { type LiveUpdate, type Post } from '../../types';
import {
  getFeaturedFeedPost,
  getFeedHeroSummary,
  getFeedLiveLensHeading,
  getFeedLiveLensItems,
  getFeedPulseMetrics,
  getFeedSceneBoard,
  getPostPulseScore,
  getPostSignal,
} from './feed-presentation';

const now = new Date('2026-06-23T09:00:00Z');

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  title: 'Library steps are buzzing',
  latitude: 37.323,
  longitude: -122.032,
  points: 0,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:30:00Z').toISOString(),
  ...overrides,
});

const makeLiveUpdate = (overrides: Partial<LiveUpdate> = {}): LiveUpdate => ({
  id: 'live-1',
  title: 'Open mic queue is moving fast',
  summary: 'People nearby are posting about short sets and room outside.',
  url: 'https://x.com/example/status/42001',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:42:00Z').toISOString(),
  tags: ['music', 'nearby'],
  ...overrides,
});

describe('feed presentation helpers', () => {
  it('scores fresh posts with replies, media, polls, and place context', () => {
    const post = makePost({
      commentsCount: 3,
      images: ['https://example.com/photo.jpg'],
      location: {
        latitude: 37.323,
        longitude: -122.032,
        name: 'Library steps',
        formattedAddress: 'Cupertino Library',
      },
      points: 5,
      poll: {
        id: 10,
        postId: 1,
        votingLength: 1,
        participantsCount: 6,
        options: [],
      },
    });

    expect(getPostPulseScore(post, now.getTime())).toBe(63);
  });

  it('labels posts by the strongest visible social signal', () => {
    expect(getPostSignal(makePost({ points: 20, commentsCount: 12 }), now.getTime())).toEqual({
      label: 'hot now',
      tone: 'hot',
    });
    expect(getPostSignal(makePost({ commentsCount: 8 }), now.getTime())).toEqual({
      label: 'chat moving',
      tone: 'chat',
    });
    expect(
      getPostSignal(
        makePost({
          poll: {
            id: 10,
            postId: 1,
            votingLength: 1,
            participantsCount: 0,
            options: [],
          },
        }),
        now.getTime(),
      ),
    ).toEqual({
      label: 'vote check',
      tone: 'poll',
    });
  });

  it('chooses the highest-pulse post for the feed feature', () => {
    const quiet = makePost({ id: 1, points: 2, commentsCount: 1 });
    const active = makePost({ id: 2, points: 12, commentsCount: 10 });

    expect(getFeaturedFeedPost([quiet, active])).toBe(active);
  });

  it('builds live lens items ranked by pulse with concise social meta', () => {
    const hot = makePost({
      id: 2,
      title: 'Open mic line is out the door',
      points: 32,
      commentsCount: 10,
    });
    const poll = makePost({
      id: 3,
      title: 'Should we move the pickup game?',
      poll: {
        id: 20,
        postId: 3,
        votingLength: 1,
        participantsCount: 9,
        options: [],
      },
    });
    const photo = makePost({
      id: 4,
      title: 'Neon mural just went up',
      commentsCount: 1,
      images: ['https://example.com/mural.jpg'],
    });

    const items = getFeedLiveLensItems([poll, photo, hot], now.getTime());

    expect(items.map((item) => item.id)).toEqual([2, 3, 4]);
    expect(items[0]).toMatchObject({
      meta: '10 replies moving',
      signalLabel: 'hot now',
      title: 'Open mic line is out the door',
      tone: 'hot',
    });
    expect(items[1]).toMatchObject({
      meta: '9 votes live',
      signalLabel: 'vote check',
      tone: 'poll',
    });
  });

  it('formats live lens headings with singular and plural drops', () => {
    expect(getFeedLiveLensHeading({ total: 1 })).toBe('1 drop in range');
    expect(getFeedLiveLensHeading({ total: 2 })).toBe('2 drops in range');
    expect(getFeedLiveLensHeading({ total: 0 })).toBe('No drops in range');
  });

  it('summarizes feed pulse metrics for the hero and rail', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(
      getFeedPulseMetrics([
        makePost({
          commentsCount: 4,
          images: ['https://example.com/photo.jpg'],
          location: {
            latitude: 37.323,
            longitude: -122.032,
            name: 'Library steps',
            formattedAddress: 'Cupertino Library',
          },
          points: 8,
        }),
        makePost({
          id: 2,
          commentsCount: 1,
          poll: {
            id: 20,
            postId: 2,
            votingLength: 1,
            participantsCount: 11,
            options: [],
          },
        }),
      ]),
    ).toEqual({
      comments: 5,
      energyLabel: 'lit up',
      photos: 1,
      places: 1,
      polls: 1,
      score: 98,
      total: 2,
    });

    vi.useRealTimers();
  });

  it('formats feed hero copy with singular and plural counts', () => {
    expect(
      getFeedHeroSummary({
        comments: 1,
        energyLabel: 'warming',
        photos: 0,
        places: 1,
        polls: 1,
        score: 24,
        total: 1,
      }),
    ).toBe('1 post, 1 reply, and 1 live check near you.');

    expect(
      getFeedHeroSummary({
        comments: 0,
        energyLabel: 'quiet',
        photos: 0,
        places: 0,
        polls: 0,
        score: 0,
        total: 0,
      }),
    ).toBe('The block is quiet right now.');
  });

  it('builds a scene board from nearby posts and live outside signals', () => {
    const hot = makePost({
      id: 2,
      title: 'Open mic line is out the door',
      points: 20,
      commentsCount: 9,
      images: ['https://example.com/stage.jpg'],
      location: {
        latitude: 37.323,
        longitude: -122.032,
        name: 'Cafe patio',
        formattedAddress: 'Cafe patio, Cupertino',
      },
      poll: {
        id: 20,
        postId: 2,
        votingLength: 1,
        participantsCount: 12,
        options: [],
      },
    });
    const quiet = makePost({
      id: 3,
      title: 'Study tables opening up',
      points: 2,
      commentsCount: 1,
    });

    const scene = getFeedSceneBoard(
      [quiet, hot],
      [makeLiveUpdate()],
      now.getTime(),
    );

    expect(scene.status).toBe('surging');
    expect(scene.headline).toBe('People are posting nearby');
    expect(scene.primaryPostId).toBe(2);
    expect(scene.primaryActionLabel).toBe('Open top post');
    expect(scene.stats).toContainEqual({
      label: 'X live',
      tone: 'live',
      value: '1',
    });
    expect(scene.moments.map((moment) => moment.title)).toEqual([
      'Open mic line is out the door',
      'Open mic queue is moving fast',
      'Study tables opening up',
    ]);
  });

  it('keeps the scene board useful when the area is quiet', () => {
    const scene = getFeedSceneBoard([], [], now.getTime());

    expect(scene).toMatchObject({
      headline: 'Nothing nearby yet',
      moments: [],
      primaryActionLabel: 'Post first',
      primaryPostId: undefined,
      status: 'quiet',
    });
  });
});
