import { type Coordinates } from '../types';

type RadiusFieldFeature =
  | GeoJSON.Feature<GeoJSON.Polygon, { kind: 'radius' }>
  | GeoJSON.Feature<GeoJSON.Point, { kind: 'center' }>;

const EARTH_CIRCUMFERENCE_METERS = 40075016.686;
const MAPBOX_TILE_SIZE = 512;
const TARGET_RADIUS_PIXELS = 140;

export const createCircleGeoJson = (
  coordinates: Coordinates,
  radiusMeters: number,
): GeoJSON.Feature<GeoJSON.Polygon, { kind: 'radius' }> => {
  const points = 80;
  const earthRadius = 6371008.8;
  const latitude = (coordinates.latitude * Math.PI) / 180;
  const longitude = (coordinates.longitude * Math.PI) / 180;
  const distance = radiusMeters / earthRadius;
  const ring: number[][] = [];

  for (let index = 0; index <= points; index += 1) {
    const bearing = (index * 2 * Math.PI) / points;
    const lat = Math.asin(
      Math.sin(latitude) * Math.cos(distance) +
        Math.cos(latitude) * Math.sin(distance) * Math.cos(bearing),
    );
    const lng =
      longitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(latitude),
        Math.cos(distance) - Math.sin(latitude) * Math.sin(lat),
      );

    ring.push([(lng * 180) / Math.PI, (lat * 180) / Math.PI]);
  }

  return {
    type: 'Feature',
    properties: { kind: 'radius' },
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
  };
};

export const createRadiusFieldGeoJson = (
  coordinates: Coordinates,
  radiusMeters: number,
): GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.Point> => ({
  type: 'FeatureCollection',
  features: [
    createCircleGeoJson(coordinates, radiusMeters),
    {
      type: 'Feature',
      properties: { kind: 'center' },
      geometry: {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude],
      },
    },
  ] satisfies RadiusFieldFeature[],
});

export const getNearbyRadiusZoom = (
  coordinates: Coordinates,
  radiusMeters: number,
): number => {
  const latitudeScale = Math.max(
    Math.cos((coordinates.latitude * Math.PI) / 180),
    0.01,
  );
  const metersPerPixel = Math.max(radiusMeters / TARGET_RADIUS_PIXELS, 0.1);
  const zoom = Math.log2(
    (EARTH_CIRCUMFERENCE_METERS * latitudeScale) /
      (MAPBOX_TILE_SIZE * metersPerPixel),
  );

  return Math.max(11, Math.min(16, zoom));
};
