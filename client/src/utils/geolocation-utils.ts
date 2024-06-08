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
