import * as Permissions from 'expo-location';

import { requestLocationPermission } from '@/utils/permission-utils';

export type Location = {
  latitude: number;
  longitude: number;
};

export const retrieveCurrentPosition = async (): Promise<Location | null> => {
  return new Promise(async (resolve, reject) => {
    const permissionGranted = await requestLocationPermission();

    if (permissionGranted) {
      let position = await Permissions.getCurrentPositionAsync({
        accuracy: 3,
      });
      const { latitude, longitude } = position.coords;
      const location: Location = {
        latitude,
        longitude,
      };

      resolve(location);
    } else {
      const error = new Error('Location permission denied');
      console.error('Location permission denied');
      reject(error);
    }
  });
};

export type GooglePlaceLocation = {
  latitude: number;
  longitude: number;
  name: string;
  formattedAddress: string;
};

export const calculateDistance = (loc1: Location, loc2: Location) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (loc2.latitude - loc1.latitude) * (Math.PI / 180);
  const dLng = (loc2.longitude - loc1.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.latitude * (Math.PI / 180)) *
      Math.cos(loc2.latitude * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
