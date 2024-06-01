import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useRegister } from '@/api/auth';
import { setAppLoading } from '@/core/loading';
import { Button, ControlledInput, Header, Pressable, Text, View } from '@/ui';
import { Layout } from '@/ui/core/layout';

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

export const EmailRegisterScreen = () => {
  const {
    isLoading,
    error,
    mutate: mutateRegister,
  } = useRegister({
    onSuccess: (data) => {
      const { sessionId, pendingUser } = data;
      navigate('Auth', {
        screen: 'ValidateEmail',
        params: {
          pendingUserId: pendingUser.id,
          email: pendingUser.email,
          sessionId,
        },
      });
    },
    onSettled: () => {
      setAppLoading(false);
    },
    onMutate: () => {
      setAppLoading(true, 'Creating your account...');
    },
  });
  const { navigate } = useNavigation();

  const { handleSubmit, control, setFocus } = useForm<RegisterDto>({
    resolver,
  });

  const onSubmit = (data: RegisterDto) => {
    mutateRegister(data);
  };

  return (
    <Layout className="flex-1" verticalPadding={80}>
      <Header headerTitle="Register" />

      <View className="mt-8 flex-1 px-4">
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
          placeholder="Username"
          autoFocus={true}
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('email')}
        />
        <ControlledInput
          testID="email-input"
          control={control}
          name="email"
          label="Email"
          placeholder="Email"
          keyboardType="email-address"
          returnKeyType="next"
          textContentType="emailAddress"
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
        <Button
          loading={isLoading}
          testID="register-button"
          label="Register"
          onPress={handleSubmit(onSubmit)}
          variant="secondary"
        />

        <View className="flex-row">
          <Text className="">Already have an account? </Text>

          <Pressable onPress={() => navigate('Auth', { screen: 'Login' })}>
            <Text className="text-primary-400">Login</Text>
          </Pressable>
        </View>

        <View className="h-6" />
      </View>
    </Layout>
  );
};
