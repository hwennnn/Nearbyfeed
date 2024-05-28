import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import {
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '@/screens/forgot-password';
import { AuthOnboardingScreen } from '@/screens/login/auth-onboarding';
import { EmailLoginScreen } from '@/screens/login/email-login-form';
import { EmailRegisterScreen } from '@/screens/register';
import ValidateEmailScreen from '@/screens/validate-email';

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
    <Stack.Navigator>
      <Stack.Screen
        name="AuthOnboarding"
        component={AuthOnboardingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="Login" component={EmailLoginScreen} options={{}} />
      <Stack.Screen
        name="Register"
        component={EmailRegisterScreen}
        options={{}}
      />
      <Stack.Screen
        name="ValidateEmail"
        component={ValidateEmailScreen}
        options={{
          headerShown: false,
          headerBackTitleVisible: true,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: '',
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
