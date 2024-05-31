import 'react-native-gesture-handler';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
// import { enableMapSet } from 'immer';
import React from 'react';
import FlashMessage from 'react-native-flash-message';

import { APIProvider } from '@/api/common';
import { hydrateAuth, hydrateTheme } from '@/core';
import { RootNavigator } from '@/navigation';
import { OverlayLoadingSpinner } from '@/ui';

function cacheImages(images: any[]) {
  return images.map((image) => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
      // .then((download) => console.log(download.uri));
    }
  });
}
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const App = () => {
  const [appIsReady, setAppIsReady] = React.useState(false);

  // Load any resources or data that you need before rendering the app
  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        hydrateAuth();
        hydrateTheme();
        // enableMapSet();
        // userUtils.hydrateUser();

        const imageAssets = cacheImages([
          require('assets/images/rounded-icon.png'),
          require('assets/images/location-permission.png'),
        ]);

        await Promise.all([...imageAssets]);
      } catch (e) {
        // You might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setAppIsReady(true);
        console.log('app ready');
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <ActionSheetProvider>
      <BottomSheetModalProvider>
        <APIProvider>
          <RootNavigator />
          <FlashMessage position="top" />
          <OverlayLoadingSpinner />
        </APIProvider>
      </BottomSheetModalProvider>
    </ActionSheetProvider>
  );
};

export default App;
