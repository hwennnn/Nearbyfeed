import { getLocationMapTarget } from '@nearbyfeed/shared';
import type { PostLocation } from '@/api';

export const getOpenMapsPayload = (location: PostLocation) =>
  getLocationMapTarget(location);
