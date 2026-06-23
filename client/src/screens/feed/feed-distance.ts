import {
  DEFAULT_DISTANCE_METERS,
  DISTANCE_OPTIONS_METERS,
  formatDistanceMeters,
  type DistanceMeters,
} from '@nearbyfeed/shared';

export const DEFAULT_FEED_DISTANCE = DEFAULT_DISTANCE_METERS;
export const FEED_DISTANCE_CANCEL_LABEL = 'Cancel';

export const FEED_DISTANCE_OPTIONS = DISTANCE_OPTIONS_METERS.map((value) => ({
  label: `Within ${formatDistanceMeters(value)}`,
  value,
}));

export const getFeedDistanceActionLabels = (): string[] => [
  ...FEED_DISTANCE_OPTIONS.map((option) => option.label),
  FEED_DISTANCE_CANCEL_LABEL,
];

export const getFeedDistanceValueAtIndex = (
  selectedIndex: number | undefined,
): DistanceMeters | undefined => {
  if (selectedIndex === undefined) return undefined;

  return FEED_DISTANCE_OPTIONS[selectedIndex]?.value;
};

export const formatFeedDistance = (distance: DistanceMeters): string =>
  formatDistanceMeters(distance);
