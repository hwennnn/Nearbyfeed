import { useActionSheet } from '@expo/react-native-action-sheet';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Keyboard } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/Ionicons';

import { useEditProfile, useSelf } from '@/api/users';
import {
  ActivityIndicator,
  Button,
  ControlledInput,
  Image,
  Pressable,
  showErrorMessage,
  Text,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';
import { getInitials } from '@/utils/get-initials';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(25)
  @Transform(({ value }) => value?.trim())
  username: string;
}

const resolver = classValidatorResolver(UpdateProfileDto);

type EditImageButtonProps = {
  clearImageCallback: () => void;
  setImageCallback: (uri: string) => void;
};
const EditImageButton = ({
  clearImageCallback,
  setImageCallback,
}: EditImageButtonProps) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageCallback(result.assets[0].uri);
    }
  };

  const onPressActionSheet = () => {
    const options = ['Clear Image', 'Select Image', 'Cancel'];

    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        userInterfaceStyle: isDark ? 'dark' : 'light',

        options,
        cancelButtonIndex,
        title: 'Edit Image Settings',
      },
      (selectedIndex: number | undefined) => {
        switch (selectedIndex) {
          case 0:
            clearImageCallback();
            break;

          case 1:
            pickImage();
            break;

          case cancelButtonIndex:
          case undefined:
          default:
            break;
        }
      }
    );
  };

  return (
    <Pressable
      className="absolute bottom-0 right-0 rounded-full bg-primary-400 p-[5px]"
      onPress={onPressActionSheet}
    >
      <Icon name="ios-pencil" size={16} color="white" />
    </Pressable>
  );
};

export const EditProfile = () => {
  const { control, handleSubmit, watch, setValue, formState } =
    useForm<UpdateProfileDto>({
      resolver,
    });

  const [image, setImage] = React.useState<string | null>(null);

  const { isLoading, data: user } = useSelf({
    variables: {},
    onSuccess: (data) => {
      setImage(data.image);
      setValue('username', data.username);
    },
  });

  const { mutate: updateProfile, isLoading: isLoadingEditProfile } =
    useEditProfile();

  const onSubmit = React.useCallback(
    async (data: UpdateProfileDto) => {
      Keyboard.dismiss();
      const dto = {
        userId: user!.id,
        username: data.username.trim(),
        image: user?.image !== image ? image : null,
        shouldSetImageNull: user?.image !== null && image === null,
      };

      updateProfile(
        { ...dto },
        {
          onSuccess: () => {
            showMessage({
              message: 'Update profile successfully',
              type: 'success',
            });
          },
          onError: () => {
            showErrorMessage('Error updating profile');
          },
        }
      );
    },
    [image, updateProfile, user]
  );

  const hasChanges =
    !isLoading &&
    formState.isDirty &&
    (user?.image !== image || user?.username !== watch().username);

  if (isLoading) {
    return (
      <Layout className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </Layout>
    );
  }

  return (
    <Layout className="mx-4 mt-4 flex-1 space-y-10">
      <View className="items-center space-y-1">
        <View className="h-[80px] w-[80px] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
          {image === null && (
            <Text
              className="font-medium text-gray-600 dark:text-gray-300"
              variant="h3"
            >
              {getInitials(user?.username ?? '')}
            </Text>
          )}
          {image !== null && (
            <Image
              source={{ uri: image }}
              className="h-[80px] w-[80px] rounded-full"
            />
          )}
          <EditImageButton
            clearImageCallback={() => setImage(null)}
            setImageCallback={(result) => setImage(result)}
          />
        </View>

        <Text variant="lg" className="font-semibold">
          {user?.username ?? ''}
        </Text>

        <Text variant="sm" className="text-gray-600 dark:text-gray-300">
          {user?.email ?? ''}
        </Text>
      </View>

      <View className="flex-1 space-y-5">
        <ControlledInput
          label="Username"
          name="username"
          control={control}
          placeholder="Username"
        />

        <Button
          disabled={!hasChanges}
          label="Update Profile"
          onPress={handleSubmit(onSubmit)}
          loading={isLoadingEditProfile}
          variant="secondary"
        />
      </View>
    </Layout>
  );
};
