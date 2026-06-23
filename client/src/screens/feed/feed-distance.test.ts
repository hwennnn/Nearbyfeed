import {
  DISTANCE_OPTIONS_METERS,
  formatDistanceMeters,
} from '@nearbyfeed/shared';
import {
  DEFAULT_FEED_DISTANCE,
  FEED_DISTANCE_CANCEL_LABEL,
  FEED_DISTANCE_OPTIONS,
  formatFeedDistance,
  getFeedDistanceActionLabels,
  getFeedDistanceValueAtIndex,
} from './feed-distance';

describe('feed distance helpers', () => {
  it('uses the shared nearby distance options', () => {
    expect(FEED_DISTANCE_OPTIONS.map((option) => option.value)).toEqual(
      DISTANCE_OPTIONS_METERS,
    );
    expect(getFeedDistanceActionLabels()).toEqual([
      ...DISTANCE_OPTIONS_METERS.map(
        (distance) => `Within ${formatDistanceMeters(distance)}`,
      ),
      FEED_DISTANCE_CANCEL_LABEL,
    ]);
    expect(DEFAULT_FEED_DISTANCE).toBe(DISTANCE_OPTIONS_METERS[0]);
  });

  it('maps action-sheet selections back to shared distance values', () => {
    expect(getFeedDistanceValueAtIndex(0)).toBe(DISTANCE_OPTIONS_METERS[0]);
    expect(getFeedDistanceValueAtIndex(2)).toBe(DISTANCE_OPTIONS_METERS[2]);
    expect(getFeedDistanceValueAtIndex(undefined)).toBeUndefined();
    expect(getFeedDistanceValueAtIndex(99)).toBeUndefined();
  });

  it('formats feed distances through the shared formatter', () => {
    expect(formatFeedDistance(200)).toBe('200m');
    expect(formatFeedDistance(1000)).toBe('1km');
  });
});
