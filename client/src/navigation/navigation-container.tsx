import type { LinkingOptions } from '@react-navigation/native';
import { NavigationContainer as RNNavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth, useTheme } from '@/core';
import type { RootStackParamList } from '@/navigation/types';
import { LoadingComponent } from '@/ui';

import { useThemeConfig } from './use-theme-config';

const prefix = Linking.createURL('/');
const AuthLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix],
  config: {
    screens: {
      Auth: {
        screens: {
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
  const isDark = useTheme.use.colorScheme() === 'dark';

  if (url) {
    const { hostname, path, queryParams, scheme } = Linking.parse(url);

    console.log(
      `Linked to app ${scheme} with hostname: ${hostname}, path: ${path} and data: ${JSON.stringify(
        queryParams
      )}`
    );
  }

  return (
    <SafeAreaProvider
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        backgroundColor: isDark ? 'black' : 'white',
      }}
    >
      <RNNavigationContainer
        linking={isLoggedIn ? AppLinking : AuthLinking}
        theme={theme}
        fallback={<LoadingComponent />}
      >
        {children}
      </RNNavigationContainer>
    </SafeAreaProvider>
  );
};
