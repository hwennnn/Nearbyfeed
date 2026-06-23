import {
  type DistanceMeters,
  type TimeWindow,
} from '@nearbyfeed/shared';
import { useEffect } from 'react';
import { type View } from '../app-types';
import { captureEvent } from '../lib/api';
import { type LocationStatus } from './useNearbyLocation';

export const useRouteTelemetry = ({
  distance,
  locationStatus,
  timeWindow,
  view,
}: {
  distance: DistanceMeters;
  locationStatus: LocationStatus;
  timeWindow: TimeWindow;
  view: View;
}) => {
  useEffect(() => {
    void captureEvent(
      `web.${view}_viewed`,
      {
        distance,
        timeWindow,
        locationStatus,
      },
      view,
    );
  }, [distance, locationStatus, timeWindow, view]);
};
