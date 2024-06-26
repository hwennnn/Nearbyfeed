import type { ConfigContext, ExpoConfig } from '@expo/config';

import { ClientEnv, Env, withEnvSuffix } from './env';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.NAME,
  description: `${Env.NAME} Mobile App`,
  slug: 'nearbyfeed',
  version: Env.VERSION.toString(),
  orientation: 'portrait',
  icon: `${withEnvSuffix('./assets/icon')}.png`,
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#F75469',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['assets/images/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: Env.BUNDLE_ID,
    usesAppleSignIn: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: `${withEnvSuffix('./assets/icon')}.png`,
      backgroundColor: '#FFFFFF',
    },
    package: Env.PACKAGE,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    ['@bacons/link-assets', ['./assets/fonts/Inter.ttf']],
    'expo-localization',
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Nearbyfeed to access your photos',
        cameraPermission: 'Allow Nearbyfeed to access your camera',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow Nearbyfeed to use your location',
      },
    ],
    ['expo-apple-authentication'],
  ],
  extra: {
    ...ClientEnv,
  },
  scheme: 'nearbyfeed',
});
