import { describe, expect, it } from 'vitest';
import {
  getNearbyActivityCamera,
  getSelectedPostCamera,
} from './map-camera';

const center = { latitude: 37.323, longitude: -122.0322 };
const post = {
  latitude: 37.34,
  longitude: -122.01,
};
const liveSignal = {
  latitude: 37.315,
  longitude: -122.05,
};

describe('map camera policy', () => {
  it('frames radius, posts, and live signals with desktop panel padding', () => {
    const camera = getNearbyActivityCamera({
      center,
      distance: 200,
      height: 900,
      liveSignalPoints: [liveSignal],
      postPoints: [post],
      width: 1280,
    });

    expect(camera.bounds[0][0]).toBeLessThanOrEqual(liveSignal.longitude);
    expect(camera.bounds[1][0]).toBeGreaterThanOrEqual(post.longitude);
    expect(camera.options).toEqual({
      duration: 900,
      essential: true,
      maxZoom: 16,
      padding: {
        bottom: 110,
        left: 72,
        right: 440,
        top: 134,
      },
    });
  });

  it('uses bottom-sheet padding on mobile when framing nearby activity', () => {
    const camera = getNearbyActivityCamera({
      center,
      distance: 500,
      height: 760,
      liveSignalPoints: [],
      postPoints: [],
      width: 390,
    });

    expect(camera.options.padding).toEqual({
      bottom: 340,
      left: 42,
      right: 42,
      top: 118,
    });
  });

  it('keeps selected posts clear of the live panel without losing radius context', () => {
    const camera = getSelectedPostCamera({
      center,
      distance: 200,
      height: 900,
      post,
      width: 1280,
    });

    expect(camera).toMatchObject({
      center: [post.longitude, post.latitude],
      essential: true,
      padding: {
        bottom: 110,
        left: 72,
        right: 440,
        top: 134,
      },
    });
    expect(camera.zoom).toBeGreaterThan(15);
    expect(camera.zoom).toBeLessThanOrEqual(16);
  });
});
