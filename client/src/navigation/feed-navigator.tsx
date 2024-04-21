import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import { Feed } from '@/screens';

export type FeedStackParamList = {
  Feed: undefined;
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

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
    </Stack.Navigator>
  );
};
