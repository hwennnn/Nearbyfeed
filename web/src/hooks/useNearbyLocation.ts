import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchLocationName } from '../lib/api';
import { DEFAULT_COORDINATES } from '../lib/constants';
import { type Coordinates } from '../types';

export type LocationStatus = 'locating' | 'live' | 'fallback';

export const useNearbyLocation = () => {
  const [coordinates, setCoordinates] =
    useState<Coordinates>(DEFAULT_COORDINATES);
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>('locating');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('fallback');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('live');
      },
      () => setLocationStatus('fallback'),
      {
        enableHighAccuracy: true,
        timeout: 5000,
      },
    );
  }, []);

  const locationQuery = useQuery({
    queryKey: ['location-name', coordinates],
    queryFn: async () => await fetchLocationName(coordinates),
  });

  const locationName =
    locationQuery.data?.locationName ??
    (locationStatus === 'live' ? 'your block' : 'Cupertino');

  return {
    coordinates,
    locationName,
    locationQuery,
    locationStatus,
  };
};
