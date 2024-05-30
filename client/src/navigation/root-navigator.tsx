/* eslint-disable react/no-unstable-nested-components */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';

import { useAuth } from '@/core';
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
  const status = useAuth.use.status();

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
          animation: 'none',
        }}
      >
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
            </>
          )}
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
