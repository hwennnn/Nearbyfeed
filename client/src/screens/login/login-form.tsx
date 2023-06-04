import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import type { AxiosError } from 'axios';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import React, { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  Button,
  ControlledInput,
  Pressable,
  Text,
  TouchableOpacity,
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

export type LoginFormProps = {
  onSubmit?: SubmitHandler<LoginDto>;
  isLoading: boolean;
  error: AxiosError<unknown, any> | null;
  emailVerified: boolean;
};

export const LoginForm = ({
  onSubmit = () => {},
  isLoading,
  error,
  emailVerified,
}: LoginFormProps) => {
  const { navigate } = useNavigation();

  const { handleSubmit, control } = useForm<LoginDto>({
    resolver,
  });

  const [isBannerVisible, setBannerVisible] = useState(emailVerified);

  const handleBannerClose = () => {
    setBannerVisible(false);
  };

  const navToForgotPassword = () => {
    navigate('Auth', {
      screen: 'ForgotPassword',
    });
  };

  return (
    <View className="flex-1 justify-center px-4">
      <Text testID="form-title" variant="h1" className="pb-2 text-center">
        Sign In
      </Text>

      {isBannerVisible && (
        <View className="my-4 w-full flex-row rounded-xl bg-green-500 p-4">
          <Text className="flex-1 font-semibold text-white">
            Your email has been successfully verified. You can now proceed to
            log in.
          </Text>

          <TouchableOpacity onPress={handleBannerClose} className="flex">
            <Icon name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>
      )}

      {typeof error === 'string' && (
        <Text className="pb-4 text-center text-red-600">{error}</Text>
      )}

      <ControlledInput
        testID="email-input"
        control={control}
        name="email"
        label="Email"
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

      <View className="flex-row">
        <Text className="">Do not have an account? </Text>

        <Pressable onPress={() => navigate('Auth', { screen: 'Register' })}>
          <Text className="text-primary-400">Register now</Text>
        </Pressable>
      </View>
    </View>
  );
};
