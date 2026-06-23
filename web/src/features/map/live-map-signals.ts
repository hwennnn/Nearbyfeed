import { type Coordinates, type LiveUpdate } from '../../types';
import { type LiveMapSignal, type LiveMapSignalTone } from './map-types';

const EARTH_RADIUS_METERS = 6371008.8;
const MAX_LIVE_MAP_SIGNALS = 4;
const LIVE_SIGNAL_OPEN_SIDE_BEARINGS = [340, 280, 220, 40];

const getStableUnitHash = (input: string): number => {
  let hash = 2166136261;

  for (const character of input) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
};

const getOffsetCoordinates = (
  origin: Coordinates,
  distanceMeters: number,
  bearingDegrees: number,
): Coordinates => {
  if (distanceMeters <= 0) return origin;

  const latitude = (origin.latitude * Math.PI) / 180;
  const longitude = (origin.longitude * Math.PI) / 180;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const distance = distanceMeters / EARTH_RADIUS_METERS;
  const nextLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(distance) +
      Math.cos(latitude) * Math.sin(distance) * Math.cos(bearing),
  );
  const nextLongitude =
    longitude +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distance) * Math.cos(latitude),
      Math.cos(distance) - Math.sin(latitude) * Math.sin(nextLatitude),
    );

  return {
    latitude: (nextLatitude * 180) / Math.PI,
    longitude: (nextLongitude * 180) / Math.PI,
  };
};

const getLiveSignalTone = (update: LiveUpdate): LiveMapSignalTone => {
  const tags = update.tags.map((tag) => tag.toLowerCase());

  if (
    tags.some((tag) =>
      ['alert', 'heads-up', 'incident', 'traffic', 'warning'].includes(tag),
    )
  ) {
    return 'alert';
  }

  if (
    tags.some((tag) =>
      ['event', 'food', 'line', 'music', 'queue', 'show'].includes(tag),
    )
  ) {
    return 'scene';
  }

  return 'social';
};

const getLiveSignalLabel = (update: LiveUpdate): string => {
  const normalizedTags = update.tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  const priorityTags = [
    'traffic',
    'alert',
    'incident',
    'music',
    'event',
    'queue',
    'food',
    'nearby',
  ];

  return (
    priorityTags.find((tag) => normalizedTags.includes(tag)) ??
    normalizedTags[0] ??
    'live'
  );
};

export const getLiveMapSignals = (
  liveUpdates: LiveUpdate[],
  center: Coordinates,
  radiusMeters: number,
): LiveMapSignal[] => {
  const visibleUpdates = liveUpdates.slice(0, MAX_LIVE_MAP_SIGNALS);

  return visibleUpdates.map((update, index) => {
    const seed = `${update.id}:${update.url}:${index}`;
    const radius = Math.max(0, radiusMeters);
    const distanceFloor = Math.min(28, radius);
    const distanceRatio =
      [0.82, 0.88, 0.64, 0.84][index] +
      (getStableUnitHash(`${seed}:distance`) - 0.5) * 0.08;
    const distanceMeters = Math.min(
      radius,
      Math.max(distanceFloor, radius * distanceRatio),
    );
    const bearing =
      (LIVE_SIGNAL_OPEN_SIDE_BEARINGS[index] +
        (getStableUnitHash(`${seed}:bearing`) - 0.5) * 10 +
        360) %
      360;

    return {
      coordinates: getOffsetCoordinates(center, distanceMeters, bearing),
      id: update.id,
      label: getLiveSignalLabel(update),
      sourceLabel: 'X live',
      summary: update.summary,
      title: update.title,
      tone: getLiveSignalTone(update),
      url: update.url,
    };
  });
};
