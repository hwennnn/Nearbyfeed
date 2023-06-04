import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAddPost } from '@/api';
import {
  colors,
  ControlledInput,
  Image,
  Pressable,
  showErrorMessage,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';
import { retrieveCurrentPosition } from '@/utils/geolocation-utils';

export class CreatePostDto {
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(500)
  content?: string;
}

const resolver = classValidatorResolver(CreatePostDto);

export const AddFeed = () => {
  const { control, handleSubmit } = useForm<CreatePostDto>({
    resolver,
  });
  const { mutate: addPost, isLoading } = useAddPost();
  const [image, setImage] = React.useState<ImagePicker.ImagePickerAsset | null>(
    null
  );

  const navigation = useNavigation();

  const onSubmit = React.useCallback(
    async (data: CreatePostDto) => {
      const location = await retrieveCurrentPosition();
      if (location === null) {
        showErrorMessage('Location must be enabled to create a post.');
        return;
      }

      addPost(
        { ...data, ...location, image },
        {
          onSuccess: () => {
            showMessage({
              message: 'Post added successfully',
              type: 'success',
            });
            navigation.goBack();
          },
          onError: () => {
            showErrorMessage('Error adding post');
          },
        }
      );
    },
    [addPost, image, navigation]
  );

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
      setImage(result.assets[0]);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isLoading}>
          <Text variant="md" className="text-primary-400">
            Create
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [handleSubmit, isLoading, navigation, onSubmit]);

  return (
    <Layout className="flex-1 p-4">
      <ControlledInput
        name="title"
        control={control}
        placeholder="Title"
        className="border-none text-[24px] font-bold dark:text-charcoal-100"
      />

      {image === null && (
        <TouchableOpacity
          onPress={pickImage}
          className="my-4 h-[150px] w-[150px] items-center justify-center border-[1px] border-dotted border-charcoal-700 dark:border-white"
        >
          <Icon name="add" color={colors.primary[400]} size={48} />
        </TouchableOpacity>
      )}

      {image !== null && (
        <View className="my-4 h-[150px] w-[150px]">
          <Image source={{ uri: image.uri }} className="h-full w-full" />

          <Pressable
            className="absolute top-2 right-2 rounded-full border bg-black"
            onPress={() => setImage(null)}
          >
            <Icon name="close" color="white" size={16} />
          </Pressable>
        </View>
      )}

      <ControlledInput
        name="content"
        placeholder="Body Content (optional)"
        // max of 6 lines
        className="max-h-64 border-none text-[16px] dark:text-charcoal-100"
        control={control}
        multiline
      />
    </Layout>
  );
};
