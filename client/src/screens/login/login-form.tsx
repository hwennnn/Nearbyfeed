import { Env } from '@env';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import type { AxiosError } from 'axios';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import {
  Button,
  ControlledInput,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/ui';

const config = {
  iosClientId: Env.GOOGLE_AUTH_IOS_CLIENT_ID,
  webClientId: Env.GOOGLE_AUTH_WEB_CLIENT_ID,
};

export class LoginDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Length(8, undefined, { message: 'Password must be at least 8 characters' })
  password: string;
}

const resolver = classValidatorResolver(LoginDto);

export type LoginFormProps = {
  onSubmit?: SubmitHandler<LoginDto>;
  isLoading: boolean;
  error: AxiosError<unknown, any> | null;
};

export const LoginForm = ({
  onSubmit = () => {},
  isLoading,
  error,
}: LoginFormProps) => {
  const { navigate } = useNavigation();

  const { handleSubmit, control } = useForm<LoginDto>({
    resolver,
  });

  const [_request, response, promptAsync] = Google.useAuthRequest(config);

  useEffect(() => {
    if (response !== null && response.type === 'success') {
      const accessToken = response.authentication?.accessToken;
      console.log('🚀 ~ useEffect ~ accessToken:', accessToken);
      // TODO: call "auth/google/calback" with the token to get the JWT tokens
    }
  }, [response]);

  const navToForgotPassword = () => {
    navigate('Auth', {
      screen: 'ForgotPassword',
    });
  };

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle="flex-1 grow justify-center"
    >
      <Text variant="h1" className="pb-2 text-center">
        Sign In
      </Text>

      {typeof error === 'string' && (
        <Text className="pb-4 text-center text-red-600">{error}</Text>
      )}

      <ControlledInput
        testID="email-input"
        control={control}
        name="email"
        label="Email"
        placeholder="Email"
        keyboardType="email-address"
      />

      <ControlledInput
        testID="password-input"
        control={control}
        name="password"
        label="Password"
        placeholder="********"
        secureTextEntry={true}
      />

      <Text
        className="pb-1 text-primary-400"
        variant="sm"
        onPress={navToForgotPassword}
      >
        Forgot password?
      </Text>

      <Button
        loading={isLoading}
        testID="login-button"
        label="Login"
        onPress={handleSubmit(onSubmit)}
        variant="primary"
      />

      <Button
        label="Continue with Google"
        onPress={() => promptAsync()}
        variant="secondary"
      />

      <View className="flex-row">
        <Text className="">Do not have an account? </Text>

        <Pressable onPress={() => navigate('Auth', { screen: 'Register' })}>
          <Text className="text-primary-400">Register now</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
