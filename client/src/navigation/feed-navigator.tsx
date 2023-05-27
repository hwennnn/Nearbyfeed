import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import type { Post as PostEntitiy } from '@/api';
import { AddPost, Feed, Post } from '@/screens';
import { Pressable, Text } from '@/ui';

export type FeedStackParamList = {
  Feed: undefined;
  Post: { post: PostEntitiy };
  AddPost: undefined;
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

const GoToAddPost = () => {
  const { navigate } = useNavigation<FeedNavigatorProp>();

  return (
    <Pressable onPress={() => navigate('AddPost')} className="p-2">
      <Text className="text-primary-300">Create</Text>
    </Pressable>
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
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <GoToAddPost />,
        }}
      />

      <Stack.Screen name="Post" component={Post} />
      <Stack.Screen name="AddPost" component={AddPost} />
    </Stack.Navigator>
  );
};
