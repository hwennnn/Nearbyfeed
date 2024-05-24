import * as Permissions from 'expo-location';

import { showErrorMessage } from '@/ui';

export type Location = {
  latitude: number;
  longitude: number;
};

// Function to request location permission
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    let { status } = await Permissions.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      console.log('Location permission granted');
      // Location permission granted, you can now proceed with location-related functionality
      return true;
    } else {
      console.log('Location permission denied');
      // Location permission denied, handle it accordingly
      return false;
    }
  } catch (error) {
    console.log('Error requesting location permission:', error);
    showErrorMessage(
      'There is an error when requesting location permission. Please try again.'
    );
    // Handle the error, display an error message, etc.
    return false;
  }
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
