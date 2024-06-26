import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Length, Matches } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useResetPassword } from '@/api/auth';
import type { AuthStackParamList } from '@/navigation/auth-navigator';
import {
  Button,
  ControlledInput,
  Header,
  showSuccessMessage,
  Text,
  View,
} from '@/ui';
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

  const { handleSubmit, control, formState, setFocus } =
    useForm<ResetPasswordDto>({
      resolver,
    });

  const isFormValid = formState.isValid;

  const { isLoading, error, mutateAsync } = useResetPassword({
    onSuccess: () => {
      showSuccessMessage(
        'You have successfully reset your password. You can now proceed to log in.'
      );
      navigate('Auth', { screen: 'Login' });
    },
  });

  const onSubmit = async (data: ResetPasswordDto): Promise<void> => {
    await mutateAsync({ token, newPassword: data.password });
  };

  return (
    <Layout className="flex-1" verticalPadding={80}>
      <Header isDisabledBack={isLoading} headerTitle="Reset Password" />

      <View className="mt-8 flex-1 space-y-4 px-4">
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
          placeholder="********"
          autoFocus={true}
          returnKeyType="next"
          textContentType="password"
          onSubmitEditing={() => setFocus('confirmPassword')}
        />

        <ControlledInput
          control={control}
          name="confirmPassword"
          label="Confirm your password"
          placeholder="********"
          secureTextEntry={true}
          returnKeyType="send"
          textContentType="newPassword"
          onSubmitEditing={(event) => {
            event.preventDefault();
            if (isFormValid && !isLoading) {
              handleSubmit(onSubmit)(event);
            }
          }}
        />

        <Button
          disabled={!isFormValid || isLoading}
          loading={isLoading}
          testID="submit-button"
          label="Submit"
          onPress={handleSubmit(onSubmit)}
          variant="secondary"
        />
      </View>
    </Layout>
  );
};
