/* eslint-disable react-native/no-inline-styles */
import { Env } from '@env';
import { useNavigation } from '@react-navigation/core';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import React from 'react';

import { useGoogleAuth } from '@/api';
import { signIn } from '@/core/auth';
import { setAppLoading } from '@/core/loading';
import { setUser } from '@/core/user';
import { Button, Text, View } from '@/ui';
import { Layout } from '@/ui/core/layout';
import { FontAwesome5, Ionicons } from '@/ui/icons/ionicons';

const config = {
  iosClientId: Env.GOOGLE_AUTH_IOS_CLIENT_ID,
};

export const AuthOnboardingScreen = () => {
  const { isLoading: isGoogleLoading, mutate: mutateGoogleAuth } =
    useGoogleAuth({
      onSuccess: (result) => {
        setAppLoading(false);
        const tokens = result.tokens;

        signIn(tokens);
        setUser(result.user);
      },
      onError: (_error) => {
        // TODO: show error toast
        setAppLoading(false);
      },
    });

  const [_request, response, promptAsync] = Google.useAuthRequest(config);
  const { navigate } = useNavigation();

  React.useEffect(() => {
    if (response !== null) {
      if (response.type === 'success') {
        const accessToken = response.authentication!.accessToken;
        console.log('🚀 ~ useEffect ~ accessToken:', accessToken);
        mutateGoogleAuth({
          token: accessToken,
        });
      } else if (response.type === 'error') {
        // TODO: show error toast: There is an error while signing in. Please try again
      }
    }
  }, [mutateGoogleAuth, response]);

  const navigateToEmailRegister = () => {
    navigate('Auth', {
      screen: 'Login',
    });
  };

  const handleGoogleAuthSignIn = async () => {
    setAppLoading(true, 'Signing in...');
    await promptAsync();
  };

  return (
    <Layout className="flex-1" verticalPadding={0}>
      <View className="flex-1 px-4">
        <View className="flex-1">
          <Text variant="h1" className="pb-2 text-center">
            Nearbyfeed
          </Text>

          <Button
            icon={
              <FontAwesome5 name="google" size={12} className="text-white" />
            }
            label="Continue with Google"
            onPress={handleGoogleAuthSignIn}
            variant="primary"
            loading={isGoogleLoading}
          />

          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={5}
            style={{
              width: '100%',
              height: 44,
            }}
            onPress={async () => {
              try {
                const credential = await AppleAuthentication.signInAsync({
                  requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                  ],
                });
                // TODO: implement apple backend authentication
                console.log(credential);
                // signed in
              } catch (e: any) {
                if (e.code === 'ERR_REQUEST_CANCELED') {
                  // handle that the user canceled the sign-in flow
                } else {
                  // handle other errors
                }
              }
            }}
          />

          <Button
            label="Continue with Email"
            variant="secondary"
            icon={<Ionicons name="mail" size={16} className="text-white" />}
            onPress={navigateToEmailRegister}
          />
        </View>

        <View className="flex-row justify-center space-x-4">
          <Text variant="sm" className="text-bold">
            Privacy policy
          </Text>

          <Text variant="sm" className="text-bold">
            Terms of service
          </Text>
        </View>
      </View>
    </Layout>
  );
};
