/* eslint-disable react-native/no-inline-styles */
import { Env } from '@env';
import { useNavigation } from '@react-navigation/core';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import React from 'react';
import { Platform } from 'react-native';

import { useGoogleAuth } from '@/api';
import { useIsFirstTime, useTheme } from '@/core';
import { signIn } from '@/core/auth';
import { setAppLoading } from '@/core/loading';
import { setUser } from '@/core/user';
import type { AuthStackParamList } from '@/navigation';
import {
  Button,
  HeaderButton,
  Image,
  LayoutWithoutKeyboard,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { FontAwesome5, Ionicons } from '@/ui/icons/vector-icons';

const config = {
  iosClientId: Env.GOOGLE_AUTH_IOS_CLIENT_ID,
};

type Props = RouteProp<AuthStackParamList, 'AuthOnboarding'>;

export const AuthOnboardingScreen = () => {
  const { params } = useRoute<Props>();
  const isCloseButton = params?.isCloseButton === true;

  const [_, setIsFirstTime] = useIsFirstTime();

  const isDark = useTheme.use.colorScheme() === 'dark';

  const { isLoading: isGoogleLoading, mutate: mutateGoogleAuth } =
    useGoogleAuth({
      onSuccess: (result) => {
        setAppLoading(false);
        const tokens = result.tokens;

        signIn(tokens);
        setUser(result.user);
        setIsFirstTime(false);
      },
      onError: (_error) => {
        // TODO: show error toast
        setAppLoading(false);
      },
      onMutate: () => {
        setAppLoading(true, 'Signing in...');
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
        console.log(response.error?.message);
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
    await promptAsync();
  };

  const skipAuth = () => {
    setIsFirstTime(false);
    navigate('App', {
      screen: 'Feed',
      initial: false,
    });
  };

  return (
    <LayoutWithoutKeyboard className="flex-1">
      <View className="flex-1 px-4">
        <View className="items-end">
          {isCloseButton ? (
            <HeaderButton iconName="close" />
          ) : (
            <TouchableOpacity onPress={skipAuth}>
              <Text variant="md" className="text-bold">
                Skip
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-1 justify-center">
          <Image
            source={require('assets/images/rounded-icon.png')}
            className="h-60 w-60 self-center"
            priority="high"
            placeholder={null}
          />

          <Text variant="h1" className="pb-2 text-center font-bold">
            Nearbyfeed
          </Text>

          <Text className="mb-6 text-center" variant="md">
            Discover and connect with your local community through real-time
            updates and engaging posts.
          </Text>

          <Button
            icon={
              <FontAwesome5
                name="google"
                size={12}
                className="text-white dark:text-black"
              />
            }
            label="Continue with Google"
            onPress={handleGoogleAuthSignIn}
            variant="primary"
            loading={isGoogleLoading}
          />

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
              }
              buttonStyle={
                isDark
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
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
                  console.log(e);
                  if (e.code === 'ERR_REQUEST_CANCELED') {
                    // handle that the user canceled the sign-in flow
                  } else {
                    // handle other errors
                  }
                }
              }}
            />
          )}

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
    </LayoutWithoutKeyboard>
  );
};
