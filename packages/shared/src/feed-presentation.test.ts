import { describe, expect, it } from 'vitest';
import {
  getFeedLiveLensItems,
  getFeedPulseMetrics,
  getFeedSceneBoard,
  getPostSignal,
  type FeedLiveUpdateInput,
  type FeedPostInput,
} from './index';

const now = new Date('2026-06-23T09:00:00Z').getTime();

const makePost = (overrides: Partial<FeedPostInput> = {}): FeedPostInput => ({
  id: 1,
  title: 'Library steps are buzzing',
  points: 0,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:30:00Z').toISOString(),
  ...overrides,
});

const makeLiveUpdate = (
  overrides: Partial<FeedLiveUpdateInput> = {},
): FeedLiveUpdateInput => ({
  id: 'live-1',
  title: 'Open mic queue is moving fast',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:42:00Z').toISOString(),
  tags: ['music', 'nearby'],
  url: 'https://x.com/example/status/42001',
  ...overrides,
});

describe('shared feed presentation model', () => {
  it('scores nearby posts with fresh, media, poll, and place signals', () => {
    expect(
      getFeedPulseMetrics(
        [
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
              participantsCount: 11,
            },
          }),
        ],
        now,
      ),
    ).toEqual({
      comments: 5,
      energyLabel: 'lit up',
      photos: 1,
      places: 1,
      polls: 1,
      score: 98,
      total: 2,
    });
  });

  it('keeps the strongest social signal labels platform neutral', () => {
    expect(getPostSignal(makePost({ points: 20, commentsCount: 12 }), now)).toEqual({
      label: 'hot now',
      tone: 'hot',
    });
    expect(getPostSignal(makePost({ commentsCount: 8 }), now)).toEqual({
      label: 'chat moving',
      tone: 'chat',
    });
    expect(
      getPostSignal(
        makePost({
          poll: {
            participantsCount: 0,
          },
        }),
        now,
      ),
    ).toEqual({
      label: 'vote check',
      tone: 'poll',
    });
  });

  it('ranks live lens items by pulse with concise social meta', () => {
    const items = getFeedLiveLensItems(
      [
        makePost({
          id: 3,
          title: 'Should we move the pickup game?',
          poll: {
            participantsCount: 9,
          },
        }),
        makePost({
          id: 4,
          title: 'Neon mural just went up',
          commentsCount: 1,
          images: ['https://example.com/mural.jpg'],
        }),
        makePost({
          id: 2,
          title: 'Open mic line is out the door',
          points: 32,
          commentsCount: 10,
        }),
      ],
      now,
    );

    expect(items.map((item) => item.id)).toEqual([2, 3, 4]);
    expect(items[0]).toMatchObject({
      meta: '10 replies moving',
      signalLabel: 'hot now',
      tone: 'hot',
    });
    expect(items[1]).toMatchObject({
      meta: '9 votes live',
      signalLabel: 'vote check',
      tone: 'poll',
    });
  });

  it('combines posts and outside live signals into the scene board', () => {
    const scene = getFeedSceneBoard(
      [
        makePost({
          id: 3,
          title: 'Study tables opening up',
          points: 2,
          commentsCount: 1,
        }),
        makePost({
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
            participantsCount: 12,
          },
        }),
      ],
      [makeLiveUpdate()],
      now,
    );

    expect(scene.status).toBe('surging');
    expect(scene.headline).toBe('People are posting nearby');
    expect(scene.primaryPostId).toBe(2);
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
});
