import {
  type DistanceMeters,
  type TimeWindow,
} from '@nearbyfeed/shared';
import { useQuery } from '@tanstack/react-query';
import { type View } from '../app-types';
import { demoLiveUpdates } from '../data/demo';
import { fetchLiveUpdates } from '../lib/api';
import { type Coordinates } from '../types';

export const useNearbyLiveUpdates = ({
  coordinates,
  distance,
  locationName,
  timeWindow,
  view,
}: {
  coordinates: Coordinates;
  distance: DistanceMeters;
  locationName: string;
  timeWindow: TimeWindow;
  view: View;
}) => {
  const shouldFetchLiveUpdates = view === 'feed' || view === 'map';
  const liveQuery = useQuery({
    queryKey: ['live', coordinates, distance, timeWindow, locationName],
    queryFn: async () =>
      await fetchLiveUpdates({
        ...coordinates,
        distance,
        timeWindow,
        locationName,
      }),
    enabled: shouldFetchLiveUpdates,
  });

  const liveUpdates =
    liveQuery.data !== undefined && liveQuery.data.length > 0
      ? liveQuery.data
      : demoLiveUpdates;
  const isLiveFallback =
    liveQuery.data === undefined || liveQuery.data.length === 0;

  return {
    isLiveFallback,
    isLiveFetching: liveQuery.isFetching,
    liveQuery,
    liveUpdates,
    refreshLiveUpdates: () => void liveQuery.refetch(),
  };
};
