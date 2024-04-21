import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import { MapScreen } from '@/screens/maps';

export type MapStackParamList = {
  MapScreen: undefined;
};

const Stack = createNativeStackNavigator<MapStackParamList>();

type Props = NativeStackScreenProps<MapStackParamList>;
export type MapNavigatorProp = Props['navigation'];

export const MapNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapScreen"
        component={MapScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
