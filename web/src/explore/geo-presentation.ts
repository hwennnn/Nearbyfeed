import type { FeedItem } from './feed-api';

const PIN_CONFIDENCE = 0.8;
const EARTH_RADIUS_M = 6371000;
const CIRCLE_POINTS = 64;

export type AreaCircle = {
  lat: number;
  lng: number;
  radiusM: number;
  count: number;
};

/** Only items with a trustworthy position get a pin. */
export const hasExactLocation = (item: FeedItem): boolean =>
  item.geo_confidence >= PIN_CONFIDENCE;

export const splitByPrecision = (
  items: FeedItem[],
): { pinned: FeedItem[]; areas: AreaCircle[] } => {
  const pinned: FeedItem[] = [];
  const areas = new Map<string, AreaCircle>();

  for (const item of items) {
    if (hasExactLocation(item)) {
      pinned.push(item);
      continue;
    }

    // Items from one area search share a centre, so a pin each would stack
    // into a false hotspot. One circle says what we actually know.
    const key = `${item.lat},${item.lng},${item.geo_radius_m}`;
    const area = areas.get(key);
    if (area) {
      area.count += 1;
    } else {
      areas.set(key, {
        lat: item.lat,
        lng: item.lng,
        radiusM: item.geo_radius_m,
        count: 1,
      });
    }
  }

  return { pinned, areas: [...areas.values()] };
};

/** Traces a circle on the sphere as a closed ring of [lng, lat] points. */
export const circleRing = (area: AreaCircle): [number, number][] => {
  const angular = area.radiusM / EARTH_RADIUS_M;
  const lat1 = (area.lat * Math.PI) / 180;
  const lng1 = (area.lng * Math.PI) / 180;

  const ring: [number, number][] = [];
  for (let step = 0; step <= CIRCLE_POINTS; step += 1) {
    const bearing = (step / CIRCLE_POINTS) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) +
        Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
      );
    ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return ring;
};

export const formatDistance = (item: FeedItem): string => {
  if (!hasExactLocation(item)) {
    return `Within ${Math.round(item.geo_radius_m / 1000)} km`;
  }
  if (item.distance_m < 1000) {
    return `${Math.round(item.distance_m / 10) * 10} m away`;
  }
  return `${(item.distance_m / 1000).toFixed(1)} km away`;
};

export const formatAge = (publishedAt: string, now = Date.now()): string => {
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(publishedAt).getTime()) / 60000),
  );
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/** Fixture IDs do not exist on YouTube, so they must never reach the player. */
export const isFixture = (item: FeedItem): boolean =>
  item.media[0]?.embed_id?.startsWith('fx_') ?? false;
