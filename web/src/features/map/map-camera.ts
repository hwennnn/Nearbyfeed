import { type DistanceMeters } from '@nearbyfeed/shared';
import { type Coordinates } from '../../types';
import {
  getNearbyMapBounds,
  getNearbyMapFitPadding,
  getNearbyRadiusZoom,
  type NearbyMapBounds,
  type NearbyMapFitPadding,
} from '../../lib/map-utils';

export type MapViewportSize = {
  height: number;
  width: number;
};

export type NearbyActivityCamera = {
  bounds: NearbyMapBounds;
  options: {
    duration: number;
    essential: boolean;
    maxZoom: number;
    padding: NearbyMapFitPadding;
  };
};

export type SelectedPostCamera = {
  center: [number, number];
  essential: boolean;
  padding: NearbyMapFitPadding;
  zoom: number;
};

export const getNearbyActivityCamera = ({
  center,
  distance,
  height,
  liveSignalPoints,
  postPoints,
  width,
}: MapViewportSize & {
  center: Coordinates;
  distance: DistanceMeters;
  liveSignalPoints: Coordinates[];
  postPoints: Coordinates[];
}): NearbyActivityCamera => ({
  bounds: getNearbyMapBounds({
    center,
    points: [...postPoints, ...liveSignalPoints],
    radiusMeters: distance,
  }),
  options: {
    duration: 900,
    essential: true,
    maxZoom: 16,
    padding: getNearbyMapFitPadding({ height, width }),
  },
});

export const getSelectedPostCamera = ({
  center,
  distance,
  height,
  post,
  width,
}: MapViewportSize & {
  center: Coordinates;
  distance: DistanceMeters;
  post: Coordinates;
}): SelectedPostCamera => ({
  center: [post.longitude, post.latitude],
  essential: true,
  padding: getNearbyMapFitPadding({ height, width }),
  zoom: Math.max(15, getNearbyRadiusZoom(center, distance)),
});
