import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import {
  AuthOnboardingScreen,
  EmailLoginScreen,
  EmailRegisterScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  ValidateEmailScreen,
} from '@/screens';

export type AuthStackParamList = {
  AuthOnboarding: undefined;
  Login: undefined;
  Register: undefined;
  ValidateEmail: { pendingUserId: string; email: string; sessionId: string };
  ForgotPassword: undefined;
  ResetPassword: {
    token: string;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="AuthOnboarding" component={AuthOnboardingScreen} />
      <Stack.Screen name="Login" component={EmailLoginScreen} />
      <Stack.Screen name="Register" component={EmailRegisterScreen} />
      <Stack.Screen name="ValidateEmail" component={ValidateEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};
