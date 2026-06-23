import { describe, expect, it } from 'vitest';
import {
  createRadiusFieldGeoJson,
  getNearbyMapBounds,
  getNearbyMapFitPadding,
  getNearbyRadiusZoom,
} from './map-utils';

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

describe('map utils', () => {
  it('builds a radius field with closed radius geometry and a center point', () => {
    const center = { latitude: 37.323, longitude: -122.0322 };
    const radiusMeters = 500;
    const field = createRadiusFieldGeoJson(center, radiusMeters);
    const radiusFeature = field.features[0] as GeoJSON.Feature<
      GeoJSON.Polygon,
      { kind: 'radius' }
    >;
    const centerFeature = field.features[1] as GeoJSON.Feature<
      GeoJSON.Point,
      { kind: 'center' }
    >;

    expect(field.features).toHaveLength(2);
    expect(radiusFeature.properties.kind).toBe('radius');
    expect(centerFeature).toEqual({
      type: 'Feature',
      properties: { kind: 'center' },
      geometry: {
        type: 'Point',
        coordinates: [center.longitude, center.latitude],
      },
    });

    const radiusRing = radiusFeature.geometry.coordinates[0];
    expect(radiusRing[0]).toEqual(radiusRing[radiusRing.length - 1]);
    expect(radiusRing.length).toBeGreaterThanOrEqual(80);

    const firstRadiusPoint = {
      latitude: radiusRing[0][1],
      longitude: radiusRing[0][0],
    };
    expect(distanceBetween(center, firstRadiusPoint)).toBeCloseTo(
      radiusMeters,
      -1,
    );
  });

  it('keeps each radius option visually substantial on the map', () => {
    const center = { latitude: 37.323, longitude: -122.0322 };

    expect(getNearbyRadiusZoom(center, 200)).toBeGreaterThan(15);
    expect(getNearbyRadiusZoom(center, 500)).toBeGreaterThan(14);
    expect(getNearbyRadiusZoom(center, 1000)).toBeGreaterThan(13);
    expect(getNearbyRadiusZoom(center, 200)).toBeGreaterThan(
      getNearbyRadiusZoom(center, 500),
    );
    expect(getNearbyRadiusZoom(center, 500)).toBeGreaterThan(
      getNearbyRadiusZoom(center, 1000),
    );
  });

  it('builds map bounds from the nearby radius when no posts exist', () => {
    const center = { latitude: 37.323, longitude: -122.0322 };
    const bounds = getNearbyMapBounds({
      center,
      points: [],
      radiusMeters: 500,
    });

    expect(bounds[0][0]).toBeLessThan(center.longitude);
    expect(bounds[0][1]).toBeLessThan(center.latitude);
    expect(bounds[1][0]).toBeGreaterThan(center.longitude);
    expect(bounds[1][1]).toBeGreaterThan(center.latitude);
  });

  it('expands map bounds to include nearby posts outside the radius edge', () => {
    const center = { latitude: 37.323, longitude: -122.0322 };
    const post = { latitude: 37.34, longitude: -122.01 };
    const bounds = getNearbyMapBounds({
      center,
      points: [post],
      radiusMeters: 200,
    });

    expect(bounds[1][0]).toBe(post.longitude);
    expect(bounds[1][1]).toBe(post.latitude);
  });

  it('uses side-panel padding on desktop and bottom-sheet padding on mobile', () => {
    expect(getNearbyMapFitPadding({ height: 900, width: 1280 })).toEqual({
      bottom: 110,
      left: 72,
      right: 440,
      top: 134,
    });

    expect(getNearbyMapFitPadding({ height: 760, width: 390 })).toEqual({
      bottom: 340,
      left: 42,
      right: 42,
      top: 118,
    });
  });
});
