import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-location';

import { showErrorMessage } from '@/ui';

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

export const requestCameraPermission = async (): Promise<boolean> => {
  const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();

  if (cameraStatus.status !== 'granted') {
    showErrorMessage(
      'Camera access is required to use this feature. Please enable camera permissions in your settings.'
    );
    return false;
  }

  return true;
};

export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const cameraRollStatus =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (cameraRollStatus.status !== 'granted') {
    showErrorMessage(
      'Media library access is required to use this feature. Please enable media library permissions in your settings.'
    );
    return false;
  }

  return true;
};
