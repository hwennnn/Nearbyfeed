import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Length, Matches } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useCreatePassword } from '@/api/users/create-password';
import type { ProfileNavigatorProp } from '@/navigation/profile-navigator';
import { type ProfileStackParamList } from '@/navigation/profile-navigator';
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
import { MatchesProperty } from '@/utils/decorators';

export class CreatePasswordDto {
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

const resolver = classValidatorResolver(CreatePasswordDto);

type Props = RouteProp<ProfileStackParamList, 'CreatePassword'>;

export const CreatePasswordScreen = () => {
  const { params } = useRoute<Props>();
  const { hasPassword } = params;

  const { handleSubmit, control, formState, setFocus } =
    useForm<CreatePasswordDto>({
      resolver,
    });

  const isFormValid = formState.isValid;

  const { navigate } = useNavigation<ProfileNavigatorProp>();

  const { isLoading, error, mutateAsync } = useCreatePassword();

  const onSubmit = async (data: CreatePasswordDto): Promise<void> => {
    await mutateAsync(
      {
        password: data.password,
      },
      {
        onSuccess: () => {
          showSuccessMessage(
            'You have successfully created a password for your account.'
          );
          navigate('Profile');
        },
        onError: () => {
          showErrorMessage('There is an error. Please try again');
        },
      }
    );
  };

  return (
    <Layout className="flex-1" verticalPadding={80}>
      <Header isDisabledBack={isLoading} headerTitle="Create Password" />

      <View className="mt-4 flex-1 space-y-4 px-4">
        {!hasPassword && (
          <Text variant="xl" className="pb-4 font-bold">
            Please enter a new password.
          </Text>
        )}

        {typeof error === 'string' && (
          <Text testID="form-title" className="pb-4 text-red-600">
            {error}
          </Text>
        )}

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
