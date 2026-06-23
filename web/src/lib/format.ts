import {
  type DistanceMeters,
  formatDistanceMeters,
  formatInitials,
  formatRelativeCompactTime,
} from '@nearbyfeed/shared';

export const formatDistance = (distance: DistanceMeters): string =>
  formatDistanceMeters(distance);

export const initials = (value?: string): string =>
  formatInitials(value, 'NF');

export const timeAgo = (value?: string | null): string => {
  if (value === undefined || value === null) return 'Just now';
  return formatRelativeCompactTime(value, new Date(Date.now()));
};
