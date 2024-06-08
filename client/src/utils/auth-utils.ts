import { Alert } from 'react-native';

import { useAuth, useTheme } from '@/core';

export const promptSignIn = (onLoggedIn: () => void): boolean => {
  const isLoggedIn = useAuth.getState().status === 'signIn';
  const scheme = useTheme.getState().colorScheme;

  if (isLoggedIn) return true;

  Alert.alert(
    'Sign-In Required',
    'To proceed with this action, you need to be logged in. Please log in to continue.',
    [
      {
        text: 'Sign In',
        onPress: () => {
          onLoggedIn();
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    {
      userInterfaceStyle: scheme,
    }
  );

  return false;
};
