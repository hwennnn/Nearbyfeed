import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useLogin } from '@/api';
import { signIn } from '@/core';
import { setUser } from '@/core/user';
import {
  Button,
  ControlledInput,
  Header,
  Layout,
  Pressable,
  Text,
  View,
} from '@/ui';

export class LoginDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Length(8, undefined, { message: 'Password must be at least 8 characters' })
  password: string;
}

const resolver = classValidatorResolver(LoginDto);

export const EmailLoginScreen = () => {
  const { navigate } = useNavigation();

  const {
    isLoading,
    error,
    mutateAsync: mutateLogin,
  } = useLogin({
    onSuccess: (result) => {
      const tokens = result.tokens;

      signIn(tokens);
      setUser(result.user);
    },
  });

  const { handleSubmit, control, setFocus } = useForm<LoginDto>({
    resolver,
  });

  const navToForgotPassword = () => {
    navigate('Auth', {
      screen: 'ForgotPassword',
    });
  };

  const onSubmit = async (data: LoginDto) => {
    await mutateLogin(data);
  };

  return (
    <Layout className="flex-1 bg-white dark:bg-black" verticalPadding={80}>
      <Header headerTitle="Sign In" isDisabledBack={isLoading} />

      <View className="mt-8 flex-1 px-4">
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
          autoFocus={true}
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('password')}
        />

        <ControlledInput
          testID="password-input"
          control={control}
          name="password"
          label="Password"
          placeholder="********"
          secureTextEntry={true}
          returnKeyType="send"
          textContentType="password"
          onSubmitEditing={(event) => {
            event.preventDefault();
            if (!isLoading) {
              handleSubmit(onSubmit)(event);
            }
          }}
        />

        <Pressable onPress={navToForgotPassword}>
          <Text className="self-end pb-1 text-primary-400" variant="sm">
            Forgot password?
          </Text>
        </Pressable>

        <Button
          loading={isLoading}
          testID="login-button"
          label="Sign In"
          onPress={handleSubmit(onSubmit)}
          variant="secondary"
        />

        <View className="mt-8 flex-row self-center">
          <Text className="">Do not have an account? </Text>

          <Pressable onPress={() => navigate('Auth', { screen: 'Register' })}>
            <Text className="text-primary-400">Register now</Text>
          </Pressable>
        </View>
      </View>
    </Layout>
  );
};
