import { type Post } from '../../types';

type Location = NonNullable<Post['location']>;

export type LocationCardModel = {
  coordinateLabel: string;
  mapSearchUrl: string;
  microLabel: string;
};

export const getLocationCardModel = (location: Location): LocationCardModel => {
  const coordinateLabel = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  const query = encodeURIComponent(`${location.latitude},${location.longitude}`);

  return {
    coordinateLabel,
    mapSearchUrl: `https://www.google.com/maps/search/?api=1&query=${query}`,
    microLabel: 'Pinned place',
  };
};
