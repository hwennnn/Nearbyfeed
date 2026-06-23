import { type Coordinates } from '../types';

export const MAPBOX_ACCESS_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';

export const DEFAULT_COORDINATES: Coordinates = {
  latitude: 37.323,
  longitude: -122.0322,
};
