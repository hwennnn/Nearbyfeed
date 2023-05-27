import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import { Login, Register } from '@/screens';
import ValidateEmailScreen from '@/screens/validate-email';

export type AuthStackParamList = {
  Login:
    | undefined
    | {
        verifyEmail: 'success';
      };
  Register: undefined;
  ValidateEmail: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ValidateEmail"
        component={ValidateEmailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
