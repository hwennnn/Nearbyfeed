import { type Coordinates } from '../types';

export const normalizeMapboxAccessToken = (value?: string): string =>
  value?.trim() ?? '';

export const MAPBOX_ACCESS_TOKEN =
  normalizeMapboxAccessToken(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);

export const HAS_MAPBOX_ACCESS_TOKEN = MAPBOX_ACCESS_TOKEN.length > 0;

export const DEFAULT_COORDINATES: Coordinates = {
  latitude: 37.323,
  longitude: -122.0322,
};
