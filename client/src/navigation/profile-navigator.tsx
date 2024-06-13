import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import { Profile } from '@/screens';
import { BlockedAccountScreen } from '@/screens/profile/blocked-accounts';
import { CreatePasswordScreen } from '@/screens/profile/create-password-screen';
import { EditProfile } from '@/screens/profile/edit-profile';
import { ManageAccountLinkingScreen } from '@/screens/profile/manage-account-linking';
import { UpdatePasswordScreen } from '@/screens/profile/update-password-screen';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  BlockedAccounts: undefined;
  UpdatePassword: undefined;
  CreatePassword: undefined;
  ManageAccountLinking: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

type Props = NativeStackScreenProps<ProfileStackParamList>;
export type ProfileNavigatorProp = Props['navigation'];

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Profile" component={Profile} />

      <Stack.Screen name="EditProfile" component={EditProfile} />

      <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />

      <Stack.Screen name="CreatePassword" component={CreatePasswordScreen} />

      <Stack.Screen name="BlockedAccounts" component={BlockedAccountScreen} />

      <Stack.Screen
        name="ManageAccountLinking"
        component={ManageAccountLinkingScreen}
      />
    </Stack.Navigator>
  );
};
