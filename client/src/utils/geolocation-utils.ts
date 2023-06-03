import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

import { showErrorMessage } from '@/ui';

export type Location = {
  latitude: number;
  longitude: number;
};

// Function to request location permission
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    let permission;
    if (Platform.OS === 'ios') {
      permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    } else {
      permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    }

    const result = await request(permission);
    if (result === RESULTS.GRANTED) {
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
      // Permission granted, you can now retrieve the location
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          const location: Location = {
            latitude,
            longitude,
          };

          resolve(location);
        },
        (error) => {
          console.error('Error retrieving location:', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      const error = new Error('Location permission denied');
      console.error('Location permission denied');
      reject(error);
    }
  });
};
