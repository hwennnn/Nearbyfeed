/* eslint-disable react/no-unstable-nested-components */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { useColorScheme } from 'react-native';

import type { ColorSchemeType } from '@/core';
import { setSystemColorScheme, useAuth, useIsFirstTime } from '@/core';
import { TabNavigator } from '@/navigation/tab-navigator';
import type { RootStackParamList } from '@/navigation/types';
import { AddFeed, FeedDetails } from '@/screens';
import { CommentsDetails } from '@/screens/feed/comment-details';
import { MyComments } from '@/screens/profile/my-comments';
import { MyPosts } from '@/screens/profile/my-posts';
import { HeaderButton, View } from '@/ui';

import { AuthNavigator } from './auth-navigator';
import { NavigationContainer } from './navigation-container';

const Stack = createNativeStackNavigator<RootStackParamList>();
type Props = NativeStackScreenProps<RootStackParamList>;
export type RootNavigatorProp = Props['navigation'];

export const Root = () => {
  const [isFirstTime] = useIsFirstTime();

  const status = useAuth.use.status();
  const systemColorScheme = useColorScheme();

  const setSystemColor = React.useCallback((t: ColorSchemeType) => {
    setSystemColorScheme(t);
  }, []);

  React.useEffect(() => {
    setSystemColor(systemColorScheme as ColorSchemeType);
  }, [setSystemColor, systemColorScheme]);

  const onLayoutRootView = React.useCallback(async () => {
    if (status !== 'idle') {
      await SplashScreen.hideAsync();
    }
  }, [status]);

  return (
    <View className="flex-1" onLayout={onLayoutRootView}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
        initialRouteName={isFirstTime ? 'Auth' : 'App'}
      >
        <Stack.Screen
          name="App"
          component={TabNavigator}
          options={{
            animation: 'fade',
            animationTypeForReplace: 'push',
          }}
        />

        {status === 'signOut' && (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animation: 'slide_from_bottom',
              animationTypeForReplace: 'push',
            }}
          />
        )}

        <Stack.Group
          screenOptions={{
            headerShown: true,
            animation: 'default',
            gestureEnabled: true,
          }}
        >
          <Stack.Screen
            name="AddFeed"
            component={AddFeed}
            options={{
              headerTitle: 'Create a Feed',
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
          <Stack.Screen
            name="CommentDetails"
            component={CommentsDetails}
            options={{
              presentation: 'modal',
              animation: 'default',
              headerTitle: 'Comment',
              headerLeft: () => (
                <HeaderButton iconName="chevron-back-outline" />
              ),
            }}
          />
          <Stack.Screen
            name="MyPosts"
            component={MyPosts}
            options={{
              headerTitle: 'My Posts',
            }}
          />
          <Stack.Screen
            name="MyComments"
            component={MyComments}
            options={{
              headerTitle: 'My Comments',
            }}
          />
        </Stack.Group>
      </Stack.Navigator>
    </View>
  );
};

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Root />
    </NavigationContainer>
  );
};
