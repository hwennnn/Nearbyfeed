import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { IsEmail, IsNotEmpty } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useForgotPassword } from '@/api/auth';
import { Button, ControlledInput, showSuccessMessage, Text, View } from '@/ui';
import { Layout } from '@/ui/core/layout';
import { getRandomIntFromInterval } from '@/utils/math-utils';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

const resolver = classValidatorResolver(ForgotPasswordDto);

export const ForgotPasswordScreen = () => {
  const { handleSubmit, control, formState } = useForm<ForgotPasswordDto>({
    resolver,
  });

  const { error, mutate } = useForgotPassword();

  const [isFormLoading, setIsFormLoading] = React.useState(false);

  const isFormValid = formState.isValid;

  const onSubmit = (data: ForgotPasswordDto): void => {
    setIsFormLoading(true);

    mutate(data);
    setTimeout(() => {
      setIsFormLoading(false);
      showSuccessMessage(
        'An email will be sent to you if the provided email is valid and registered with us.'
      );
    }, getRandomIntFromInterval(3000, 5000)); // set random interval to prevent malicious attack on checking active emails
  };

  return (
    <Layout className="flex-1">
      <View className="flex-1 space-y-4 px-4 pt-12">
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

        <View>
          <ControlledInput
            testID="email-input"
            control={control}
            name="email"
            placeholder="Enter your email here"
          />
        </View>

        <Button
          disabled={!isFormValid}
          loading={isFormLoading}
          testID="submit-button"
          label="Submit"
          onPress={handleSubmit(onSubmit)}
          variant="secondary"
        />
      </View>
    </Layout>
  );
};
