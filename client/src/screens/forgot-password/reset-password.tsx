import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Length, Matches } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useResetPassword } from '@/api/auth';
import type { AuthStackParamList } from '@/navigation/auth-navigator';
import { Button, ControlledInput, showSuccessMessage, Text } from '@/ui';
import { Layout } from '@/ui/core/layout';
import { MatchesProperty } from '@/utils/decorators';

export class ResetPasswordDto {
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

  @MatchesProperty('password', { message: 'Passwords must match' })
  confirmPassword: string;
}

const resolver = classValidatorResolver(ResetPasswordDto);

type Props = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = () => {
  const { params } = useRoute<Props>();
  const { token } = params;
  const { navigate } = useNavigation();

  const { handleSubmit, control } = useForm<ResetPasswordDto>({
    resolver,
  });

  const { isLoading, error, mutateAsync } = useResetPassword();

  const onSubmit = async (data: ResetPasswordDto): Promise<void> => {
    await mutateAsync({ token, newPassword: data.password });

    showSuccessMessage(
      'You have successfully reset your password. You can now proceed to log in.'
    );
    navigate('Auth', { screen: 'Login' });
  };

  return (
    <Layout className="flex-1 justify-center p-4">
      <Text testID="form-title" variant="h1" className="pb-2 text-center">
        Reset your password
      </Text>

      <Text testID="form-title" variant="md" className="pb-2">
        Enter a new password to reset the password on your account.
      </Text>

      {typeof error === 'string' && (
        <Text testID="form-title" className="pb-4 text-red-600">
          {error}
        </Text>
      )}

      <ControlledInput
        control={control}
        name="password"
        label="Password"
        secureTextEntry={true}
      />

      <ControlledInput
        control={control}
        name="confirmPassword"
        label="Confirm your password"
        secureTextEntry={true}
      />

      <Button
        loading={isLoading}
        testID="submit-button"
        label="Submit"
        onPress={handleSubmit(onSubmit)}
        variant="primary"
      />
    </Layout>
  );
};
