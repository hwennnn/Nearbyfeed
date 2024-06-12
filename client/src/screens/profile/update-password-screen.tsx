import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { IsString, Length, Matches } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useUpdatePassword } from '@/api/users/update-password';
import { useUser } from '@/core/user';
import {
  Button,
  ControlledInput,
  Header,
  showErrorMessage,
  showSuccessMessage,
  Text,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';
import { DoesNotMatchProperty, MatchesProperty } from '@/utils/decorators';

export class UpdatePasswordDto {
  @IsString()
  originalPassword: string;

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
  @DoesNotMatchProperty('originalPassword', {
    message: 'The new password must be different ',
  })
  password: string;

  @MatchesProperty('password', { message: 'Passwords must match' })
  confirmPassword: string;
}

const resolver = classValidatorResolver(UpdatePasswordDto);

export const UpdatePasswordScreen = () => {
  const { handleSubmit, control, formState, setFocus } =
    useForm<UpdatePasswordDto>({
      resolver,
    });

  const isFormValid = formState.isValid;

  const { isLoading, error, mutateAsync } = useUpdatePassword({
    onSuccess: () => {
      showSuccessMessage('You have successfully updated your password');
    },
    onError: () => {
      showErrorMessage('There is an error. Please try again');
    },
  });

  const onSubmit = async (data: UpdatePasswordDto): Promise<void> => {
    const userId = useUser.getState().user?.id;

    if (userId === undefined) return;

    await mutateAsync({
      originalPassword: data.originalPassword,
      newPassword: data.password,
      userId,
    });
  };

  return (
    <Layout className="flex-1" verticalPadding={80}>
      <Header isDisabledBack={isLoading} headerTitle="Update Password" />

      <View className="mt-8 flex-1 space-y-4 px-4">
        {typeof error === 'string' && (
          <Text testID="form-title" className="pb-4 text-red-600">
            {error}
          </Text>
        )}

        <ControlledInput
          control={control}
          name="originalPassword"
          label="Current Password"
          secureTextEntry={true}
          placeholder="********"
          returnKeyType="next"
          textContentType="password"
          onSubmitEditing={() => setFocus('password')}
        />

        <ControlledInput
          control={control}
          name="password"
          label="New Password"
          secureTextEntry={true}
          placeholder="********"
          returnKeyType="next"
          textContentType="password"
          onSubmitEditing={() => setFocus('confirmPassword')}
        />

        <ControlledInput
          control={control}
          name="confirmPassword"
          label="Confirm Password"
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
          disabled={isLoading}
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
