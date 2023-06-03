/* eslint-disable react/no-unstable-nested-components */
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import type { Post as PostEntitiy } from '@/api';
import { AddFeed, Feed, Post } from '@/screens';
import { TouchableOpacity } from '@/ui';
import colors from '@/ui/theme/colors';

export type FeedStackParamList = {
  Feed: undefined;
  Post: { post: PostEntitiy };
  AddFeed: undefined;
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

const CloseButton = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { goBack, canGoBack } = useNavigation<FeedNavigatorProp>();

  const closeModal = () => {
    if (canGoBack()) {
      goBack();
    }
  };

  return (
    <TouchableOpacity onPress={closeModal} className="">
      <Icon
        name="close"
        size={28}
        color={isDark ? colors.white : colors.black}
      />
    </TouchableOpacity>
  );
};

type Props = NativeStackScreenProps<FeedStackParamList>;
export type FeedNavigatorProp = Props['navigation'];

export const FeedNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Feed"
        component={Feed}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen name="Post" component={Post} />

      <Stack.Group
        screenOptions={{
          presentation: 'fullScreenModal',
        }}
      >
        <Stack.Screen
          name="AddFeed"
          component={AddFeed}
          options={{
            headerTitle: 'Create a Feed',
            headerLeft: () => <CloseButton />,
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};
