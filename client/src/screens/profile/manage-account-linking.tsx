import { Env } from '@env';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import React from 'react';
import { Platform } from 'react-native';

import { queryClient, useDisconnectProvider } from '@/api';
import { useLinkGoogleAuth } from '@/api/auth/link-google-auth';
import { useSelf } from '@/api/users';
import { useAuth } from '@/core';
import { setAppLoading } from '@/core/loading';
import type { ProfileNavigatorProp } from '@/navigation/profile-navigator';
import {
  ErrorComponent,
  Header,
  Ionicons,
  LoadingButton,
  LoadingComponent,
  showErrorMessage,
  showSuccessMessage,
  Text,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';

const config = {
  iosClientId: Env.GOOGLE_AUTH_IOS_CLIENT_ID,
};

type AccountLinkingRowProps = {
  providerName: string;
  isLinked: boolean;
  iconName: string;
  canDisconnect: boolean;
  onPress: (isLinking: boolean) => void;
  buttonLabel?: string;
};

const AccountLinkingRow = ({
  providerName,
  isLinked,
  iconName,
  canDisconnect,
  onPress,
  buttonLabel,
}: AccountLinkingRowProps) => {
  return (
    <View className="mt-4 flex-row items-center justify-between">
      <View className="flex-row items-center space-x-2">
        <Ionicons
          name={iconName}
          size={24}
          className="text-black dark:text-white"
        />
        <Text>{providerName}</Text>
      </View>

      <LoadingButton
        disabled={isLinked ? !canDisconnect : false}
        label={buttonLabel ?? (isLinked ? 'Disconnect' : 'Connect')}
        onPress={() => onPress(!isLinked)}
      />
    </View>
  );
};

export const ManageAccountLinkingScreen = () => {
  const isLoggedIn = useAuth().status === 'signIn';

  const { navigate } = useNavigation<ProfileNavigatorProp>();

  const {
    isLoading,
    isError,
    data: user,
    refetch,
  } = useSelf({
    variables: {},
    enabled: isLoggedIn,
  });

  const [_request, response, promptAsync] = Google.useAuthRequest(config);

  const { mutate: disconnectProvider } = useDisconnectProvider({
    onSuccess: () => {
      queryClient.invalidateQueries(['self']);
      showSuccessMessage('Successfully delinked the provider to your account');
    },
    onError: (_error) => {
      showErrorMessage('There is an error. Please try again');
    },
    onSettled: () => {
      setAppLoading(false);
    },
    onMutate: () => {
      setAppLoading(true, 'Delinking...');
    },
  });

  const { mutate: mutateGoogleAuth } = useLinkGoogleAuth({
    onSuccess: () => {
      queryClient.invalidateQueries(['self']);
      showSuccessMessage('Successfully linked the provider to your account');
    },
    onError: (_error) => {
      showErrorMessage('There is an error. Please try again');
    },
    onSettled: () => {
      setAppLoading(false);
    },
    onMutate: () => {
      setAppLoading(true, 'Linking...');
    },
  });

  React.useEffect(() => {
    if (response !== null) {
      if (response.type === 'success') {
        const accessToken = response.authentication!.accessToken;
        mutateGoogleAuth({
          token: accessToken,
        });
      } else if (response.type === 'error') {
        console.log(response.error?.message);
        showErrorMessage('There is an error. Please try again');
      }
    }
  }, [mutateGoogleAuth, response]);

  if (!isLoggedIn || isLoading) {
    return <LoadingComponent />;
  }

  if (isError) {
    return <ErrorComponent onPressRetry={refetch} />;
  }

  const isGoogleLinked =
    user.providers.find(
      (provider) =>
        provider.providerName === 'GOOGLE' && provider.isActive === true
    ) !== undefined;

  const isAppleLinked =
    user.providers.find(
      (provider) =>
        provider.providerName === 'APPLE' && provider.isActive === true
    ) !== undefined;

  const isEmailPasswordLinked =
    user.providers.find(
      (provider) =>
        provider.providerName === 'EMAIL' && provider.isActive === true
    ) !== undefined && user.hasPassword;

  const canDisconnect =
    [isGoogleLinked, isAppleLinked, isEmailPasswordLinked].filter(Boolean)
      .length >= 2;

  const handleEmailLinking = async (isLinking: boolean) => {
    if (isLinking) {
      navigate('CreatePassword');
    } else {
      if (!canDisconnect) return;

      disconnectProvider({
        providerName: 'email',
      });
    }
  };

  const handleGoogleLinking = async (isLinking: boolean) => {
    if (isLinking) {
      promptAsync();
    } else {
      if (!canDisconnect) return;

      disconnectProvider({
        providerName: 'google',
      });
    }
  };

  const handleAppleLinking = async (isLinking: boolean) => {
    if (isLinking) {
    } else {
      if (!canDisconnect) return;

      disconnectProvider({
        providerName: 'apple',
      });
    }
  };

  return (
    <Layout className="flex-1" verticalPadding={80}>
      <Header isDisabledBack={false} headerTitle="Manage Account Linking" />

      <View className="mt-4 flex-1 space-y-4 px-4">
        <Text variant="md" className="text-gray-600 dark:text-gray-300">
          Email: {user.email}
        </Text>

        <AccountLinkingRow
          providerName="Email / Password"
          isLinked={isEmailPasswordLinked}
          iconName="mail"
          canDisconnect={canDisconnect}
          onPress={handleEmailLinking}
          buttonLabel={isEmailPasswordLinked ? 'Disconnect' : 'Set password'}
        />

        <AccountLinkingRow
          providerName="Google"
          isLinked={isGoogleLinked}
          iconName="logo-google"
          canDisconnect={canDisconnect}
          onPress={handleGoogleLinking}
        />

        {Platform.OS === 'ios' && (
          <AccountLinkingRow
            providerName="Apple"
            isLinked={isAppleLinked}
            iconName="logo-apple"
            canDisconnect={canDisconnect}
            onPress={handleAppleLinking}
          />
        )}
      </View>
    </Layout>
  );
};
