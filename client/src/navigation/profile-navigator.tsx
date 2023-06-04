import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import { Profile } from '@/screens';
import { EditProfile } from '@/screens/profile/edit-profile';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

type Props = NativeStackScreenProps<ProfileStackParamList>;
export type ProfileNavigatorProp = Props['navigation'];

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          headerTitle: 'Edit Profile',
        }}
      />
    </Stack.Navigator>
  );
};
