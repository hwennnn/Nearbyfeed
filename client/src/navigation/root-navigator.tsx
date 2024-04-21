/* eslint-disable react/no-unstable-nested-components */
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '@/core';
import { useIsFirstTime } from '@/core/hooks';
import { TabNavigator } from '@/navigation/tab-navigator';
import type { RootStackParamList } from '@/navigation/types';
import { AddFeed, FeedDetails, Onboarding } from '@/screens';
import { TouchableOpacity } from '@/ui';
import colors from '@/ui/theme/colors';

import { AuthNavigator } from './auth-navigator';
import { NavigationContainer } from './navigation-container';

const Stack = createNativeStackNavigator<RootStackParamList>();
type Props = NativeStackScreenProps<RootStackParamList>;
export type RootNavigatorProp = Props['navigation'];

const HeaderButton = ({ iconName }: { iconName: string }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { goBack, canGoBack } = useNavigation<RootNavigatorProp>();

  const closeModal = () => {
    if (canGoBack()) {
      goBack();
    }
  };

  return (
    <TouchableOpacity onPress={closeModal} className="">
      <Icon
        name={iconName}
        size={28}
        color={isDark ? colors.white : colors.black}
      />
    </TouchableOpacity>
  );
};

export const Root = () => {
  const status = useAuth.use.status();

  const [isFirstTime] = useIsFirstTime();
  const hideSplash = React.useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (status !== 'idle') {
      hideSplash();
    }
  }, [hideSplash, status]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'none',
      }}
    >
      {isFirstTime ? (
        <Stack.Screen name="Onboarding" component={Onboarding} />
      ) : (
        <Stack.Group>
          {status === 'signOut' ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              <Stack.Screen name="App" component={TabNavigator} />
              <Stack.Group
                screenOptions={{
                  headerShown: true,
                  animation: 'default',
                }}
              >
                <Stack.Screen
                  name="AddFeed"
                  component={AddFeed}
                  options={{
                    presentation: 'modal',
                    headerTitle: 'Create a Feed',
                    headerLeft: () => <HeaderButton iconName="close-outline" />,
                  }}
                />
                <Stack.Screen
                  name="FeedDetails"
                  component={FeedDetails}
                  options={{
                    headerTitle: 'Feed',
                    headerLeft: () => (
                      <HeaderButton iconName="chevron-back-outline" />
                    ),
                  }}
                />
              </Stack.Group>
            </>
          )}
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Root />
    </NavigationContainer>
  );
};
