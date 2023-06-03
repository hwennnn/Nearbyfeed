import 'react-native-gesture-handler';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import FlashMessage from 'react-native-flash-message';

import { APIProvider } from '@/api';
import { hydrateAuth, loadSelectedTheme } from '@/core';
import { RootNavigator } from '@/navigation';

hydrateAuth();
loadSelectedTheme();
SplashScreen.preventAutoHideAsync();

const App = () => {
  return (
    <ActionSheetProvider>
      <BottomSheetModalProvider>
        <APIProvider>
          <RootNavigator />
          <FlashMessage position="top" />
        </APIProvider>
      </BottomSheetModalProvider>
    </ActionSheetProvider>
  );
};

export default App;
