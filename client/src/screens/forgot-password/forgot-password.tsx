import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { IsEmail, IsNotEmpty } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useForgotPassword } from '@/api/auth';
import { Button, ControlledInput, showSuccessMessage, Text } from '@/ui';
import { Layout } from '@/ui/core/layout';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

const resolver = classValidatorResolver(ForgotPasswordDto);

export const ForgotPasswordScreen = () => {
  const { handleSubmit, control } = useForm<ForgotPasswordDto>({
    resolver,
  });

  const { isLoading, error, mutateAsync } = useForgotPassword();

  const onSubmit = async (data: ForgotPasswordDto): Promise<void> => {
    await mutateAsync(data);

    showSuccessMessage(
      'An email will be sent to you if the provided email is valid and registered with us.'
    );
  };

  return (
    <Layout className="justify-center">
      <Text variant="h1" className="pb-2 text-center">
        Forgot your password?
      </Text>

      <Text variant="md" className="pb-2">
        Enter your email address and we'll send you a link to reset your
        password.
      </Text>

      {typeof error === 'string' && (
        <Text className="pb-4 text-red-600">{error}</Text>
      )}

      <ControlledInput
        testID="email-input"
        control={control}
        name="email"
        label="Email"
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
