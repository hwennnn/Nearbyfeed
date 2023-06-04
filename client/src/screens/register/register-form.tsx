import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import type { AxiosError } from 'axios';
import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { Button, ControlledInput, Pressable, Text, View } from '@/ui';

export class RegisterDto {
  @IsNotEmpty({ message: 'Username is required' })
  @Length(4, 25, { message: 'Username must be between 4 and 25 characters' })
  username: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Matches(/^(?=.*[a-z])/, {
    message: 'Password must contain at least 1 lowercase letter',
  })
  @Matches(/^(?=.*[A-Z])/, {
    message: 'Password must contain at least 1 uppercase letter',
  })
  @Matches(/^(?=.*\d)/, { message: 'Password must contain at least 1 number' })
  @Matches(/^(?=.*[-!$%^&*()_+|~=`{}\\[\]:";'<>?,.\\/@#])/, {
    message: 'Password must contain at least 1 symbol',
  })
  @Length(8, undefined, { message: 'Password must be at least 8 characters' })
  password: string;
}

const resolver = classValidatorResolver(RegisterDto);

export type RegisterFormProps = {
  onSubmit?: SubmitHandler<RegisterDto>;
  isLoading: boolean;
  error: AxiosError<unknown, any> | null;
};

export const RegisterForm = ({
  onSubmit = () => {},
  isLoading,
  error,
}: RegisterFormProps) => {
  const { navigate } = useNavigation();

  const { handleSubmit, control } = useForm<RegisterDto>({
    resolver,
  });

  return (
    <View className="flex-1 justify-center px-4">
      <Text testID="form-title" variant="h1" className="pb-2 text-center">
        Register
      </Text>

      {typeof error === 'string' && (
        <Text testID="form-title" className="pb-4 text-center text-red-600">
          {error}
        </Text>
      )}

      <ControlledInput
        testID="username-input"
        control={control}
        name="username"
        label="Username"
      />
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
      <Button
        loading={isLoading}
        testID="register-button"
        label="Register"
        onPress={handleSubmit(onSubmit)}
        variant="primary"
      />

      <View className="flex-row">
        <Text className="">Already have an account? </Text>

        <Pressable onPress={() => navigate('Auth', { screen: 'Login' })}>
          <Text className="text-primary-400">Login</Text>
        </Pressable>
      </View>
    </View>
  );
};
