import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { geolocationClient } from '@/api/common/geolocation-client';
import type { GeolocationName, Place } from '@/api/types';

type Response = GeolocationName | null;
type Variables = {
  latitude: number | null;
  longitude: number | null;
};

export const useLocationName = createQuery<Response, Variables, AxiosError>(
  `locationName`,
  async ({ queryKey: [_primaryKey, variables] }) => {
    if (variables.latitude === null || variables.longitude === null)
      return null;

    const response = await geolocationClient.get('/reverse', {
      params: {
        lat: variables.latitude,
        lon: variables.longitude,
        format: 'json',
      },
    });

    const data: Place | null = response.data;

    if (data === null) return null;

    const names = data.display_name.split(', ');

    return names.length > 0
      ? {
          locationName: names[0],
          displayName: data.display_name,
        }
      : null;
  }
);
