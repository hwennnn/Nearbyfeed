import { describe, expect, it } from 'vitest';
import type { FeedItem } from './feed-api';
import {
  circleRing,
  formatAge,
  formatDistance,
  isFixture,
  splitByPrecision,
} from './geo-presentation';

const item = (overrides: Partial<FeedItem> = {}): FeedItem => ({
  id: 1,
  source: 'youtube',
  kind: 'video',
  title: 'Title',
  body: null,
  url: null,
  author_name: null,
  author_url: null,
  media: [],
  lat: 1.35,
  lng: 103.82,
  geo_method: 'source_tagged',
  geo_confidence: 0.9,
  geo_radius_m: 50,
  place_name: null,
  published_at: '2026-11-05T00:00:00Z',
  distance_m: 420,
  ...overrides,
});

const areaItem = (id: number) =>
  item({ id, geo_method: 'query_area', geo_confidence: 0.4, geo_radius_m: 12000 });

describe('splitByPrecision', () => {
  it('pins confident items', () => {
    const { pinned, areas } = splitByPrecision([item()]);

    expect(pinned).toHaveLength(1);
    expect(areas).toHaveLength(0);
  });

  it('merges area items that share a search into one circle', () => {
    const { pinned, areas } = splitByPrecision([areaItem(1), areaItem(2), areaItem(3)]);

    expect(pinned).toHaveLength(0);
    expect(areas).toEqual([{ lat: 1.35, lng: 103.82, radiusM: 12000, count: 3 }]);
  });

  it('keeps separate searches as separate circles', () => {
    const { areas } = splitByPrecision([areaItem(1), { ...areaItem(2), lat: 2 }]);

    expect(areas).toHaveLength(2);
  });
});

describe('circleRing', () => {
  it('returns a closed ring at the requested radius', () => {
    const ring = circleRing({ lat: 0, lng: 0, radiusM: 111195, count: 1 });

    expect(ring[0][0]).toBeCloseTo(ring[ring.length - 1][0], 6);
    expect(ring[0][1]).toBeCloseTo(ring[ring.length - 1][1], 6);
    expect(ring[0][1]).toBeCloseTo(1, 2);
  });
});

describe('formatDistance', () => {
  it('never claims precision for an approximate item', () => {
    expect(formatDistance(areaItem(1))).toBe('Within 12 km');
  });

  it('formats metres and kilometres', () => {
    expect(formatDistance(item({ distance_m: 424 }))).toBe('420 m away');
    expect(formatDistance(item({ distance_m: 2460 }))).toBe('2.5 km away');
  });
});

describe('formatAge', () => {
  const now = Date.parse('2026-11-05T12:00:00Z');

  it('uses the largest sensible unit', () => {
    expect(formatAge('2026-11-05T11:59:50Z', now)).toBe('Just now');
    expect(formatAge('2026-11-05T11:15:00Z', now)).toBe('45m ago');
    expect(formatAge('2026-11-05T09:00:00Z', now)).toBe('3h ago');
    expect(formatAge('2026-11-02T12:00:00Z', now)).toBe('3d ago');
  });

  it('treats clock skew as just now', () => {
    expect(formatAge('2026-11-05T12:05:00Z', now)).toBe('Just now');
  });
});

describe('isFixture', () => {
  it('detects synthetic video IDs', () => {
    const media = [{ type: 'video', url: 'x', embed_id: 'fx_1_2_3' }];

    expect(isFixture(item({ media }))).toBe(true);
    expect(isFixture(item({ media: [{ ...media[0], embed_id: 'dQw4' }] }))).toBe(false);
    expect(isFixture(item())).toBe(false);
  });
});
