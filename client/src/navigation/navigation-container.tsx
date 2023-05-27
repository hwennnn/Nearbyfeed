import type { LinkingOptions } from '@react-navigation/native';
import { NavigationContainer as RNNavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/core';
import type { RootStackParamList } from '@/navigation/types';

import { useThemeConfig } from './use-theme-config';

const prefix = Linking.createURL('/');
const AuthLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: {
            path: 'login/:verifyEmail',
          },
          ResetPassword: {
            path: 'reset-password/:token',
          },
        },
      },
    },
  },
};
const AppLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix],
  config: {
    screens: {},
  },
};

export const NavigationContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isLoggedIn = useAuth.use.status() === 'signIn';
  const theme = useThemeConfig();
  const url = Linking.useURL();

  if (url) {
    const { hostname, path, queryParams, scheme } = Linking.parse(url);

    console.log(
      `Linked to app ${scheme} with hostname: ${hostname}, path: ${path} and data: ${JSON.stringify(
        queryParams
      )}`
    );
  }

  return (
    <SafeAreaProvider>
      <RNNavigationContainer
        linking={isLoggedIn ? AppLinking : AuthLinking}
        theme={theme}
        // fallback={<Text>Loading...</Text>}
      >
        {children}
      </RNNavigationContainer>
    </SafeAreaProvider>
  );
};
