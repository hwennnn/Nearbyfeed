import { describe, expect, it } from 'vitest';
import { type LiveUpdate, type Post } from '../../types';
import {
  getFeaturedMapPost,
  getLiveMapSignals,
  getMapLiveSheetSummary,
  getMapLiveStory,
  getMapMarkerLabel,
  getMapPostSignalLabel,
  getMapPostTone,
  getMapPulseMetrics,
  getMapVibeSnapshot,
} from './map-presentation';

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  title: 'Library steps are buzzing',
  latitude: 37.323,
  longitude: -122.032,
  points: 0,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
  ...overrides,
});

const liveUpdate: LiveUpdate = {
  id: 'live-1',
  title: 'Queue forming',
  summary: 'People are posting about a short line.',
  url: 'https://x.com/search?q=queue',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:02:00Z').toISOString(),
  tags: ['nearby'],
};

const distanceBetween = (
  left: { latitude: number; longitude: number },
  right: { latitude: number; longitude: number },
): number => {
  const earthRadiusMeters = 6371008.8;
  const leftLatitude = (left.latitude * Math.PI) / 180;
  const rightLatitude = (right.latitude * Math.PI) / 180;
  const latitudeDelta = ((right.latitude - left.latitude) * Math.PI) / 180;
  const longitudeDelta = ((right.longitude - left.longitude) * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) *
      Math.cos(rightLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

describe('map presentation helpers', () => {
  it('prioritizes active replies in marker labels', () => {
    const post = makePost({
      commentsCount: 8,
      points: 20,
      poll: {
        id: 1,
        postId: 1,
        votingLength: 1,
        participantsCount: 14,
        options: [],
      },
    });

    expect(getMapMarkerLabel(post)).toBe('8');
    expect(getMapPostTone(post)).toBe('chat');
    expect(getMapPostSignalLabel(post)).toBe('people talking');
  });

  it('labels poll-only posts clearly on the map', () => {
    const post = makePost({
      poll: {
        id: 1,
        postId: 1,
        votingLength: 1,
        participantsCount: 0,
        options: [],
      },
    });

    expect(getMapMarkerLabel(post)).toBe('poll');
    expect(getMapPostTone(post)).toBe('poll');
  });

  it('chooses the highest-signal post as the featured pulse', () => {
    const quiet = makePost({ id: 1, points: 5, commentsCount: 1 });
    const active = makePost({ id: 2, points: 16, commentsCount: 12 });

    expect(getFeaturedMapPost([quiet, active])).toBe(active);
  });

  it('turns posts and live updates into pulse metrics', () => {
    const metrics = getMapPulseMetrics(
      [
        makePost({ points: 12, commentsCount: 4 }),
        makePost({
          id: 2,
          points: 8,
          poll: {
            id: 2,
            postId: 2,
            votingLength: 1,
            participantsCount: 11,
            options: [],
          },
        }),
      ],
      [liveUpdate],
    );

    expect(metrics).toEqual({
      level: 'rising',
      liveCount: 1,
      pollCount: 1,
      postCount: 2,
      replyCount: 4,
      score: 45,
    });
  });

  it('builds a quiet live story for empty map states', () => {
    expect(getMapLiveStory([], [])).toEqual({
      detail: 'Open the radius or post what people nearby should know.',
      headline: 'Nothing nearby yet',
      metrics: [
        { label: 'drops', value: '0' },
        { label: 'X live', value: '0' },
        { label: 'replies', value: '0' },
      ],
      kicker: 'quiet nearby',
      tone: 'quiet',
    });
  });

  it('promotes live outside signals when the map has X enrichment', () => {
    const story = getMapLiveStory(
      [
        makePost({
          commentsCount: 2,
          points: 25,
          poll: {
            id: 1,
            postId: 1,
            votingLength: 5,
            participantsCount: 8,
            options: [],
          },
        }),
      ],
      [
        liveUpdate,
        {
          ...liveUpdate,
          id: 'live-2',
          title: 'Open mic queue is moving',
        },
      ],
    );

    expect(story).toEqual({
      detail: '1 drop, 2 replies, and 1 poll are already in range.',
      headline: '2 X mentions nearby',
      metrics: [
        { label: 'drops', value: '1' },
        { label: 'X live', value: '2' },
        { label: 'replies', value: '2' },
      ],
      kicker: 'rising nearby',
      tone: 'rising',
    });
  });

  it('uses the strongest nearby post as the story when there are no live updates', () => {
    const story = getMapLiveStory(
      [
        makePost({ id: 1, title: 'Quiet table swap', points: 1 }),
        makePost({
          id: 2,
          title: 'Food truck line is moving fast',
          commentsCount: 4,
          points: 38,
        }),
      ],
      [],
    );

    expect(story.headline).toBe('Food truck line is moving fast');
    expect(story.detail).toBe('2 drops and 4 replies are already in range.');
    expect(story.kicker).toBe('rising nearby');
  });

  it('turns quiet map states into a clear first-action vibe', () => {
    expect(getMapVibeSnapshot([], [])).toEqual({
      action: 'Post first',
      body: 'No drops yet. Open the radius or post what is happening.',
      eyebrow: 'vibe check',
      title: 'Quiet nearby',
      tone: 'quiet',
    });
  });

  it('builds a premium live sheet summary for the map panel', () => {
    const summary = getMapLiveSheetSummary(
      'Cupertino Car Wash, 10002',
      [makePost({ commentsCount: 4, points: 38 })],
      [
        liveUpdate,
        {
          ...liveUpdate,
          id: 'live-2',
          title: 'Cafe queue is moving',
        },
      ],
    );

    expect(summary).toEqual({
      action: 'Scan X',
      detail:
        '2 X mentions, 1 drop, and 4 replies are active around Cupertino Car Wash, 10002.',
      headline: 'X is moving nearby',
      kicker: 'nearby now',
      statChips: [
        { label: 'drops', value: '1' },
        { label: 'X live', value: '2' },
        { label: 'replies', value: '4' },
      ],
      tone: 'rising',
    });
  });

  it('keeps empty live sheet states directional', () => {
    expect(getMapLiveSheetSummary('Cupertino', [], [])).toEqual({
      action: 'Post first',
      detail:
        'No drops or X mentions inside Cupertino. Widen the radius or post first.',
      headline: 'Quiet nearby',
      kicker: 'nearby now',
      statChips: [
        { label: 'drops', value: '0' },
        { label: 'X live', value: '0' },
        { label: 'replies', value: '0' },
      ],
      tone: 'quiet',
    });
  });

  it('promotes outside chatter when live enrichment is leading the map', () => {
    expect(
      getMapVibeSnapshot([makePost()], [
        liveUpdate,
        {
          ...liveUpdate,
          id: 'live-2',
          title: 'Cafe queue is moving',
        },
      ]),
    ).toEqual({
      action: 'Scan X',
      body: '2 X mentions are moving around 1 nearby drop.',
      eyebrow: 'vibe check',
      title: 'X is moving nearby',
      tone: 'rising',
    });
  });

  it('surfaces active thread energy when replies dominate', () => {
    expect(
      getMapVibeSnapshot(
        [
          makePost({ commentsCount: 8, points: 34 }),
          makePost({ id: 2, commentsCount: 4, points: 12 }),
        ],
        [],
      ),
    ).toEqual({
      action: 'Open top thread',
      body: '12 replies across 2 drops. Jump in while it is active.',
      eyebrow: 'vibe check',
      title: 'People are talking nearby',
      tone: 'rising',
    });
  });

  it('projects live enrichment into deterministic approximate map signals', () => {
    const center = { latitude: 37.323, longitude: -122.0322 };
    const updates = [
      liveUpdate,
      {
        ...liveUpdate,
        id: 'live-traffic',
        title: 'Traffic bunching near the market',
        tags: ['heads-up', 'traffic'],
      },
    ];

    const signals = getLiveMapSignals(updates, center, 500);
    const repeatedSignals = getLiveMapSignals(updates, center, 500);

    expect(signals).toHaveLength(2);
    expect(signals).toEqual(repeatedSignals);
    expect(signals[0]).toMatchObject({
      id: 'live-1',
      label: 'nearby',
      sourceLabel: 'X live',
      tone: 'social',
    });
    expect(signals[1]).toMatchObject({
      label: 'traffic',
      tone: 'alert',
    });
    expect(signals[0].coordinates).not.toEqual(signals[1].coordinates);
    expect(distanceBetween(center, signals[0].coordinates)).toBeLessThanOrEqual(
      500,
    );
    expect(distanceBetween(center, signals[1].coordinates)).toBeLessThanOrEqual(
      500,
    );
  });

  it('caps live map signals to keep the map readable', () => {
    const signals = getLiveMapSignals(
      Array.from({ length: 8 }, (_, index) => ({
        ...liveUpdate,
        id: `live-${index}`,
        url: `https://x.com/search?q=${index}`,
      })),
      { latitude: 37.323, longitude: -122.0322 },
      1000,
    );

    expect(signals).toHaveLength(4);
  });

  it('fans live map signals apart in tight map radiuses', () => {
    const center = { latitude: 37.323, longitude: -122.0322 };
    const signals = getLiveMapSignals(
      [
        {
          ...liveUpdate,
          id: 'demo-live-1',
          tags: ['music', 'nearby'],
          url: 'https://x.com/search?q=cupertino%20open%20mic',
        },
        {
          ...liveUpdate,
          id: 'demo-live-2',
          title: 'Traffic bunching near the market',
          tags: ['heads-up'],
          url: 'https://x.com/search?q=cupertino%20traffic',
        },
      ],
      center,
      200,
    );

    expect(
      distanceBetween(signals[0].coordinates, signals[1].coordinates),
    ).toBeGreaterThan(150);
  });
});
